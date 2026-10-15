import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { isValidCivilDate, isValidCivilTime } from "./validation";
import { AppointmentsReadError } from "./read-errors";
import type { Appointment, AppointmentActivityDetails, AppointmentPayment, AppointmentSchedule } from "./types";

type RecordValue = Record<string, unknown>;
function invalid(): never { throw new AppointmentsReadError("DATA_INVALID"); }
function record(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value) || value instanceof Timestamp) invalid();
  return value as RecordValue;
}
function string(value: unknown, nonempty = true): string {
  if (typeof value !== "string" || (nonempty && !value.trim())) invalid();
  return value;
}
function integer(value: unknown, minimum: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < minimum) invalid();
  return value;
}
function choice<T extends string>(value: unknown, values: readonly T[]): T {
  if (typeof value !== "string" || !values.includes(value as T)) invalid();
  return value as T;
}
function optionalString(source: RecordValue, key: string) {
  return source[key] === undefined ? {} : { [key]: string(source[key], false) };
}
function instant(value: unknown): string {
  if (!(value instanceof Timestamp)) invalid();
  try { return value.toDate().toISOString(); } catch { return invalid(); }
}
const statuses = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;
const fields = ["modality", "sessionType", "meetingLink", "notes", "amount", "method"] as const;
function schedule(value: unknown): AppointmentSchedule {
  const data = record(value);
  const date = string(data.date), time = string(data.time), duration = integer(data.duration, 1);
  if (!isValidCivilDate(date) || !isValidCivilTime(time)) invalid();
  const [hour, minute] = time.split(":").map(Number);
  if (hour * 60 + minute + duration > 1440) invalid();
  return { date, time, duration };
}
function payment(value: unknown): AppointmentPayment {
  const data = record(value);
  return {
    amount: integer(data.amount, 0), method: choice(data.method, ["pix", "payment_link", "cash"]),
    status: choice(data.status, ["pending", "paid", "refunded"]),
    ...(data.paidAt === undefined ? {} : { paidAt: instant(data.paidAt) }),
  };
}
function changedValue(field: string, value: unknown): string | number | null {
  if (field === "amount") return integer(value, 0);
  if (field === "modality") return choice(value, ["online", "in_person"]);
  if (field === "sessionType") return choice(value, ["initial", "follow_up"]);
  if (field === "method") return choice(value, ["pix", "payment_link", "cash"]);
  return value === null ? null : string(value, false);
}
function details(value: unknown): AppointmentActivityDetails {
  const data = record(value);
  const result: AppointmentActivityDetails = {};
  if (data.initial !== undefined) {
    const initial = record(data.initial);
    result.initial = { schedule: schedule(initial.schedule), status: choice(initial.status, ["pending", "confirmed"]),
      patientId: string(initial.patientId), payment: payment(initial.payment) };
  }
  if (data.schedule !== undefined) {
    const change = record(data.schedule);
    result.schedule = { before: schedule(change.before), after: schedule(change.after) };
  }
  if (data.status !== undefined) {
    const change = record(data.status);
    result.status = { before: choice(change.before, statuses), after: choice(change.after, statuses) };
  }
  if (data.fields !== undefined) {
    if (!Array.isArray(data.fields)) invalid();
    result.fields = data.fields.map((field) => choice(field, fields));
  }
  if (data.changes !== undefined) {
    if (!Array.isArray(data.changes)) invalid();
    result.changes = data.changes.map((value) => {
      const change = record(value);
      const field = choice(change.field, ["modality", "sessionType", "meetingLink", "amount", "method"] as const);
      return { field, before: changedValue(field, change.before), after: changedValue(field, change.after) };
    });
  }
  if (data.reason !== undefined) result.reason = string(data.reason, false);
  return result;
}

export function appointmentFromFirestore(id: string, value: unknown): Appointment {
  const data = record(value), patient = record(data.patient);
  if (!Array.isArray(data.activityTimeline)) invalid();
  return {
    id: string(id), version: integer(data.version, 1), ...schedule(data),
    status: choice(data.status, statuses), modality: choice(data.modality, ["online", "in_person"]),
    sessionType: choice(data.sessionType, ["initial", "follow_up"]),
    ...optionalString(data, "meetingLink"), ...optionalString(data, "notes"),
    patient: { id: string(patient.id), fullName: string(patient.fullName),
      relationship: choice(patient.relationship, ["new", "returning"]),
      ...optionalString(patient, "phone"), ...optionalString(patient, "email") },
    payment: payment(data.payment),
    activityTimeline: data.activityTimeline.map((value) => {
      const event = record(value);
      return { id: integer(event.id, 1),
        type: choice(event.type, ["created", "edited", "rescheduled", "confirmed", "cancelled", "completed", "no_show", "payment_recorded", "payment_refunded"]),
        actorId: string(event.actorId), title: string(event.title), description: string(event.description, false),
        occurredAt: instant(event.occurredAt), ...(event.details === undefined ? {} : { details: details(event.details) }) };
    }),
  };
}

// Serialization re-validates by round trip; used by the transactional writer and local fixtures only.
export function appointmentToFirestore(appointment: Appointment): RecordValue {
  function serialize(value: unknown, key = ""): unknown {
    if (key === "paidAt" || key === "occurredAt") {
      const iso = string(value);
      const date = new Date(iso);
      if (!iso.endsWith("Z") || !Number.isFinite(date.getTime())) invalid();
      return Timestamp.fromDate(date);
    }
    if (Array.isArray(value)) return value.map((item) => serialize(item));
    if (value && typeof value === "object") return Object.fromEntries(
      Object.entries(value).filter(([, item]) => item !== undefined).map(([name, item]) => [name, serialize(item, name)]));
    return value;
  }
  const serialized = record(serialize(appointment));
  const validated = appointmentFromFirestore(appointment.id, serialized);
  const result = record(serialize(validated));
  delete result.id;
  return result;
}
