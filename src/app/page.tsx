import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="app-shell-bg flex min-h-screen items-center justify-center px-6">
      <div className="app-card w-full max-w-3xl p-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--primary-dark)" }}>
          Ana Psi
        </p>
        <h1 className="mt-4">Base inicial pronta</h1>
        <p className="mt-4 text-base app-muted">
          Fundação limpa para começar a implementar o produto com fidelidade ao Figma.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/admin/inicio">
            <Button>Ir para o painel</Button>
          </Link>
          <Link href="/style-guide">
            <Button variant="secondary">Ver style guide</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}