export type AppointmentStatus =
  | "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export type AppointmentModality = "online" | "in_person";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type AppointmentSessionType = "initial" | "follow_up";
export type PatientRelationship = "new" | "returning";
export type PaymentMethod = "pix" | "payment_link" | "cash";

export type AppointmentActivity = {
  id: number;
  title: string;
  description: string;
  occurredAt: string; // ISO 8601 UTC instant ending in Z.
};

export type AppointmentPatient = {
  fullName: string;
  phone: string;
  email: string;
  relationship: PatientRelationship;
};

// One appointment has one charge; amounts are integer BRL cents.
export type AppointmentPayment = {
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string; // ISO 8601 UTC instant ending in Z.
};

export type Appointment = {
  id: string;
  date: string; // YYYY-MM-DD civil date in America/Sao_Paulo.
  time: string; // HH:mm civil time in America/Sao_Paulo.
  duration: number; // Minutes.
  status: AppointmentStatus;
  modality: AppointmentModality;
  sessionType: AppointmentSessionType;
  meetingLink?: string;
  notes?: string;
  patient: AppointmentPatient;
  payment: AppointmentPayment;
  activityTimeline: AppointmentActivity[];
};
