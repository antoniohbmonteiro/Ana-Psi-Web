import type { AppointmentErrorCode } from "./types";

export type AppointmentWriteErrorCode = AppointmentErrorCode
  | "INVALID_BODY" | "IDEMPOTENCY_KEY_REUSED" | "IDEMPOTENCY_KEY_CONFLICT" | "PATIENT_NOT_FOUND"
  | "DATA_INVALID" | "CONFIG_INVALID" | "UNAVAILABLE";

// Public codes and Portuguese messages only: never include document contents or SDK errors.
export type AppointmentWriteError = {
  code: AppointmentWriteErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
  appointmentId?: string;
};

export type CreateAppointmentWriteResult =
  | { ok: true; appointmentId: string; replayed: boolean }
  | { ok: false; error: AppointmentWriteError };

const messages: Partial<Record<AppointmentWriteErrorCode, string>> = {
  INVALID_BODY: "Solicitação inválida.",
  IDEMPOTENCY_KEY_REUSED: "Este envio já criou um agendamento. Abra o agendamento criado ou recarregue o formulário.",
  // Deliberately says nothing about the earlier request: the key belongs to another actor or operation.
  IDEMPOTENCY_KEY_CONFLICT: "Não foi possível usar este envio. Tente salvar novamente.",
  PATIENT_NOT_FOUND: "Paciente não encontrado. Recarregue a página e selecione novamente.",
  DATA_INVALID: "Não foi possível salvar por inconsistência nos dados da agenda.",
  CONFIG_INVALID: "Agendamentos indisponíveis neste ambiente.",
  UNAVAILABLE: "Não foi possível confirmar o agendamento. Tente novamente; o reenvio não duplica o agendamento.",
};

export function appointmentWriteFailure(code: AppointmentWriteErrorCode, message = messages[code] ?? "Não foi possível salvar o agendamento."): { ok: false; error: AppointmentWriteError } {
  return { ok: false, error: { code, message } };
}

export function appointmentWriteStatus(code: AppointmentWriteErrorCode) {
  switch (code) {
    case "INVALID_BODY": return 400;
    case "SCHEDULE_CONFLICT": case "IDEMPOTENCY_KEY_REUSED": case "IDEMPOTENCY_KEY_CONFLICT":
    case "DUPLICATE_ID": case "VERSION_CONFLICT": return 409;
    case "DATA_INVALID": case "CONFIG_INVALID": case "UNAVAILABLE": return 503;
    default: return 422;
  }
}
