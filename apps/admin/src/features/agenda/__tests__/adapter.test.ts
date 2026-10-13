import test from "node:test";
import assert from "node:assert/strict";
import { createMockAppointments } from "../../appointments/mock";
import { toAppointmentSessions } from "../adapter";
import { blockedSessions } from "../mock";
import { buildTimeSlots, getMiniCalendarDays, getSessionsForSlot, getTodaySessions, getWeekLabel, getStartOfWeek, getSessionCardStyles } from "../utils";
import type { AppointmentStatus } from "../../appointments/types";

const now = new Date("2026-10-13T18:20:00Z");
const today = "2026-10-13";

test("adapter derives each session and detail identity from the same appointment", () => {
  const appointments = createMockAppointments(now);
  const sessions = toAppointmentSessions(appointments);
  assert.equal(sessions.length, appointments.length);
  appointments.forEach((appointment, index) => {
    const session = sessions[index];
    assert.equal(session.type, "appointment");
    assert.equal(session.appointmentId, appointment.id);
    assert.equal(session.id, `session-${appointment.id}`);
    assert.equal(session.status, appointment.status);
    assert.equal(session.date, appointment.date);
    assert.equal(session.time, appointment.time);
    assert.equal(session.duration, appointment.duration);
    assert.equal(session.patientName, appointment.patient.fullName);
  });
  assert.deepEqual(toAppointmentSessions([]), []);
});

test("adapter preserves all statuses without inventing confirmations", () => {
  const base = createMockAppointments(now)[0];
  const statuses: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
  const sessions = toAppointmentSessions(statuses.map((status) => ({ ...base, id: status, status })));
  assert.deepEqual(sessions.map((session) => session.status), statuses);
});

test("today lists every appointment status, excludes blocks, and sorts without mutating input", () => {
  const base = createMockAppointments(now)[0];
  const statuses: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
  const sessions = toAppointmentSessions(statuses.map((status, index) => ({
    ...base, id: status, date: today, time: `${String(17 - index).padStart(2, "0")}:00`, status,
  })));
  const block = { ...blockedSessions[0], date: today, time: "15:00" };
  const tomorrow = toAppointmentSessions([{ ...base, id: "tomorrow", date: "2026-10-14" }])[0];
  const all = [...sessions, block, tomorrow];
  const original = all.map((session) => session.id);
  const result = getTodaySessions(all, today);
  assert.equal(result.length, 5);
  assert.deepEqual(result.map((session) => session.status), [...statuses].reverse());
  assert.deepEqual(all.map((session) => session.id), original);
  assert.deepEqual(getSessionsForSlot(all, today, "15:00").map((session) => session.id), ["session-completed", "block-001"]);
  assert.equal(block.appointmentId, undefined);
  assert.equal(block.status, undefined);
});

test("calendar uses civil weeks/months while preserving 35 days and 30-minute slots", () => {
  assert.equal(getWeekLabel(getStartOfWeek(today)), "12 - 18 de Outubro de 2026");
  assert.equal(getWeekLabel("2026-12-28"), "28 de Dezembro - 3 de Janeiro de 2027");
  const days = getMiniCalendarDays("2026-10-13");
  assert.equal(days.length, 35);
  assert.equal(days[0].date, "2026-09-28");
  assert.equal(days.at(-1)?.date, "2026-11-01");
  assert.equal(days[0].isCurrentMonth, false);
  assert.equal(days[3].isCurrentMonth, true);
  const slots = buildTimeSlots();
  assert.equal(slots.length, 27);
  assert.equal(slots[0], "08:00");
  assert.equal(slots[1], "08:30");
  assert.equal(slots.at(-1), "21:00");
  assert.ok(!slots.includes("08:15"));
  assert.equal(getSessionCardStyles("appointment").backgroundColor, "var(--primary)");
  assert.equal(getSessionCardStyles("blocked").backgroundColor, "#DCD7E5");
});
