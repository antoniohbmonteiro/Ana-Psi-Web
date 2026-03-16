import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  patientName: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  modalityLabel: string;
  sessionTypeLabel: string;
  appointmentStatusLabel: string;
  appointmentStatusVariant:
    | "neutral"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info";
  paymentStatusLabel: string;
  paymentStatusVariant:
    | "neutral"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info";
  meetingLink?: string;
  notes?: string;
};

export function AppointmentSummaryCard({
  patientName,
  dateLabel,
  timeLabel,
  durationLabel,
  modalityLabel,
  sessionTypeLabel,
  appointmentStatusLabel,
  appointmentStatusVariant,
  paymentStatusLabel,
  paymentStatusVariant,
  meetingLink,
  notes,
}: Props) {
  return (
    <Card className="rounded-xl">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-card-label">Paciente</p>
            <h2 className="mt-2 text-[24px] font-medium leading-8 text-[var(--foreground)]">
              {patientName}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={appointmentStatusVariant}>
              {appointmentStatusLabel}
            </Badge>
            <Badge variant={paymentStatusVariant}>
              {paymentStatusLabel}
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="app-card-soft p-4">
            <p className="text-card-label">Data</p>
            <p className="mt-2 text-item-title">{dateLabel}</p>
          </div>

          <div className="app-card-soft p-4">
            <p className="text-card-label">Horário</p>
            <p className="mt-2 text-item-title">{timeLabel}</p>
          </div>

          <div className="app-card-soft p-4">
            <p className="text-card-label">Duração</p>
            <p className="mt-2 text-item-title">{durationLabel}</p>
          </div>

          <div className="app-card-soft p-4">
            <p className="text-card-label">Modalidade</p>
            <p className="mt-2 text-item-title">{modalityLabel}</p>
          </div>

          <div className="app-card-soft p-4">
            <p className="text-card-label">Tipo</p>
            <p className="mt-2 text-item-title">{sessionTypeLabel}</p>
          </div>

          <div className="app-card-soft p-4">
            <p className="text-card-label">Link da sessão</p>
            <p className="mt-2 truncate text-sm font-medium text-[var(--primary-dark)]">
              {meetingLink ?? "Ainda não definido"}
            </p>
          </div>
        </div>

        <div className="app-card-soft p-4">
          <p className="text-card-label">Observações</p>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
            {notes ?? "Sem observações administrativas."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}