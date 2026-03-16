import Link from "next/link";
import { Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Session } from "../types";

type Props = {
  sessions: Session[];
};

export function TodayAppointmentsCard({ sessions }: Props) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <Clock3 size={16} color="var(--primary-dark)" />
          <h2 className="text-[16px] font-medium leading-6 text-[var(--foreground)]">
            Atendimentos de Hoje
          </h2>
        </div>

        <div className="space-y-2">
          {sessions.map((session) => {
            const content = (
              <>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {session.time}
                </p>
                <p className="mt-1 text-sm app-muted">{session.patientName}</p>
              </>
            );

            if (!session.appointmentId) {
              return (
                <div
                  key={session.id}
                  className="w-full rounded-xl p-3"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={session.id}
                href={`/admin/agendamentos/${session.appointmentId}`}
                className="block w-full rounded-xl p-3 text-left transition hover:bg-[rgba(182,166,202,0.12)]"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}