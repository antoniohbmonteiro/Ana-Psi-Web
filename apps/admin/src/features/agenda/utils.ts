import type { Session, SessionType } from "./types";

export const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getStartOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function buildTimeSlots() {
  const slots: string[] = [];
  const startHour = 8;
  const endHour = 21;

  for (let hour = startHour; hour <= endHour; hour += 1) {
    slots.push(`${pad(hour)}:00`);
    if (hour !== endHour) {
      slots.push(`${pad(hour)}:30`);
    }
  }

  return slots;
}

export function getWeekLabel(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6);
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const startMonth = monthNames[weekStart.getMonth()];
  const endMonth = monthNames[weekEnd.getMonth()];
  const endYear = weekEnd.getFullYear();

  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${startDay} - ${endDay} de ${endMonth} de ${endYear}`;
  }

  return `${startDay} de ${startMonth} - ${endDay} de ${endMonth} de ${endYear}`;
}

export function getMiniCalendarDays(referenceDate: Date) {
  const firstDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const firstWeekday = firstDay.getDay();
  const mondayOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;

  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 35 }).map((_, index) => {
    const date = addDays(gridStart, index);

    return {
      date,
      isCurrentMonth: date.getMonth() === referenceDate.getMonth(),
    };
  });
}

export function getSessionsForSlot(
  sessions: Session[],
  date: Date,
  time: string
) {
  const isoDate = toIsoDate(date);
  return sessions.filter((session) => session.date === isoDate && session.time === time);
}

export function getTodaySessions(sessions: Session[], referenceDate: Date) {
  const isoDate = toIsoDate(referenceDate);

  return sessions
    .filter((session) => session.date === isoDate && session.type === "confirmed")
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function getSessionCardStyles(type: SessionType) {
  if (type === "blocked") {
    return {
      backgroundColor: "#DCD7E5",
      border: "1px solid #C8C0D6",
      color: "#5E566E",
      backgroundImage:
        "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(94, 86, 110, 0.08) 10px, rgba(94, 86, 110, 0.08) 20px)",
    };
  }

  return {
    backgroundColor: "var(--primary)",
    border: "1px solid var(--primary-dark)",
    color: "white",
  };
}