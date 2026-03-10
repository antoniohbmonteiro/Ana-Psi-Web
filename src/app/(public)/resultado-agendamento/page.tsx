import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ResultadoAgendamentoPage() {
  return (
    <main className="app-shell-bg min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-4">
            <h1>Reserva Temporária Realizada</h1>
            <p className="text-sm app-muted">Complete o pagamento para confirmar sua sessão.</p>
            <div className="app-card-soft p-4">Tempo restante: 29:48</div>
            <div className="app-card-soft p-4">12/03/2026 · 09:00 · Online</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h3>Pagamento</h3>
            <div className="app-card-soft p-4">R$ 100,00 · PIX</div>
            <Button className="w-full">Pagar agora</Button>
            <Button className="w-full" variant="secondary">Copiar código PIX</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}