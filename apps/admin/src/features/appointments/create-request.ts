import type {
  AppointmentCommandError, AppointmentModality, AppointmentSessionType, PaymentMethod,
} from "./types";
import { APPOINTMENT_TEXT_LIMITS, isValidCivilDate, isValidCivilTime, timeToMinutes } from "./validation";

// Shared by the form and the API: the browser gets early feedback, the server remains authoritative.
export const CREATE_APPOINTMENT_LIMITS = {
  fullNameMin: 2,
  durationMax: 480,
  amountMax: 1_000_000, // R$ 10.000,00 in cents.
} as const;

export type NewPatientRequest = { mode: "new"; fullName: string; phone: string; email?: string };
export type ExistingPatientRequest = { mode: "existing"; id: string };

export type CreateAppointmentRequest = {
  requestId: string;
  patient: NewPatientRequest | ExistingPatientRequest;
  date: string;
  time: string;
  duration: number;
  modality: AppointmentModality;
  sessionType: AppointmentSessionType;
  status: "pending" | "confirmed";
  amount: number;
  method: PaymentMethod;
  meetingLink?: string;
  notes?: string;
};

type FieldErrors = Record<string, string>;
export type CreateAppointmentRequestResult =
  | { ok: true; value: CreateAppointmentRequest }
  | { ok: false; error: AppointmentCommandError };

const REQUEST_FIELDS = ["requestId", "patient", "date", "time", "duration", "modality", "sessionType",
  "status", "amount", "method", "meetingLink", "notes"];
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DOCUMENT_ID = /^[A-Za-z0-9_-]{1,128}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Area codes assigned by Anatel; numbers outside this list cannot be dialled in Brazil.
const AREA_CODES = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

function plainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
function choice<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}
function unknownFields(value: Record<string, unknown>, keys: readonly string[], errors: FieldErrors, prefix = "") {
  for (const key of Object.keys(value)) if (!keys.includes(key)) errors[`${prefix}${key}`] = "Campo não permitido.";
}
// Empty optional text means "not informed"; anything else must be a string.
function optionalText(value: unknown, errors: FieldErrors, key: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") { errors[key] = "Informe um texto válido."; return undefined; }
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizePersonName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

// Returns "(DD) NNNNN-NNNN" or "(DD) NNNN-NNNN"; undefined when the number is not a valid Brazilian phone.
export function normalizeBrazilPhone(value: string): string | undefined {
  if (!/^\+?[\d\s().-]+$/.test(value.trim())) return undefined;
  let digits = value.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return undefined;
  if (!AREA_CODES.has(Number(digits.slice(0, 2)))) return undefined;
  const number = digits.slice(2);
  if (number.length === 9 && number[0] !== "9") return undefined;
  if (number.length === 8 && !"2345".includes(number[0])) return undefined;
  return `(${digits.slice(0, 2)}) ${number.slice(0, -4)}-${number.slice(-4)}`;
}

// Accepts Brazilian notation such as "150", "150,5", "1.234,56" or "R$ 99,90"; returns integer cents.
export function parseBrlAmountToCents(value: string): number | undefined {
  const text = value.trim().replace(/^R\$\s*/i, "");
  let reais: string;
  let cents = "";
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(text) || /^\d+(,\d{1,2})?$/.test(text)) {
    const [whole, fraction = ""] = text.split(",");
    reais = whole.replace(/\./g, "");
    cents = fraction;
  } else if (/^\d+\.\d{1,2}$/.test(text)) {
    [reais, cents] = text.split(".");
  } else {
    return undefined;
  }
  const amount = Number(reais) * 100 + Number(cents.padEnd(2, "0"));
  return Number.isSafeInteger(amount) ? amount : undefined;
}

export function parseCreateAppointmentRequest(input: unknown): CreateAppointmentRequestResult {
  const errors: FieldErrors = Object.create(null);
  if (!plainObject(input)) return failure({ input: "Informe um objeto válido." });
  unknownFields(input, REQUEST_FIELDS, errors);

  const requestId = typeof input.requestId === "string" && UUID_V4.test(input.requestId)
    ? input.requestId.toLowerCase() : undefined;
  if (!requestId) errors.requestId = "Identificador de envio inválido. Recarregue a página.";

  let patient: CreateAppointmentRequest["patient"] | undefined;
  if (!plainObject(input.patient)) errors.patient = "Informe o paciente.";
  else if (input.patient.mode === "existing") {
    unknownFields(input.patient, ["mode", "id"], errors, "patient.");
    if (typeof input.patient.id !== "string" || !DOCUMENT_ID.test(input.patient.id)) errors["patient.id"] = "Selecione um paciente cadastrado.";
    else patient = { mode: "existing", id: input.patient.id };
  } else if (input.patient.mode === "new") {
    unknownFields(input.patient, ["mode", "fullName", "phone", "email"], errors, "patient.");
    const fullName = typeof input.patient.fullName === "string" ? normalizePersonName(input.patient.fullName) : "";
    if (fullName.length < CREATE_APPOINTMENT_LIMITS.fullNameMin) errors["patient.fullName"] = "Informe o nome completo.";
    else if (fullName.length > APPOINTMENT_TEXT_LIMITS.fullName) errors["patient.fullName"] = `Use no máximo ${APPOINTMENT_TEXT_LIMITS.fullName} caracteres.`;
    const phone = typeof input.patient.phone === "string" && input.patient.phone.length <= APPOINTMENT_TEXT_LIMITS.phone
      ? normalizeBrazilPhone(input.patient.phone) : undefined;
    if (!phone) errors["patient.phone"] = "Informe um telefone brasileiro com DDD.";
    const email = optionalText(input.patient.email, errors, "patient.email");
    if (email !== undefined && (email.length > APPOINTMENT_TEXT_LIMITS.email || !EMAIL.test(email))) errors["patient.email"] = "Informe um e-mail válido.";
    if (phone) patient = { mode: "new", fullName, phone, ...(email !== undefined ? { email } : {}) };
  } else errors["patient.mode"] = "Escolha entre paciente novo ou cadastrado.";

  if (!isValidCivilDate(input.date)) errors.date = "Informe uma data válida.";
  if (!isValidCivilTime(input.time)) errors.time = "Informe um horário válido.";
  const duration = input.duration;
  if (!Number.isSafeInteger(duration) || (duration as number) < 1 || (duration as number) > CREATE_APPOINTMENT_LIMITS.durationMax) {
    errors.duration = `Informe uma duração entre 1 e ${CREATE_APPOINTMENT_LIMITS.durationMax} minutos.`;
  } else if (isValidCivilTime(input.time) && timeToMinutes(input.time) + (duration as number) > 1440) {
    errors.duration = "O atendimento não pode ultrapassar a meia-noite.";
  }
  if (!choice(input.modality, ["online", "in_person"] as const)) errors.modality = "Informe a modalidade.";
  if (!choice(input.sessionType, ["initial", "follow_up"] as const)) errors.sessionType = "Informe o tipo de sessão.";
  if (!choice(input.status, ["pending", "confirmed"] as const)) errors.status = "Informe o status inicial.";
  const amount = input.amount;
  if (!Number.isSafeInteger(amount) || (amount as number) < 0 || (amount as number) > CREATE_APPOINTMENT_LIMITS.amountMax) {
    errors.amount = "Informe um valor entre R$ 0,00 e R$ 10.000,00.";
  }
  if (!choice(input.method, ["pix", "payment_link", "cash"] as const)) errors.method = "Informe a forma de pagamento.";

  const meetingLink = optionalText(input.meetingLink, errors, "meetingLink");
  if (meetingLink !== undefined) {
    if (input.modality === "in_person") errors.meetingLink = "Atendimentos presenciais não usam link de sessão.";
    else if (meetingLink.length > APPOINTMENT_TEXT_LIMITS.meetingLink) errors.meetingLink = `Use no máximo ${APPOINTMENT_TEXT_LIMITS.meetingLink} caracteres.`;
    else {
      try { if (new URL(meetingLink).protocol !== "https:") throw new Error(); }
      catch { errors.meetingLink = "Informe um link HTTPS válido."; }
    }
  }
  const notes = optionalText(input.notes, errors, "notes");
  if (notes !== undefined && notes.length > APPOINTMENT_TEXT_LIMITS.notes) errors.notes = `Use no máximo ${APPOINTMENT_TEXT_LIMITS.notes} caracteres.`;

  if (Object.keys(errors).length || !requestId || !patient) return failure(errors);
  return {
    ok: true,
    value: {
      requestId, patient,
      date: input.date as string, time: input.time as string, duration: duration as number,
      modality: input.modality as AppointmentModality, sessionType: input.sessionType as AppointmentSessionType,
      status: input.status as "pending" | "confirmed", amount: amount as number, method: input.method as PaymentMethod,
      ...(meetingLink !== undefined ? { meetingLink } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  };
}

function failure(fieldErrors: FieldErrors): CreateAppointmentRequestResult {
  return { ok: false, error: { code: "VALIDATION_ERROR", message: "Revise os campos informados.", fieldErrors } };
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])]));
  }
  return value;
}

// Stable representation of what a request asks for; the request ID itself is excluded.
export function canonicalCreateAppointmentRequest(request: CreateAppointmentRequest) {
  const payload: Partial<CreateAppointmentRequest> = { ...request };
  delete payload.requestId;
  return JSON.stringify(canonical(payload));
}
