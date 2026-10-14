import { getAppDateTime } from "../../lib/app-date";
import type { AppointmentsRepository } from "./repository";
import type { Appointment } from "./types";

export type AppointmentsService = AppointmentsRepository & {
  getNextAppointment(now: Date): Promise<Appointment | null>;
  getPendingPaymentsCount(): Promise<number>;
  getPendingAppointmentsCount(): Promise<number>;
  getTotalDurationByDate(date: string): Promise<number>;
};

export function createAppointmentsService(
  repository: AppointmentsRepository
): AppointmentsService {
  return {
    ...repository,
    async getNextAppointment(now) {
      const current = getAppDateTime(now);
      const currentStart = `${current.date}T${current.time}`;
      return (await repository.getAllAppointments())
        .filter((item) =>
          item.status === "confirmed" &&
          `${item.date}T${item.time}:00.000` > currentStart
        )
        .sort((a, b) => a.date.localeCompare(b.date) ||
          a.time.localeCompare(b.time) || a.id.localeCompare(b.id))[0] ?? null;
    },
    getPendingPaymentsCount: async () => (await repository.getAllAppointments())
      .filter((item) => item.payment.status === "pending").length,
    getPendingAppointmentsCount: async () => (await repository.getAllAppointments())
      .filter((item) => item.status === "pending").length,
    getTotalDurationByDate: async (date) => (await repository.getAppointmentsByDate(date))
      .reduce((total, item) => total + item.duration, 0),
  };
}
