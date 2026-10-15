// Shared HTTP helpers for integration suites; this module contains no tests.
import assert from "node:assert/strict";
import { ADMIN_EMAIL, AUTH_HOST, LOCAL_PASSWORD } from "../scripts/emulator-env.mjs";

export const origin = process.env.ADMIN_TEST_ORIGIN;
assert.ok(origin && new URL(origin).hostname === "127.0.0.1");

export class CookieJar {
  values = new Map();
  receive(response) {
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const position = pair.indexOf("=");
      const value = pair.slice(position + 1);
      if (value) this.values.set(pair.slice(0, position), value); else this.values.delete(pair.slice(0, position));
    }
  }
  get header() { return [...this.values].map(([name, value]) => `${name}=${value}`).join("; "); }
}

export async function request(path, jar = new CookieJar(), options = {}) {
  const response = await fetch(`${origin}${path}`, {
    ...options, headers: { Cookie: jar.header, ...options.headers }, redirect: "manual",
    signal: AbortSignal.timeout(60_000),
  });
  jar.receive(response);
  return response;
}

// Auth Emulator REST sign-in keeps client SDK state out of the HTTP suites.
export async function signIn(email = ADMIN_EMAIL, password = LOCAL_PASSWORD) {
  const response = await fetch(`http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  assert.equal(response.status, 200);
  return (await response.json()).idToken;
}

export async function csrf(jar) {
  const response = await request("/api/admin/auth/csrf", jar);
  assert.equal(response.status, 200);
  return (await response.json()).csrfToken;
}

export async function login(email = ADMIN_EMAIL) {
  const jar = new CookieJar();
  const token = await csrf(jar);
  const response = await request("/api/admin/auth/sessao", jar, {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": token },
    body: JSON.stringify({ idToken: await signIn(email) }),
  });
  return { response, jar };
}

export async function postJson(path, jar, body, headers = {}) {
  const token = await csrf(jar);
  return request(path, jar, {
    method: "POST", body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { Origin: origin, "Content-Type": "application/json", "X-CSRF-Token": token, ...headers },
  });
}

export function civilDate(offsetDays = 0, now = new Date()) {
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const [year, month, day] = today.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offsetDays)).toISOString().slice(0, 10);
}
