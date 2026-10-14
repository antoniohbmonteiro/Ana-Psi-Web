import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminConfig } from "@/lib/firebase/config.server";
import { cookiePolicy, sessionCookieName } from "@/lib/auth/session.server";
import { csrfCookieName } from "@/lib/auth/csrf.server";
import { authErrorResponse, protectPost, PRIVATE_HEADERS } from "@/lib/auth/http.server";

export const runtime = "nodejs";

export function POST(request: NextRequest) {
  try {
    const config = getAdminConfig();
    protectPost(request, config);
    // Logout deliberately does not call Auth: even an invalid/revoked session can be removed.
    const response = new NextResponse(null, { status: 204, headers: PRIVATE_HEADERS });
    response.cookies.set(sessionCookieName(config), "", { ...cookiePolicy(config), maxAge: 0 });
    response.cookies.set(csrfCookieName(config), "", { ...cookiePolicy(config), sameSite: "strict", maxAge: 0 });
    return response;
  } catch (error) { return authErrorResponse(error); }
}
