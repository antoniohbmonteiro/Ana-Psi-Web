"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockSessions } from "@/features/agenda/mock";
import { MiniCalendarCard } from "@/features/agenda/components/mini-calendar-card";
import { TodayAppointmentsCard } from "@/features/agenda/components/today-appointments-card";
import { WeeklyCalendarGrid } from "@/features/agenda/components/weekly-calendar-grid";
import {
  addDays,
  buildTimeSlots,
  getMiniCalendarDays,
  getStartOfWeek,
  getTodaySessions,
  getWeekLabel,
} from "@/features/agenda/utils";
import { getAppTodayDate } from "@/lib/app-date";

export default function AgendaPage() {
const today = useMemo(() => getAppTodayDate(), []);
const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(today));

  const weekDays = useMemo(
    () => Array.from({ length: 7 }).map((_, index) => addDays(currentWeekStart, index)),
    [currentWeekStart]
  );

  const timeSlots = useMemo(() => buildTimeSlots(), []);
  const miniCalendarDays = useMemo(
    () => getMiniCalendarDays(currentWeekStart),
    [currentWeekStart]
  );
  const todaysSessions = useMemo(
    () => getTodaySessions(mockSessions, today),
    [today]
  );

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
          <MiniCalendarCard
            currentWeekStart={currentWeekStart}
            miniCalendarDays={miniCalendarDays}
          />

          <TodayAppointmentsCard sessions={todaysSessions} />
        </div>

        <WeeklyCalendarGrid
          weekDays={weekDays}
          timeSlots={timeSlots}
          sessions={mockSessions}
        />
      </div>
    </div>
  );
}