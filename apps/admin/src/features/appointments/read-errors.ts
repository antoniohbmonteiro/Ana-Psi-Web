export type AppointmentsReadErrorCode = "DATA_INVALID" | "CONFIG_INVALID" | "UNAVAILABLE";

// Public codes only: never include document contents or SDK errors.
export class AppointmentsReadError extends Error {
  constructor(public readonly code: AppointmentsReadErrorCode) {
    super(code);
    this.name = "AppointmentsReadError";
  }
}
