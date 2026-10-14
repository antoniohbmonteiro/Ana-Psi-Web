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

export function buildTimeSlots(sessions: readonly Session[] = []) {
  const starts = sessions.map((session) => {
    const [hour, minute] = session.time.split(":").map(Number);
    return hour * 60 + minute;
  });
  const first = Math.floor(Math.min(480, ...starts) / 30) * 30;
  const last = Math.min(1439, Math.ceil(Math.max(1260, ...starts) / 30) * 30);
  const minutes = new Set(starts);
  for (let minute = first; minute <= last; minute += 30) minutes.add(minute);
  return [...minutes].sort((a, b) => a - b).map((minute) => `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`);
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
