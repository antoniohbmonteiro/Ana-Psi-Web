"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sessionPost } from "@/lib/auth/client";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  async function logout() {
    setPending(true);
    setFailed(false);
    try {
      await sessionPost("/api/admin/auth/sair");
      // Full navigation discards the authenticated Router Cache and client state.
      window.location.replace("/admin/entrar");
    } catch { setFailed(true); setPending(false); }
  }
  return (
    <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
      {failed ? <p role="alert" className="text-sm">Não foi possível sair. Tente novamente.</p> : null}
      <Button variant="ghost" size="sm" onClick={logout} disabled={pending}>{pending ? "Saindo…" : "Sair"}</Button>
    </div>
  );
}
