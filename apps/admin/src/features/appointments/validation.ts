import { addDays, getAppDateTime } from "../../lib/app-date";
import type {
  AppointmentCommandContext, AppointmentCommandError, AppointmentEditableFields,
  AppointmentOperationInput, AppointmentSchedule, CancelAppointmentInput,
  CreateAppointmentInput, EditAppointmentInput, RescheduleAppointmentInput,
} from "./types";

type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: AppointmentCommandError };
type FieldErrors = Record<string, string>;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
function allowed(value: unknown, choices: readonly string[]) {
  return typeof value === "string" && choices.includes(value);
}
function unknownFields(value: Record<string, unknown>, keys: readonly string[], errors: FieldErrors, prefix = "") {
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) errors[`${prefix}${key}`] = "Campo não permitido.";
  }
}
function result<T>(value: unknown, errors: FieldErrors): ValidationResult<T> {
  return Object.keys(errors).length
    ? { ok: false, error: { code: "VALIDATION_ERROR", message: "Revise os campos informados.", fieldErrors: errors } }
    : { ok: true, value: value as T };
}
function objectInput(value: unknown): ValidationResult<Record<string, unknown>> {
  return record(value) ? { ok: true, value }
    : result(value, { input: "Informe um objeto válido." });
}

export function isValidCivilDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return false;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
export function isValidCivilTime(value: unknown): value is string {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}
export function timeToMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
function scheduleErrors(value: Record<string, unknown>, errors: FieldErrors) {
  if (!isValidCivilDate(value.date)) errors.date = "Informe uma data existente no formato YYYY-MM-DD.";
  if (!isValidCivilTime(value.time)) errors.time = "Informe um horário válido no formato HH:mm.";
  if (!Number.isSafeInteger(value.duration) || (value.duration as number) <= 0) {
    errors.duration = "Informe uma duração inteira positiva em minutos.";
  } else if (isValidCivilTime(value.time) && timeToMinutes(value.time) + (value.duration as number) > 1440) {
    errors.duration = "O atendimento não pode ultrapassar a meia-noite.";
  }
}
function amountError(value: unknown, errors: FieldErrors, key: string) {
  if (!Number.isSafeInteger(value) || (value as number) < 0) errors[key] = "Informe um valor inteiro não negativo em centavos.";
}
function optionalText(value: unknown, errors: FieldErrors, key: string, nullable = false) {
  if (value !== undefined && !(nullable && value === null) && typeof value !== "string") {
    errors[key] = "Informe um texto válido.";
  }
}
function linkError(value: unknown, errors: FieldErrors, key: string, nullable = false) {
  if (value === undefined || (nullable && value === null)) return;
  try {
    if (typeof value !== "string" || new URL(value).protocol !== "https:") throw new Error();
  } catch {
    errors[key] = "Informe uma URL HTTPS válida.";
  }
}
function operationErrors(value: Record<string, unknown>, errors: FieldErrors) {
  if (!nonEmpty(value.id)) errors.id = "Informe o identificador do agendamento.";
  if (!Number.isSafeInteger(value.expectedVersion) || (value.expectedVersion as number) < 1) {
    errors.expectedVersion = "Informe uma versão inteira positiva.";
  }
}

export function validateCommandContext(context: AppointmentCommandContext): AppointmentCommandError | undefined {
  if (!context || !(context.now instanceof Date) || !Number.isFinite(context.now.getTime()) || !nonEmpty(context.actorId)) {
    return { code: "VALIDATION_ERROR", message: "Contexto da operação inválido." };
  }
}

export function validateCreateAppointmentInput(input: unknown): ValidationResult<CreateAppointmentInput> {
  const parsed = objectInput(input);
  if (!parsed.ok) return parsed;
  const value = parsed.value;
  const errors: FieldErrors = Object.create(null);
  unknownFields(value, ["patient", "date", "time", "duration", "modality", "sessionType", "amount", "method", "status", "meetingLink", "notes"], errors);
  scheduleErrors(value, errors);
  if (!record(value.patient)) errors.patient = "Informe o paciente identificado.";
  else {
    unknownFields(value.patient, ["id", "fullName", "phone", "email", "relationship"], errors, "patient.");
    if (!nonEmpty(value.patient.id)) errors["patient.id"] = "Informe o identificador do paciente.";
    if (!nonEmpty(value.patient.fullName)) errors["patient.fullName"] = "Informe o nome completo.";
    if (!allowed(value.patient.relationship, ["new", "returning"])) errors["patient.relationship"] = "Informe o vínculo do paciente.";
    optionalText(value.patient.phone, errors, "patient.phone");
    optionalText(value.patient.email, errors, "patient.email");
  }
  if (!allowed(value.modality, ["online", "in_person"])) errors.modality = "Informe a modalidade.";
  if (!allowed(value.sessionType, ["initial", "follow_up"])) errors.sessionType = "Informe o tipo de sessão.";
  amountError(value.amount, errors, "amount");
  if (!allowed(value.method, ["pix", "payment_link", "cash"])) errors.method = "Informe o método de pagamento.";
  if (value.status !== undefined && !allowed(value.status, ["pending", "confirmed"])) errors.status = "Status inicial inválido.";
  linkError(value.meetingLink, errors, "meetingLink");
  if (value.modality === "in_person" && value.meetingLink !== undefined) errors.meetingLink = "Atendimentos presenciais não usam link de sessão.";
  optionalText(value.notes, errors, "notes");
  return result(input, errors);
}

export function validateEditAppointmentInput(input: unknown): ValidationResult<EditAppointmentInput> {
  const parsed = objectInput(input);
  if (!parsed.ok) return parsed;
  const value = parsed.value;
  const errors: FieldErrors = Object.create(null);
  unknownFields(value, ["id", "expectedVersion", "changes"], errors);
  operationErrors(value, errors);
  if (!record(value.changes)) errors.changes = "Informe os campos que deseja alterar.";
  else {
    const changes = value.changes;
    unknownFields(changes, ["modality", "sessionType", "meetingLink", "notes", "amount", "method"] satisfies (keyof AppointmentEditableFields)[], errors, "changes.");
    if (changes.modality !== undefined && !allowed(changes.modality, ["online", "in_person"])) errors["changes.modality"] = "Modalidade inválida.";
    if (changes.sessionType !== undefined && !allowed(changes.sessionType, ["initial", "follow_up"])) errors["changes.sessionType"] = "Tipo de sessão inválido.";
    if (changes.amount !== undefined) amountError(changes.amount, errors, "changes.amount");
    if (changes.method !== undefined && !allowed(changes.method, ["pix", "payment_link", "cash"])) errors["changes.method"] = "Método inválido.";
    linkError(changes.meetingLink, errors, "changes.meetingLink", true);
    optionalText(changes.notes, errors, "changes.notes", true);
  }
  return result(input, errors);
}

export function validateRescheduleAppointmentInput(input: unknown): ValidationResult<RescheduleAppointmentInput> {
  const parsed = objectInput(input);
  if (!parsed.ok) return parsed;
  const errors: FieldErrors = Object.create(null);
  unknownFields(parsed.value, ["id", "expectedVersion", "date", "time", "duration"], errors);
  operationErrors(parsed.value, errors);
  scheduleErrors(parsed.value, errors);
  return result(input, errors);
}

export function validateOperationInput(input: unknown): ValidationResult<AppointmentOperationInput> {
  const parsed = objectInput(input);
  if (!parsed.ok) return parsed;
  const errors: FieldErrors = Object.create(null);
  unknownFields(parsed.value, ["id", "expectedVersion"], errors);
  operationErrors(parsed.value, errors);
  return result(input, errors);
}

export function validateCancelAppointmentInput(input: unknown): ValidationResult<CancelAppointmentInput> {
  const parsed = objectInput(input);
  if (!parsed.ok) return parsed;
  const errors: FieldErrors = Object.create(null);
  unknownFields(parsed.value, ["id", "expectedVersion", "reason"], errors);
  operationErrors(parsed.value, errors);
  optionalText(parsed.value.reason, errors, "reason");
  return result(input, errors);
}

// Keys represent civil time in the official zone; these are not UTC instants.
export function appointmentStartKey(schedule: AppointmentSchedule) {
  return `${schedule.date}T${schedule.time}:00.000`;
}
export function appointmentEndKey(schedule: AppointmentSchedule) {
  const end = timeToMinutes(schedule.time) + schedule.duration;
  if (end === 1440) return `${addDays(schedule.date, 1)}T00:00:00.000`;
  return `${schedule.date}T${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}:00.000`;
}
export function currentCivilKey(now: Date) {
  const current = getAppDateTime(now);
  return `${current.date}T${current.time}`;
}
