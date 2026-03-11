"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type SessionType = "confirmed" | "blocked";

type Session = {
  id: number;
  date: string;
  time: string;
  patientName: string;
  duration: number;
  type: SessionType;
};

const mockSessions: Session[] = [
  {
    id: 1,
    date: "2026-03-09",
    time: "09:00",
    patientName: "Mariana Silva",
    duration: 60,
    type: "confirmed",
  },
  {
    id: 2,
    date: "2026-03-09",
    time: "14:00",
    patientName: "Júlia Oliveira",
    duration: 60,
    type: "confirmed",
  },
  {
    id: 3,
    date: "2026-03-10",
    time: "10:30",
    patientName: "Carlos Eduardo Santos",
    duration: 60,
    type: "confirmed",
  },
  {
    id: 4,
    date: "2026-03-11",
    time: "12:00",
    patientName: "Bloqueio Pessoal",
    duration: 60,
    type: "blocked",
  },
  {
    id: 5,
    date: "2026-03-12",
    time: "16:00",
    patientName: "Roberto Almeida",
    duration: 60,
    type: "confirmed",
  },
  {
    id: 6,
    date: "2026-03-13",
    time: "15:00",
    patientName: "Fernanda Costa",
    duration: 60,
    type: "confirmed",
  },
];

const monthNames = [
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

const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getStartOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function buildTimeSlots() {
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

function getWeekLabel(weekStart: Date) {
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

function getMiniCalendarDays(referenceDate: Date) {
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

function getSessionsForSlot(date: Date, time: string) {
  const isoDate = toIsoDate(date);
  return mockSessions.filter((session) => session.date === isoDate && session.time === time);
}

function getTodaySessions(referenceDate: Date) {
  const isoDate = toIsoDate(referenceDate);

  return mockSessions
    .filter((session) => session.date === isoDate && session.type === "confirmed")
    .sort((a, b) => a.time.localeCompare(b.time));
}

function getSessionCardStyles(type: SessionType) {
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

export default function AgendaPage() {
  const today = useMemo(() => new Date(2026, 2, 9), []);
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(today));

  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, index) => addDays(currentWeekStart, index)),
    [currentWeekStart]
  );

  const timeSlots = useMemo(() => buildTimeSlots(), []);
  const miniCalendarDays = useMemo(() => getMiniCalendarDays(currentWeekStart), [currentWeekStart]);
  const todaysSessions = useMemo(() => getTodaySessions(today), [today]);

  function handlePreviousWeek() {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  }

  function handleNextWeek() {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-page-title">Agenda Semanal</h1>
          <p className="mt-1 text-page-subtitle">
            Gerencie seus atendimentos e disponibilidade
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button className="rounded-xl">
            <Plus size={16} className="mr-2" />
            Novo Agendamento
          </Button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousWeek}
              className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition hover:bg-[var(--accent)]"
              style={{ borderColor: "var(--border)" }}
            >
              <ChevronLeft size={18} />
            </button>

            <div
              className="min-w-[220px] rounded-xl border bg-white px-4 py-2 text-center text-sm font-medium"
              style={{ borderColor: "var(--border)" }}
            >
              {getWeekLabel(currentWeekStart)}
            </div>

            <button
              type="button"
              onClick={handleNextWeek}
              className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition hover:bg-[var(--accent)]"
              style={{ borderColor: "var(--border)" }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_1fr]">
        <div className="space-y-6">
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <h2 className="text-[15px] font-medium leading-5 text-[var(--foreground)]">
                {monthNames[currentWeekStart.getMonth()]} {currentWeekStart.getFullYear()}
              </h2>

              <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
                {weekdayLabels.map((day) => (
                  <div
                    key={day}
                    className="py-1 text-[11px] font-medium app-muted"
                  >
                    {day}
                  </div>
                ))}

                {miniCalendarDays.map(({ date, isCurrentMonth }) => {
                  const isInCurrentWeek =
                    toIsoDate(date) >= toIsoDate(currentWeekStart) &&
                    toIsoDate(date) <= toIsoDate(addDays(currentWeekStart, 6));

                  return (
                    <div
                      key={toIsoDate(date)}
                      className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg text-[12px]"
                      style={
                        isInCurrentWeek
                          ? {
                              backgroundColor: "var(--primary)",
                              color: "white",
                              fontWeight: 500,
                            }
                          : {
                              color: isCurrentMonth
                                ? "var(--foreground)"
                                : "var(--muted-foreground)",
                            }
                      }
                    >
                      {date.getDate()}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 size={16} color="var(--primary-dark)" />
                <h2 className="text-[16px] font-medium leading-6 text-[var(--foreground)]">
                  Atendimentos de Hoje
                </h2>
              </div>

              <div className="space-y-2">
                {todaysSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    className="w-full rounded-xl p-3 text-left transition hover:bg-[rgba(182,166,202,0.12)]"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {session.time}
                    </p>
                    <p className="mt-1 text-sm app-muted">{session.patientName}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden rounded-xl">
          <div className="h-[calc(100vh-170px)] overflow-auto">
            <div className="min-w-[1120px]">
              <div
                className="sticky top-0 z-10 grid border-b bg-[var(--muted)]/80 backdrop-blur"
                style={{
                  gridTemplateColumns: "80px repeat(7, minmax(0, 1fr))",
                  borderColor: "var(--border)",
                }}
              >
                <div className="p-3 text-xs font-medium app-muted">Horário</div>

                {weekDays.map((date) => (
                  <div
                    key={toIsoDate(date)}
                    className="border-l p-3 text-center"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <p className="text-xs font-medium app-muted">
                      {weekdayLabels[(date.getDay() + 6) % 7]}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                      {date.getDate()}
                    </p>
                  </div>
                ))}
              </div>

              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="grid min-h-[80px] border-b"
                  style={{
                    gridTemplateColumns: "80px repeat(7, minmax(0, 1fr))",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="bg-[var(--muted)]/30 p-3 text-xs app-muted">{time}</div>

                  {weekDays.map((date) => {
                    const sessions = getSessionsForSlot(date, time);
                    const hasSession = sessions.length > 0;

                    return (
                      <div
                        key={`${toIsoDate(date)}-${time}`}
                        className="border-l p-2"
                        style={{ borderColor: "var(--border)" }}
                      >
                        {hasSession ? (
                          sessions.map((session) => (
                            <div
                              key={session.id}
                              className="h-full rounded-xl p-3"
                              style={getSessionCardStyles(session.type)}
                            >
                              <p className="text-sm font-medium">{session.patientName}</p>
                              <p className="mt-1 text-xs opacity-90">
                                {session.duration} min
                              </p>
                            </div>
                          ))
                        ) : (
                          <div
                            className="h-full min-h-[60px] rounded-xl border-2 border-dashed transition"
                            style={{ borderColor: "var(--border)" }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}