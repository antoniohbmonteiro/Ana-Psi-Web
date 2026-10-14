import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminConfig } from "../firebase/config.server";
import { getAdminAuth } from "../firebase/admin.server";
import { normalizeAuthError, sessionCookieName, verifyAdminSession } from "./session.server";
import { AdminAuthError } from "./errors";

export const getAdminIdentity = cache(async () => {
  const config = getAdminConfig();
  const cookie = (await cookies()).get(sessionCookieName(config))?.value;
  if (!cookie) throw new AdminAuthError(401, "SESSION_REQUIRED");
  return verifyAdminSession(cookie, config, getAdminAuth());
});

export async function requireAdmin() {
  try { return await getAdminIdentity(); }
  catch (error) {
    const failure = normalizeAuthError(error);
    if (failure.status === 401) redirect("/admin/entrar?motivo=sessao");
    if (failure.status === 403) redirect("/admin/entrar?motivo=acesso");
    // Provider failures must not render data or start a redirect loop.
    redirect("/admin/entrar?motivo=indisponivel");
  }
}
