import Link from "next/link";
import { Bell, Calendar, DollarSign, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { NextPatientCard } from "@/components/shared/next-patient-card";
import { AlertsPanel } from "@/features/home/components/alerts-panel";
import { QuickActionsPanel } from "@/features/home/components/quick-actions-panel";
import {
  getAppointmentsByDate,
  getNewRequestsCount,
  getNextAppointment,
  getPendingPaymentsCount,
  getTotalDurationByDate,
} from "@/features/appointments/repository";
import { APP_TODAY } from "@/lib/app-context";
import { appointmentsService } from "@/features/appointments/service";


const todayAppointments = appointmentsService.getAppointmentsByDate(APP_TODAY);
const nextAppointment = appointmentsService.getNextAppointment(APP_TODAY);
const totalDuration = appointmentsService.getTotalDurationByDate(APP_TODAY);

export default function InicioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">Boa tarde, Ana</h1>
        <p className="mt-1 text-page-subtitle">
          Você tem {todayAppointments.length} sessões hoje e {appointmentsService.getPendingPaymentsCount() + appointmentsService.getNewRequestsCount()} pendências        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-6 xl:grid-cols-4"
        style={{ gap: "var(--layout-grid-gap)" }}
      >
        <MetricCard
          title="Sessões Hoje"
          value={String(todayAppointments.length)}
          helper={`${totalDuration} minutos total`}
          icon={<Calendar size={24} />}
          iconBg="rgba(182,166,202,0.10)"
          iconColor="var(--primary)"
        />

        <NextPatientCard
          name={nextAppointment?.patientName ?? "Sem sessões"}
          time={nextAppointment?.time ?? "--:--"}
          countdown="Hoje"
          href={nextAppointment ? `/admin/agendamentos/${nextAppointment.id}` : undefined}
        />

        <MetricCard
          title="Pagamentos Pendentes"
          value={String(appointmentsService.getPendingPaymentsCount())}
          helper="Sessões aguardando pagamento"
          icon={<DollarSign size={24} />}
          iconBg="rgba(245,158,11,0.10)"
          iconColor="#f59e0b"
        />

        <MetricCard
          title="Novas Solicitações"
          value={String(appointmentsService.getNewRequestsCount())}
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
              {todayAppointments.map((appointment, index) => {
                const isNext = index === 0;

                return (
                  <Link
                    key={appointment.id}
                    href={`/admin/agendamentos/${appointment.id}`}
                    className="block"
                  >
                    <div
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
                              {appointment.time}
                            </span>

                            {isNext ? <Badge variant="primary">Próxima</Badge> : null}
                          </div>

                          <p className="text-item-title">{appointment.patientName}</p>
                          <p className="mt-1 text-sm app-muted">
                            {appointment.duration} minutos
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
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <AlertsPanel />
          <QuickActionsPanel />
        </div>
      </div>
    </div>
  );
}