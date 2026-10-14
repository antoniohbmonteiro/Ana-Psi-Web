export class AdminAuthError extends Error {
  constructor(public readonly status: 400 | 401 | 403 | 503, public readonly code: string) {
    super(code);
    this.name = "AdminAuthError";
  }
}

export function publicAuthMessage(status: number) {
  if (status === 400) return "Solicitação inválida.";
  if (status === 401) return "Entre novamente para continuar.";
  if (status === 403) return "Acesso não autorizado.";
  return "Acesso administrativo temporariamente indisponível.";
}
