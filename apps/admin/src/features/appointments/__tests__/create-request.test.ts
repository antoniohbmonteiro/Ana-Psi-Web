import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalCreateAppointmentRequest, normalizeBrazilPhone, normalizePersonName,
  parseBrlAmountToCents, parseCreateAppointmentRequest, type CreateAppointmentRequest,
} from "../create-request";

const requestId = "3f0e2b7c-58a4-4d6e-9b1a-2c7d8e9f0a1b";
function request(overrides: Record<string, unknown> = {}) {
  return {
    requestId,
    patient: { mode: "new", fullName: "Paciente de Teste", phone: "(31) 99999-0000" },
    date: "2026-11-02", time: "10:17", duration: 50, modality: "online", sessionType: "initial",
    status: "confirmed", amount: 15000, method: "pix",
    ...overrides,
  };
}
function parsed(value: unknown): CreateAppointmentRequest {
  const result = parseCreateAppointmentRequest(value);
  assert.ok(result.ok, JSON.stringify(result));
  return result.value;
}
function fieldErrors(value: unknown) {
  const result = parseCreateAppointmentRequest(value);
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("Expected request failure");
  assert.equal(result.error.code, "VALIDATION_ERROR");
  return result.error.fieldErrors ?? {};
}

test("a complete request is normalized: name spacing, phone format, empty optionals and request ID case", () => {
  const value = parsed(request({
    requestId: requestId.toUpperCase(),
    patient: { mode: "new", fullName: "  Maria   da  Silva ", phone: "+55 31 98888-7777", email: "  " },
    meetingLink: "", notes: "   ",
  }));
  assert.deepEqual(value, {
    requestId, patient: { mode: "new", fullName: "Maria da Silva", phone: "(31) 98888-7777" },
    date: "2026-11-02", time: "10:17", duration: 50, modality: "online", sessionType: "initial",
    status: "confirmed", amount: 15000, method: "pix",
  });
  const existing = parsed(request({ patient: { mode: "existing", id: "mock-patient-002" }, meetingLink: "https://meet.example.invalid/a", notes: " Nota " }));
  assert.deepEqual(existing.patient, { mode: "existing", id: "mock-patient-002" });
  assert.equal(existing.meetingLink, "https://meet.example.invalid/a");
  assert.equal(existing.notes, "Nota");
  assert.equal(parsed(request({ patient: { mode: "new", fullName: "Ana", phone: "3133334444", email: " a@b.co " } })).patient.mode, "new");
});

const invalidRequests: [string, Record<string, unknown>, string][] = [
  ["missing request ID", request({ requestId: undefined }), "requestId"],
  ["non UUID request ID", request({ requestId: "1234" }), "requestId"],
  ["UUID v1 request ID", request({ requestId: "3f0e2b7c-58a4-1d6e-9b1a-2c7d8e9f0a1b" }), "requestId"],
  ["unknown top-level field", request({ actorId: "attacker" }), "actorId"],
  ["missing patient", request({ patient: undefined }), "patient"],
  ["unknown patient mode", request({ patient: { mode: "other" } }), "patient.mode"],
  ["unknown patient field", request({ patient: { mode: "new", fullName: "Ana Paula", phone: "31999990000", relationship: "returning" } }), "patient.relationship"],
  ["short name", request({ patient: { mode: "new", fullName: " A ", phone: "31999990000" } }), "patient.fullName"],
  ["long name", request({ patient: { mode: "new", fullName: "N".repeat(121), phone: "31999990000" } }), "patient.fullName"],
  ["missing phone", request({ patient: { mode: "new", fullName: "Ana Paula" } }), "patient.phone"],
  ["invalid e-mail", request({ patient: { mode: "new", fullName: "Ana Paula", phone: "31999990000", email: "ana@" } }), "patient.email"],
  ["non-string e-mail", request({ patient: { mode: "new", fullName: "Ana Paula", phone: "31999990000", email: 1 } }), "patient.email"],
  ["existing patient path", request({ patient: { mode: "existing", id: "patients/other" } }), "patient.id"],
  ["existing patient extra name", request({ patient: { mode: "existing", id: "p1", fullName: "Forged" } }), "patient.fullName"],
  ["impossible date", request({ date: "2026-02-30" }), "date"],
  ["invalid time", request({ time: "7:00" }), "time"],
  ["zero duration", request({ duration: 0 }), "duration"],
  ["string duration", request({ duration: "50" }), "duration"],
  ["too long duration", request({ duration: 481 }), "duration"],
  ["cross midnight", request({ time: "23:30", duration: 31 }), "duration"],
  ["modality", request({ modality: "phone" }), "modality"],
  ["session type", request({ sessionType: "group" }), "sessionType"],
  ["terminal status", request({ status: "completed" }), "status"],
  ["negative amount", request({ amount: -1 }), "amount"],
  ["fractional amount", request({ amount: 150.5 }), "amount"],
  ["amount above limit", request({ amount: 1_000_001 }), "amount"],
  ["method", request({ method: "card" }), "method"],
  ["http link", request({ meetingLink: "http://meet.example.invalid/a" }), "meetingLink"],
  ["presencial link", request({ modality: "in_person", meetingLink: "https://meet.example.invalid/a" }), "meetingLink"],
  ["long notes", request({ notes: "n".repeat(2001) }), "notes"],
];
for (const [label, value, key] of invalidRequests) {
  test(`creation request rejects ${label}`, () => {
    assert.ok(fieldErrors(value)[key], `Expected field error for ${key}`);
  });
}

test("non-object requests and prototype keys are rejected", () => {
  for (const value of [null, [], "x", 1]) assert.ok(fieldErrors(value).input);
  const hostile = JSON.parse(`{"__proto__": {"admin": true}, "requestId": "${requestId}"}`);
  assert.ok(Object.hasOwn(fieldErrors({ ...request(), ...hostile }), "__proto__"));
});

test("Brazilian phones require a valid area code and subscriber pattern", () => {
  for (const [input, expected] of [
    ["31999990000", "(31) 99999-0000"], ["(11) 3333-4444", "(11) 3333-4444"],
    ["+55 (21) 98765-4321", "(21) 98765-4321"], ["55 61 2345 6789", "(61) 2345-6789"],
  ]) assert.equal(normalizeBrazilPhone(input), expected);
  for (const input of ["", "999990000", "(20) 99999-0000", "(31) 89999-0000", "(31) 9999-0000",
    "(31) 1999-0000", "31 99999-0000 ramal 2", "+1 415 555 0100", "(31) 99999-00000"]) {
    assert.equal(normalizeBrazilPhone(input), undefined, input);
  }
});

test("BRL amounts parse Brazilian notation into integer cents", () => {
  for (const [input, cents] of [
    ["150", 15000], ["150,5", 15050], ["150,50", 15050], ["1.234,56", 123456], ["1.500", 150000],
    ["R$ 99,90", 9990], ["0", 0], ["0,01", 1], ["150.50", 15050],
  ] as const) assert.equal(parseBrlAmountToCents(input), cents, input);
  for (const input of ["", "-10", "10,999", "1,234.56", "abc", "1.23.4", "12,", ","]) {
    assert.equal(parseBrlAmountToCents(input), undefined, input);
  }
});

test("canonical request ignores key order and the request ID but reflects every payload change", () => {
  const value = parsed(request());
  const reordered = parsed(Object.fromEntries(Object.entries(request()).reverse()));
  assert.equal(canonicalCreateAppointmentRequest(value), canonicalCreateAppointmentRequest(reordered));
  assert.equal(canonicalCreateAppointmentRequest(value),
    canonicalCreateAppointmentRequest({ ...value, requestId: "b1d2c3e4-0000-4000-8000-000000000000" }));
  assert.notEqual(canonicalCreateAppointmentRequest(value), canonicalCreateAppointmentRequest({ ...value, time: "10:18" }));
  assert.ok(!canonicalCreateAppointmentRequest(value).includes(requestId));
  assert.equal(normalizePersonName("  Ana \t Paula  "), "Ana Paula");
});
