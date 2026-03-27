import { AlertCircle, CalendarPlus, CreditCard, Link2, UserPlus, XCircle } from "lucide-react";

export const alerts = [
  {
    id: 1,
    title: "Cancelamento",
    description: "Fernanda Costa - 15:00 (10/03/2026)",
    icon: XCircle,
    iconColor: "#ef4444",
  },
  {
    id: 2,
    title: "Reagendamento",
    description: "Lucas Mendes - 14:00 → 16:30",
    icon: AlertCircle,
    iconColor: "#f59e0b",
  },
];

export const quickActions = [
  { label: "Novo Paciente", icon: UserPlus },
  { label: "Registrar Pagamento", icon: CreditCard },
  { label: "Nova Consulta", icon: CalendarPlus },
  { label: "Link Agendamento", icon: Link2 },
];