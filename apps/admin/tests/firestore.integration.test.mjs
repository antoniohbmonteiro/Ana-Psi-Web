import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, setLogLevel } from "firebase/firestore";
import { ADMIN_UID, DEMO_PROJECT_ID, assertLocalFirestoreEnvironment, localEnvironment } from "../scripts/emulator-env.mjs";
import { fictitiousAppointments, fictitiousPatients, putFictitiousAppointments, putFictitiousPatients } from "../scripts/appointment-fixtures.mjs";

assertLocalFirestoreEnvironment();
// Permission errors are expected and asserted below; do not flood CI with SDK warnings.
setLogLevel("silent");
const require = createRequire(import.meta.url);
const { createFirestoreAppointmentsRepository } = require("../.next/persistence-tests/features/appointments/firestore-repository.server.js");
const { AppointmentsReadError } = require("../.next/persistence-tests/features/appointments/read-errors.js");
const app = initializeApp({ projectId: DEMO_PROJECT_ID }, "firestore-integration");
const db = getFirestore(app);
const fixtures = fictitiousAppointments(new Date("2026-10-13T18:20:00Z"));
let rules;

before(async () => {
  rules = await initializeTestEnvironment({ projectId: DEMO_PROJECT_ID, firestore: {
    host: "127.0.0.1", port: 8080, rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8"),
  } });
  await rules.clearFirestore();
  await putFictitiousAppointments(db, fixtures);
  for (const id of ["site_public_profile", "site_public_landing", "private_settings"]) await db.doc(`settings/${id}`).set({ label: "Fixture institucional" });
  await db.doc("appointments/apt-002/private/nested").set({ value: "privado" });
  await putFictitiousPatients(db, fictitiousPatients(fixtures));
  await db.doc("appointmentDays/2026-11-02").set({ date: "2026-11-02", revision: 1 });
  await db.doc("idempotencyKeys/fixture-key").set({ operation: "appointment.create" });
});
after(async () => { await rules?.cleanup(); await db.terminate(); await deleteApp(app); });

test("Admin repository reads, sorts, filters by civil date and fetches exact document IDs", async () => {
  const repo = createFirestoreAppointmentsRepository(db);
  const all = await repo.getAllAppointments();
  const sorted = [...fixtures].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
  assert.deepEqual(all, sorted);
  assert.deepEqual(await repo.getAppointmentsByDate("2026-10-13"), sorted.filter((item) => item.date === "2026-10-13"));
  assert.deepEqual(await repo.getAppointmentById("apt-002"), fixtures[1]);
  assert.equal(await repo.getAppointmentById("missing"), undefined);
  await assert.rejects(repo.getAppointmentById("apt-002/private/nested"),
    (error) => error instanceof AppointmentsReadError && error.code === "DATA_INVALID");
});

for (const [label, context] of [
  ["anonymous", () => rules.unauthenticatedContext()],
  ["ordinary user", () => rules.authenticatedContext("local-ordinary-user")],
  ["admin UID", () => rules.authenticatedContext(ADMIN_UID)],
]) {
  test(`client ${label} cannot get/list/create/update/delete appointments or descendants`, async () => {
    const client = context().firestore();
    for (const path of ["appointments/apt-002", "appointments/apt-002/private/nested"]) {
      const ref = doc(client, path);
      await assertFails(getDoc(ref)); await assertFails(setDoc(ref, { value: "changed" }));
      await assertFails(updateDoc(ref, { value: "changed" })); await assertFails(deleteDoc(ref));
    }
    await assertFails(setDoc(doc(client, "appointments/new"), { value: "new" }));
    await assertFails(getDocs(collection(client, "appointments")));
    await assertFails(getDocs(collection(client, "appointments/apt-002/private")));
  });
  test(`client ${label} cannot read or write patients, day locks or idempotency records`, async () => {
    const client = context().firestore();
    for (const path of ["patients/mock-patient-002", "appointmentDays/2026-11-02", "idempotencyKeys/fixture-key"]) {
      const ref = doc(client, path);
      await assertFails(getDoc(ref)); await assertFails(setDoc(ref, { value: "changed" }));
      await assertFails(updateDoc(ref, { value: "changed" })); await assertFails(deleteDoc(ref));
      await assertFails(getDocs(collection(client, path.split("/")[0])));
      await assertFails(setDoc(doc(client, `${path}/private/nested`), { value: "new" }));
    }
  });
  test(`client ${label} can only get the two public settings documents`, async () => {
    const client = context().firestore();
    for (const id of ["site_public_profile", "site_public_landing"]) {
      const ref = doc(client, `settings/${id}`);
      assert.equal((await assertSucceeds(getDoc(ref))).exists(), true);
      await assertFails(setDoc(ref, { value: "changed" }));
      await assertFails(updateDoc(ref, { value: "changed" })); await assertFails(deleteDoc(ref));
      await assertFails(getDoc(doc(client, `settings/${id}/private/nested`)));
    }
    await assertFails(getDocs(collection(client, "settings")));
    await assertFails(getDoc(doc(client, "settings/private_settings")));
    await assertFails(setDoc(doc(client, "settings/new"), { value: "new" }));
    await assertFails(getDoc(doc(client, "unknown/document")));
    await assertFails(setDoc(doc(client, "unknown/document"), { value: "new" }));
  });
}

test("explicit fixture preparation is idempotent, preserves other documents and rejects remote targets", async () => {
  const env = localEnvironment();
  for (const change of [
    { FIREBASE_PROJECT_ID: "ana-psi" }, { NEXT_PUBLIC_FIREBASE_PROJECT_ID: "ana-psi" },
    { ADMIN_ENV: "production" }, { FIREBASE_AUTH_EMULATOR_HOST: "remote.example.invalid:9099" },
    { FIRESTORE_EMULATOR_HOST: "remote.example.invalid:8080" }, { FIRESTORE_EMULATOR_HOST: "" },
    { GCLOUD_PROJECT: "ana-psi" },
  ]) assert.throws(() => assertLocalFirestoreEnvironment({ ...env, ...change }));
  const extra = db.doc("appointments/local-extra");
  await extra.set({ marker: "preserve-this-fixture" });
  try {
    await putFictitiousAppointments(db, fixtures);
    await putFictitiousAppointments(db, fixtures);
    assert.equal((await db.collection("appointments").get()).size, fixtures.length + 1);
    assert.equal((await extra.get()).data().marker, "preserve-this-fixture");
  } finally { await extra.delete(); }
});

test("corrupt documents fail the whole listing and detail, never becoming empty or not found", async () => {
  await db.doc("appointments/corrupt").set({ date: "invalid" });
  const repo = createFirestoreAppointmentsRepository(db);
  const invalid = (error) => error instanceof AppointmentsReadError && error.code === "DATA_INVALID";
  await assert.rejects(repo.getAllAppointments(), invalid);
  await assert.rejects(repo.getAppointmentById("corrupt"), invalid);
  await db.doc("appointments/corrupt").delete();
});

test("an empty Firestore collection succeeds without creating fixtures", async () => {
  await rules.clearFirestore();
  const repo = createFirestoreAppointmentsRepository(db);
  assert.deepEqual(await repo.getAllAppointments(), []);
  assert.equal(await repo.getAppointmentById("apt-002"), undefined);
  assert.equal((await db.collection("appointments").get()).size, 0);
});
