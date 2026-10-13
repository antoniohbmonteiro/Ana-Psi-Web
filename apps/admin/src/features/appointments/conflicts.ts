import type { Appointment, AppointmentSchedule } from "./types";

function interval(schedule: AppointmentSchedule) {
  // UTC is only an arithmetic carrier for civil dates, never an appointment instant.
  const [hour, minute] = schedule.time.split(":").map(Number);
  const start = Date.parse(`${schedule.date}T00:00:00.000Z`) / 60000 + hour * 60 + minute;
  return { start, end: start + schedule.duration };
}

export function appointmentsOverlap(left: AppointmentSchedule, right: AppointmentSchedule) {
  const a = interval(left);
  const b = interval(right);
  return a.start < b.end && b.start < a.end;
}

// Call only with schedules validated at the command boundary.
export function findAppointmentConflicts(
  candidate: AppointmentSchedule,
  appointments: readonly Appointment[],
  excludeId?: string,
): Appointment[] {
  return appointments.filter((appointment) => appointment.id !== excludeId
    && appointment.status !== "cancelled" && appointmentsOverlap(candidate, appointment));
}
