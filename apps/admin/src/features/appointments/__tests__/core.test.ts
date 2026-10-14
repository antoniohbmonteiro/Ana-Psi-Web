import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { addDays, getAppDateTime, getAppTodayIso, getStartOfWeek } from "../../../lib/app-date";
import { createMockAppointments } from "../mock";
import { createAppointmentsRepository } from "../repository";
import { createAppointmentsService } from "../service";
import {
  formatActivityInstant, formatAmount, formatAppointmentDate, formatAppointmentTime,
  getAppointmentStatusPresentation, getPaymentStatusPresentation,
  getNextAppointmentDayLabel, toAppointmentDetailPresentation,
} from "../presentation";
import type { Appointment, AppointmentStatus } from "../types";

const referenceNow = new Date("2026-10-13T18:20:00.000Z"); // 15:20 in São Paulo.
const today = "2026-10-13";

function fixture(overrides: Partial<Appointment> = {}): Appointment {
  return { ...createMockAppointments(referenceNow)[1], id: "fixture", time: "17:00", ...overrides };
}
function serviceFor(data: Appointment[]) {
  return createAppointmentsService(createAppointmentsRepository(data));
}

test("next appointment uses current time, not the first appointment of today", async () => {
  const service = createAppointmentsService(createAppointmentsRepository(createMockAppointments(referenceNow)));
  assert.equal((await service.getNextAppointment(referenceNow))?.id, "apt-004");
  assert.equal((await service.getNextAppointment(new Date("2026-10-13T11:00:00Z")))?.id, "apt-002");
  assert.equal((await service.getNextAppointment(new Date("2026-10-13T20:00:00Z")))?.id, "apt-006");
  assert.equal((await service.getNextAppointment(new Date("2026-10-13T23:00:00Z")))?.id, "apt-006");
});

test("only future confirmed starts qualify, including seconds and milliseconds", async () => {
  const data: Appointment[] = [
    fixture({ id: "yesterday", date: addDays(today, -1) }),
    fixture({ id: "in-progress", time: "15:00", duration: 120 }),
    fixture({ id: "exact", time: "15:20" }),
    ...(["pending", "completed", "cancelled", "no_show"] as AppointmentStatus[])
      .map((status) => fixture({ id: status, time: "15:30", status })),
    fixture({ id: "future", time: "17:00" }),
  ];
  const service = serviceFor(data);
  assert.equal((await service.getNextAppointment(referenceNow))?.id, "future");
  assert.equal((await serviceFor([fixture({ time: "15:20" })]).getNextAppointment(referenceNow)), null);
  assert.equal((await serviceFor([fixture({ time: "15:20" })])
    .getNextAppointment(new Date("2026-10-13T18:19:59.999Z")))?.id, "fixture");
  assert.equal((await serviceFor([fixture({ time: "15:20" })])
    .getNextAppointment(new Date("2026-10-13T18:20:00.001Z"))), null);
});

test("next appointment supports presencial and pending payment without extra filters", async () => {
  const candidate = fixture({ modality: "in_person" });
  assert.equal(candidate.payment.status, "pending");
  assert.equal((await serviceFor([candidate]).getNextAppointment(referenceNow))?.id, candidate.id);
});

test("next appointment sorts unsorted input by date, time and then id", async () => {
  const data = [
    fixture({ id: "tomorrow", date: addDays(today, 1), time: "08:00" }),
    fixture({ id: "later", time: "18:00" }),
    fixture({ id: "b" }),
    fixture({ id: "a" }),
  ];
  assert.equal((await serviceFor(data).getNextAppointment(referenceNow))?.id, "a");
  assert.equal((await serviceFor([]).getNextAppointment(referenceNow)), null);
});

test("repository preserves order and returns independent arrays without mutating its input", async () => {
  const data = [fixture({ id: "b" }), fixture({ id: "tomorrow", date: addDays(today, 1) }), fixture({ id: "a" })];
  const originalIds = data.map((item) => item.id);
  const repo = createAppointmentsRepository(data);
  assert.deepEqual((await repo.getAllAppointments()).map((item) => item.id), ["a", "b", "tomorrow"]);
  assert.deepEqual(data.map((item) => item.id), originalIds);
  (await repo.getAllAppointments()).pop();
  (await repo.getAppointmentsByDate(today)).reverse().pop();
  assert.deepEqual((await repo.getAppointmentsByDate(today)).map((item) => item.id), ["a", "b"]);
  assert.equal((await repo.getAppointmentById("a"))?.id, "a");
  assert.equal((await repo.getAppointmentById("missing")), undefined);
});

test("counts use domain status globally and duration includes every status on its date", async () => {
  const statuses: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "no_show"];
  const data = statuses.map((status, index) => fixture({
    id: status, status, duration: 20 + index,
    payment: { amount: 10000, method: "pix", status: index % 2 === 0 ? "pending" : "paid" },
  }));
  data.push(fixture({
    id: "future-pending", date: addDays(today, 5), status: "pending",
    payment: { amount: 10000, method: "cash", status: "refunded" },
  }));
  const service = serviceFor(data);
  assert.equal((await service.getPendingPaymentsCount()), 3);
  assert.equal((await service.getPendingAppointmentsCount()), 2);
  assert.equal((await service.getTotalDurationByDate(today)), 110);
  assert.equal((await service.getTotalDurationByDate("2026-01-01")), 0);
});

test("civil today follows São Paulo even when UTC is already tomorrow", () => {
  const now = new Date("2026-10-14T01:20:30.123Z");
  assert.deepEqual(getAppDateTime(now), { date: today, time: "22:20:30.123" });
  assert.equal(getAppTodayIso(new Date("2026-10-14T02:59:59.999Z")), today);
  assert.deepEqual(getAppDateTime(new Date("2026-10-14T03:00:00Z")), { date: "2026-10-14", time: "00:00:00.000" });
});

test("civil calendar arithmetic handles month, year, leap day and Monday/Sunday", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2028-02-28", 1), "2028-02-29");
  assert.equal(getStartOfWeek("2027-01-03"), "2026-12-28");
  assert.equal(getStartOfWeek("2026-10-12"), "2026-10-12");
});

test("mocks are deterministic throughout a business day and shift only at its boundary", () => {
  const morning = createMockAppointments(new Date("2026-10-13T03:00:00Z"));
  assert.deepEqual(morning, createMockAppointments(new Date("2026-10-14T02:59:59.999Z")));
  const tomorrow = createMockAppointments(new Date("2026-10-14T03:00:00Z"));
  for (let index = 0; index < morning.length; index++) {
    assert.equal(tomorrow[index].id, morning[index].id);
    assert.equal(tomorrow[index].date, addDays(morning[index].date, 1));
    assert.equal(tomorrow[index].activityTimeline[0].occurredAt,
      new Date(Date.parse(morning[index].activityTimeline[0].occurredAt) + 86400000).toISOString());
  }
  assert.deepEqual(morning.map((item) => [item.id, item.date, item.time, item.status, item.modality, item.payment.status]), [
    ["apt-001", "2026-10-12", "09:00", "completed", "online", "paid"],
    ["apt-002", today, "09:00", "confirmed", "in_person", "pending"],
    ["apt-003", today, "14:00", "confirmed", "online", "paid"],
    ["apt-004", today, "17:00", "confirmed", "in_person", "paid"],
    ["apt-005", "2026-10-14", "10:30", "pending", "online", "pending"],
    ["apt-006", "2026-10-14", "14:00", "confirmed", "online", "paid"],
    ["apt-007", "2026-10-15", "10:30", "cancelled", "in_person", "refunded"],
  ]);
});

test("a service retains one dataset even if queried after midnight", async () => {
  const service = createAppointmentsService(createAppointmentsRepository(createMockAppointments(referenceNow)));
  const original = (await service.getAllAppointments());
  const nextDay = new Date("2026-10-14T03:00:00Z");
  (await service.getNextAppointment(nextDay));
  assert.deepEqual((await service.getAllAppointments()), original);
  assert.notDeepEqual((await createAppointmentsService(createAppointmentsRepository(createMockAppointments(nextDay))).getAllAppointments()), original);
});

test("mock events are UTC instants with ordered history and coherent payment/completion", () => {
  for (const item of createMockAppointments(referenceNow)) {
    assert.equal(item.version, 1);
    assert.ok(item.patient.id.startsWith("mock-patient-"));
    let previous = -Infinity;
    for (const event of item.activityTimeline) {
      assert.ok(event.type);
      assert.equal(event.actorId, "mock-admin");
      assert.equal(new Date(event.occurredAt).toISOString(), event.occurredAt);
      const instant = Date.parse(event.occurredAt);
      assert.ok(instant >= previous);
      previous = instant;
    }
    const created = getAppDateTime(new Date(item.activityTimeline[0].occurredAt));
    assert.ok(`${created.date}T${created.time}` < `${item.date}T${item.time}:00.000`);
    if (item.payment.status === "pending") {
      assert.equal(item.payment.paidAt, undefined);
    } else {
      assert.ok(item.payment.paidAt);
      assert.equal(new Date(item.payment.paidAt).toISOString(), item.payment.paidAt);
      assert.ok(Date.parse(item.payment.paidAt) <= previous);
    }
    if (item.status === "completed") {
      const ended = getAppDateTime(new Date(item.activityTimeline.at(-1)!.occurredAt));
      assert.equal(ended.date, item.date);
      assert.ok(ended.time.slice(0, 5) > formatAppointmentTime(item.time, item.duration).split(" às ")[1]);
    }
  }
});

test("all appointment/payment labels and variants derive from domain status", () => {
  assert.deepEqual(
    (["pending", "confirmed", "completed", "cancelled", "no_show"] as AppointmentStatus[])
      .map(getAppointmentStatusPresentation),
    [
      { label: "Pendente", variant: "warning" },
      { label: "Confirmado", variant: "success" },
      { label: "Concluído", variant: "info" },
      { label: "Cancelado", variant: "danger" },
      { label: "Não compareceu", variant: "neutral" },
    ]
  );
  assert.deepEqual(getPaymentStatusPresentation("pending"), { label: "Pendente", variant: "warning" });
  assert.deepEqual(getPaymentStatusPresentation("paid"), { label: "Pago", variant: "success" });
  assert.deepEqual(getPaymentStatusPresentation("refunded"), { label: "Reembolsado", variant: "neutral" });
});

test("presentation keeps civil dates, BRL cents and calculated time intervals", () => {
  assert.equal(formatAppointmentDate("2026-10-13"), "13 de outubro de 2026");
  assert.equal(formatAppointmentTime("09:00", 50), "09:00 às 09:50");
  assert.equal(formatAppointmentTime("23:30", 90), "23:30 às 01:00");
  assert.match(formatAmount(12000), /^R\$\s120,00$/);
  const view = toAppointmentDetailPresentation(createMockAppointments(referenceNow)[0]);
  assert.equal(view.summary.patientName, view.patient.fullName);
  assert.equal(view.summary.appointmentStatusLabel, "Concluído");
  assert.equal(view.summary.modalityLabel, "Online");
  assert.equal(view.summary.sessionTypeLabel, "Retorno");
  assert.equal(view.patient.typeLabel, "Paciente recorrente");
  assert.equal(view.payment.methodLabel, "PIX");
  assert.equal(view.payment.statusLabel, view.summary.paymentStatusLabel);
  assert.equal(view.payment.paidAtLabel, "11/10/2026 às 09:12");
  const initial = toAppointmentDetailPresentation(createMockAppointments(referenceNow)[2]);
  assert.equal(initial.summary.sessionTypeLabel, "Primeira Sessão");
  assert.equal(initial.patient.typeLabel, "Primeira consulta");
  const pending = toAppointmentDetailPresentation(createMockAppointments(referenceNow)[1]);
  assert.equal(pending.summary.modalityLabel, "Presencial");
  assert.equal(pending.payment.methodLabel, "Link de pagamento");
  assert.equal(pending.payment.paidAtLabel, undefined);
});

test("UTC event formatting converts to São Paulo, including the previous date", () => {
  assert.equal(formatActivityInstant("2026-10-14T01:20:00.000Z"), "13/10/2026 · 22:20");
  assert.equal(formatActivityInstant("2026-10-14T03:00:00.000Z", " às "), "14/10/2026 às 00:00");
});

test("next-day presentation handles today, tomorrow, other dates and empty result", () => {
  assert.equal(getNextAppointmentDayLabel(fixture(), referenceNow), "Hoje");
  assert.equal(getNextAppointmentDayLabel(fixture({ date: addDays(today, 1) }), referenceNow), "Amanhã");
  assert.equal(getNextAppointmentDayLabel(fixture({ date: "2027-01-01" }), referenceNow), "01/01/2027");
  assert.equal(getNextAppointmentDayLabel(null, referenceNow), "Sem sessões");
});

test("business dates, mocks, selection, presentation and calendar ignore the process timezone", () => {
  const modules = {
    dates: require.resolve("../../../lib/app-date"),
    mock: require.resolve("../mock"),
    service: require.resolve("../service"),
    repository: require.resolve("../repository"),
    presentation: require.resolve("../presentation"),
    agenda: require.resolve("../../agenda/utils"),
  };
  const script = `
    const paths = ${JSON.stringify(modules)};
    const dates = require(paths.dates);
    const mock = require(paths.mock);
    const service = require(paths.service);
    const presentation = require(paths.presentation);
    const agenda = require(paths.agenda);
    const now = new Date("2026-10-14T01:20:30.123Z");
    const appointments = mock.createMockAppointments(now);
    (async () => { console.log(JSON.stringify({
      current: dates.getAppDateTime(now),
      appointments,
      next: (await service.createAppointmentsService(require(paths.repository).createAppointmentsRepository(appointments)).getNextAppointment(now)).id,
      event: presentation.formatActivityInstant("2026-10-14T01:20:00.000Z"),
      detail: presentation.toAppointmentDetailPresentation(appointments[0]),
      week: agenda.getWeekLabel(dates.getStartOfWeek(dates.getAppTodayIso(now))),
      mini: agenda.getMiniCalendarDays(dates.getAppTodayIso(now))
    })); })().catch((error) => { console.error(error); process.exitCode = 1; });
  `;
  const outputs = ["UTC", "America/Sao_Paulo", "Asia/Tokyo"].map((timezone) => {
    const result = spawnSync(process.execPath, ["-e", script], {
      env: { ...process.env, TZ: timezone }, encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  });
  assert.deepEqual(outputs[0], outputs[1]);
  assert.deepEqual(outputs[0], outputs[2]);
  assert.deepEqual(outputs[0].current, { date: today, time: "22:20:30.123" });
  assert.equal(outputs[0].next, "apt-006");
  assert.equal(outputs[0].event, "13/10/2026 · 22:20");
});
