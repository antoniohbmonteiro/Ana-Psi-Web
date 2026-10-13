import { Card, CardContent } from "@/components/ui/card";
import { monthNames, weekdayLabels, addDays } from "../utils";
import { getCivilDateParts } from "@/lib/app-date";

type MiniCalendarDay = {
  date: string;
  isCurrentMonth: boolean;
};

type Props = {
  currentWeekStart: string;
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
          {monthNames[getCivilDateParts(currentWeekStart).month - 1]} {getCivilDateParts(currentWeekStart).year}
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
              date >= currentWeekStart && date <= addDays(currentWeekStart, 6);

            return (
              <div
                key={date}
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
                {getCivilDateParts(date).day}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
