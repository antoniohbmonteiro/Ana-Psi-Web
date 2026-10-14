import type { Appointment } from "./types";

export type AppointmentsRepository = {
  getAllAppointments(): Promise<Appointment[]>;
  getAppointmentById(id: string): Promise<Appointment | undefined>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
};

export function createAppointmentsRepository(
  data: readonly Appointment[]
): AppointmentsRepository {
  const appointments = [...data].sort(
    (a, b) => a.date.localeCompare(b.date) ||
      a.time.localeCompare(b.time) || a.id.localeCompare(b.id)
  );
  return {
    getAllAppointments: async () => [...appointments],
    getAppointmentById: async (id) => appointments.find((item) => item.id === id),
    getAppointmentsByDate: async (date) => appointments.filter((item) => item.date === date),
  };
}
