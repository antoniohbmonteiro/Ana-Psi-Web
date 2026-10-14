import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { AdminAuthError } from "./errors";
import type { AdminConfig } from "../firebase/config.server";

export const CSRF_MAX_AGE_SECONDS = 60 * 60;

export function csrfCookieName(config: Pick<AdminConfig, "secure">) {
  return config.secure ? "__Host-ana-admin-csrf" : "ana-admin-csrf";
}

export function createCsrfToken() {
  return randomBytes(32).toString("hex");
}

export function assertCsrf(origin: string | null, expectedOrigin: string,
  submitted: string | null, cookie: string | undefined) {
  if (origin !== expectedOrigin || !submitted || !cookie
    || !/^[a-f0-9]{64}$/.test(submitted) || !/^[a-f0-9]{64}$/.test(cookie)
    || !timingSafeEqual(Buffer.from(submitted), Buffer.from(cookie))) {
    throw new AdminAuthError(403, "CSRF_INVALID");
  }
}
