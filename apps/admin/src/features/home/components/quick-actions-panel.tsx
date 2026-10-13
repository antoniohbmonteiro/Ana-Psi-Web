import { Card, CardContent } from "@/components/ui/card";
import { quickActions } from "../mock";

export function QuickActionsPanel() {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-6">
        <h2 className="text-section-title mb-4">Central de Ações</h2>
        <p className="mb-4 text-xs app-muted">Atalhos demonstrativos. Disponível após integração.</p>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.label}
                type="button"
                disabled
                className="app-card-soft flex min-h-[92px] cursor-not-allowed flex-col items-center justify-center gap-3 p-4 text-center opacity-60"
              >
                <Icon size={16} color="var(--primary-dark)" />
                <span className="text-quick-action">{action.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
