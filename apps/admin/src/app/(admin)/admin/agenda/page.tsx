import { getAppTodayIso } from "@/lib/app-date";
import { getDemoAppointmentsService } from "@/features/appointments/demo.server";
import { toAppointmentSessions } from "@/features/agenda/adapter";
import { blockedSessions } from "@/features/agenda/mock";
import { AgendaCalendar } from "@/features/agenda/components/agenda-calendar";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const now = new Date();
  const todayIso = getAppTodayIso(now);
  const service = await getDemoAppointmentsService(now);
  const sessions = [...toAppointmentSessions(service.getAllAppointments()), ...blockedSessions];
  return <AgendaCalendar key={todayIso} todayIso={todayIso} sessions={sessions} />;
}
