export type StatusBadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type AppointmentActivity = {
  id: number;
  title: string;
  description: string;
  timeLabel: string;
};

export type AppointmentPatient = {
  fullName: string;
  phone: string;
  email: string;
  typeLabel: string;
};

export type AppointmentPayment = {
  amountLabel: string;
  methodLabel: string;
  statusLabel: string;
  statusVariant: StatusBadgeVariant;
  paidAtLabel?: string;
};

export type Appointment = {
  id: string;
  date: string;
  dateLabel: string;
  time: string;
  timeLabel: string;
  duration: number;
  durationLabel: string;
  patientName: string;
  modalityLabel: string;
  sessionTypeLabel: string;
  appointmentStatusLabel: string;
  appointmentStatusVariant: StatusBadgeVariant;
  paymentStatusLabel: string;
  paymentStatusVariant: StatusBadgeVariant;
  meetingLink?: string;
  notes?: string;
  patient: AppointmentPatient;
  payment: AppointmentPayment;
  activityTimeline: AppointmentActivity[];
};