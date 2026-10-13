import type { BadgeVariant } from "../../components/ui/badge";
import { addDays, APP_TIME_ZONE, getAppDateTime, getCivilDateParts } from "../../lib/app-date";
import type { Appointment, AppointmentStatus, PaymentStatus, AppointmentModality, AppointmentSessionType, PatientRelationship, PaymentMethod } from "./types";

type StatusPresentation = { label: string; variant: BadgeVariant };

const appointmentStatuses: Record<AppointmentStatus, StatusPresentation> = {
  pending: { label: "Pendente", variant: "warning" },
  confirmed: { label: "Confirmado", variant: "success" },
  completed: { label: "Concluído", variant: "info" },
  cancelled: { label: "Cancelado", variant: "danger" },
  no_show: { label: "Não compareceu", variant: "neutral" },
};
const paymentStatuses: Record<PaymentStatus, StatusPresentation> = {
  pending: { label: "Pendente", variant: "warning" },
  paid: { label: "Pago", variant: "success" },
  refunded: { label: "Reembolsado", variant: "neutral" },
};
const modalities: Record<AppointmentModality, string> = { online: "Online", in_person: "Presencial" };
const sessionTypes: Record<AppointmentSessionType, string> = { initial: "Primeira Sessão", follow_up: "Retorno" };
const relationships: Record<PatientRelationship, string> = { new: "Primeira consulta", returning: "Paciente recorrente" };
const paymentMethods: Record<PaymentMethod, string> = { pix: "PIX", payment_link: "Link de pagamento", cash: "Dinheiro" };

export const appointmentQuickActions = [
  "Remarcar atendimento", "Enviar lembrete", "Abrir perfil do paciente", "Copiar link da sessão",
];

export function getAppointmentStatusPresentation(status: AppointmentStatus) {
  return appointmentStatuses[status];
}
export function getPaymentStatusPresentation(status: PaymentStatus) {
  return paymentStatuses[status];
}

export function formatAppointmentDate(date: string) {
  const { year, month, day } = getCivilDateParts(date);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC", day: "2-digit", month: "long", year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatAppointmentTime(time: string, duration: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const end = (hours * 60 + minutes + duration) % (24 * 60);
  return `${time} às ${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}

export function formatAmount(amount: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount / 100);
}

export function formatActivityInstant(timestamp: string, separator = " · ") {
  const instant = new Date(timestamp);
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE, day: "2-digit", month: "2-digit", year: "numeric",
  }).format(instant);
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(instant);
  return `${date}${separator}${time}`;
}

export function getNextAppointmentDayLabel(appointment: Appointment | null, now: Date) {
  if (!appointment) return "Sem sessões";
  const today = getAppDateTime(now).date;
  if (appointment.date === today) return "Hoje";
  if (appointment.date === addDays(today, 1)) return "Amanhã";
  const [year, month, day] = appointment.date.split("-");
  return `${day}/${month}/${year}`;
}

export function toAppointmentDetailPresentation(appointment: Appointment) {
  const status = getAppointmentStatusPresentation(appointment.status);
  const paymentStatus = getPaymentStatusPresentation(appointment.payment.status);
  return {
    summary: {
      patientName: appointment.patient.fullName,
      dateLabel: formatAppointmentDate(appointment.date),
      timeLabel: formatAppointmentTime(appointment.time, appointment.duration),
      durationLabel: `${appointment.duration} minutos`,
      modalityLabel: modalities[appointment.modality],
      sessionTypeLabel: sessionTypes[appointment.sessionType],
      appointmentStatusLabel: status.label,
      appointmentStatusVariant: status.variant,
      paymentStatusLabel: paymentStatus.label,
      paymentStatusVariant: paymentStatus.variant,
      meetingLink: appointment.meetingLink,
      notes: appointment.notes,
    },
    payment: {
      amountLabel: formatAmount(appointment.payment.amount),
      methodLabel: paymentMethods[appointment.payment.method],
      statusLabel: paymentStatus.label,
      statusVariant: paymentStatus.variant,
      paidAtLabel: appointment.payment.paidAt
        ? formatActivityInstant(appointment.payment.paidAt, " às ") : undefined,
    },
    patient: {
      fullName: appointment.patient.fullName,
      phone: appointment.patient.phone,
      email: appointment.patient.email,
      typeLabel: relationships[appointment.patient.relationship],
    },
    activityTimeline: appointment.activityTimeline.map(({ occurredAt, ...item }) => ({
      ...item, timeLabel: formatActivityInstant(occurredAt),
    })),
  };
}
