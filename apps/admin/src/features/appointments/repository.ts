import { createMockAppointments } from "./mock";
import type { Appointment } from "./types";

export type AppointmentsRepository = {
  getAllAppointments(): Appointment[];
  getAppointmentById(id: string): Appointment | undefined;
  getAppointmentsByDate(date: string): Appointment[];
};

export function createAppointmentsRepository(
  referenceNow: Date,
  data: readonly Appointment[] = createMockAppointments(referenceNow)
): AppointmentsRepository {
  const appointments = [...data].sort(
    (a, b) => a.date.localeCompare(b.date) ||
      a.time.localeCompare(b.time) || a.id.localeCompare(b.id)
  );
  return {
    getAllAppointments: () => [...appointments],
    getAppointmentById: (id) => appointments.find((item) => item.id === id),
    getAppointmentsByDate: (date) => appointments.filter((item) => item.date === date),
  };
}
