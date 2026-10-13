import { findAppointmentConflicts } from "./conflicts";
import type {
  Appointment, AppointmentActivityDetails, AppointmentActivityType, AppointmentCommandContext,
  AppointmentCommandError, AppointmentCommandResult, AppointmentEditableFields, AppointmentErrorCode,
  AppointmentOperationInput, AppointmentSchedule, AppointmentStatus, CreateAppointmentContext,
} from "./types";
import {
  appointmentEndKey, appointmentStartKey, currentCivilKey, validateCancelAppointmentInput,
  validateCommandContext, validateCreateAppointmentInput, validateEditAppointmentInput,
  validateOperationInput, validateRescheduleAppointmentInput,
} from "./validation";

function failure(code: AppointmentErrorCode, message: string): { ok: false; error: AppointmentCommandError } {
  return { ok: false, error: { code, message } };
}

function loadAppointment(
  input: AppointmentOperationInput,
  appointments: readonly Appointment[],
  context: AppointmentCommandContext,
): AppointmentCommandResult {
  const error = validateCommandContext(context);
  if (error) return { ok: false, error };
  const appointment = appointments.find((item) => item.id === input.id);
  if (!appointment) return failure("NOT_FOUND", "Agendamento não encontrado.");
  if (appointment.version !== input.expectedVersion) return failure("VERSION_CONFLICT", "O agendamento foi alterado. Recarregue os dados.");
  if (!Number.isSafeInteger(appointment.version + 1)) return failure("VALIDATION_ERROR", "A versão do agendamento excede o limite permitido.");
  return { ok: true, appointment };
}

function scheduleOf(appointment: Appointment): AppointmentSchedule {
  return { date: appointment.date, time: appointment.time, duration: appointment.duration };
}

function appendActivity(
  appointment: Appointment,
  type: AppointmentActivityType,
  context: AppointmentCommandContext,
  title: string,
  description: string,
  details: AppointmentActivityDetails,
): AppointmentCommandResult {
  const nextId = appointment.activityTimeline.reduce((highest, event) => Math.max(highest, event.id), 0) + 1;
  if (!Number.isSafeInteger(nextId)) return failure("VALIDATION_ERROR", "O histórico excede o limite permitido.");
  appointment.activityTimeline.push({
    id: nextId, type, actorId: context.actorId,
    title, description, occurredAt: context.now.toISOString(), details,
  });
  return { ok: true, appointment };
}

function checkEditableTime(appointment: Appointment, context: AppointmentCommandContext) {
  if (appointment.status !== "pending" && appointment.status !== "confirmed") {
    return failure("INVALID_TRANSITION", "Este agendamento não pode mais ser alterado.");
  }
  if (appointmentStartKey(appointment) <= currentCivilKey(context.now)) {
    return failure("INVALID_OPERATION_TIME", "Altere o agendamento antes do início do atendimento.");
  }
}

// Inputs are unknown deliberately: the same runtime boundary can be reused by future server actions.
// These commands return detached snapshots and never persist or mutate repository data.
export function createAppointment(
  input: unknown,
  appointments: readonly Appointment[],
  context: CreateAppointmentContext,
): AppointmentCommandResult {
  const parsed = validateCreateAppointmentInput(input);
  if (!parsed.ok) return parsed;
  const error = validateCommandContext(context);
  if (error) return { ok: false, error };
  if (typeof context.id !== "string" || !context.id.trim()) return failure("VALIDATION_ERROR", "Informe o identificador do novo agendamento.");
  if (appointments.some((appointment) => appointment.id === context.id)) return failure("DUPLICATE_ID", "Este identificador de agendamento já existe.");
  const value = parsed.value;
  if (appointmentStartKey(value) <= currentCivilKey(context.now)) return failure("INVALID_OPERATION_TIME", "Agende um horário estritamente no futuro.");
  if (findAppointmentConflicts(value, appointments).length) return failure("SCHEDULE_CONFLICT", "O horário conflita com outro atendimento.");
  const appointment: Appointment = {
    id: context.id, version: 1,
    date: value.date, time: value.time, duration: value.duration,
    status: value.status ?? "confirmed", modality: value.modality, sessionType: value.sessionType,
    patient: structuredClone(value.patient),
    payment: { amount: value.amount, method: value.method, status: "pending" },
    activityTimeline: [],
    ...(value.meetingLink !== undefined ? { meetingLink: value.meetingLink } : {}),
    ...(value.notes !== undefined ? { notes: value.notes } : {}),
  };
  return appendActivity(appointment, "created", context, "Agendamento criado", "Sessão agendada manualmente.", {
    initial: { schedule: scheduleOf(appointment), status: value.status ?? "confirmed", patientId: appointment.patient.id, payment: { ...appointment.payment } },
  });
}

export function editAppointment(
  input: unknown,
  appointments: readonly Appointment[],
  context: AppointmentCommandContext,
): AppointmentCommandResult {
  const parsed = validateEditAppointmentInput(input);
  if (!parsed.ok) return parsed;
  const loaded = loadAppointment(parsed.value, appointments, context);
  if (!loaded.ok) return loaded;
  const original = loaded.appointment;
  const blocked = checkEditableTime(original, context);
  if (blocked) return blocked;
  const patch = parsed.value.changes;
  if (original.payment.status !== "pending"
    && ((patch.amount !== undefined && patch.amount !== original.payment.amount)
      || (patch.method !== undefined && patch.method !== original.payment.method))) {
    return failure("INVALID_TRANSITION", "Valor e método só podem mudar enquanto o pagamento estiver pendente.");
  }
  const appointment = structuredClone(original);
  if (patch.modality !== undefined) appointment.modality = patch.modality;
  if (patch.sessionType !== undefined) appointment.sessionType = patch.sessionType;
  if (patch.amount !== undefined) appointment.payment.amount = patch.amount;
  if (patch.method !== undefined) appointment.payment.method = patch.method;
  if (patch.meetingLink === null) delete appointment.meetingLink;
  else if (patch.meetingLink !== undefined) appointment.meetingLink = patch.meetingLink;
  if (patch.notes === null) delete appointment.notes;
  else if (patch.notes !== undefined) appointment.notes = patch.notes;
  if (appointment.modality === "in_person") {
    if (patch.meetingLink !== undefined && patch.meetingLink !== null) {
      return failure("VALIDATION_ERROR", "Atendimentos presenciais não usam link de sessão.");
    }
    delete appointment.meetingLink;
  }
  const fields: (keyof AppointmentEditableFields)[] = [];
  const changes: NonNullable<AppointmentActivityDetails["changes"]> = [];
  for (const field of ["modality", "sessionType", "meetingLink", "amount", "method"] as const) {
    const before = field === "amount" || field === "method" ? original.payment[field] : original[field];
    const after = field === "amount" || field === "method" ? appointment.payment[field] : appointment[field];
    if (before !== after) {
      fields.push(field);
      changes.push({ field, before: before ?? null, after: after ?? null });
    }
  }
  // Record that notes changed without duplicating their potentially sensitive content.
  if (original.notes !== appointment.notes) fields.push("notes");
  if (!fields.length) return failure("NO_CHANGES", "Nenhuma alteração foi informada.");
  appointment.version += 1;
  return appendActivity(appointment, "edited", context, "Agendamento editado", "Informações administrativas atualizadas.", { fields, changes });
}

export function rescheduleAppointment(
  input: unknown,
  appointments: readonly Appointment[],
  context: AppointmentCommandContext,
): AppointmentCommandResult {
  const parsed = validateRescheduleAppointmentInput(input);
  if (!parsed.ok) return parsed;
  const loaded = loadAppointment(parsed.value, appointments, context);
  if (!loaded.ok) return loaded;
  const original = loaded.appointment;
  const blocked = checkEditableTime(original, context);
  if (blocked) return blocked;
  const { date, time, duration } = parsed.value;
  const after = { date, time, duration };
  if (appointmentStartKey(after) <= currentCivilKey(context.now)) return failure("INVALID_OPERATION_TIME", "Remarque para um horário estritamente no futuro.");
  if (date === original.date && time === original.time && duration === original.duration) return failure("NO_CHANGES", "O horário e a duração permanecem iguais.");
  if (findAppointmentConflicts(after, appointments, original.id).length) return failure("SCHEDULE_CONFLICT", "O horário conflita com outro atendimento.");
  const appointment = { ...structuredClone(original), ...after, version: original.version + 1 };
  return appendActivity(appointment, "rescheduled", context, "Agendamento remarcado", "Data, horário ou duração atualizados.", {
    schedule: { before: scheduleOf(original), after },
  });
}

const transitions: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled", "no_show"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [], cancelled: [], no_show: [],
};

function transitionAppointment(
  input: unknown,
  appointments: readonly Appointment[],
  context: AppointmentCommandContext,
  target: "confirmed" | "cancelled" | "completed" | "no_show",
): AppointmentCommandResult {
  const parsed = target === "cancelled" ? validateCancelAppointmentInput(input) : validateOperationInput(input);
  if (!parsed.ok) return parsed;
  const loaded = loadAppointment(parsed.value, appointments, context);
  if (!loaded.ok) return loaded;
  const original = loaded.appointment;
  if (!transitions[original.status].includes(target)) return failure("INVALID_TRANSITION", "Esta mudança de status não é permitida.");
  if ((target === "completed" || target === "no_show") && appointmentEndKey(original) > currentCivilKey(context.now)) {
    return failure("INVALID_OPERATION_TIME", "Aguarde o término previsto do atendimento.");
  }
  const titles = {
    confirmed: "Agendamento confirmado", cancelled: "Agendamento cancelado",
    completed: "Atendimento concluído", no_show: "Ausência registrada",
  };
  const appointment = { ...structuredClone(original), status: target, version: original.version + 1 };
  const reason = "reason" in parsed.value ? parsed.value.reason as string | undefined : undefined;
  return appendActivity(appointment, target, context, titles[target], "Status atualizado manualmente.", {
    status: { before: original.status, after: target },
    ...(reason !== undefined ? { reason } : {}),
  });
}

export function cancelAppointment(input: unknown, appointments: readonly Appointment[], context: AppointmentCommandContext) {
  return transitionAppointment(input, appointments, context, "cancelled");
}
export function confirmAppointment(input: unknown, appointments: readonly Appointment[], context: AppointmentCommandContext) {
  return transitionAppointment(input, appointments, context, "confirmed");
}
export function completeAppointment(input: unknown, appointments: readonly Appointment[], context: AppointmentCommandContext) {
  return transitionAppointment(input, appointments, context, "completed");
}
export function markAppointmentNoShow(input: unknown, appointments: readonly Appointment[], context: AppointmentCommandContext) {
  return transitionAppointment(input, appointments, context, "no_show");
}
