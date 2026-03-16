export type SessionType = "confirmed" | "blocked";

export type Session = {
  id: string;
  appointmentId?: string;
  date: string;
  time: string;
  patientName: string;
  duration: number;
  type: SessionType;
};