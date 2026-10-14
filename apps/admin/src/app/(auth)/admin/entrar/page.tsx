import { Card, CardContent } from "@/components/ui/card";
import { getAdminConfig } from "@/lib/firebase/config.server";
import { LoginForm } from "./login-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EntrarPage({ searchParams }: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;
  let config;
  try { config = getAdminConfig(); } catch { /* Show no form when configuration is incomplete. */ }
  const message = motivo === "acesso" ? "Acesso não autorizado."
    : motivo === "sessao" ? "Entre novamente para continuar."
    : motivo === "indisponivel" ? "Acesso administrativo temporariamente indisponível." : undefined;
  return (
    <main className="app-shell-bg flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <p className="text-sidebar-brand">Boaventura Psicologia</p>
          <h1 className="mt-4 text-page-title">Entrar no administrativo</h1>
          <p className="mt-2 text-sm app-muted">Acesso exclusivo à gestão do consultório.</p>
          {config ? <LoginForm config={config.publicAuth} initialMessage={message} />
            : <p role="alert" className="mt-6 text-sm">Acesso administrativo indisponível. Verifique a configuração do ambiente.</p>}
        </CardContent>
      </Card>
    </main>
  );
}
