import "server-only";
import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { patientFromFirestore, patientToFirestore } from "../patients/firestore-mapper.server";
import { createAppointment } from "./commands";
import { canonicalCreateAppointmentRequest, type CreateAppointmentRequest } from "./create-request";
import { appointmentFromFirestore, appointmentToFirestore } from "./firestore-mapper.server";
import { withDeadline } from "./firestore-repository.server";
import { AppointmentsReadError } from "./read-errors";
import type { AppointmentPatient, CreateAppointmentInput } from "./types";
import { appointmentWriteFailure, type CreateAppointmentWriteResult } from "./write-errors";

export const IDEMPOTENCY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const CREATE_OPERATION = "appointment.create";

// IDs are chosen once per request, outside the transaction, so retries never mint new identities.
export type CreateAppointmentWriteContext = {
  now: Date;
  actorId: string;
  appointmentId: string;
  patientId: string;
};

export type AppointmentsWriter = {
  createAppointment(request: CreateAppointmentRequest, context: CreateAppointmentWriteContext): Promise<CreateAppointmentWriteResult>;
};

function requestHash(request: CreateAppointmentRequest) {
  return createHash("sha256").update(canonicalCreateAppointmentRequest(request)).digest("hex");
}

// Infrastructure constructor. Application flows must enter through application.server.
export function createFirestoreAppointmentsWriter(db: Firestore, deadlineMs = 10_000): AppointmentsWriter {
  return {
    async createAppointment(request, context) {
      const hash = requestHash(request);
      const appointments = db.collection("appointments");
      const idempotencyRef = db.collection("idempotencyKeys").doc(request.requestId);
      // One document per civil day serializes every write that can occupy that day, including empty days.
      const dayRef = db.collection("appointmentDays").doc(request.date);
      const appointmentRef = appointments.doc(context.appointmentId);
      const patientRef = db.collection("patients").doc(request.patient.mode === "new" ? context.patientId : request.patient.id);
      try {
        return await withDeadline(() => db.runTransaction(async (transaction): Promise<CreateAppointmentWriteResult> => {
          const previous = await transaction.get(idempotencyRef);
          if (previous.exists) {
            const data = previous.data() ?? {};
            if (typeof data.appointmentId !== "string" || typeof data.requestHash !== "string") return appointmentWriteFailure("DATA_INVALID");
            if (data.operation === CREATE_OPERATION && data.actorId === context.actorId && data.requestHash === hash) {
              return { ok: true, appointmentId: data.appointmentId, replayed: true };
            }
            const failure = appointmentWriteFailure("IDEMPOTENCY_KEY_REUSED");
            return { ...failure, error: { ...failure.error, appointmentId: data.appointmentId } };
          }

          const [day, sameDay, existing, patientDocument] = await Promise.all([
            transaction.get(dayRef),
            transaction.get(appointments.where("date", "==", request.date)),
            transaction.get(appointmentRef),
            transaction.get(patientRef),
          ]);
          const revision = day.exists ? day.data()?.revision : 0;
          if (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 0) return appointmentWriteFailure("DATA_INVALID");
          // A corrupt document on the same day fails the write instead of hiding an occupied interval.
          const dayAppointments = sameDay.docs.map((doc) => appointmentFromFirestore(doc.id, doc.data()));
          if (existing.exists) return appointmentWriteFailure("DUPLICATE_ID", "Este identificador de agendamento já existe.");

          let patient: AppointmentPatient;
          if (request.patient.mode === "new") {
            if (patientDocument.exists) return appointmentWriteFailure("DUPLICATE_ID", "Este identificador de paciente já existe.");
            patient = { id: context.patientId, fullName: request.patient.fullName, phone: request.patient.phone, relationship: "new",
              ...(request.patient.email !== undefined ? { email: request.patient.email } : {}) };
          } else {
            if (!patientDocument.exists) return appointmentWriteFailure("PATIENT_NOT_FOUND");
            // The stored registration is authoritative; the browser only chooses which patient.
            const stored = patientFromFirestore(patientDocument.id, patientDocument.data());
            patient = { id: stored.id, fullName: stored.fullName, phone: stored.phone, relationship: "returning",
              ...(stored.email !== undefined ? { email: stored.email } : {}) };
          }

          const input: CreateAppointmentInput = {
            patient, date: request.date, time: request.time, duration: request.duration,
            modality: request.modality, sessionType: request.sessionType, status: request.status,
            amount: request.amount, method: request.method,
            ...(request.meetingLink !== undefined ? { meetingLink: request.meetingLink } : {}),
            ...(request.notes !== undefined ? { notes: request.notes } : {}),
          };
          const result = createAppointment(input, dayAppointments, { now: context.now, actorId: context.actorId, id: context.appointmentId });
          if (!result.ok) return { ok: false, error: result.error };

          const at = Timestamp.fromDate(context.now);
          transaction.create(appointmentRef, appointmentToFirestore(result.appointment));
          if (request.patient.mode === "new") {
            const iso = context.now.toISOString();
            transaction.create(patientRef, patientToFirestore({ id: patient.id, version: 1, fullName: patient.fullName,
              phone: request.patient.phone, ...(patient.email !== undefined ? { email: patient.email } : {}),
              createdAt: iso, createdBy: context.actorId, updatedAt: iso }));
          }
          transaction.set(dayRef, { date: request.date, revision: revision + 1, updatedAt: at });
          transaction.create(idempotencyRef, {
            operation: CREATE_OPERATION, actorId: context.actorId, requestHash: hash, appointmentId: context.appointmentId,
            createdAt: at, expiresAt: Timestamp.fromMillis(context.now.getTime() + IDEMPOTENCY_RETENTION_MS),
          });
          return { ok: true, appointmentId: context.appointmentId, replayed: false };
        }), deadlineMs);
      } catch (error) {
        // A timeout may hide a commit; the same request ID safely replays it.
        if (error instanceof AppointmentsReadError) return appointmentWriteFailure(error.code);
        return appointmentWriteFailure("UNAVAILABLE");
      }
    },
  };
}
