import type { Appointment } from "./types";
import {
  getAllAppointments as repoGetAllAppointments,
  getAppointmentById as repoGetAppointmentById,
  getAppointmentsByDate as repoGetAppointmentsByDate,
  getNextAppointment as repoGetNextAppointment,
  getPendingPaymentsCount as repoGetPendingPaymentsCount,
  getNewRequestsCount as repoGetNewRequestsCount,
  getTotalDurationByDate as repoGetTotalDurationByDate,
} from "./repository";

export type AppointmentsService = {
  getAllAppointments: () => Appointment[];
  getAppointmentById: (id: string) => Appointment | undefined;
  getAppointmentsByDate: (date: string) => Appointment[];
  getNextAppointment: (date: string) => Appointment | null;
  getPendingPaymentsCount: () => number;
  getNewRequestsCount: () => number;
  getTotalDurationByDate: (date: string) => number;
};

export const appointmentsService: AppointmentsService = {
  getAllAppointments: repoGetAllAppointments,
  getAppointmentById: repoGetAppointmentById,
  getAppointmentsByDate: repoGetAppointmentsByDate,
  getNextAppointment: repoGetNextAppointment,
  getPendingPaymentsCount: repoGetPendingPaymentsCount,
  getNewRequestsCount: repoGetNewRequestsCount,
  getTotalDurationByDate: repoGetTotalDurationByDate,
};