import { requireAdmin } from "@/lib/auth/access.server";

export default async function PreReservasPage() {
  await requireAdmin();
  return (
    <div>
      <h1>Pré-reservas</h1>
      <p className="mt-2 text-[18px] app-muted">Página base em construção.</p>
    </div>
  );
}
