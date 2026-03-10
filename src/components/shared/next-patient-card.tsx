import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function NextPatientCard({
  name,
  time,
  countdown,
}: {
  name: string;
  time: string;
  countdown: string;
}) {
  return (
    <Card
      className="rounded-xl p-0"
      style={{
        background: "linear-gradient(to bottom right, rgba(182,166,202,0.05), transparent)",
        borderColor: "rgba(182,166,202,0.20)",
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-card-label">Próximo Paciente</p>
            <p className="mt-2 text-next-patient-name">{name}</p>

            <div className="mt-2 flex items-center gap-2">
              <Clock size={16} color="var(--primary)" />
              <span className="text-sm app-muted">{time}</span>
              <Badge variant="primary">{countdown}</Badge>
            </div>
          </div>

          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "rgba(182,166,202,0.10)",
              color: "var(--primary)",
            }}
          >
            <Clock size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}