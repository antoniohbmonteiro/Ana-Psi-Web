import type { Appointment } from "../appointments/types";
import type { Session } from "./types";

export function toAppointmentSessions(appointments: readonly Appointment[]): Session[] {
  return appointments.map((appointment) => ({
    id: `session-${appointment.id}`,
    appointmentId: appointment.id,
    date: appointment.date,
    time: appointment.time,
    patientName: appointment.patient.fullName,
    duration: appointment.duration,
    type: "appointment",
    status: appointment.status,
  }));
}
