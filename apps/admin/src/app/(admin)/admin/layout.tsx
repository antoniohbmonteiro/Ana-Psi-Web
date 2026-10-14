import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth/access.server";
import { getAdminConfig } from "@/lib/firebase/config.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const config = getAdminConfig();
  return (
    <AppShell>
      {config.demoAppointments ? (
        <p role="status" className="mb-6 rounded-xl border bg-white p-4 text-sm">
          Demonstração — consultas ainda sem persistência
        </p>
      ) : null}
      {children}
    </AppShell>
  );
}
