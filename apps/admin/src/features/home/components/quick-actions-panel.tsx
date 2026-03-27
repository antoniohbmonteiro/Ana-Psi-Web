import { Card, CardContent } from "@/components/ui/card";
import { quickActions } from "../mock";

export function QuickActionsPanel() {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-6">
        <h2 className="text-section-title mb-4">Central de Ações</h2>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <div
                key={action.label}
                className="app-card-soft flex min-h-[92px] flex-col items-center justify-center gap-3 p-4 text-center"
              >
                <Icon size={16} color="var(--primary-dark)" />
                <span className="text-quick-action">{action.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}