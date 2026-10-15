import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { ADMIN_EMAIL, ADMIN_UID, DEMO_PROJECT_ID, LOCAL_PASSWORD, assertLocalFirestoreEnvironment } from "../scripts/emulator-env.mjs";
import { fictitiousAppointments, fictitiousPatients, putFictitiousAppointments, putFictitiousPatients } from "../scripts/appointment-fixtures.mjs";
import { CookieJar, civilDate, csrf, login, origin, postJson, request, signIn } from "./admin-http.mjs";

assertLocalFirestoreEnvironment();
const app = initializeApp({ projectId: DEMO_PROJECT_ID }, "appointments-create-integration");
const auth = getAuth(app);
const db = getFirestore(app);
const ENDPOINT = "/api/admin/agendamentos";
const otherEmail = "other.creator@example.invalid";
const FAR_DAY = civilDate(20);

function payload(overrides = {}) {
  return {
    requestId: randomUUID(),
    patient: { mode: "new", fullName: "Paciente HTTP Fictício", phone: "(31) 96666-5555" },
    date: FAR_DAY, time: "10:00", duration: 50, modality: "online", sessionType: "initial",
    status: "confirmed", amount: 15000, method: "pix", ...overrides,
  };
}
async function appointmentsCount() { return (await db.collection("appointments").get()).size; }
function assertPrivate(response) { assert.match(response.headers.get("cache-control") ?? "", /no-store/); }

let admin;
before(async () => {
  const appointments = await putFictitiousAppointments(db, fictitiousAppointments());
  await putFictitiousPatients(db, fictitiousPatients(appointments));
  for (const [uid, email] of [[ADMIN_UID, ADMIN_EMAIL], ["local-non-admin-creator", otherEmail]]) {
    try { await auth.deleteUser(uid); }
    catch (error) { if (error.code !== "auth/user-not-found") throw error; }
    await auth.createUser({ uid, email, password: LOCAL_PASSWORD });
  }
  const session = await login();
  assert.equal(session.response.status, 204);
  admin = session.jar;
});
after(async () => { await db.terminate(); await deleteApp(app); });

test("creation requires an administrative session, the exact origin and CSRF, and never writes otherwise", async () => {
  const before = await appointmentsCount();
  const anonymous = await postJson(ENDPOINT, new CookieJar(), payload());
  assert.equal(anonymous.status, 401);
  assertPrivate(anonymous);
  const other = await login(otherEmail);
  assert.equal(other.response.status, 403);
  const forgedCookie = new CookieJar();
  forgedCookie.values.set("ana-admin-session", await auth.createSessionCookie(await signIn(otherEmail), { expiresIn: 3_600_000 }));
  assert.equal((await postJson(ENDPOINT, forgedCookie, payload())).status, 403);
  for (const headers of [{ Origin: "http://attacker.example.invalid" }, { Origin: "" }, { "X-CSRF-Token": "invalid" }]) {
    const response = await postJson(ENDPOINT, admin, payload(), headers);
    assert.equal(response.status, 403);
    assertPrivate(response);
  }
  const token = await csrf(admin);
  const withoutCookie = await request(ENDPOINT, new CookieJar(), {
    method: "POST", body: JSON.stringify(payload()),
    headers: { Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": token, Cookie: `ana-admin-session=${admin.values.get("ana-admin-session")}` },
  });
  assert.equal(withoutCookie.status, 403, "The CSRF cookie must accompany the header");
  assert.equal((await request(ENDPOINT, admin)).status, 405);
  assert.equal(await appointmentsCount(), before);
});

test("malformed and invalid payloads are rejected with field errors and without echoing submitted data", async () => {
  const before = await appointmentsCount();
  assert.equal((await postJson(ENDPOINT, admin, payload(), { "Content-Type": "text/plain" })).status, 400);
  for (const body of ["{", "x".repeat(20_000), JSON.stringify(payload({ notes: "n".repeat(17_000) }))]) {
    const response = await postJson(ENDPOINT, admin, body);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { code: "INVALID_BODY", message: "Solicitação inválida." });
  }
  for (const [body, field] of [
    [[], "input"],
    [payload({ patient: { mode: "new", fullName: "Nome Secreto Fictício", phone: "123" } }), "patient.phone"],
    [payload({ requestId: "not-a-uuid" }), "requestId"],
    [payload({ amount: 150.5 }), "amount"],
    [payload({ modality: "in_person", meetingLink: "https://meet.example.invalid/x" }), "meetingLink"],
    [{ ...payload(), actorId: "forged-actor" }, "actorId"],
  ]) {
    const response = await postJson(ENDPOINT, admin, body);
    assert.equal(response.status, 422);
    assertPrivate(response);
    const text = await response.text();
    assert.ok(!text.includes("Nome Secreto"));
    const json = JSON.parse(text);
    assert.equal(json.code, "VALIDATION_ERROR");
    assert.ok(json.fieldErrors[field], `Missing field error ${field}`);
  }
  assert.equal(await appointmentsCount(), before);
});

test("a valid creation persists, appears in Detail and Agenda, and replays, conflicts and patients stay safe", async () => {
  const body = payload({ notes: "Observação HTTP fictícia." });
  const created = await postJson(ENDPOINT, admin, body);
  assert.equal(created.status, 201);
  assertPrivate(created);
  const { id, replayed } = await created.json();
  assert.equal(replayed, false);
  assert.equal(created.headers.get("location"), `/admin/agendamentos/${id}`);
  const stored = (await db.doc(`appointments/${id}`).get()).data();
  assert.equal(stored.version, 1);
  assert.equal(stored.activityTimeline[0].actorId, ADMIN_UID);
  assert.equal(stored.patient.relationship, "new");

  const detail = await request(`/admin/agendamentos/${id}?criado=1`, admin);
  const html = await detail.text();
  assert.equal(detail.status, 200);
  for (const text of ["Paciente HTTP Fictício", "Agendamento criado com sucesso.", "Agendamento criado", "R$ 150,00", "(31) 96666-5555", "Observação HTTP fictícia."]) {
    assert.ok(html.includes(text), `Detail must show ${text}`);
  }
  assert.ok(!(await (await request(`/admin/agendamentos/${id}`, admin)).text()).includes("Agendamento criado com sucesso."));
  assert.ok((await (await request("/admin/agenda", admin)).text()).includes("Paciente HTTP Fictício"));

  const replay = await postJson(ENDPOINT, admin, body);
  assert.equal(replay.status, 200);
  assert.deepEqual(await replay.json(), { id, replayed: true });
  const reused = await postJson(ENDPOINT, admin, { ...body, time: "15:00" });
  assert.equal(reused.status, 409);
  assert.deepEqual(await reused.json().then(({ code, appointmentId }) => ({ code, appointmentId })), { code: "IDEMPOTENCY_KEY_REUSED", appointmentId: id });
  const conflict = await postJson(ENDPOINT, admin, payload({ time: "10:30" }));
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).code, "SCHEDULE_CONFLICT");
  const past = await postJson(ENDPOINT, admin, payload({ date: civilDate(-1) }));
  assert.equal(past.status, 422);
  assert.equal((await past.json()).code, "INVALID_OPERATION_TIME");
  assert.equal((await db.collection("appointments").where("date", "==", FAR_DAY).get()).size, 1);

  const returning = await postJson(ENDPOINT, admin, payload({ patient: { mode: "existing", id: stored.patient.id }, time: "11:00", sessionType: "follow_up" }));
  assert.equal(returning.status, 201);
  const second = (await db.doc(`appointments/${(await returning.json()).id}`).get()).data();
  assert.deepEqual(second.patient, { ...stored.patient, relationship: "returning" });
  const missing = await postJson(ENDPOINT, admin, payload({ patient: { mode: "existing", id: "missing-patient" }, time: "14:00" }));
  assert.equal(missing.status, 422);
  assert.equal((await missing.json()).code, "PATIENT_NOT_FOUND");
});

test("Home reflects a newly created appointment as the next session and a pending payment", async () => {
  const documents = await db.collection("appointments").get();
  let createdId;
  try {
    const batch = db.batch(); for (const item of documents.docs) batch.delete(item.ref); await batch.commit();
    const created = await postJson(ENDPOINT, admin, payload({
      date: civilDate(1), time: "10:00", patient: { mode: "new", fullName: "Paciente Home Fictício", phone: "(31) 95555-1111" },
    }));
    assert.equal(created.status, 201);
    createdId = (await created.json()).id;
    const html = await (await request("/admin/inicio", admin)).text();
    assert.ok(html.includes("Paciente Home Fictício"));
    assert.ok(html.includes("Amanhã"));
    assert.match(html, /Pagamentos Pendentes<\/p><p class="mt-2 text-metric-value">1<\/p>/);
    assert.ok(html.includes(`href="/admin/agendamentos/${createdId}"`));
  } finally {
    if (createdId) await db.doc(`appointments/${createdId}`).delete();
    const batch = db.batch(); for (const item of documents.docs) batch.set(item.ref, item.data()); await batch.commit();
  }
});

test("the creation page requires an administrative session and offers registered patients", async () => {
  const denied = await request("/admin/agendamentos/novo");
  assert.ok([303, 307].includes(denied.status));
  assert.ok(denied.headers.get("location")?.includes("/admin/entrar"));
  const page = await request("/admin/agendamentos/novo", admin);
  assert.equal(page.status, 200);
  assertPrivate(page);
  const html = await page.text();
  for (const field of ["fullName", "phone", "email", "date", "time", "duration", "status", "amount", "method", "notes"]) {
    assert.ok(html.includes(`name="${field}"`), `Missing field ${field}`);
  }
  assert.ok(html.includes("Novo Agendamento"));
  assert.ok(html.includes("Carlos Eduardo Santos"), "Registered patients must be available to the selector");
  for (const route of ["/admin/agenda", "/admin/inicio"]) {
    assert.ok((await (await request(route, admin)).text()).includes('href="/admin/agendamentos/novo"'), `${route} must link to the form`);
  }
});
