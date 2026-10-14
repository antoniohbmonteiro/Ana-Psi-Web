import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth/access.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
