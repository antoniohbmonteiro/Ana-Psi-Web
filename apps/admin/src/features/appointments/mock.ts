import { addDays, getAppTodayIso, getCivilDateParts } from "../../lib/app-date";
import type { Appointment } from "./types";

export function createMockAppointments(referenceNow: Date): Appointment[] {
  const today = getAppTodayIso(referenceNow);
  const { year, month, day } = getCivilDateParts(today);
  // Event times are fixed UTC instants relative to the business calendar day.
  const eventAt = (days: number, hour: number, minute = 0) =>
    new Date(Date.UTC(year, month - 1, day + days, hour, minute)).toISOString();

  return [
    {
      id: "apt-001", date: addDays(today, -1), time: "09:00", duration: 50,
      status: "completed", modality: "online", sessionType: "follow_up",
      meetingLink: "https://meet.google.com/abc-defg-hij",
      notes: "Paciente pediu recibo após a sessão. Confirmar presença na véspera.",
      patient: {
        fullName: "Mariana Silva", phone: "(31) 99999-9999",
        email: "mariana.silva@email.com", relationship: "returning",
      },
      payment: { amount: 10000, method: "pix", status: "paid", paidAt: eventAt(-2, 12, 12) },
      activityTimeline: [
        { id: 1, title: "Agendamento criado", description: "Sessão agendada manualmente pela terapeuta.", occurredAt: eventAt(-2, 10) },
        { id: 2, title: "Pagamento aprovado", description: "Pagamento via PIX confirmado com sucesso.", occurredAt: eventAt(-2, 12, 12) },
        { id: 3, title: "Atendimento concluído", description: "Sessão realizada com a paciente.", occurredAt: eventAt(-1, 15) },
      ],
    },
    {
      id: "apt-002", date: today, time: "09:00", duration: 50,
      status: "confirmed", modality: "in_person", sessionType: "follow_up",
      notes: "Trazer comprovante da última sessão.",
      patient: {
        fullName: "Carlos Eduardo Santos", phone: "(31) 98888-2222",
        email: "carlos.santos@email.com", relationship: "returning",
      },
      payment: { amount: 10000, method: "payment_link", status: "pending" },
      activityTimeline: [
        { id: 1, title: "Agendamento confirmado", description: "Sessão confirmada pela terapeuta.", occurredAt: eventAt(-1, 20, 10) },
      ],
    },
    {
      id: "apt-003", date: today, time: "14:00", duration: 50,
      status: "confirmed", modality: "online", sessionType: "initial",
      meetingLink: "https://meet.google.com/jul-olia-123",
      patient: {
        fullName: "Júlia Oliveira", phone: "(31) 97777-3333",
        email: "julia.oliveira@email.com", relationship: "new",
      },
      payment: { amount: 12000, method: "pix", status: "paid", paidAt: eventAt(-1, 19, 20) },
      activityTimeline: [
        { id: 1, title: "Reserva convertida em agendamento", description: "Pagamento confirmado e sessão liberada.", occurredAt: eventAt(-1, 19, 20) },
      ],
    },
    {
      id: "apt-004", date: today, time: "17:00", duration: 50,
      status: "confirmed", modality: "in_person", sessionType: "follow_up",
      patient: {
        fullName: "Roberto Almeida", phone: "(31) 96666-1111",
        email: "roberto.almeida@email.com", relationship: "returning",
      },
      payment: { amount: 10000, method: "cash", status: "paid", paidAt: eventAt(-1, 15, 40) },
      activityTimeline: [
        { id: 1, title: "Agendamento confirmado", description: "Sessão confirmada manualmente.", occurredAt: eventAt(-1, 15, 40) },
      ],
    },
    {
      id: "apt-005", date: addDays(today, 1), time: "10:30", duration: 50,
      status: "pending", modality: "online", sessionType: "follow_up",
      patient: {
        fullName: "Fernanda Costa", phone: "(31) 95555-4444",
        email: "fernanda.costa@email.com", relationship: "returning",
      },
      payment: { amount: 10000, method: "payment_link", status: "pending" },
      activityTimeline: [
        { id: 1, title: "Pré-reserva criada", description: "Aguardando confirmação do pagamento.", occurredAt: eventAt(-1, 17) },
      ],
    },
    {
      id: "apt-006", date: addDays(today, 1), time: "14:00", duration: 50,
      status: "confirmed", modality: "online", sessionType: "follow_up",
      meetingLink: "https://meet.google.com/luc-mend-123",
      patient: {
        fullName: "Lucas Mendes", phone: "(31) 94444-5555",
        email: "lucas.mendes@email.com", relationship: "returning",
      },
      payment: { amount: 10000, method: "pix", status: "paid", paidAt: eventAt(-1, 12) },
      activityTimeline: [
        { id: 1, title: "Agendamento confirmado", description: "Sessão confirmada após o pagamento.", occurredAt: eventAt(-1, 12) },
      ],
    },
    {
      id: "apt-007", date: addDays(today, 2), time: "10:30", duration: 50,
      status: "cancelled", modality: "in_person", sessionType: "initial",
      patient: {
        fullName: "Beatriz Souza", phone: "(31) 93333-6666",
        email: "beatriz.souza@email.com", relationship: "new",
      },
      payment: { amount: 12000, method: "pix", status: "refunded", paidAt: eventAt(-2, 12) },
      activityTimeline: [
        { id: 1, title: "Agendamento criado", description: "Sessão reservada para a paciente.", occurredAt: eventAt(-2, 10) },
        { id: 2, title: "Pagamento aprovado", description: "Pagamento via PIX confirmado.", occurredAt: eventAt(-2, 12) },
        { id: 3, title: "Agendamento cancelado", description: "Pagamento reembolsado após o cancelamento.", occurredAt: eventAt(-1, 12) },
      ],
    },
  ];
}
