import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { ADMIN_UID, DEMO_PROJECT_ID, FIRESTORE_HOST, assertLocalFirestoreEnvironment } from "../scripts/emulator-env.mjs";

assertLocalFirestoreEnvironment();
const require = createRequire(import.meta.url);
const compiled = "../.next/persistence-tests/features";
const { createFirestoreAppointmentsWriter, IDEMPOTENCY_RETENTION_MS } = require(`${compiled}/appointments/firestore-writer.server.js`);
const { parseCreateAppointmentRequest } = require(`${compiled}/appointments/create-request.js`);
const { createFirestoreAppointmentsRepository } = require(`${compiled}/appointments/firestore-repository.server.js`);
const { patientToFirestore } = require(`${compiled}/patients/firestore-mapper.server.js`);
const app = initializeApp({ projectId: DEMO_PROJECT_ID }, "appointments-write-integration");
const db = getFirestore(app);
// The emulator resolves lock contention in seconds; a wider deadline keeps parallel scenarios deterministic.
const writer = createFirestoreAppointmentsWriter(db, 30_000);
const now = new Date("2026-10-13T13:00:00.000Z"); // 10:00 in São Paulo.
const DAY = "2026-11-02";

function request(overrides = {}) {
  const result = parseCreateAppointmentRequest({
    requestId: randomUUID(),
    patient: { mode: "new", fullName: "Paciente Fictício", phone: "(31) 99999-0000" },
    date: DAY, time: "10:00", duration: 50, modality: "online", sessionType: "initial",
    status: "confirmed", amount: 15000, method: "pix", ...overrides,
  });
  assert.ok(result.ok, JSON.stringify(result));
  return result.value;
}
function create(value, overrides = {}) {
  return writer.createAppointment(value, { now, actorId: ADMIN_UID, appointmentId: randomUUID(), patientId: randomUUID(), ...overrides });
}
function code(result) { return result.ok ? "OK" : result.error.code; }
async function count(collection, date) {
  const query = date ? db.collection(collection).where("date", "==", date) : db.collection(collection);
  return (await query.get()).size;
}
async function revision(date = DAY) { return (await db.doc(`appointmentDays/${date}`).get()).data()?.revision; }

beforeEach(async () => {
  const response = await fetch(`http://${FIRESTORE_HOST}/emulator/v1/projects/${DEMO_PROJECT_ID}/databases/(default)/documents`, { method: "DELETE" });
  assert.equal(response.status, 200);
});
after(async () => { await db.terminate(); await deleteApp(app); });

test("creation on an empty day writes appointment, patient, day lock and idempotency record together", async () => {
  const value = request({ patient: { mode: "new", fullName: "  Maria  Fictícia ", phone: "31988887777", email: "maria@example.invalid" }, notes: "Primeiro contato." });
  const result = await create(value);
  assert.equal(code(result), "OK");
  assert.equal(result.replayed, false);
  const stored = (await db.doc(`appointments/${result.appointmentId}`).get()).data();
  assert.equal(stored.version, 1);
  assert.equal(stored.status, "confirmed");
  assert.deepEqual(stored.payment, { amount: 15000, method: "pix", status: "pending" });
  assert.equal(stored.patient.relationship, "new");
  assert.equal(stored.patient.fullName, "Maria Fictícia");
  assert.equal(stored.patient.phone, "(31) 98888-7777");
  assert.equal(stored.activityTimeline.length, 1);
  const [event] = stored.activityTimeline;
  assert.equal(event.type, "created");
  assert.equal(event.actorId, ADMIN_UID);
  assert.ok(event.occurredAt instanceof Timestamp);
  assert.equal(event.occurredAt.toDate().toISOString(), now.toISOString());
  const domain = await createFirestoreAppointmentsRepository(db).getAppointmentById(result.appointmentId);
  assert.equal(domain.notes, "Primeiro contato.");
  assert.equal(domain.activityTimeline[0].details.initial.patientId, domain.patient.id);

  const patient = (await db.doc(`patients/${domain.patient.id}`).get()).data();
  assert.equal(patient.fullName, "Maria Fictícia");
  assert.equal(patient.email, "maria@example.invalid");
  assert.equal(patient.version, 1);
  assert.equal(patient.createdBy, ADMIN_UID);
  assert.ok(patient.createdAt instanceof Timestamp);
  assert.deepEqual(Object.keys((await db.doc(`appointmentDays/${DAY}`).get()).data()).sort(), ["date", "revision", "updatedAt"]);
  assert.equal(await revision(), 1);
  const key = (await db.doc(`idempotencyKeys/${value.requestId}`).get()).data();
  assert.equal(key.operation, "appointment.create");
  assert.equal(key.actorId, ADMIN_UID);
  assert.equal(key.appointmentId, result.appointmentId);
  assert.match(key.requestHash, /^[a-f0-9]{64}$/);
  assert.equal(key.expiresAt.toMillis() - key.createdAt.toMillis(), IDEMPOTENCY_RETENTION_MS);
  assert.ok(!JSON.stringify(key).includes("Maria"));
});

test("an existing patient is copied from the stored registration; a missing patient writes nothing", async () => {
  const registeredAt = "2026-09-01T12:00:00.000Z";
  await db.doc("patients/registered").set(patientToFirestore({ id: "registered", version: 1, fullName: "Paciente Cadastrado",
    phone: "(31) 97777-6666", createdAt: registeredAt, createdBy: ADMIN_UID, updatedAt: registeredAt }));
  const result = await create(request({ patient: { mode: "existing", id: "registered" }, sessionType: "follow_up" }));
  assert.equal(code(result), "OK");
  const stored = (await db.doc(`appointments/${result.appointmentId}`).get()).data();
  assert.deepEqual(stored.patient, { id: "registered", fullName: "Paciente Cadastrado", phone: "(31) 97777-6666", relationship: "returning" });
  assert.equal(await count("patients"), 1);
  assert.equal(code(await create(request({ patient: { mode: "existing", id: "missing" }, time: "15:00" }))), "PATIENT_NOT_FOUND");
  assert.equal(await count("appointments"), 1);
  assert.equal(await count("idempotencyKeys"), 1);
  assert.equal(await revision(), 1);
});

test("every non-cancelled status occupies the interval; cancelled, adjacent and other days do not", async () => {
  const first = await create(request());
  assert.equal(code(first), "OK");
  for (const status of ["pending", "confirmed", "completed", "no_show"]) {
    await db.doc(`appointments/${first.appointmentId}`).update({ status });
    assert.equal(code(await create(request({ time: "10:30", duration: 15 }))), "SCHEDULE_CONFLICT", status);
  }
  assert.equal(await count("appointments"), 1);
  assert.equal(await count("patients"), 1);
  assert.equal(await revision(), 1);
  assert.equal(code(await create(request({ time: "10:50" }))), "OK");
  assert.equal(code(await create(request({ time: "09:10" }))), "OK");
  assert.equal(code(await create(request({ date: "2026-11-03" }))), "OK");
  await db.doc(`appointments/${first.appointmentId}`).update({ status: "cancelled" });
  assert.equal(code(await create(request({ time: "10:20", duration: 20 }))), "OK");
  assert.equal(await count("appointments", DAY), 4);
  assert.equal(await revision(), 4);
});

test("concurrent overlapping creations on an empty day persist exactly one appointment", async () => {
  const results = await Promise.all(["10:00", "10:05", "10:10", "10:15", "10:20", "10:25"]
    .map((time) => create(request({ time }))));
  const codes = results.map(code);
  assert.equal(codes.filter((value) => value === "OK").length, 1, codes.join(","));
  assert.ok(codes.every((value) => value === "OK" || value === "SCHEDULE_CONFLICT"), codes.join(","));
  assert.equal(await count("appointments", DAY), 1);
  assert.equal(await count("patients"), 1);
  assert.equal(await count("idempotencyKeys"), 1);
  assert.equal(await revision(), 1);
});

test("concurrent non-overlapping creations on the same day all succeed and serialize the day revision", async () => {
  const results = await Promise.all(["08:00", "09:00", "10:00", "11:00"].map((time) => create(request({ time }))));
  assert.deepEqual(results.map(code), ["OK", "OK", "OK", "OK"]);
  assert.equal(new Set(results.map((result) => result.appointmentId)).size, 4);
  assert.equal(await count("appointments", DAY), 4);
  assert.equal(await revision(), 4);
});

test("the same request ID replays sequentially and in parallel; a different payload is refused", async () => {
  const value = request();
  const first = await create(value);
  const replay = await create(value);
  assert.deepEqual([code(first), code(replay), replay.replayed], ["OK", "OK", true]);
  assert.equal(replay.appointmentId, first.appointmentId);
  const reused = await create({ ...value, time: "15:00" });
  assert.equal(code(reused), "IDEMPOTENCY_KEY_REUSED");
  assert.equal(reused.error.appointmentId, first.appointmentId);

  const parallel = request({ time: "16:00" });
  const results = await Promise.all([1, 2, 3].map(() => create(parallel)));
  assert.deepEqual(results.map(code), ["OK", "OK", "OK"]);
  assert.equal(new Set(results.map((result) => result.appointmentId)).size, 1);
  assert.equal(results.filter((result) => !result.replayed).length, 1);
  assert.equal(await count("appointments"), 2);
  assert.equal(await count("patients"), 2);
});

test("a refused attempt does not consume its request ID", async () => {
  assert.equal(code(await create(request())), "OK");
  const retry = request({ time: "10:30" });
  assert.equal(code(await create(retry)), "SCHEDULE_CONFLICT");
  assert.equal(code(await create({ ...retry, time: "11:00" })), "OK");
  assert.equal(await count("appointments"), 2);
});

test("current or past starts are rejected without writing", async () => {
  for (const [date, time] of [["2026-10-13", "10:00"], ["2026-10-13", "09:59"], ["2026-10-12", "23:00"]]) {
    assert.equal(code(await create(request({ date, time }))), "INVALID_OPERATION_TIME");
  }
  assert.equal(code(await create(request({ date: "2026-10-13", time: "10:01" }))), "OK");
  assert.equal(await count("appointments"), 1);
  assert.equal(await count("idempotencyKeys"), 1);
});

test("corrupt same-day data fails closed; corrupt data on another day does not block", async () => {
  await db.doc("appointments/corrupt").set({ date: DAY, notes: "private-corrupt-marker" });
  const blocked = await create(request());
  assert.equal(code(blocked), "DATA_INVALID");
  assert.ok(!JSON.stringify(blocked).includes("private-corrupt-marker"));
  assert.equal(await count("appointments"), 1);
  assert.equal(await count("patients"), 0);
  await db.doc("appointments/corrupt").update({ date: "2026-11-05" });
  assert.equal(code(await create(request())), "OK");
  await db.doc(`appointmentDays/${DAY}`).set({ date: DAY, revision: "corrupt" });
  assert.equal(code(await create(request({ time: "15:00" }))), "DATA_INVALID");
  const malformedKey = request({ date: "2026-11-04" });
  await db.doc(`idempotencyKeys/${malformedKey.requestId}`).set({ operation: "appointment.create" });
  assert.equal(code(await create(malformedKey)), "DATA_INVALID");
  assert.equal(await count("appointments"), 2);
});
