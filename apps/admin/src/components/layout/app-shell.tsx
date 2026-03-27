import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell-bg min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-auto">
          <div
            className="mx-auto"
            style={{
              maxWidth: "var(--layout-content-max)",
              padding: "var(--layout-page-padding)",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}