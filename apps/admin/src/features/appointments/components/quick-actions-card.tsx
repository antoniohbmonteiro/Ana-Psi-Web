import {
  CalendarClock,
  Link2,
  MessageCircleMore,
  UserRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const iconMap = {
  "Remarcar atendimento": CalendarClock,
  "Enviar lembrete": MessageCircleMore,
  "Abrir perfil do paciente": UserRound,
  "Copiar link da sessão": Link2,
};

type Props = {
  actions: string[];
};

export function QuickActionsCard({ actions }: Props) {
  return (
    <Card className="rounded-xl">
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-section-title">Ações Rápidas</h3>
          <p className="mt-1 text-sm app-muted">
            Atalhos úteis para operar este atendimento
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = iconMap[action as keyof typeof iconMap] ?? Link2;

            return (
              <button
                key={action}
                type="button"
                className="app-card-soft flex min-h-[96px] flex-col items-center justify-center gap-3 p-4 text-center transition hover:opacity-90"
              >
                <Icon size={18} color="var(--primary-dark)" />
                <span className="text-quick-action">{action}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}