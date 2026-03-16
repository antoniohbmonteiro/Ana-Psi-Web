import { Card, CardContent } from "@/components/ui/card";
import { monthNames, weekdayLabels, toIsoDate, addDays } from "../utils";

type MiniCalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

type Props = {
  currentWeekStart: Date;
  miniCalendarDays: MiniCalendarDay[];
};

export function MiniCalendarCard({
  currentWeekStart,
  miniCalendarDays,
}: Props) {
  return (
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
  );
}