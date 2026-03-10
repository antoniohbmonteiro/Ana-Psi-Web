import { Card, CardContent } from "@/components/ui/card";

export default function AgendamentoDetalhePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Detalhes do Agendamento</h1>
        <p className="mt-2 text-[18px] app-muted">Hub central do atendimento.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="space-y-4">
            <h3>Resumo do atendimento</h3>
            <div className="app-card-soft p-4">Paciente: Mariana Silva</div>
            <div className="app-card-soft p-4">12/03/2026 · 09:00 às 09:50</div>
            <div className="app-card-soft p-4">Online · Pago</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h3>Pagamento</h3>
            <div className="app-card-soft p-4">Valor: R$ 100,00</div>
            <div className="app-card-soft p-4">PIX</div>
            <div className="app-card-soft p-4">Pago</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}