import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { appointmentQuickActions, toAppointmentDetailPresentation } from "@/features/appointments/presentation";
import { ActivityTimelineCard } from "@/features/appointments/components/activity-timeline-card";
import { AppointmentSummaryCard } from "@/features/appointments/components/appointment-summary-card";
import { PatientInfoCard } from "@/features/appointments/components/patient-info-card";
import { PaymentSummaryCard } from "@/features/appointments/components/payment-summary-card";
import { QuickActionsCard } from "@/features/appointments/components/quick-actions-card";
import { createAppointmentsService } from "@/features/appointments/service";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params;
  const appointment = createAppointmentsService(new Date()).getAppointmentById(id);

  if (!appointment) {
    notFound();
  }

  const view = toAppointmentDetailPresentation(appointment);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-page-title">Detalhes do Agendamento</h1>
          <p className="mt-1 text-page-subtitle">
            Visualize e gerencie as informações principais deste atendimento
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" className="rounded-xl">
            Remarcar
          </Button>
          <Button variant="danger" className="rounded-xl">
            Cancelar
          </Button>
          <Button className="rounded-xl">Marcar como Concluído</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <AppointmentSummaryCard {...view.summary} />

        <PaymentSummaryCard {...view.payment} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PatientInfoCard {...view.patient} />

        <ActivityTimelineCard items={view.activityTimeline} />
      </div>

      <QuickActionsCard actions={appointmentQuickActions} />
    </div>
  );
}