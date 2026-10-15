import "server-only";
import { randomUUID } from "node:crypto";
import { cache } from "react";
import { requireAdmin, type AdminIdentity } from "../../lib/auth/access.server";
import { getAdminFirestore } from "../../lib/firebase/admin.server";
import { createFirestorePatientsRepository } from "../patients/firestore-repository.server";
import { createAppointmentsService } from "./service";
import { createFirestoreAppointmentsRepository } from "./firestore-repository.server";
import { createFirestoreAppointmentsWriter } from "./firestore-writer.server";
import type { CreateAppointmentRequest } from "./create-request";
import { AppointmentsReadError } from "./read-errors";
import { appointmentWriteFailure, type CreateAppointmentWriteResult } from "./write-errors";

// React cache is scoped to the server render, never a global dataset cache.
export const getAppointmentsService = cache(async () => {
  await requireAdmin();
  return createAppointmentsService(createFirestoreAppointmentsRepository(getAdminFirestore()));
});

export const getPatientsRepository = cache(async () => {
  await requireAdmin();
  return createFirestorePatientsRepository(getAdminFirestore());
});

// The identity parameter can only come from requireAdminApi, which runs before any Firestore setup.
export async function createAppointmentAsAdmin(
  identity: AdminIdentity, request: CreateAppointmentRequest,
): Promise<CreateAppointmentWriteResult> {
  let writer;
  try { writer = createFirestoreAppointmentsWriter(getAdminFirestore()); }
  catch (error) {
    return appointmentWriteFailure(error instanceof AppointmentsReadError ? error.code : "CONFIG_INVALID");
  }
  return writer.createAppointment(request, {
    now: new Date(), actorId: identity.uid, appointmentId: randomUUID(), patientId: randomUUID(),
  });
}
