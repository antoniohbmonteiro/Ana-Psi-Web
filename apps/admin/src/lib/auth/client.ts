"use client";

export class AdminSessionRequestError extends Error {}

async function csrfToken() {
  const response = await fetch("/api/admin/auth/csrf", { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new AdminSessionRequestError("Acesso administrativo temporariamente indisponível.");
  return (await response.json() as { csrfToken: string }).csrfToken;
}

// Administrative JSON writes: same-origin, CSRF protected, never cached. Network failures throw.
export async function adminPostJson(path: "/api/admin/agendamentos", body: unknown) {
  const token = await csrfToken();
  const response = await fetch(path, {
    method: "POST", credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
    body: JSON.stringify(body),
  });
  let data: unknown;
  try { data = await response.json(); } catch { data = undefined; }
  return { status: response.status, data };
}

export async function sessionPost(path: "/api/admin/auth/sessao" | "/api/admin/auth/sair", body?: { idToken: string }) {
  try {
    const token = await csrfToken();
    const response = await fetch(path, {
      method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": token },
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
