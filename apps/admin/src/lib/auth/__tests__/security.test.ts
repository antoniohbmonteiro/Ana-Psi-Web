import test from "node:test";
import assert from "node:assert/strict";
import type { Auth, DecodedIdToken } from "firebase-admin/auth";
import { parseAdminConfig } from "../../firebase/config.server";
import { AdminAuthError, publicAuthMessage } from "../errors";
import { sessionPost } from "../client";
import { assertCsrf, createCsrfToken, csrfCookieName } from "../csrf.server";
import {
  assertAllowedUid, assertRecentSignIn, cookiePolicy, issueAdminSession,
  normalizeAuthError, sessionCookieName, SESSION_DURATION_MS, verifyAdminSession,
} from "../session.server";

const localEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  ADMIN_ENV: "ci", ADMIN_ORIGIN: "http://127.0.0.1:3100", ADMIN_ALLOWED_UID: "local-admin-ana",
  FIREBASE_PROJECT_ID: "demo-ana-psi", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  NEXT_PUBLIC_FIREBASE_API_KEY: "fake-api-key", NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo-ana-psi.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-ana-psi", NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app",
  NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true", NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "http://127.0.0.1:9099",
};
const remoteEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  ADMIN_ENV: "production", ADMIN_ORIGIN: "https://admin.example.invalid", ADMIN_ALLOWED_UID: "future-admin",
  FIREBASE_PROJECT_ID: "future-project", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "future-project",
  NEXT_PUBLIC_FIREBASE_API_KEY: "public-key", NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "future-project.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_APP_ID: "public-app-id", NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "false",
};
const config = parseAdminConfig(localEnv);
const now = Date.parse("2026-10-13T18:00:00.000Z");
const token = { uid: config.allowedUid, auth_time: now / 1000 } as DecodedIdToken;
const failsWith = (status: number) => (error: unknown) => error instanceof AdminAuthError && error.status === status;

test("local mode is explicit, supports a production Next build, and keeps private configuration separate", () => {
  const parsed = parseAdminConfig({ ...localEnv, NODE_ENV: "production", ADMIN_ENABLE_DEMO_APPOINTMENTS: "true" });
  assert.equal(parsed.local, true);
  assert.equal(parsed.demoAppointments, true);
  assert.equal(parsed.publicAuth.emulatorUrl, "http://127.0.0.1:9099");
  assert.ok(!("allowedUid" in parsed.publicAuth));
  assert.equal(parseAdminConfig(localEnv).demoAppointments, false);
});

for (const key of ["ADMIN_ENV", "ADMIN_ORIGIN", "ADMIN_ALLOWED_UID", "FIREBASE_PROJECT_ID",
  "FIREBASE_AUTH_EMULATOR_HOST", "NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID", "NEXT_PUBLIC_FIREBASE_USE_EMULATORS",
  "NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL"]) {
  test(`missing ${key} fails closed before Firebase initialization`, () => {
    const env = { ...localEnv };
    delete env[key];
    assert.throws(() => parseAdminConfig(env), failsWith(503));
  });
}

for (const change of [
  { ADMIN_ENV: "unknown" }, { ADMIN_ORIGIN: "http://127.0.0.1:3100/path" },
  { ADMIN_ORIGIN: "http://remote.example.invalid:3100" },
  { FIREBASE_PROJECT_ID: "ana-psi", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "ana-psi" },
  { NEXT_PUBLIC_FIREBASE_PROJECT_ID: "different-project" }, { NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "false" },
  { FIREBASE_AUTH_EMULATOR_HOST: "remote.example.invalid:9099" },
  { FIREBASE_AUTH_EMULATOR_HOST: "http://127.0.0.1:9099" },
  { FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099/path" },
  { NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "http://localhost:9099" },
  { FIRESTORE_EMULATOR_HOST: "remote.example.invalid:8080" },
  { ADMIN_ENABLE_DEMO_APPOINTMENTS: "yes" },
]) {
  test(`local configuration rejects ${JSON.stringify(change)}`, () => {
    assert.throws(() => parseAdminConfig({ ...localEnv, ...change }), failsWith(503));
  });
}

test("remote mode requires HTTPS and forbids every emulator setting and demonstration", () => {
  assert.equal(parseAdminConfig(remoteEnv).secure, true);
  for (const change of [
    { ADMIN_ORIGIN: "http://admin.example.invalid" },
    { FIREBASE_PROJECT_ID: "demo-ana-psi", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-ana-psi" },
    { NEXT_PUBLIC_FIREBASE_USE_EMULATORS: "true" }, { FIREBASE_AUTH_EMULATOR_HOST: "" },
    { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080" }, { NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL: "" },
    { ADMIN_ENABLE_DEMO_APPOINTMENTS: "true" },
  ]) assert.throws(() => parseAdminConfig({ ...remoteEnv, ...change }), failsWith(503));
});

test("session cookie is host-only, HttpOnly, Lax, secure on HTTPS, and expires in eight hours", () => {
  const remote = parseAdminConfig(remoteEnv);
  assert.deepEqual(cookiePolicy(config), { httpOnly: true, secure: false, sameSite: "lax", path: "/" });
  assert.equal(cookiePolicy(remote).secure, true);
  assert.equal(sessionCookieName(remote), "__Host-ana-admin-session");
  assert.equal(csrfCookieName(remote), "__Host-ana-admin-csrf");
  assert.equal(sessionCookieName(config), "ana-admin-session");
  assert.equal(SESSION_DURATION_MS, 28_800_000);
});

test("authorization uses the exact allowed UID, never another identity attribute", () => {
  assertAllowedUid(token, config.allowedUid);
  assert.throws(() => assertAllowedUid({ uid: "other" }, config.allowedUid), failsWith(403));
  assert.throws(() => assertAllowedUid(token, ""), failsWith(403));
});

test("recent sign-in is accepted only inside the last five minutes", () => {
  assertRecentSignIn(now / 1000, now);
  assertRecentSignIn(now / 1000 - 299, now);
  for (const time of [now / 1000 - 300, now / 1000 + 1, NaN, Infinity]) {
    assert.throws(() => assertRecentSignIn(time, now), failsWith(401));
  }
});

test("CSRF requires exact origin, two valid tokens and a constant-time match", () => {
  const csrf = createCsrfToken();
  assert.notEqual(csrf, createCsrfToken());
  assertCsrf(config.origin, config.origin, csrf, csrf);
  for (const [origin, submitted, cookie] of [
    [null, csrf, csrf], ["http://attacker.example.invalid", csrf, csrf],
    [`${config.origin}/`, csrf, csrf], [config.origin, null, csrf],
    [config.origin, csrf, undefined], [config.origin, "invalid", csrf],
    [config.origin, csrf, createCsrfToken()],
  ] as const) assert.throws(() => assertCsrf(origin, config.origin, submitted, cookie), failsWith(403));
});

test("session exchange checks revocation, UID and recent authentication before issuing a cookie", async () => {
  const calls: string[] = [];
  const auth: Pick<Auth, "verifyIdToken" | "createSessionCookie"> = {
    async verifyIdToken(value, revoked) {
      assert.equal(value, "id-token"); assert.equal(revoked, true); calls.push("verify"); return token;
    },
    async createSessionCookie(value, options) {
      assert.equal(value, "id-token"); assert.equal(options.expiresIn, SESSION_DURATION_MS);
      calls.push("issue"); return "cookie";
    },
  };
  assert.equal(await issueAdminSession("id-token", config, auth, now), "cookie");
  assert.deepEqual(calls, ["verify", "issue"]);
  for (const invalid of [{ ...token, uid: "other" }, { ...token, auth_time: now / 1000 - 300 }]) {
    let issued = false;
    const forbidden = { ...auth, verifyIdToken: async () => invalid, createSessionCookie: async () => { issued = true; return "cookie"; } };
    await assert.rejects(issueAdminSession("id-token", config, forbidden, now), failsWith(invalid.uid === "other" ? 403 : 401));
    assert.equal(issued, false);
  }
});

test("session verification always checks revocation and returns only server identity", async () => {
  const auth: Pick<Auth, "verifySessionCookie"> = {
    async verifySessionCookie(cookie, revoked) {
      assert.equal(cookie, "cookie"); assert.equal(revoked, true); return token;
    },
  };
  assert.deepEqual(await verifyAdminSession("cookie", config, auth), { uid: config.allowedUid });
  await assert.rejects(verifyAdminSession(undefined, config, auth), failsWith(401));
  await assert.rejects(verifyAdminSession("cookie", config, { verifySessionCookie: async () => ({ ...token, uid: "other" }) }), failsWith(403));
});

test("expired/revoked/disabled identities are denied; provider failures stay unavailable", async () => {
  for (const code of ["auth/session-cookie-expired", "auth/session-cookie-revoked", "auth/user-disabled", "auth/user-not-found"]) {
    await assert.rejects(verifyAdminSession("cookie", config, {
      verifySessionCookie: async () => { throw { code, message: "sensitive provider text" }; },
    }), failsWith(401));
  }
  assert.equal(normalizeAuthError({ code: "app/network-error" }).status, 503);
  assert.equal(normalizeAuthError(new Error("secret")).message, "AUTH_UNAVAILABLE");
  assert.ok(!publicAuthMessage(503).includes("secret"));
});

test("client network errors never expose provider text and remain in Portuguese", async (context) => {
  const original = globalThis.fetch;
  context.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => { throw new TypeError("Failed to fetch secret-token"); };
  await assert.rejects(sessionPost("/api/admin/auth/sessao", { idToken: "secret-token" }), {
    message: "Acesso administrativo temporariamente indisponível.",
  });
});

test("client preserves a safe access-denied message without displaying the response body", async (context) => {
  const original = globalThis.fetch;
  context.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async (path) => String(path).endsWith("/csrf")
    ? Response.json({ csrfToken: createCsrfToken() })
    : new Response("sensitive-provider-detail", { status: 403 });
  await assert.rejects(sessionPost("/api/admin/auth/sessao", { idToken: "id-token" }), { message: "Acesso não autorizado." });
});
