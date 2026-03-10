import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AgendarPage() {
  return (
    <main className="app-shell-bg min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-4">
            <h1>Agendamento Online</h1>
            <p className="text-sm app-muted">Base pública inicial.</p>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="app-card-soft p-4 text-center">10 mar</div>
              <div className="app-card-soft p-4 text-center">11 mar</div>
              <div className="app-card-soft p-4 text-center">12 mar</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h3>Resumo</h3>
            <div className="app-card-soft p-4">Consulta online · 50 min · R$ 100</div>
            <Button className="w-full">Continuar</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}