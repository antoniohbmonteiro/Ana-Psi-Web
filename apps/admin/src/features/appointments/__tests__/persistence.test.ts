import test from "node:test";
import assert from "node:assert/strict";
import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { createMockAppointments } from "../mock";
import { appointmentFromFirestore, appointmentToFirestore } from "../firestore-mapper.server";
import { createFirestoreAppointmentsRepository, readWithDeadline } from "../firestore-repository.server";
import { createAppointmentsService } from "../service";
import { AppointmentsReadError } from "../read-errors";
import { requireFirestoreConfig } from "../../../lib/firebase/config.server";
import { patientFromFirestore, patientToFirestore } from "../../patients/firestore-mapper.server";
import { createFirestorePatientsRepository } from "../../patients/firestore-repository.server";
import type { Patient } from "../../patients/types";
import { createFirestoreAppointmentsWriter } from "../firestore-writer.server";
import { parseCreateAppointmentRequest } from "../create-request";
import { appointmentWriteStatus } from "../write-errors";
import type { Appointment } from "../types";

const now = new Date("2026-10-13T18:20:30.123Z");
const fixtures = createMockAppointments(now);
const failure = (code: string) => (error: unknown) => error instanceof AppointmentsReadError && error.code === code;

test("mapper round-trips all historical fixtures, timestamps, cents and stable identities", () => {
  for (const fixture of fixtures) {
    const stored = appointmentToFirestore(fixture);
    assert.ok(!("id" in stored));
    const history = stored.activityTimeline as { occurredAt: unknown }[];
    assert.ok(history.every((event) => event.occurredAt instanceof Timestamp));
    assert.deepEqual(appointmentFromFirestore(fixture.id, stored), fixture);
  }
});

test("document ID is authoritative and unknown fields never escape the mapper", () => {
  const stored: Record<string, unknown> = { ...appointmentToFirestore(fixtures[0]), id: "untrusted", privateExtra: "hidden" };
  (stored.patient as Record<string, unknown>).privateExtra = "hidden";
  const domain = appointmentFromFirestore("actual-id", stored);
  assert.equal(domain.id, "actual-id");
  assert.ok(!JSON.stringify(domain).includes("hidden"));
});

test("structured history preserves initial payments, changes, schedules, statuses and UTC", () => {
  const appointment: Appointment = { ...fixtures[0], version: 7, activityTimeline: [{
    id: 3, type: "edited", actorId: "local-admin-ana", title: "Alteração", description: "",
    occurredAt: now.toISOString(), details: {
      initial: { schedule: { date: "2020-02-29", time: "10:17", duration: 45 }, status: "confirmed",
        patientId: fixtures[0].patient.id, payment: fixtures[0].payment },
      schedule: { before: { date: "2020-02-29", time: "10:17", duration: 45 }, after: { date: "2020-03-01", time: "11:00", duration: 50 } },
      status: { before: "pending", after: "confirmed" }, fields: ["amount", "notes", "meetingLink"],
      changes: [{ field: "amount", before: 10000, after: 12000 }, { field: "meetingLink", before: null, after: "https://example.invalid" }], reason: "Teste",
    },
  }] };
  assert.deepEqual(appointmentFromFirestore(appointment.id, appointmentToFirestore(appointment)), appointment);
});

for (const [path, value] of [
  ["date", "2026-02-30"], ["time", "24:00"], ["duration", 0], ["duration", 2000],
  ["version", 0], ["status", "unknown"], ["modality", "unknown"], ["sessionType", "unknown"],
  ["patient.id", ""], ["patient.fullName", null], ["patient.relationship", "unknown"], ["patient.phone", 123],
  ["payment.amount", 10.5], ["payment.amount", -1], ["payment.amount", Number.MAX_SAFE_INTEGER + 1],
  ["payment.method", "unknown"], ["payment.status", "unknown"], ["payment.paidAt", now.toISOString()],
  ["activityTimeline", null], ["activityTimeline.0.occurredAt", now.toISOString()],
  ["activityTimeline.0.type", "unknown"], ["activityTimeline.0.actorId", ""], ["activityTimeline.0.id", 0],
  ["activityTimeline.0.details", { changes: [{ field: "notes", before: "secret", after: "secret" }] }],
  ["activityTimeline.0.details", { initial: { schedule: {}, payment: {} } }],
] as const) {
  test(`mapper rejects malformed persisted ${path}: ${String(value)}`, () => {
    const data = appointmentToFirestore(fixtures[0]);
    const keys = path.split(".");
    let target = data;
    for (const key of keys.slice(0, -1)) target = target[key] as Record<string, unknown>;
    target[keys.at(-1)!] = value;
    assert.throws(() => appointmentFromFirestore("fixture", data), failure("DATA_INVALID"));
  });
}

test("timestamps and optional strings must have persisted types; serializing invalid UTC fails", () => {
  assert.throws(() => appointmentFromFirestore("fixture", {}), failure("DATA_INVALID"));
  assert.throws(() => appointmentFromFirestore("fixture", null), failure("DATA_INVALID"));
  assert.throws(() => appointmentToFirestore({ ...fixtures[0], payment: { ...fixtures[0].payment, paidAt: "bad" } }), failure("DATA_INVALID"));
});

function database(data: Appointment[], onList: () => void = () => {}) {
  return { collection: () => ({
    get: async () => { onList(); return { docs: data.map((item) => ({ id: item.id, data: () => appointmentToFirestore(item) })) }; },
    doc: (id: string) => ({ get: async () => {
      const item = data.find((value) => value.id === id);
      return { exists: !!item, id, data: () => item && appointmentToFirestore(item) };
    } }),
  }) } as unknown as Firestore;
}

test("Home calculations share one listing; direct detail reads do not list", async () => {
  let calls = 0;
  const service = createAppointmentsService(createFirestoreAppointmentsRepository(database([...fixtures].reverse(), () => calls++)));
  const [today, next, duration, payments, pending] = await Promise.all([
    service.getAppointmentsByDate("2026-10-13"), service.getNextAppointment(now),
    service.getTotalDurationByDate("2026-10-13"), service.getPendingPaymentsCount(), service.getPendingAppointmentsCount(),
  ]);
  assert.equal(calls, 1);
  assert.deepEqual(today.map((item) => item.id), ["apt-002", "apt-003", "apt-004"]);
  assert.equal(next?.id, "apt-004"); assert.equal(duration, 150); assert.equal(payments, 2); assert.equal(pending, 1);
  assert.deepEqual(await service.getAppointmentById("apt-002"), fixtures[1]);
  assert.equal(await service.getAppointmentById("missing"), undefined); assert.equal(calls, 1);
});

test("empty persistence is success, unavailable and invalid persistence fail distinctly", async () => {
  assert.deepEqual(await createFirestoreAppointmentsRepository(database([])).getAllAppointments(), []);
  const unavailable = { collection: () => ({ get: async () => { throw new Error("private SDK error"); } }) } as unknown as Firestore;
  await assert.rejects(createFirestoreAppointmentsRepository(unavailable).getAllAppointments(), failure("UNAVAILABLE"));
  const corrupt = { collection: () => ({ get: async () => ({ docs: [{ id: "corrupt", data: () => ({}) }] }) }) } as unknown as Firestore;
  await assert.rejects(createFirestoreAppointmentsRepository(corrupt).getAllAppointments(), failure("DATA_INVALID"));
});

test("deadline returns an explicit failure and does not expose late results or SDK messages", async () => {
  await assert.rejects(readWithDeadline(() => new Promise(() => {}), 10), failure("UNAVAILABLE"));
  await assert.rejects(readWithDeadline(async () => { throw new Error("private details"); }), (error: unknown) =>
    error instanceof AppointmentsReadError && error.message === "UNAVAILABLE");
});

test("missing local Firestore host fails before connection while auth remains independently configured", () => {
  const env: NodeJS.ProcessEnv = { NODE_ENV: "test", ADMIN_ENV: "ci", ADMIN_ORIGIN: "http://127.0.0.1:3100", ADMIN_ALLOWED_UID: "local-admin-ana",
    FIREBASE_PROJECT_ID: "demo-ana-psi", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
    NEXT_PUBLIC_FIREBASE_API_KEY: "fake", NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-ana-psi.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-ana-psi", NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app",
    NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true", NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "http://127.0.0.1:9099" };
  assert.throws(() => requireFirestoreConfig(env), failure("CONFIG_INVALID"));
  assert.equal(requireFirestoreConfig({ ...env, FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" }).projectId, "demo-ana-psi");
});

const patient: Patient = {
  id: "patient-1", version: 1, fullName: "Paciente Fictício", phone: "(31) 99999-0000", email: "paciente@example.invalid",
  createdAt: "2026-10-13T18:20:30.123Z", createdBy: "local-admin-ana", updatedAt: "2026-10-13T18:20:30.123Z",
};

test("patient mapper round-trips timestamps, drops unknown fields and keeps the document ID authoritative", () => {
  const stored = patientToFirestore(patient);
  assert.ok(!("id" in stored));
  assert.ok(stored.createdAt instanceof Timestamp && stored.updatedAt instanceof Timestamp);
  assert.deepEqual(patientFromFirestore(patient.id, stored), patient);
  const withoutEmail: Patient = { ...patient };
  delete withoutEmail.email;
  assert.deepEqual(patientFromFirestore(patient.id, patientToFirestore(withoutEmail)), withoutEmail);
  const domain = patientFromFirestore("actual", { ...stored, id: "forged", privateExtra: "hidden" });
  assert.equal(domain.id, "actual");
  assert.ok(!JSON.stringify(domain).includes("hidden"));
});

for (const [key, value] of [
  ["version", 0], ["version", "1"], ["fullName", ""], ["phone", null], ["email", 1],
  ["createdAt", "2026-10-13T18:20:30.123Z"], ["updatedAt", undefined], ["createdBy", " "],
] as const) {
  test(`patient mapper rejects malformed persisted ${key}: ${String(value)}`, () => {
    const data: Record<string, unknown> = { ...patientToFirestore(patient), [key]: value };
    if (value === undefined) delete data[key];
    assert.throws(() => patientFromFirestore(patient.id, data), failure("DATA_INVALID"));
  });
}

test("patients listing sorts by Portuguese collation and fails on invalid or unavailable data", async () => {
  const docs = [{ ...patient, id: "p3", fullName: "Érica" }, { ...patient, id: "p1", fullName: "beatriz" }, { ...patient, id: "p2", fullName: "Álvaro" }];
  const db = { collection: () => ({ get: async () => ({ docs: docs.map((item) => ({ id: item.id, data: () => patientToFirestore(item) })) }) }) } as unknown as Firestore;
  assert.deepEqual((await createFirestorePatientsRepository(db).listPatients()).map((item) => item.fullName), ["Álvaro", "beatriz", "Érica"]);
  const corrupt = { collection: () => ({ get: async () => ({ docs: [{ id: "x", data: () => ({}) }] }) }) } as unknown as Firestore;
  await assert.rejects(createFirestorePatientsRepository(corrupt).listPatients(), failure("DATA_INVALID"));
  const unavailable = { collection: () => ({ get: async () => { throw new Error("private SDK error"); } }) } as unknown as Firestore;
  await assert.rejects(createFirestorePatientsRepository(unavailable).listPatients(), failure("UNAVAILABLE"));
});

test("writer reports SDK failures and timeouts as UNAVAILABLE without exposing SDK messages", async () => {
  const parsed = parseCreateAppointmentRequest({
    requestId: "3f0e2b7c-58a4-4d6e-9b1a-2c7d8e9f0a1b", patient: { mode: "new", fullName: "Paciente Fictício", phone: "31999990000" },
    date: "2026-11-02", time: "10:00", duration: 50, modality: "online", sessionType: "initial", status: "confirmed", amount: 15000, method: "pix",
  });
  assert.ok(parsed.ok);
  const reference = { doc: () => ({}), where: () => ({}) };
  const context = { now, actorId: "local-admin-ana", appointmentId: "a1", patientId: "p1" };
  for (const runTransaction of [async () => { throw new Error("private SDK error"); }, () => new Promise(() => {})]) {
    const db = { collection: () => reference, runTransaction } as unknown as Firestore;
    const result = await createFirestoreAppointmentsWriter(db, 20).createAppointment(parsed.value, context);
    assert.deepEqual(result.ok ? undefined : result.error.code, "UNAVAILABLE");
    assert.ok(!JSON.stringify(result).includes("private"));
  }
  assert.equal(appointmentWriteStatus("SCHEDULE_CONFLICT"), 409);
  assert.equal(appointmentWriteStatus("IDEMPOTENCY_KEY_REUSED"), 409);
  assert.equal(appointmentWriteStatus("VALIDATION_ERROR"), 422);
  assert.equal(appointmentWriteStatus("PATIENT_NOT_FOUND"), 422);
  assert.equal(appointmentWriteStatus("INVALID_OPERATION_TIME"), 422);
  assert.equal(appointmentWriteStatus("INVALID_BODY"), 400);
  assert.equal(appointmentWriteStatus("UNAVAILABLE"), 503);
  assert.equal(appointmentWriteStatus("DATA_INVALID"), 503);
});
