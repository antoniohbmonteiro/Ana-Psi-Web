import { getAppDateTime } from "../../lib/app-date";
import { createAppointmentsRepository } from "./repository";
import type { AppointmentsRepository } from "./repository";
import type { Appointment } from "./types";

export type AppointmentsService = AppointmentsRepository & {
  getNextAppointment(now: Date): Appointment | null;
  getPendingPaymentsCount(): number;
  getPendingAppointmentsCount(): number;
  getTotalDurationByDate(date: string): number;
};

export function createAppointmentsService(
  referenceNow: Date,
  repository: AppointmentsRepository = createAppointmentsRepository(referenceNow)
): AppointmentsService {
  return {
    ...repository,
    getNextAppointment(now) {
      const current = getAppDateTime(now);
      const currentStart = `${current.date}T${current.time}`;
      return repository.getAllAppointments()
        .filter((item) =>
          item.status === "confirmed" &&
          `${item.date}T${item.time}:00.000` > currentStart
        )
        .sort((a, b) => a.date.localeCompare(b.date) ||
          a.time.localeCompare(b.time) || a.id.localeCompare(b.id))[0] ?? null;
    },
    getPendingPaymentsCount: () => repository.getAllAppointments()
      .filter((item) => item.payment.status === "pending").length,
    getPendingAppointmentsCount: () => repository.getAllAppointments()
      .filter((item) => item.status === "pending").length,
    getTotalDurationByDate: (date) => repository.getAppointmentsByDate(date)
      .reduce((total, item) => total + item.duration, 0),
  };
}
