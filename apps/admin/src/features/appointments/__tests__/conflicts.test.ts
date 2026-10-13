import test from "node:test";
import assert from "node:assert/strict";
import { appointmentsOverlap, findAppointmentConflicts } from "../conflicts";
import { createMockAppointments } from "../mock";
import type { Appointment, AppointmentSchedule, AppointmentStatus } from "../types";

const now = new Date("2026-10-13T10:00:00.000Z");
const schedule: AppointmentSchedule = { date: "2026-10-13", time: "09:00", duration: 50 };

test("intervals detect equal starts, partial overlap and containment in both directions", () => {
  for (const candidate of [
    { ...schedule }, { ...schedule, time: "09:30" },
    { ...schedule, time: "08:45", duration: 30 },
    { ...schedule, time: "09:10", duration: 10 },
    { ...schedule, time: "08:30", duration: 120 },
  ]) {
    assert.equal(appointmentsOverlap(schedule, candidate), true);
    assert.equal(appointmentsOverlap(candidate, schedule), true);
  }
});

test("adjacent intervals, separate dates and the midnight boundary do not overlap", () => {
  for (const candidate of [
    { ...schedule, time: "09:50" },
    { ...schedule, time: "08:10" },
    { ...schedule, date: "2026-10-14" },
  ]) assert.equal(appointmentsOverlap(schedule, candidate), false);
  assert.equal(appointmentsOverlap(
    { date: "2026-10-13", time: "23:30", duration: 30 },
    { date: "2026-10-14", time: "00:00", duration: 50 },
  ), false);
});

test("every non-cancelled status occupies time regardless of modality; own ID is excluded", () => {
  const base = createMockAppointments(now)[1];
  const statuses: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
  const appointments: Appointment[] = statuses.map((status, index) => ({
    ...base, ...schedule, id: status, status, modality: index % 2 ? "online" : "in_person",
  }));
  const before = structuredClone(appointments);
  Object.freeze(appointments);
  assert.deepEqual(findAppointmentConflicts(schedule, appointments).map((item) => item.id), ["pending", "confirmed", "completed", "no_show"]);
  assert.deepEqual(findAppointmentConflicts(schedule, appointments, "pending").map((item) => item.id), ["confirmed", "completed", "no_show"]);
  assert.deepEqual(findAppointmentConflicts(schedule, []), []);
  assert.deepEqual(appointments, before);
});

test("minute-level intervals detect conflicts that the 30-minute calendar slots cannot show", () => {
  assert.equal(appointmentsOverlap(
    { ...schedule, time: "08:17", duration: 50 },
    { ...schedule, time: "09:00", duration: 30 },
  ), true);
});
