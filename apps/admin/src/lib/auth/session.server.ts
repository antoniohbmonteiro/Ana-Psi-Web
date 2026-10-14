import "server-only";
import type { Auth, DecodedIdToken } from "firebase-admin/auth";
import { AdminAuthError } from "./errors";
import type { AdminConfig } from "../firebase/config.server";

export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
export const RECENT_SIGN_IN_SECONDS = 5 * 60;

export function cookiePolicy(config: Pick<AdminConfig, "secure">) {
  return { httpOnly: true, secure: config.secure, sameSite: "lax" as const, path: "/" };
}

export function sessionCookieName(config: Pick<AdminConfig, "secure">) {
  return config.secure ? "__Host-ana-admin-session" : "ana-admin-session";
}

export function assertAllowedUid(token: Pick<DecodedIdToken, "uid">, allowedUid: string) {
  if (!allowedUid || token.uid !== allowedUid) throw new AdminAuthError(403, "ADMIN_FORBIDDEN");
}

export function assertRecentSignIn(authTime: number, now: number) {
  const age = Math.floor(now / 1000) - authTime;
  if (!Number.isFinite(authTime) || age < 0 || age >= RECENT_SIGN_IN_SECONDS) {
    throw new AdminAuthError(401, "RECENT_SIGN_IN_REQUIRED");
  }
}

// Keep invalid identity separate from provider/network failure. Neither exposes the SDK error text.
export function normalizeAuthError(error: unknown): AdminAuthError {
  if (error instanceof AdminAuthError) return error;
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  if (typeof code === "string" && [
    "auth/argument-error", "auth/invalid-id-token", "auth/id-token-expired", "auth/id-token-revoked",
    "auth/invalid-session-cookie", "auth/session-cookie-expired", "auth/session-cookie-revoked",
    "auth/user-disabled", "auth/user-not-found",
  ].includes(code)) return new AdminAuthError(401, "SESSION_INVALID");
  return new AdminAuthError(503, "AUTH_UNAVAILABLE");
}

export async function verifyAdminSession(
  cookie: string | undefined, config: AdminConfig, auth: Pick<Auth, "verifySessionCookie">,
) {
  if (!cookie) throw new AdminAuthError(401, "SESSION_REQUIRED");
  try {
    const token = await auth.verifySessionCookie(cookie, true);
    assertAllowedUid(token, config.allowedUid);
    return { uid: token.uid };
  } catch (error) { throw normalizeAuthError(error); }
}

export async function issueAdminSession(
  idToken: string, config: AdminConfig, auth: Pick<Auth, "verifyIdToken" | "createSessionCookie">,
  now?: number,
) {
  try {
    const token = await auth.verifyIdToken(idToken, true);
    assertAllowedUid(token, config.allowedUid);
    assertRecentSignIn(token.auth_time, now ?? Date.now());
    return await auth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });
  } catch (error) { throw normalizeAuthError(error); }
}
