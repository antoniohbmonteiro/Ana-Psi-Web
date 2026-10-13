export type AppointmentStatus =
  | "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export type AppointmentModality = "online" | "in_person";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type AppointmentSessionType = "initial" | "follow_up";
export type PatientRelationship = "new" | "returning";
export type PaymentMethod = "pix" | "payment_link" | "cash";

export type AppointmentSchedule = Pick<Appointment, "date" | "time" | "duration">;
export type AppointmentActivityType =
  | "created" | "edited" | "rescheduled" | "confirmed" | "cancelled"
  | "completed" | "no_show" | "payment_recorded" | "payment_refunded";
export type AppointmentEditableFields = {
  modality?: AppointmentModality;
  sessionType?: AppointmentSessionType;
  meetingLink?: string | null;
  notes?: string | null;
  amount?: number;
  method?: PaymentMethod;
};
export type AppointmentActivityDetails = {
  initial?: {
    schedule: AppointmentSchedule;
    status: "pending" | "confirmed";
    patientId: string;
    payment: AppointmentPayment;
  };
  schedule?: { before: AppointmentSchedule; after: AppointmentSchedule };
  status?: { before: AppointmentStatus; after: AppointmentStatus };
  fields?: (keyof AppointmentEditableFields)[];
  changes?: {
    field: Exclude<keyof AppointmentEditableFields, "notes">;
    before: string | number | null;
    after: string | number | null;
  }[];
  reason?: string;
};

export type AppointmentActivity = {
  id: number;
  type: AppointmentActivityType;
  actorId: string;
  title: string;
  description: string;
  occurredAt: string; // ISO 8601 UTC instant ending in Z.
  details?: AppointmentActivityDetails;
};

export type AppointmentPatient = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
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
  version: number;
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

export type CreateAppointmentInput = AppointmentSchedule & {
  patient: AppointmentPatient;
  modality: AppointmentModality;
  sessionType: AppointmentSessionType;
  amount: number;
  method: PaymentMethod;
  status?: "pending" | "confirmed";
  meetingLink?: string;
  notes?: string;
};
export type AppointmentOperationInput = { id: string; expectedVersion: number };
export type EditAppointmentInput = AppointmentOperationInput & { changes: AppointmentEditableFields };
export type RescheduleAppointmentInput = AppointmentOperationInput & AppointmentSchedule;
export type CancelAppointmentInput = AppointmentOperationInput & { reason?: string };
export type ConfirmAppointmentInput = AppointmentOperationInput;
export type CompleteAppointmentInput = AppointmentOperationInput;
export type MarkAppointmentNoShowInput = AppointmentOperationInput;
export type AppointmentCommandContext = { now: Date; actorId: string };
export type CreateAppointmentContext = AppointmentCommandContext & { id: string };
export type AppointmentErrorCode =
  | "VALIDATION_ERROR" | "NOT_FOUND" | "DUPLICATE_ID" | "INVALID_TRANSITION"
  | "INVALID_OPERATION_TIME" | "SCHEDULE_CONFLICT" | "VERSION_CONFLICT" | "NO_CHANGES";
export type AppointmentCommandError = {
  code: AppointmentErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
};
export type AppointmentCommandResult =
  | { ok: true; appointment: Appointment }
  | { ok: false; error: AppointmentCommandError };
