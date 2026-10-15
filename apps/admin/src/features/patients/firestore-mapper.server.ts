import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { AppointmentsReadError } from "../appointments/read-errors";
import type { Patient } from "./types";

type RecordValue = Record<string, unknown>;
function invalid(): never { throw new AppointmentsReadError("DATA_INVALID"); }
function record(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value) || value instanceof Timestamp) invalid();
  return value as RecordValue;
}
function string(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) invalid();
  return value;
}
function instant(value: unknown): string {
  if (!(value instanceof Timestamp)) invalid();
  try { return value.toDate().toISOString(); } catch { return invalid(); }
}

// The document ID is authoritative; unknown fields are never propagated.
export function patientFromFirestore(id: string, value: unknown): Patient {
  const data = record(value);
  if (typeof data.version !== "number" || !Number.isSafeInteger(data.version) || data.version < 1) invalid();
  return {
    id: string(id), version: data.version, fullName: string(data.fullName), phone: string(data.phone),
    ...(data.email === undefined ? {} : { email: string(data.email) }),
    createdAt: instant(data.createdAt), createdBy: string(data.createdBy), updatedAt: instant(data.updatedAt),
  };
}

export function patientToFirestore(patient: Patient): RecordValue {
  const timestamp = (iso: string) => {
    const date = new Date(iso);
    if (!iso.endsWith("Z") || !Number.isFinite(date.getTime())) invalid();
    return Timestamp.fromDate(date);
  };
  const stored: RecordValue = {
    version: patient.version, fullName: patient.fullName, phone: patient.phone,
    ...(patient.email === undefined ? {} : { email: patient.email }),
    createdAt: timestamp(patient.createdAt), createdBy: patient.createdBy, updatedAt: timestamp(patient.updatedAt),
  };
  patientFromFirestore(patient.id, stored);
  return stored;
}
