"use client";

import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import type { AppointmentsReadErrorCode } from "../read-errors";

const messages: Record<AppointmentsReadErrorCode, string> = {
  DATA_INVALID: "Não foi possível carregar as consultas por inconsistência nos dados.",
  CONFIG_INVALID: "Consultas indisponíveis neste ambiente.",
  UNAVAILABLE: "Consultas temporariamente indisponíveis.",
};

export function AppointmentsReadFailure({ code }: { code: AppointmentsReadErrorCode }) {
  const router = useRouter();
  return <div className="space-y-4">
    <h1 className="text-page-title">Consultas indisponíveis</h1>
    <p role="alert" className="app-muted">{messages[code]}</p>
    <Button variant="secondary" onClick={() => router.refresh()}>Tentar novamente</Button>
  </div>;
}
