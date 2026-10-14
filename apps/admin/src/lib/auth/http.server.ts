import "server-only";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { publicAuthMessage } from "./errors";
import { normalizeAuthError } from "./session.server";
import { assertCsrf, csrfCookieName } from "./csrf.server";
import type { AdminConfig } from "../firebase/config.server";

export const PRIVATE_HEADERS = { "Cache-Control": "private, no-store, max-age=0", "Pragma": "no-cache" };

export function authErrorResponse(error: unknown) {
  const failure = normalizeAuthError(error);
  return NextResponse.json({ message: publicAuthMessage(failure.status) }, {
    status: failure.status, headers: PRIVATE_HEADERS,
  });
}

export function protectPost(request: NextRequest, config: AdminConfig) {
  assertCsrf(request.headers.get("origin"), config.origin,
    request.headers.get("x-csrf-token"), request.cookies.get(csrfCookieName(config))?.value);
}
