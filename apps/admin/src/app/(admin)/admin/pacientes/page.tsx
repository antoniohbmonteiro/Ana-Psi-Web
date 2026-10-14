import { requireAdmin } from "@/lib/auth/access.server";

export default async function PacientesPage() {
  await requireAdmin();
  return (
    <div>
      <h1>Pacientes</h1>
      <p className="mt-2 text-[18px] app-muted">Página base em construção.</p>
    </div>
  );
}
