import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminConfig } from "@/lib/firebase/config.server";
import { createCsrfToken, csrfCookieName, CSRF_MAX_AGE_SECONDS } from "@/lib/auth/csrf.server";
import { cookiePolicy } from "@/lib/auth/session.server";
import { authErrorResponse, PRIVATE_HEADERS } from "@/lib/auth/http.server";
import { AdminAuthError } from "@/lib/auth/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  try {
    const config = getAdminConfig();
    const origin = request.headers.get("origin");
    if ((origin && origin !== config.origin) || request.headers.get("sec-fetch-site") === "cross-site") {
      throw new AdminAuthError(403, "CSRF_INVALID");
    }
    const csrfToken = createCsrfToken();
    const response = NextResponse.json({ csrfToken }, { headers: PRIVATE_HEADERS });
    response.cookies.set(csrfCookieName(config), csrfToken, {
      ...cookiePolicy(config), sameSite: "strict", maxAge: CSRF_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) { return authErrorResponse(error); }
}
