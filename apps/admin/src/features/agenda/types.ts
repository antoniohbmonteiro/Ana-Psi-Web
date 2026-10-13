import type { AppointmentStatus } from "../appointments/types";

export type SessionType = "appointment" | "blocked";
type SessionBase = {
  id: string;
  date: string;
  time: string;
  patientName: string;
  duration: number;
};
export type Session = SessionBase & (
  | { type: "appointment"; appointmentId: string; status: AppointmentStatus }
  | { type: "blocked"; appointmentId?: never; status?: never }
);
