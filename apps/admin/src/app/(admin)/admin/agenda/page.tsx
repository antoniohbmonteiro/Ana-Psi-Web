import { AppointmentsReadError } from "@/features/appointments/read-errors";
import { AppointmentsReadFailure } from "@/features/appointments/components/read-error";
import { getAppTodayIso } from "@/lib/app-date";
import { getAppointmentsService } from "@/features/appointments/application.server";
import { toAppointmentSessions } from "@/features/agenda/adapter";
import { AgendaCalendar } from "@/features/agenda/components/agenda-calendar";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

async function renderPage() {
  const now = new Date();
  const todayIso = getAppTodayIso(now);
  const service = await getAppointmentsService();
  const sessions = toAppointmentSessions(await service.getAllAppointments());
  return <AgendaCalendar key={todayIso} todayIso={todayIso} sessions={sessions} />;
}

export default async function Page() {
  try { return await renderPage(); }
  catch (error) {
    if (error instanceof AppointmentsReadError) return <AppointmentsReadFailure code={error.code} />;
    throw error;
  }
}
