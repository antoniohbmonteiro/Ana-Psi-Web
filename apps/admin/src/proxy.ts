import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const secure = process.env.ADMIN_ORIGIN?.startsWith("https://") === true;
  const cookieName = secure ? "__Host-ana-admin-session" : "ana-admin-session";
  const protectedPage = (path === "/admin" || path.startsWith("/admin/")) && path !== "/admin/entrar";
  const response = protectedPage && !request.cookies.get(cookieName)?.value
    ? NextResponse.redirect(new URL("/admin/entrar", request.url)) : NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
