import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  amountLabel: string;
  methodLabel: string;
  statusLabel: string;
  statusVariant:
    | "neutral"
    | "primary"
    | "success"
    | "warning"
    | "danger"
    | "info";
  paidAtLabel?: string;
};

export function PaymentSummaryCard({
  amountLabel,
  methodLabel,
  statusLabel,
  statusVariant,
  paidAtLabel,
}: Props) {
  return (
    <Card className="rounded-xl">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-section-title">Pagamento</h3>
            <p className="mt-1 text-sm app-muted">
              Resumo financeiro do atendimento
            </p>
          </div>

          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        <div className="space-y-3">
          <div className="app-card-soft p-4">
            <p className="text-card-label">Valor</p>
            <p className="mt-2 text-item-title">{amountLabel}</p>
          </div>

          <div className="app-card-soft p-4">
            <p className="text-card-label">Forma de pagamento</p>
            <p className="mt-2 text-item-title">{methodLabel}</p>
          </div>

          <div className="app-card-soft p-4">
            <p className="text-card-label">Status</p>
            <p className="mt-2 text-item-title">{statusLabel}</p>
          </div>

          <div className="app-card-soft p-4">
            <p className="text-card-label">Confirmação</p>
            <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
              {paidAtLabel ?? "Ainda não confirmado"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}