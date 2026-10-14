export default function AdminLoading() {
  return <div role="status" aria-live="polite" className="space-y-4">
    <p className="app-muted">Carregando consultas…</p>
    <div aria-hidden="true" className="h-40 animate-pulse rounded-xl bg-[var(--accent)]" />
  </div>;
}
