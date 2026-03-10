import {
  AlertCircle,
  Bell,
  Calendar,
  CalendarPlus,
  CreditCard,
  DollarSign,
  Link2,
  Play,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { NextPatientCard } from "@/components/shared/next-patient-card";

const todaySessions = [
  { id: 1, time: "09:00", patientName: "Mariana Silva", duration: 60, next: true },
  { id: 2, time: "10:30", patientName: "Carlos Eduardo Santos", duration: 60 },
  { id: 3, time: "14:00", patientName: "Júlia Oliveira", duration: 60 },
  { id: 4, time: "16:00", patientName: "Roberto Almeida", duration: 60 },
];

const alerts = [
  {
    id: 1,
    title: "Cancelamento",
    description: "Fernanda Costa - 15:00 (10/03/2026)",
    icon: <XCircle size={18} color="#ef4444" />,
  },
  {
    id: 2,
    title: "Reagendamento",
    description: "Lucas Mendes - 14:00 → 16:30",
    icon: <AlertCircle size={18} color="#f59e0b" />,
  },
];

const quickActions = [
  { label: "Novo Paciente", icon: UserPlus },
  { label: "Registrar Pagamento", icon: CreditCard },
  { label: "Nova Consulta", icon: CalendarPlus },
  { label: "Link Agendamento", icon: Link2 },
];

export default function InicioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">Boa tarde, Ana</h1>
        <p className="mt-1 text-page-subtitle">
          Você tem 4 sessões hoje e 6 pendências
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-6 xl:grid-cols-4"
        style={{ gap: "var(--layout-grid-gap)" }}
      >
        <MetricCard
          title="Sessões Hoje"
          value="4"
          helper="240 minutos total"
          icon={<Calendar size={24} />}
          iconBg="rgba(182,166,202,0.10)"
          iconColor="var(--primary)"
        />

        <NextPatientCard
          name="Mariana Silva"
          time="09:00"
          countdown="9h 44m"
        />

        <MetricCard
          title="Pagamentos Pendentes"
          value="4"
          helper="R$ 1060.00"
          icon={<DollarSign size={24} />}
          iconBg="rgba(245,158,11,0.10)"
          iconColor="#f59e0b"
        />

        <MetricCard
          title="Novas Solicitações"
          value="2"
          helper="Agendamentos pendentes"
          icon={<Bell size={24} />}
          iconBg="rgba(59,130,246,0.10)"
          iconColor="#3b82f6"
        />
      </div>

      <div
        className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]"
        style={{ gap: "var(--layout-grid-gap)" }}
      >
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <h2 className="text-section-title mb-4">Agenda de Hoje</h2>

            <div
              className="space-y-3 overflow-auto pr-2"
              style={{ height: "var(--layout-today-scroll-height)" }}
            >
              {todaySessions.map((session) => {
                const isNext = Boolean(session.next);

                return (
                  <div
                    key={session.id}
                    className="cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md"
                    style={
                      isNext
                        ? {
                            backgroundColor: "rgba(182,166,202,0.05)",
                            borderColor: "var(--primary)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                          }
                        : {
                            backgroundColor: "var(--accent)",
                            borderColor: "var(--border)",
                          }
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <span
                            className="text-item-title"
                            style={{ color: isNext ? "var(--primary)" : "var(--foreground)" }}
                          >
                            {session.time}
                          </span>

                          {isNext ? (
                            <Badge variant="primary">Próxima</Badge>
                          ) : null}
                        </div>

                        <p className="text-item-title">{session.patientName}</p>
                        <p className="mt-1 text-sm app-muted">
                          {session.duration} minutos
                        </p>
                      </div>

                      {isNext ? (
                        <Button
                          className="rounded-xl"
                          size="sm"
                          style={{ backgroundColor: "var(--primary)" }}
                        >
                          <Play size={16} className="mr-2" />
                          Iniciar Sessão
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h2 className="text-section-title mb-4">Alertas Prioritários</h2>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="app-card-soft p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{alert.icon}</div>
                      <div>
                        <p className="text-side-item-title">{alert.title}</p>
                        <p className="text-side-item-subtitle">{alert.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h2 className="text-section-title mb-4">Central de Ações</h2>

              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <div
                      key={action.label}
                      className="app-card-soft flex min-h-[92px] flex-col items-center justify-center gap-3 p-4 text-center"
                    >
                      <Icon size={16} color="var(--primary)" />
                      <span className="text-quick-action">
                        {action.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}