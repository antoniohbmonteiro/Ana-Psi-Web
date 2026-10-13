import { addDays, getStartOfWeek, getCivilDateParts } from "../../lib/app-date";
import type { Session, SessionType } from "./types";

export { addDays, getStartOfWeek };
export const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
export const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function buildTimeSlots() {
  const slots: string[] = [];
  for (let hour = 8; hour <= 21; hour += 1) {
    slots.push(`${pad(hour)}:00`);
    if (hour !== 21) slots.push(`${pad(hour)}:30`);
  }
  return slots;
}

export function getWeekLabel(weekStart: string) {
  const start = getCivilDateParts(weekStart);
  const end = getCivilDateParts(addDays(weekStart, 6));
  if (start.month === end.month) {
    return `${start.day} - ${end.day} de ${monthNames[end.month - 1]} de ${end.year}`;
  }
  return `${start.day} de ${monthNames[start.month - 1]} - ${end.day} de ${monthNames[end.month - 1]} de ${end.year}`;
}

export function getMiniCalendarDays(referenceDate: string) {
  const { year, month } = getCivilDateParts(referenceDate);
  const firstDay = `${year}-${pad(month)}-01`;
  const gridStart = getStartOfWeek(firstDay);
  return Array.from({ length: 35 }, (_, index) => {
    const date = addDays(gridStart, index);
    return { date, isCurrentMonth: getCivilDateParts(date).month === month };
  });
}

export function getSessionsForSlot(sessions: Session[], date: string, time: string) {
  return sessions.filter((session) => session.date === date && session.time === time);
}

export function getTodaySessions(sessions: Session[], today: string) {
  return sessions
    .filter((session) => session.date === today && session.type === "appointment")
    .sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
}

export function getSessionCardStyles(type: SessionType) {
  if (type === "blocked") {
    return {
      backgroundColor: "#DCD7E5",
      border: "1px solid #C8C0D6",
      color: "#5E566E",
      backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(94, 86, 110, 0.08) 10px, rgba(94, 86, 110, 0.08) 20px)",
    };
  }
  return {
    backgroundColor: "var(--primary)",
    border: "1px solid var(--primary-dark)",
    color: "white",
  };
}
