import { appointmentsService } from "@/features/appointments/service";
import type { Session } from "./types";

const blockedSessions: Session[] = [
  {
    id: "block-001",
    date: "2026-03-11",
    time: "12:00",
    patientName: "Bloqueio Pessoal",
    duration: 60,
    type: "blocked",
  },
];

const appointmentSessions: Session[] = appointmentsService
  .getAllAppointments()
  .map((appointment) => ({
    id: `session-${appointment.id}`,
    appointmentId: appointment.id,
    date: appointment.date,
    time: appointment.time,
    patientName: appointment.patientName,
    duration: appointment.duration,
    type: "confirmed",
  }));

export const mockSessions: Session[] = [...appointmentSessions, ...blockedSessions];