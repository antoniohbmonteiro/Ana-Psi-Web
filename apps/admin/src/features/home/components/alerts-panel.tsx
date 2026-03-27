import { Card, CardContent } from "@/components/ui/card";
import { alerts } from "../mock";

export function AlertsPanel() {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-6">
        <h2 className="text-section-title mb-4">Alertas Prioritários</h2>

        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alert.icon;

            return (
              <div key={alert.id} className="app-card-soft p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Icon size={18} color={alert.iconColor} />
                  </div>

                  <div>
                    <p className="text-side-item-title">{alert.title}</p>
                    <p className="text-side-item-subtitle">{alert.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}