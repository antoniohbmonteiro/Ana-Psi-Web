"use client";

import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getClientAuth } from "@/lib/firebase/client";
import type { PublicAuthConfig } from "@/lib/firebase/config.server";
import { sessionPost } from "@/lib/auth/client";

export function LoginForm({ config, initialMessage }: { config: PublicAuthConfig; initialMessage?: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setMessage(undefined);
    let sessionCreated = false;
    try {
      let idToken: string;
      try {
        const auth = getClientAuth(config);
        const credential = await signInWithEmailAndPassword(auth, String(data.get("email")), String(data.get("password")));
        idToken = await credential.user.getIdToken();
      } catch {
        throw new Error("Não foi possível entrar. Confira os dados e tente novamente.");
      }
      await sessionPost("/api/admin/auth/sessao", { idToken });
      sessionCreated = true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      form.reset();
      // Never leave the short-lived Firebase login in client memory after the exchange.
      try { await signOut(getClientAuth(config)); } catch { /* Full navigation also clears in-memory state. */ }
      setPending(false);
    }
    if (sessionCreated) window.location.replace("/admin/inicio");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <label htmlFor="admin-email" className="text-sm font-medium">E-mail</label>
        <Input id="admin-email" name="email" type="email" autoComplete="username" required disabled={pending} />
      </div>
      <div className="space-y-2">
        <label htmlFor="admin-password" className="text-sm font-medium">Senha</label>
        <Input id="admin-password" name="password" type="password" autoComplete="current-password" required disabled={pending} />
      </div>
      {message ? <p role="alert" className="text-sm">{message}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</Button>
    </form>
  );
}
