import { AppointmentsReadError } from "@/features/appointments/read-errors";
import { AppointmentsReadFailure } from "@/features/appointments/components/read-error";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { appointmentQuickActions, toAppointmentDetailPresentation } from "@/features/appointments/presentation";
import { ActivityTimelineCard } from "@/features/appointments/components/activity-timeline-card";
import { AppointmentSummaryCard } from "@/features/appointments/components/appointment-summary-card";
import { PatientInfoCard } from "@/features/appointments/components/patient-info-card";
import { PaymentSummaryCard } from "@/features/appointments/components/payment-summary-card";
import { QuickActionsCard } from "@/features/appointments/components/quick-actions-card";
import { getAppointmentsService } from "@/features/appointments/application.server";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function renderPage({ params }: Props) {
  const { id } = await params;
  const service = await getAppointmentsService();
  const appointment = await service.getAppointmentById(id);

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
          <Button variant="secondary" className="rounded-xl" disabled aria-describedby="appointment-integration-note">
            Remarcar
          </Button>
          <Button variant="danger" className="rounded-xl" disabled aria-describedby="appointment-integration-note">
            Cancelar
          </Button>
          <Button className="rounded-xl" disabled aria-describedby="appointment-integration-note">Marcar como Concluído</Button>
          <p id="appointment-integration-note" className="w-full text-xs app-muted">Disponível após integração</p>
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

export default async function Page(props: Props) {
  try { return await renderPage(props); }
  catch (error) {
    if (error instanceof AppointmentsReadError) return <AppointmentsReadFailure code={error.code} />;
    throw error;
  }
}
