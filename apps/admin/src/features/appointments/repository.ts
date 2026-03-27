import { appointments } from "./mock";

export function getAllAppointments() {
  return appointments;
}

export function getAppointmentById(id: string) {
  return appointments.find((appointment) => appointment.id === id);
}

export function getAppointmentsByDate(date: string) {
  return appointments
    .filter((appointment) => appointment.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getNextAppointment(date: string) {
  return getAppointmentsByDate(date)[0] ?? null;
}

export function getPendingPaymentsCount() {
  return appointments.filter(
    (appointment) => appointment.paymentStatusVariant === "warning"
  ).length;
}

export function getNewRequestsCount() {
  return appointments.filter(
    (appointment) => appointment.appointmentStatusVariant === "warning"
  ).length;
}

export function getTotalDurationByDate(date: string) {
  return getAppointmentsByDate(date).reduce(
    (total, appointment) => total + appointment.duration,
    0
  );
}