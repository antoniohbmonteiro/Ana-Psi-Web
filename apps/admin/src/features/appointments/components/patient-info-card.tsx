import { Card, CardContent } from "@/components/ui/card";

type Props = {
  fullName: string;
  phone: string;
  email: string;
  typeLabel: string;
};

export function PatientInfoCard({
  fullName,
  phone,
  email,
  typeLabel,
}: Props) {
  return (
    <Card className="rounded-xl">
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-section-title">Paciente</h3>
          <p className="mt-1 text-sm app-muted">
            Informações principais da pessoa atendida
          </p>
        </div>

        <div className="space-y-3">
          <div className="app-card-soft p-4">
            <p className="text-card-label">Nome completo</p>
            <p className="mt-2 text-item-title">{fullName}</p>
          </div>

          <div className="app-card-soft p-4">
            <p className="text-card-label">Telefone</p>
            <p className="mt-2 text-item-title">{phone}</p>
          </div>

          <div className="app-card-soft p-4">
            <p className="text-card-label">E-mail</p>
            <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
              {email}
            </p>
          </div>

          <div className="app-card-soft p-4">
            <p className="text-card-label">Tipo de vínculo</p>
            <p className="mt-2 text-item-title">{typeLabel}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}