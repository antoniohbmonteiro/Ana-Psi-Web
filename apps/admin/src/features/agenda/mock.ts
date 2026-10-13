import type { Session } from "./types";

export const blockedSessions: Session[] = [
  {
    id: "block-001",
    date: "2026-03-11",
    time: "12:00",
    patientName: "Bloqueio Pessoal",
    duration: 60,
    type: "blocked",
  },
];
