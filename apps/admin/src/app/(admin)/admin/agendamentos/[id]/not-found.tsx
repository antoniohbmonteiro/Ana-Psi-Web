import Link from "next/link";

export default function AppointmentNotFound() {
  return <div className="space-y-4">
    <h1 className="text-page-title">Agendamento não encontrado</h1>
    <p className="app-muted">Este agendamento não está disponível.</p>
    <Link href="/admin/agenda" className="text-[var(--primary)]">Voltar à agenda</Link>
  </div>;
}
