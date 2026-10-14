import { requireAdmin } from "@/lib/auth/access.server";

export default async function FinanceiroPage() {
  await requireAdmin();
  return (
    <div>
      <h1>Financeiro</h1>
      <p className="mt-2 text-[18px] app-muted">Página base em construção.</p>
    </div>
  );
}
