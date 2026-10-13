export const APP_TIME_ZONE = "America/Sao_Paulo";

const appClock = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hourCycle: "h23",
});

export function getAppDateTime(now: Date) {
  const parts = Object.fromEntries(
    appClock.formatToParts(now).map(({ type, value }) => [type, value])
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}.${String(now.getUTCMilliseconds()).padStart(3, "0")}`,
  };
}

export function getAppTodayIso(now: Date) {
  return getAppDateTime(now).date;
}

// UTC Date objects below carry calendar dates, not appointment instants.
export function getCivilDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const carrier = new Date(Date.UTC(year, month - 1, day));
  return { year, month, day, weekday: carrier.getUTCDay() };
}

export function addDays(date: string, days: number) {
  const { year, month, day } = getCivilDateParts(date);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function getStartOfWeek(date: string) {
  const { weekday } = getCivilDateParts(date);
  return addDays(date, weekday === 0 ? -6 : 1 - weekday);
}
