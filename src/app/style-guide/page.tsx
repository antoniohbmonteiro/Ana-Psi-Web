import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function StyleGuidePage() {
  return (
    <main className="app-shell-bg min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--primary-dark)" }}>
            Style Guide
          </p>
          <h1 className="mt-3">Base visual inicial</h1>
          <p className="mt-2 text-sm app-muted">
            Primeira camada para aproximar o projeto do Figma.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <h3>Botões</h3>
            <div className="flex flex-wrap gap-3">
              <Button>Primário</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h3>Badges</h3>
            <div className="flex flex-wrap gap-3">
              <Badge>Neutro</Badge>
              <Badge variant="primary">Primário</Badge>
              <Badge variant="success">Sucesso</Badge>
              <Badge variant="warning">Aviso</Badge>
              <Badge variant="danger">Erro</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="app-label">Input</label>
              <Input placeholder="Digite aqui" />
            </div>
            <div>
              <label className="app-label">Select</label>
              <Select defaultValue="retorno">
                <option value="retorno">Retorno</option>
                <option value="primeira">Primeira sessão</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="app-label">Textarea</label>
              <Textarea placeholder="Observação administrativa" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h3>Cards suaves</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="app-card-soft p-4">Card suave</div>
              <div className="app-card-soft p-4">Card suave</div>
              <div className="app-card-soft p-4">Card suave</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}