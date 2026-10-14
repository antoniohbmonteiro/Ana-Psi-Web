import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { initializeApp as initializeAdmin, deleteApp as deleteAdmin } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { putFictitiousAppointments } from "../scripts/appointment-fixtures.mjs";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { initializeApp as initializeClient, deleteApp as deleteClient } from "firebase/app";
import { initializeAuth, connectAuthEmulator, inMemoryPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  ADMIN_EMAIL, ADMIN_UID, AUTH_HOST, DEMO_PROJECT_ID, LOCAL_PASSWORD, assertLocalEmulatorEnvironment,
} from "../scripts/emulator-env.mjs";

assertLocalEmulatorEnvironment();
const origin = process.env.ADMIN_TEST_ORIGIN;
assert.ok(origin && new URL(origin).hostname === "127.0.0.1");
const adminApp = initializeAdmin({ projectId: DEMO_PROJECT_ID }, "integration-admin");
const adminAuth = getAdminAuth(adminApp);
const db = getFirestore(adminApp);
const clientApp = initializeClient({ apiKey: "fake-api-key", projectId: DEMO_PROJECT_ID }, "integration-client");
const clientAuth = initializeAuth(clientApp, { persistence: inMemoryPersistence });
connectAuthEmulator(clientAuth, `http://${AUTH_HOST}`, { disableWarnings: true });
const otherUid = "local-non-admin";
const otherEmail = "other.user@example.invalid";
const routes = ["/admin/inicio", "/admin/agenda", "/admin/agendamentos/apt-002", "/admin/pacientes",
  "/admin/financeiro", "/admin/pre-reservas", "/admin/disponibilidade", "/admin/bloqueios"];

class CookieJar {
  values = new Map();
  receive(response) {
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const position = pair.indexOf("=");
      const name = pair.slice(0, position);
      const value = pair.slice(position + 1);
      if (value) this.values.set(name, value); else this.values.delete(name);
    }
  }
  get header() { return [...this.values].map(([name, value]) => `${name}=${value}`).join("; "); }
}

async function request(path, jar = new CookieJar(), options = {}) {
  const response = await fetch(`${origin}${path}`, {
    ...options, headers: { Cookie: jar.header, ...options.headers }, redirect: "manual",
    signal: AbortSignal.timeout(60_000),
  });
  jar.receive(response);
  return response;
}

async function signIn(email = ADMIN_EMAIL, password = LOCAL_PASSWORD) {
  try {
    const result = await signInWithEmailAndPassword(clientAuth, email, password);
    return await result.user.getIdToken();
  } finally { await signOut(clientAuth); }
}

async function csrf(jar) {
  const response = await request("/api/admin/auth/csrf", jar);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  return (await response.json()).csrfToken;
}

async function exchange(idToken, jar = new CookieJar()) {
  const token = await csrf(jar);
  const response = await request("/api/admin/auth/sessao", jar, {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": token },
    body: JSON.stringify({ idToken }),
  });
  return { response, jar };
}

async function login() {
  const result = await exchange(await signIn());
  assert.equal(result.response.status, 204);
  return result.jar;
}

async function assertDenied(response) {
  const body = await response.text();
  assert.ok([200, 303, 307].includes(response.status), `Unexpected protected response status: ${response.status}`);
  assert.ok((response.headers.get("location") ?? body).includes("/admin/entrar"));
  // Next may echo the requested document ID as route metadata; that is not fetched appointment data.
  for (const value of ["Mariana Silva", "Carlos Eduardo Santos", "Júlia Oliveira", "mock-patient-", "99999-9999"]) {
    assert.ok(!body.includes(value), `Protected HTML/RSC must not disclose appointment data: ${value}`);
  }
  assert.match(response.headers.get("cache-control"), /no-store/);
}

function unsignedFixture(cookie, changes) {
  // Auth Emulator tokens are unsigned. This helper is test-only and never shipped in the application.
  const parts = cookie.split(".");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  return `${parts[0]}.${Buffer.from(JSON.stringify({ ...payload, ...changes })).toString("base64url")}.`;
}

before(async () => {
  await putFictitiousAppointments(db);
  for (const [uid, email] of [[ADMIN_UID, ADMIN_EMAIL], [otherUid, otherEmail]]) {
    try { await adminAuth.deleteUser(uid); }
    catch (error) { if (error.code !== "auth/user-not-found") throw error; }
    await adminAuth.createUser({ uid, email, password: LOCAL_PASSWORD });
  }
});

after(async () => {
  await deleteClient(clientApp);
  await db.terminate();
  await deleteAdmin(adminApp);
});

test("login route is public, has Portuguese fields, and contains no private UID", async () => {
  const response = await request("/admin/entrar");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Entrar no administrativo/);
  assert.match(html, /name="email"/);
  assert.match(html, /name="password"/);
  assert.ok(!html.includes(ADMIN_UID));
  assert.match(response.headers.get("cache-control"), /no-store/);
});

test("all direct routes and RSC requests deny access without a session", async () => {
  for (const route of routes) {
    await assertDenied(await request(route));
    await assertDenied(await request(`${route}?_rsc=auth-test`, undefined, { headers: { RSC: "1" } }));
  }
});

test("invalid credentials fail in Firebase; a malformed token cannot create a server session", async () => {
  await assert.rejects(signIn(ADMIN_EMAIL, "wrong-password"));
  assert.equal(clientAuth.currentUser, null);
  const { response, jar } = await exchange("not-a-token");
  assert.equal(response.status, 401);
  assert.equal(jar.values.has("ana-admin-session"), false);
});

test("authenticated non-admin cannot exchange tokens or use a legitimate Firebase session cookie", async () => {
  const idToken = await signIn(otherEmail);
  const { response, jar } = await exchange(idToken);
  assert.equal(response.status, 403);
  assert.equal(jar.values.has("ana-admin-session"), false);
  jar.values.set("ana-admin-session", await adminAuth.createSessionCookie(idToken, { expiresIn: 28_800_000 }));
  for (const route of routes) await assertDenied(await request(route, jar));
});

test("valid login issues an eight-hour HttpOnly session and authorized pages use persisted data", async () => {
  const { response, jar } = await exchange(await signIn());
  assert.equal(response.status, 204);
  assert.equal(clientAuth.currentUser, null);
  const cookie = response.headers.getSetCookie().find((value) => value.startsWith("ana-admin-session="));
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=lax/i);
  assert.match(cookie, /Path=\//i);
  assert.match(cookie, /Max-Age=28800/i);
  assert.ok(!cookie.includes("Domain="));
  const session = decodeURIComponent(jar.values.get("ana-admin-session"));
  const claims = await adminAuth.verifySessionCookie(session, true);
  assert.equal(claims.exp - claims.iat, 28_800);
  for (const route of routes) {
    const page = await request(route, jar);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.ok(!html.includes("Demonstração — consultas ainda sem persistência"));
    if (["/admin/inicio", "/admin/agenda", "/admin/agendamentos/apt-002"].includes(route)) {
      assert.ok(html.includes("Carlos Eduardo Santos"), "Authorized page must show the persisted fixture");
    }
    assert.match(page.headers.get("cache-control"), /no-store/);
  }
});


test("Home, Agenda and Detail share Firestore fixtures and preserve read-only actions", async () => {
  const jar = await login();
  for (const route of ["/admin/inicio", "/admin/agenda", "/admin/agendamentos/local-minute-0"]) {
    const response = await request(route, jar); const html = await response.text();
    assert.equal(response.status, 200);
    assert.ok(html.includes("Paciente fictício 1"), `Missing persisted fixture on ${route}`);
    assert.ok(html.includes("10:17"), `Missing exact start on ${route}`);
    assert.match(html, /disabled/);
    assert.ok(!html.includes("Dados demonstrativos"));
    assert.ok(!html.includes("Bloqueio Pessoal"));
    if (route === "/admin/inicio") assert.ok(html.includes("Ainda não integrado"));
  }
  const agenda = await (await request("/admin/agenda", jar)).text();
  assert.match(agenda, /07:15/); assert.match(agenda, /23:45/);
  const detail = await (await request("/admin/agendamentos/apt-002", jar)).text();
  assert.ok(detail.includes("Pagamento"), "Detail must show payment information");
  assert.ok(detail.includes("Histórico"), "Detail must show history information");
});

test("empty data, missing documents and corrupted data have distinct page states", async () => {
  const jar = await login();
  const documents = await db.collection("appointments").get();
  try {
    const batch = db.batch(); for (const item of documents.docs) batch.delete(item.ref); await batch.commit();
    const home = await request("/admin/inicio", jar); const html = await home.text();
    assert.equal(home.status, 200); assert.ok(html.includes("Sem atendimentos hoje")); assert.ok(html.includes("Sem sessões"));
    const agenda = await request("/admin/agenda", jar); assert.ok((await agenda.text()).includes("Nenhum agendamento disponível"));
    const missing = await request("/admin/agendamentos/missing", jar);
    // With a loading boundary Next can commit 200 before streaming a not-found response.
    const missingBody = await missing.text();
    assert.ok([200, 404].includes(missing.status));
    assert.ok(missing.status === 404 || missingBody.includes("NEXT_HTTP_ERROR_FALLBACK;404"), "Missing document must trigger Next notFound");
    await db.doc("appointments/corrupt").set({ date: "invalid", notes: "private-corrupt-marker" });
    for (const route of ["/admin/inicio", "/admin/agenda", "/admin/agendamentos/corrupt"]) {
      const response = await request(route, jar); const body = await response.text();
      assert.notEqual(response.status, 404); assert.match(body, /inconsistência nos dados/);
      assert.ok(!body.includes("private-corrupt-marker"));
      // Next serializes the available not-found component even when it is not rendered.
      assert.ok(!body.includes("NEXT_HTTP_ERROR_FALLBACK;404"), "Invalid documents must not trigger notFound");
    }
  } finally {
    await db.doc("appointments/corrupt").delete();
    const batch = db.batch(); for (const item of documents.docs) batch.set(item.ref, item.data()); await batch.commit();
  }
});

test("CSRF, foreign origins and malformed bodies are rejected without issuing a session", async () => {
  const jar = new CookieJar();
  const csrfToken = await csrf(jar);
  const idToken = await signIn();
  const headers = { Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": csrfToken };
  for (const changed of [
    { ...headers, Origin: "http://attacker.example.invalid" }, { ...headers, Origin: "" },
    { ...headers, "X-CSRF-Token": "invalid" },
  ]) {
    const response = await request("/api/admin/auth/sessao", jar, { method: "POST", headers: changed, body: JSON.stringify({ idToken }) });
    assert.equal(response.status, 403);
    assert.equal(jar.values.has("ana-admin-session"), false);
  }
  for (const body of ["{", "null", "[]", JSON.stringify({ idToken, uid: ADMIN_UID }), "x".repeat(20_000)]) {
    const response = await request("/api/admin/auth/sessao", jar, { method: "POST", headers, body });
    assert.equal(response.status, 400);
    assert.equal(jar.values.has("ana-admin-session"), false);
  }
  const foreign = await request("/api/admin/auth/csrf", jar, { headers: { Origin: "http://attacker.example.invalid" } });
  assert.equal(foreign.status, 403);
  for (const path of ["sessao", "sair"]) {
    const response = await request(`/api/admin/auth/${path}`);
    assert.equal(response.status, 405);
  }
});

test("malformed and expired cookies are denied, including direct appointment access", async () => {
  const valid = await login();
  for (const cookie of ["not-a-cookie", unsignedFixture(decodeURIComponent(valid.values.get("ana-admin-session")), {
    exp: Math.floor(Date.now() / 1000) - 600,
  })]) {
    const jar = new CookieJar();
    jar.values.set("ana-admin-session", cookie);
    for (const route of ["/admin/inicio", "/admin/agendamentos/apt-002"]) await assertDenied(await request(route, jar));
  }
});

test("an old authentication time cannot be used to establish a fresh session", async () => {
  const old = unsignedFixture(await signIn(), { auth_time: Math.floor(Date.now() / 1000) - 301 });
  const { response, jar } = await exchange(old);
  assert.equal(response.status, 401);
  assert.equal(jar.values.has("ana-admin-session"), false);
});

test("logout requires CSRF, clears the current cookie, and preserves another browser session", async () => {
  const first = await login();
  const second = await login();
  const token = await csrf(first);
  const denied = await request("/api/admin/auth/sair", first, {
    method: "POST", headers: { Origin: "http://attacker.example.invalid", "X-CSRF-Token": token },
  });
  assert.equal(denied.status, 403);
  assert.equal(first.values.has("ana-admin-session"), true);
  const response = await request("/api/admin/auth/sair", first, {
    method: "POST", headers: { Origin: origin, "X-CSRF-Token": token },
  });
  assert.equal(response.status, 204);
  assert.equal(first.values.has("ana-admin-session"), false);
  await assertDenied(await request("/admin/inicio", first));
  assert.equal((await request("/admin/inicio", second)).status, 200);
});

test("revoked sessions and ID tokens are denied, while logout still works", async () => {
  const idToken = await signIn();
  const { jar } = await exchange(idToken);
  await delay(1100); // Firebase's revocation timestamps have second precision.
  await adminAuth.revokeRefreshTokens(ADMIN_UID);
  await assertDenied(await request("/admin/inicio", jar));
  assert.equal((await exchange(idToken)).response.status, 401);
  const token = await csrf(jar);
  const response = await request("/api/admin/auth/sair", jar, {
    method: "POST", headers: { Origin: origin, "X-CSRF-Token": token },
  });
  assert.equal(response.status, 204);
  assert.equal(jar.values.has("ana-admin-session"), false);
});

test("disabled or deleted administrative accounts cannot access protected data", async () => {
  const jar = await login();
  await adminAuth.updateUser(ADMIN_UID, { disabled: true });
  await assertDenied(await request("/admin/inicio", jar));
  await adminAuth.updateUser(ADMIN_UID, { disabled: false });
  const fresh = await login();
  await adminAuth.deleteUser(ADMIN_UID);
  await assertDenied(await request("/admin/agendamentos/apt-002", fresh));
});
