import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Session } from "../types";
import {
  getSessionsForSlot,
  getSessionCardStyles,
  toIsoDate,
  weekdayLabels,
} from "../utils";

type Props = {
  weekDays: Date[];
  timeSlots: string[];
  sessions: Session[];
};

export function WeeklyCalendarGrid({
  weekDays,
  timeSlots,
  sessions,
}: Props) {
  return (
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
              <div className="bg-[var(--muted)]/30 p-3 text-xs app-muted">
                {time}
              </div>

              {weekDays.map((date) => {
                const slotSessions = getSessionsForSlot(sessions, date, time);
                const hasSession = slotSessions.length > 0;

                return (
                  <div
                    key={`${toIsoDate(date)}-${time}`}
                    className="border-l p-2"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {hasSession ? (
                      slotSessions.map((session) => {
                        const content = (
                          <>
                            <p className="text-sm font-medium">{session.patientName}</p>
                            <p className="mt-1 text-xs opacity-90">
                              {session.duration} min
                            </p>
                          </>
                        );

                        if (session.type === "blocked" || !session.appointmentId) {
                          return (
                            <div
                              key={session.id}
                              className="h-full rounded-xl p-3"
                              style={getSessionCardStyles(session.type)}
                            >
                              {content}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={session.id}
                            href={`/admin/agendamentos/${session.appointmentId}`}
                            className="block h-full rounded-xl p-3 transition hover:opacity-95"
                            style={getSessionCardStyles(session.type)}
                          >
                            {content}
                          </Link>
                        );
                      })
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
  );
}