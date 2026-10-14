import test, { after } from "node:test";
import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { ADMIN_UID, ADMIN_EMAIL, LOCAL_PASSWORD, AUTH_HOST, DEMO_PROJECT_ID, assertLocalEmulatorEnvironment } from "../scripts/emulator-env.mjs";

assertLocalEmulatorEnvironment();
const origin = process.env.ADMIN_TEST_ORIGIN;
assert.ok(origin && new URL(origin).hostname === "127.0.0.1");
const scenario = process.env.ADMIN_TEST_SCENARIO;
const app = initializeApp({ projectId: DEMO_PROJECT_ID }, `config-test-${scenario}`);
const auth = getAuth(app);
after(() => deleteApp(app));

async function validToken() {
  try { await auth.deleteUser(ADMIN_UID); }
  catch (error) { if (error.code !== "auth/user-not-found") throw error; }
  await auth.createUser({ uid: ADMIN_UID, email: ADMIN_EMAIL, password: LOCAL_PASSWORD });
  const response = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: LOCAL_PASSWORD, returnSecureToken: true }),
  });
  assert.equal(response.status, 200);
  return (await response.json()).idToken;
}

async function request(path, options = {}) {
  return fetch(`${origin}${path}`, { redirect: "manual", signal: AbortSignal.timeout(60_000), ...options });
}

function privateDataAbsent(html) {
  for (const name of ["Mariana Silva", "Carlos Eduardo Santos", "Júlia Oliveira", "mock-patient-"]) {
    assert.ok(!html.includes(name), "Failure must not render appointment fixtures");
  }
}

test(`server fails closed with ${scenario}`, async () => {
  if (scenario === "config-incomplete") {
    const login = await request("/admin/entrar");
    const html = await login.text();
    assert.match(html, /Verifique a configuração do ambiente/);
    assert.ok(!html.includes('name="password"'));
    for (const [path, method] of [["csrf", "GET"], ["sessao", "POST"], ["sair", "POST"]]) {
      const response = await request(`/api/admin/auth/${path}`, { method });
      assert.equal(response.status, 503);
      assert.match(response.headers.get("cache-control"), /no-store/);
    }
    const protectedPage = await request("/admin/inicio", { headers: { Cookie: "ana-admin-session=invalid" } });
    privateDataAbsent(await protectedPage.text());
    return;
  }

  const idToken = await validToken();
  const csrf = await request("/api/admin/auth/csrf");
  assert.equal(csrf.status, 200);
  const { csrfToken } = await csrf.json();
  const csrfCookie = csrf.headers.getSetCookie()[0].split(";")[0];
  const session = await request("/api/admin/auth/sessao", {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json", Cookie: csrfCookie, "X-CSRF-Token": csrfToken },
    body: JSON.stringify({ idToken }),
  });

  if (scenario === "auth-unavailable") {
    assert.equal(session.status, 503);
    assert.equal(session.headers.getSetCookie().length, 0);
    assert.deepEqual(await session.json(), { message: "Acesso administrativo temporariamente indisponível." });
    const cookie = await auth.createSessionCookie(idToken, { expiresIn: 28_800_000 });
    const page = await request("/admin/inicio", { headers: { Cookie: `ana-admin-session=${cookie}` } });
    const body = await page.text();
    privateDataAbsent(body);
    assert.ok((page.headers.get("location") ?? body).includes("motivo=indisponivel"));
    return;
  }

  assert.ok(["firestore-config-incomplete", "firestore-unavailable"].includes(scenario));
  assert.equal(session.status, 204);
  const cookie = session.headers.getSetCookie().find((value) => value.startsWith("ana-admin-session=")).split(";")[0];
  for (const path of ["/admin/inicio", "/admin/agenda", "/admin/agendamentos/apt-002"]) {
    const response = await request(path, { headers: { Cookie: cookie } });
    const body = await response.text();
    privateDataAbsent(body);
    assert.match(body, scenario === "firestore-config-incomplete" ? /Consultas indisponíveis neste ambiente/ : /Consultas temporariamente indisponíveis/);
    assert.match(body, /Tentar novamente/);
    assert.ok(!body.includes("Demonstração — consultas ainda sem persistência"));
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
});
