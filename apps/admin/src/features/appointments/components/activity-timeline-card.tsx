import { Card, CardContent } from "@/components/ui/card";

type TimelineItem = {
  id: number;
  title: string;
  description: string;
  timeLabel: string;
};

type Props = {
  items: TimelineItem[];
};

export function ActivityTimelineCard({ items }: Props) {
  return (
    <Card className="rounded-xl">
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-section-title">Histórico de Atividade</h3>
          <p className="mt-1 text-sm app-muted">
            Eventos mais recentes relacionados ao agendamento
          </p>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: "var(--primary)" }}
                />
                {index < items.length - 1 ? (
                  <div
                    className="mt-2 w-px flex-1"
                    style={{ backgroundColor: "var(--border)" }}
                  />
                ) : null}
              </div>

              <div className="pb-4">
                <p className="text-item-title">{item.title}</p>
                <p className="mt-1 text-sm app-muted">{item.description}</p>
                <p className="mt-2 text-xs app-muted">{item.timeLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}