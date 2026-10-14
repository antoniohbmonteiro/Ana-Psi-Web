import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminConfig } from "@/lib/firebase/config.server";
import { getAdminAuth } from "@/lib/firebase/admin.server";
import { cookiePolicy, issueAdminSession, sessionCookieName, SESSION_DURATION_MS } from "@/lib/auth/session.server";
import { csrfCookieName } from "@/lib/auth/csrf.server";
import { authErrorResponse, protectPost, PRIVATE_HEADERS } from "@/lib/auth/http.server";
import { AdminAuthError } from "@/lib/auth/errors";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const config = getAdminConfig();
    protectPost(request, config);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
      throw new AdminAuthError(400, "INVALID_BODY");
    }
    // Bound allocation before parsing an untrusted body, including chunked requests.
    const reader = request.body?.getReader();
    if (!reader) throw new AdminAuthError(400, "INVALID_BODY");
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 16_384) {
          await reader.cancel();
          throw new AdminAuthError(400, "INVALID_BODY");
        }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new AdminAuthError(400, "INVALID_BODY"); }
    if (!body || typeof body !== "object" || Array.isArray(body)
      || Object.keys(body).length !== 1 || !("idToken" in body)
      || typeof body.idToken !== "string" || !body.idToken || body.idToken.length > 12_000) {
      throw new AdminAuthError(400, "INVALID_BODY");
    }
    const cookie = await issueAdminSession(body.idToken, config, getAdminAuth());
    const response = new NextResponse(null, { status: 204, headers: PRIVATE_HEADERS });
    response.cookies.set(sessionCookieName(config), cookie, {
      ...cookiePolicy(config), maxAge: SESSION_DURATION_MS / 1000,
      expires: new Date(Date.now() + SESSION_DURATION_MS),
    });
    response.cookies.set(csrfCookieName(config), "", { ...cookiePolicy(config), sameSite: "strict", maxAge: 0 });
    return response;
  } catch (error) { return authErrorResponse(error); }
}
