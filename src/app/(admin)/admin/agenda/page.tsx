import { Card, CardContent } from "@/components/ui/card";

export default function AgendaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Agenda Semanal</h1>
        <p className="mt-2 text-[18px] app-muted">Base inicial da agenda da terapeuta.</p>
      </div>

      <Card>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-7">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
              <div key={day} className="app-card-soft min-h-[260px] p-4">
                <p className="text-sm font-semibold">{day}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}