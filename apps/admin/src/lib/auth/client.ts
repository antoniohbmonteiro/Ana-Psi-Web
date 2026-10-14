"use client";

export class AdminSessionRequestError extends Error {}

export async function sessionPost(path: "/api/admin/auth/sessao" | "/api/admin/auth/sair", body?: { idToken: string }) {
  try {
    const csrfResponse = await fetch("/api/admin/auth/csrf", { cache: "no-store", credentials: "same-origin" });
    if (!csrfResponse.ok) throw new AdminSessionRequestError("Acesso administrativo temporariamente indisponível.");
    const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
    const response = await fetch(path, {
      method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) {
      if (response.status === 403) throw new AdminSessionRequestError("Acesso não autorizado.");
      if (response.status === 401) throw new AdminSessionRequestError("Não foi possível entrar. Confira os dados e tente novamente.");
      throw new AdminSessionRequestError("Acesso administrativo temporariamente indisponível.");
    }
  } catch (error) {
    if (error instanceof AdminSessionRequestError) throw error;
    throw new AdminSessionRequestError("Acesso administrativo temporariamente indisponível.");
  }
}
