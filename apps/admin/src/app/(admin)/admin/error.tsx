"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="space-y-4">
      <h1 className="text-page-title">Consultas indisponíveis</h1>
      <p role="alert" className="app-muted">A leitura persistida de consultas ainda não está disponível neste ambiente.</p>
      <Button onClick={reset} variant="secondary">Tentar novamente</Button>
    </div>
  );
}
