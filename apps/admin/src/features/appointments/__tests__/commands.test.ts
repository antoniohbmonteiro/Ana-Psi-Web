import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cancelAppointment, completeAppointment, confirmAppointment, createAppointment,
  editAppointment, markAppointmentNoShow, rescheduleAppointment,
} from "../commands";
import { createMockAppointments } from "../mock";
import { createAppointmentsRepository } from "../repository";
import { createAppointmentsService } from "../service";
import { toAppointmentDetailPresentation } from "../presentation";
import { toAppointmentSessions } from "../../agenda/adapter";
import { isValidCivilDate, isValidCivilTime } from "../validation";
import type {
  Appointment, AppointmentCommandContext, AppointmentCommandResult, AppointmentErrorCode,
  AppointmentStatus, CreateAppointmentInput, PaymentStatus,
} from "../types";

const now = new Date("2026-10-13T10:00:00.000Z"); // 07:00 São Paulo.
const context = { now, actorId: "test-admin" };
const createContext = { ...context, id: "new-appointment" };
function fixture(overrides: Partial<Appointment> = {}): Appointment {
  return { ...createMockAppointments(now)[1], ...overrides };
}
function input(overrides: Partial<CreateAppointmentInput> = {}): CreateAppointmentInput {
  return {
    patient: { id: "test-patient", fullName: "Paciente de Teste", relationship: "new" },
    date: "2026-10-13", time: "09:17", duration: 50,
    modality: "online", sessionType: "initial", amount: 10000, method: "pix",
    ...overrides,
  };
}
function success(result: AppointmentCommandResult) {
  assert.ok(result.ok, JSON.stringify(result));
  return result.appointment;
}
function failure(result: AppointmentCommandResult, code: AppointmentErrorCode) {
  assert.equal(result.ok, false);
  if (result.ok) throw new Error("Expected command failure");
  assert.equal(result.error.code, code);
  return result.error;
}
function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}
function operation(appointment: Appointment) {
  return { id: appointment.id, expectedVersion: appointment.version };
}

test("creation produces an identified snapshot, pending payment and one UTC audit event", () => {
  const value = freezeDeep(input({ amount: 0 }));
  const appointment = success(createAppointment(value, freezeDeep([]), freezeDeep({ ...createContext, now: new Date(now) })));
  assert.equal(appointment.id, createContext.id);
  assert.equal(appointment.version, 1);
  assert.equal(appointment.status, "confirmed");
  assert.deepEqual(appointment.payment, { amount: 0, method: "pix", status: "pending" });
  assert.equal(appointment.patient.id, value.patient.id);
  assert.equal(appointment.activityTimeline.length, 1);
  const event = appointment.activityTimeline[0];
  assert.equal(event.id, 1);
  assert.equal(event.type, "created");
  assert.equal(event.actorId, context.actorId);
  assert.equal(event.occurredAt, now.toISOString());
  assert.equal(event.details?.initial?.patientId, value.patient.id);
  assert.equal(event.details?.initial?.status, "confirmed");
  assert.deepEqual(event.details?.initial?.schedule, { date: value.date, time: value.time, duration: value.duration });
  assert.deepEqual(event.details?.initial?.payment, appointment.payment);
  appointment.patient.fullName = "Other";
  appointment.payment.amount = 1;
  assert.equal(value.patient.fullName, "Paciente de Teste");
  assert.equal(event.details?.initial?.payment.amount, 0);
  const presentation = toAppointmentDetailPresentation(appointment);
  assert.equal(presentation.patient.phone, "Não informado");
  assert.equal(presentation.patient.email, "Não informado");
  assert.equal(success(createAppointment(input({ status: "pending", modality: "in_person" }), [], createContext)).status, "pending");
});

const invalidCreates: [string, unknown][] = [
  ["null", null], ["array", []], ["empty", {}],
  ["unknown field", { ...input(), payment: { status: "paid" } }],
  ["missing patient", { ...input(), patient: null }],
  ["patient ID", input({ patient: { id: " ", fullName: "Test", relationship: "new" } })],
  ["patient name", input({ patient: { id: "test", fullName: " ", relationship: "new" } })],
  ["patient field", { ...input(), patient: { ...input().patient, secret: true } }],
  ["patient enum", { ...input(), patient: { ...input().patient, relationship: "unknown" } }],
  ["patient contact", { ...input(), patient: { ...input().patient, phone: 123 } }],
  ["date format", input({ date: "13/10/2026" })],
  ["nonexistent date", input({ date: "2026-02-29" })],
  ["invalid day", input({ date: "2026-04-31" })],
  ["invalid month", input({ date: "2026-13-01" })],
  ["24:00", input({ time: "24:00" })], ["invalid minute", input({ time: "09:60" })],
  ["missing zero", input({ time: "9:00" })],
  ["zero duration", input({ duration: 0 })], ["negative duration", input({ duration: -1 })],
  ["fractional duration", input({ duration: 1.5 })], ["cross midnight", input({ time: "23:30", duration: 31 })],
  ["negative amount", input({ amount: -1 })], ["fractional amount", input({ amount: 1.5 })],
  ["unsafe amount", input({ amount: Number.MAX_SAFE_INTEGER + 1 })], ["NaN amount", input({ amount: NaN })],
  ["amount string", { ...input(), amount: "10000" }],
  ["modality", { ...input(), modality: "unknown" }], ["session type", { ...input(), sessionType: "unknown" }],
  ["method", { ...input(), method: "unknown" }], ["initial terminal", { ...input(), status: "completed" }],
  ["http link", input({ meetingLink: "http://example.invalid/session" })],
  ["invalid link", input({ meetingLink: "broken" })],
  ["presencial link", input({ modality: "in_person", meetingLink: "https://example.invalid/session" })],
  ["invalid notes", { ...input(), notes: 123 }],
  ["long patient ID", input({ patient: { id: "p".repeat(129), fullName: "Test", relationship: "new" } })],
  ["long patient name", input({ patient: { id: "test", fullName: "N".repeat(121), relationship: "new" } })],
  ["long phone", input({ patient: { id: "test", fullName: "Test", phone: "9".repeat(41), relationship: "new" } })],
  ["long e-mail", input({ patient: { id: "test", fullName: "Test", email: `${"e".repeat(250)}@x.io`, relationship: "new" } })],
  ["long notes", input({ notes: "n".repeat(2001) })],
  ["long link", input({ meetingLink: `https://example.invalid/${"l".repeat(480)}` })],
];
for (const [label, value] of invalidCreates) {
  test(`creation rejects ${label} at runtime with field errors`, () => {
    const error = failure(createAppointment(freezeDeep(value), [], createContext), "VALIDATION_ERROR");
    assert.ok(error.fieldErrors && Object.keys(error.fieldErrors).length > 0);
  });
}

test("text limits accept their exact bounds and also bound edits and cancellation reasons", () => {
  success(createAppointment(input({
    patient: { id: "p".repeat(128), fullName: "N".repeat(120), phone: "9".repeat(40), email: "e".repeat(254), relationship: "new" },
    notes: "n".repeat(2000), meetingLink: `https://example.invalid/${"l".repeat(476)}`,
  }), [], createContext));
  const appointment = fixture();
  const edit = failure(editAppointment({ ...operation(appointment), changes: { notes: "n".repeat(2001) } }, [appointment], context), "VALIDATION_ERROR");
  assert.ok(edit.fieldErrors?.["changes.notes"]);
  const cancel = failure(cancelAppointment({ ...operation(appointment), reason: "r".repeat(501) }, [appointment], context), "VALIDATION_ERROR");
  assert.ok(cancel.fieldErrors?.reason);
});

test("civil date validation handles leap years and rejects normalization of impossible dates", () => {
  assert.equal(isValidCivilDate("2028-02-29"), true);
  assert.equal(isValidCivilDate("0099-12-31"), true);
  for (const date of ["0000-01-01", "2026-00-10", "2026-01-00", "2026-02-30", "2026-2-01"]) assert.equal(isValidCivilDate(date), false);
  for (const time of ["23:59", "00:00", "08:17"]) assert.equal(isValidCivilTime(time), true);
  assert.equal(success(createAppointment(input({ date: "2028-02-29" }), [], createContext)).date, "2028-02-29");
});

test("unknown JSON keys are rejected even when they match Object prototype property names", () => {
  const hostile = JSON.parse('{"__proto__": "unexpected"}');
  const errors = [
    failure(createAppointment({ ...input(), ...hostile }, [], createContext), "VALIDATION_ERROR"),
    failure(createAppointment({ ...input(), patient: { ...input().patient, ...hostile } }, [], createContext), "VALIDATION_ERROR"),
    failure(editAppointment({ ...operation(fixture()), changes: hostile }, [fixture()], context), "VALIDATION_ERROR"),
  ];
  assert.ok(Object.hasOwn(errors[0].fieldErrors!, "__proto__"));
  assert.ok(Object.hasOwn(errors[1].fieldErrors!, "patient.__proto__"));
  assert.ok(Object.hasOwn(errors[2].fieldErrors!, "changes.__proto__"));
});

test("creation checks exact start, duplicate IDs, interval conflicts and invalid command context", () => {
  const value = input({ time: "07:00" });
  failure(createAppointment(value, [], createContext), "INVALID_OPERATION_TIME");
  failure(createAppointment(input({ time: "06:59" }), [], createContext), "INVALID_OPERATION_TIME");
  success(createAppointment(value, [], { ...createContext, now: new Date(now.getTime() - 1) }));
  failure(createAppointment(input(), [fixture({ id: createContext.id })], createContext), "DUPLICATE_ID");
  failure(createAppointment(input(), [fixture()], createContext), "SCHEDULE_CONFLICT");
  success(createAppointment(input(), [fixture({ status: "cancelled" })], createContext));
  failure(createAppointment(input(), [], { ...createContext, now: new Date(NaN) }), "VALIDATION_ERROR");
  failure(createAppointment(input(), [], { ...createContext, actorId: " " }), "VALIDATION_ERROR");
  failure(createAppointment(input(), [], { ...createContext, id: " " }), "VALIDATION_ERROR");
});

const transitionCommands = { confirmed: confirmAppointment, cancelled: cancelAppointment, completed: completeAppointment, no_show: markAppointmentNoShow };
const statuses: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
const validTransitions: Record<AppointmentStatus, readonly string[]> = {
  pending: ["confirmed", "cancelled", "no_show"], confirmed: ["cancelled", "completed", "no_show"],
  completed: [], cancelled: [], no_show: [],
};
for (const status of statuses) {
  for (const [target, command] of Object.entries(transitionCommands)) {
    test(`status ${status} → ${target} follows the transition matrix`, () => {
      const appointment = freezeDeep(fixture({ status }));
      const before = structuredClone(appointment);
      const result = command(operation(appointment), freezeDeep([appointment]), { ...context, now: new Date("2026-10-13T13:00:00Z") });
      if (validTransitions[status].includes(target)) {
        const updated = success(result);
        assert.equal(updated.status, target);
        assert.equal(updated.version, appointment.version + 1);
        assert.deepEqual(updated.payment, appointment.payment);
        assert.equal(updated.activityTimeline.length, appointment.activityTimeline.length + 1);
        assert.deepEqual(updated.activityTimeline.at(-1)?.details?.status, { before: status, after: target });
      } else failure(result, "INVALID_TRANSITION");
      assert.deepEqual(appointment, before);
    });
  }
}

test("completion and absence require the end, including exact midnight across year boundaries", () => {
  for (const command of [completeAppointment, markAppointmentNoShow]) {
    const appointment = fixture();
    const end = new Date("2026-10-13T12:50:00Z");
    failure(command(operation(appointment), [appointment], { ...context, now: new Date(end.getTime() - 1) }), "INVALID_OPERATION_TIME");
    success(command(operation(appointment), [appointment], { ...context, now: end }));
    const midnight = fixture({ date: "2026-12-31", time: "23:30", duration: 30 });
    failure(command(operation(midnight), [midnight], { ...context, now: new Date("2027-01-01T02:59:59.999Z") }), "INVALID_OPERATION_TIME");
    success(command(operation(midnight), [midnight], { ...context, now: new Date("2027-01-01T03:00:00Z") }));
  }
  success(createAppointment(input({ time: "23:30", duration: 30 }), [], createContext));
});

test("late confirmation allows completion; cancellation preserves every payment state and reason", () => {
  const lateContext = { ...context, now: new Date("2026-10-13T13:00:00Z") };
  const pending = fixture({ status: "pending" });
  const confirmed = success(confirmAppointment(operation(pending), [pending], lateContext));
  success(completeAppointment(operation(confirmed), [confirmed], lateContext));
  for (const status of ["pending", "paid", "refunded"] satisfies PaymentStatus[]) {
    const appointment = freezeDeep(fixture({ payment: { amount: 10000, method: "pix", status, ...(status === "pending" ? {} : { paidAt: "2026-10-12T12:00:00.000Z" }) } }));
    const cancelled = success(cancelAppointment({ ...operation(appointment), reason: "Solicitação do paciente" }, [appointment], lateContext));
    assert.deepEqual(cancelled.payment, appointment.payment);
    assert.equal(cancelled.activityTimeline.at(-1)?.details?.reason, "Solicitação do paciente");
    failure(cancelAppointment(operation(cancelled), [cancelled], lateContext), "INVALID_TRANSITION");
  }
});

test("rescheduling preserves identity, status, patient and payment and records both schedules", () => {
  const appointment = freezeDeep(fixture({ meetingLink: "https://example.invalid/session" }));
  const changed = success(rescheduleAppointment({ ...operation(appointment), date: "2026-10-14", time: "10:17", duration: 45 }, [appointment], context));
  assert.equal(changed.id, appointment.id);
  assert.equal(changed.version, 2);
  assert.equal(changed.status, appointment.status);
  assert.deepEqual(changed.patient, appointment.patient);
  assert.deepEqual(changed.payment, appointment.payment);
  assert.equal(changed.meetingLink, appointment.meetingLink);
  assert.deepEqual(changed.activityTimeline.at(-1)?.details?.schedule, {
    before: { date: appointment.date, time: appointment.time, duration: appointment.duration },
    after: { date: "2026-10-14", time: "10:17", duration: 45 },
  });
  const extended = success(rescheduleAppointment({ ...operation(appointment), date: appointment.date, time: appointment.time, duration: 60 }, [appointment], context));
  assert.equal(extended.duration, 60); // Own original interval does not conflict.
  const other = fixture({ id: "other", time: "09:50" });
  failure(rescheduleAppointment({ ...operation(appointment), date: appointment.date, time: appointment.time, duration: 60 }, [appointment, other], context), "SCHEDULE_CONFLICT");
  failure(rescheduleAppointment({ ...operation(appointment), date: appointment.date, time: appointment.time, duration: appointment.duration }, [appointment], context), "NO_CHANGES");
  failure(rescheduleAppointment({ ...operation(appointment), date: appointment.date, time: "07:00", duration: 30 }, [appointment], context), "INVALID_OPERATION_TIME");
  failure(rescheduleAppointment({ ...operation(appointment), date: appointment.date, time: "23:30", duration: 31 }, [appointment], context), "VALIDATION_ERROR");
});

test("editing records administrative changes, clears presencial link and avoids duplicating notes", () => {
  const appointment = freezeDeep(fixture({ modality: "online", meetingLink: "https://example.invalid/session", notes: "Old private note" }));
  const changed = success(editAppointment({ ...operation(appointment), changes: { modality: "in_person", sessionType: "initial", notes: "New private note", amount: 20000, method: "cash" } }, [appointment], context));
  assert.equal(changed.meetingLink, undefined);
  assert.equal(changed.date, appointment.date);
  assert.equal(changed.time, appointment.time);
  assert.equal(changed.duration, appointment.duration);
  assert.equal(changed.patient.id, appointment.patient.id);
  assert.equal(changed.payment.amount, 20000);
  assert.equal(changed.payment.status, "pending");
  const event = changed.activityTimeline.at(-1)!;
  assert.equal(event.type, "edited");
  assert.equal(event.id, appointment.activityTimeline[0].id + 1);
  assert.deepEqual(event.details?.fields, ["modality", "sessionType", "meetingLink", "amount", "method", "notes"]);
  assert.ok(!JSON.stringify(event).includes("private note"));
  assert.ok(event.details?.changes?.some((change) => change.field === "meetingLink" && change.after === null));
  const cleared = success(editAppointment({ ...operation(appointment), changes: { notes: null, meetingLink: null } }, [appointment], context));
  assert.equal(cleared.notes, undefined);
  assert.equal(cleared.meetingLink, undefined);
  for (const status of ["paid", "refunded"] satisfies PaymentStatus[]) {
    const paid = fixture({ payment: { ...appointment.payment, status, paidAt: "2026-10-12T12:00:00.000Z" } });
    failure(editAppointment({ ...operation(paid), changes: { amount: 1 } }, [paid], context), "INVALID_TRANSITION");
    failure(editAppointment({ ...operation(paid), changes: { method: "cash" } }, [paid], context), "INVALID_TRANSITION");
    assert.deepEqual(success(editAppointment({ ...operation(paid), changes: { notes: "Administrative note" } }, [paid], context)).payment, paid.payment);
  }
});

test("editing rejects unknown fields, invalid values, presencial links and no-op updates", () => {
  const appointment = fixture();
  for (const changes of [{ patient: {} }, { date: "2026-10-14" }, { status: "completed" }, { duration: 90 }, { payment: {} }, { modality: "bad" }, { amount: -1 }, { method: "bad" }, { meetingLink: "javascript:alert(1)" }, { notes: 123 }, null]) {
    failure(editAppointment({ ...operation(appointment), changes }, [appointment], context), "VALIDATION_ERROR");
  }
  failure(editAppointment({ ...operation(appointment), changes: { meetingLink: "https://example.invalid/session" } }, [appointment], context), "VALIDATION_ERROR");
  for (const changes of [{}, { modality: appointment.modality }, { notes: appointment.notes }, { amount: appointment.payment.amount, method: appointment.payment.method }]) {
    failure(editAppointment({ ...operation(appointment), changes }, [appointment], context), "NO_CHANGES");
  }
  const online = fixture({ modality: "online" });
  assert.equal(success(editAppointment({ ...operation(online), changes: { meetingLink: "https://example.invalid/session" } }, [online], context)).meetingLink, "https://example.invalid/session");
});

test("editing and rescheduling reject terminal records and appointments already starting", () => {
  for (const status of ["completed", "cancelled", "no_show"] satisfies AppointmentStatus[]) {
    const appointment = fixture({ status });
    failure(editAppointment({ ...operation(appointment), changes: { notes: "Test" } }, [appointment], context), "INVALID_TRANSITION");
    failure(rescheduleAppointment({ ...operation(appointment), date: "2026-10-14", time: "09:00", duration: 50 }, [appointment], context), "INVALID_TRANSITION");
  }
  for (const clock of ["2026-10-13T12:00:00Z", "2026-10-13T12:00:00.001Z"]) {
    const appointment = fixture();
    const atStart = { ...context, now: new Date(clock) };
    failure(editAppointment({ ...operation(appointment), changes: { notes: "Test" } }, [appointment], atStart), "INVALID_OPERATION_TIME");
    failure(rescheduleAppointment({ ...operation(appointment), date: "2026-10-14", time: "09:00", duration: 50 }, [appointment], atStart), "INVALID_OPERATION_TIME");
  }
});

test("every existing-record command rejects missing records, stale versions and malformed input without mutation", () => {
  const appointment = freezeDeep(fixture({ status: "pending" }));
  const before = structuredClone(appointment);
  const commands = [
    (base: object, ctx: AppointmentCommandContext) => editAppointment({ ...base, changes: { notes: "Test" } }, [appointment], ctx),
    (base: object, ctx: AppointmentCommandContext) => rescheduleAppointment({ ...base, date: "2026-10-14", time: "10:00", duration: 50 }, [appointment], ctx),
    ...Object.values(transitionCommands).map((command) => (base: object, ctx: AppointmentCommandContext) => command(base, [appointment], ctx)),
  ];
  for (const command of commands) {
    failure(command({ id: "missing", expectedVersion: 1 }, context), "NOT_FOUND");
    failure(command({ id: appointment.id, expectedVersion: 2 }, context), "VERSION_CONFLICT");
    failure(command({ id: appointment.id, expectedVersion: 0 }, context), "VALIDATION_ERROR");
    failure(command({ ...operation(appointment), unknown: true }, context), "VALIDATION_ERROR");
    failure(command(operation(appointment), { ...context, actorId: "" }), "VALIDATION_ERROR");
    assert.deepEqual(appointment, before);
  }
});

test("successful commands detach nested patient, payment and previous history from input snapshots", () => {
  const appointment = freezeDeep(fixture({ status: "pending" }));
  const before = structuredClone(appointment);
  const changed = success(confirmAppointment(operation(appointment), freezeDeep([appointment]), context));
  changed.patient.fullName = "Changed";
  changed.payment.amount = 1;
  changed.activityTimeline[0].description = "Changed";
  assert.deepEqual(appointment, before);
  const edited = success(editAppointment({ ...operation(changed), changes: { notes: "Test" } }, freezeDeep([changed]), context));
  edited.activityTimeline[1].details!.status!.before = "cancelled";
  assert.equal(changed.activityTimeline[1].details?.status?.before, "pending");
});

test("query, agenda and detail views consistently reflect command snapshots without adding repository writes", async () => {
  const created = success(createAppointment(input({ status: "pending" }), [], createContext));
  const serviceFor = (data: Appointment[]) => createAppointmentsService(createAppointmentsRepository(data));
  assert.equal((await serviceFor([created]).getPendingAppointmentsCount()), 1);
  assert.equal((await serviceFor([created]).getNextAppointment(now)), null);
  const confirmed = success(confirmAppointment(operation(created), [created], context));
  assert.equal((await serviceFor([confirmed]).getNextAppointment(now))?.id, created.id);
  const rescheduled = success(rescheduleAppointment({ ...operation(confirmed), date: "2026-10-14", time: "10:17", duration: 60 }, [confirmed], context));
  const service = serviceFor([rescheduled]);
  assert.equal((await service.getAppointmentsByDate("2026-10-13")).length, 0);
  assert.equal((await service.getTotalDurationByDate("2026-10-14")), 60);
  assert.equal((await service.getPendingAppointmentsCount()), 0);
  assert.equal((await service.getPendingPaymentsCount()), 1);
  const session = toAppointmentSessions((await service.getAllAppointments()))[0];
  assert.equal(session.appointmentId, rescheduled.id);
  assert.equal(session.time, "10:17");
  const detail = toAppointmentDetailPresentation((await service.getAppointmentById(rescheduled.id))!);
  assert.equal(detail.summary.timeLabel, "10:17 às 11:17");
  assert.equal(detail.activityTimeline.length, 3);
  const cancelled = success(cancelAppointment(operation(rescheduled), [rescheduled], context));
  assert.equal((await serviceFor([cancelled]).getNextAppointment(now)), null);
  assert.equal((await serviceFor([cancelled]).getPendingPaymentsCount()), 1);
  assert.equal((await serviceFor([cancelled]).getAppointmentsByDate("2026-10-14")).length, 1);
  assert.equal(toAppointmentSessions([cancelled])[0].status, "cancelled");
  const afterEnd = { ...context, now: new Date("2026-10-14T15:00:00Z") };
  for (const command of [completeAppointment, markAppointmentNoShow]) {
    const finished = success(command(operation(rescheduled), [rescheduled], afterEnd));
    assert.equal((await serviceFor([finished]).getNextAppointment(now)), null);
    assert.equal((await serviceFor([finished]).getTotalDurationByDate("2026-10-14")), 60);
    assert.equal((await serviceFor([finished]).getPendingPaymentsCount()), 1);
    assert.equal(toAppointmentSessions([finished])[0].status, finished.status);
    assert.equal(toAppointmentDetailPresentation(finished).activityTimeline.length, 4);
  }
});

test("commands, history and conflicts ignore process timezone near the São Paulo day boundary", () => {
  const commandPath = require.resolve("../commands");
  const script = `
    const commands = require(${JSON.stringify(commandPath)});
    const context = { now: new Date("2026-10-14T01:20:30.123Z"), actorId: "test-admin", id: "test" };
    const input = ${JSON.stringify(input({ time: "23:30", duration: 30 }))};
    const created = commands.createAppointment(input, [], context);
    if (!created.ok) throw Error(JSON.stringify(created));
    const end = commands.completeAppointment({ id: "test", expectedVersion: 1 }, [created.appointment], { ...context, now: new Date("2026-10-14T03:00:00Z") });
    const conflict = commands.createAppointment(input, [created.appointment], { ...context, id: "other" });
    console.log(JSON.stringify({ created, end, conflict }));
  `;
  const outputs = ["UTC", "America/Sao_Paulo", "Asia/Tokyo"].map((timezone) => {
    const result = spawnSync(process.execPath, ["-e", script], { env: { ...process.env, TZ: timezone }, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  });
  assert.deepEqual(outputs[0], outputs[1]);
  assert.deepEqual(outputs[0], outputs[2]);
  assert.equal(outputs[0].end.appointment.status, "completed");
  assert.equal(outputs[0].conflict.error.code, "SCHEDULE_CONFLICT");
});
