$ErrorActionPreference = "Stop"

function Write-Utf8File {
  param(
    [string]$Path,
    [string]$Content
  )

  $fullPath = if ([System.IO.Path]::IsPathRooted($Path)) {
    $Path
  } else {
    Join-Path (Get-Location).Path $Path
  }

  $dir = Split-Path $fullPath -Parent
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }

  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($fullPath, $Content, $utf8)
}

if (-not (Test-Path "package.json")) {
  throw "Rode este script na raiz do projeto Next."
}

$folders = @(
  "src/app/(admin)/admin/inicio",
  "src/app/(admin)/admin/agenda",
  "src/app/(admin)/admin/agendamentos/[id]",
  "src/app/(admin)/admin/disponibilidade",
  "src/app/(admin)/admin/bloqueios",
  "src/app/(admin)/admin/pre-reservas",
  "src/app/(admin)/admin/pacientes",
  "src/app/(admin)/admin/financeiro",
  "src/app/(public)/agendar",
  "src/app/(public)/resultado-agendamento",
  "src/app/style-guide",
  "src/components/ui",
  "src/components/layout",
  "src/components/shared",
  "src/features/appointments",
  "src/features/availability",
  "src/features/blocks",
  "src/features/booking",
  "src/features/finance",
  "src/features/patients",
  "src/features/reservations",
  "src/lib",
  "src/data/mock"
)

foreach ($folder in $folders) {
  New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

Write-Utf8File "src/lib/cn.ts" @'
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
'@

Write-Utf8File "src/app/globals.css" @'
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");
@import "tailwindcss";

:root {
  --background: #f4f2f7;
  --foreground: #333333;
  --card: #ffffff;
  --card-foreground: #333333;
  --popover: #ffffff;
  --popover-foreground: #333333;
  --primary: #b6a6ca;
  --primary-dark: #9b8ab3;
  --primary-foreground: #ffffff;
  --secondary: #e8e4ed;
  --secondary-foreground: #333333;
  --muted: #f4f2f7;
  --muted-foreground: #6b6b7b;
  --accent: #eae7f0;
  --accent-foreground: #333333;
  --destructive: #e85d75;
  --destructive-foreground: #ffffff;
  --border: #e0dce8;
  --input-background: #fafafe;
  --success: #22c55e;
  --warning: #f59e0b;
  --info: #60a5fa;
  --radius-lg: 18px;
  --radius-xl: 24px;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: "Inter", sans-serif;
}

@layer base {
  h1 {
    @apply text-3xl font-semibold tracking-tight;
  }

  h2 {
    @apply text-2xl font-semibold tracking-tight;
  }

  h3 {
    @apply text-xl font-semibold tracking-tight;
  }

  p {
    @apply leading-7;
  }
}

@layer components {
  .app-shell-bg {
    background:
      radial-gradient(circle at top left, rgba(182, 166, 202, 0.18), transparent 22%),
      linear-gradient(180deg, #faf9fc 0%, #f4f2f7 100%);
  }

  .app-card {
    @apply rounded-[24px] border bg-white;
    border-color: var(--border);
    box-shadow: 0 10px 30px rgba(86, 68, 120, 0.06);
  }

  .app-card-soft {
    @apply rounded-[20px] border;
    border-color: var(--border);
    background: var(--secondary);
  }

  .app-input {
    @apply h-11 w-full rounded-2xl border px-4 text-sm outline-none transition;
    border-color: var(--border);
    background: var(--input-background);
    color: var(--foreground);
  }

  .app-input::placeholder {
    color: var(--muted-foreground);
  }

  .app-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(182, 166, 202, 0.16);
  }

  .app-label {
    @apply mb-2 block text-sm font-medium;
    color: var(--foreground);
  }

  .app-muted {
    color: var(--muted-foreground);
  }
}
'@

Write-Utf8File "src/components/ui/button.tsx" @'
import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "text-white shadow-[0_10px_24px_rgba(182,166,202,0.32)] hover:opacity-95",
  secondary: "hover:opacity-95",
  ghost: "hover:bg-white/60",
  danger: "text-white hover:opacity-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const styleMap: Record<ButtonVariant, React.CSSProperties> = {
  primary: { backgroundColor: "var(--primary)" },
  secondary: {
    backgroundColor: "var(--secondary)",
    color: "var(--foreground)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--foreground)",
  },
  danger: {
    backgroundColor: "var(--destructive)",
  },
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      style={{ ...styleMap[variant], ...style }}
      {...props}
    />
  );
}
'@

Write-Utf8File "src/components/ui/input.tsx" @'
import * as React from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return <input className={cn("app-input", className)} {...props} />;
}
'@

Write-Utf8File "src/components/ui/textarea.tsx" @'
import * as React from "react";
import { cn } from "@/lib/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
        className
      )}
      style={{
        borderColor: "var(--border)",
        background: "var(--input-background)",
        color: "var(--foreground)",
      }}
      {...props}
    />
  );
}
'@

Write-Utf8File "src/components/ui/select.tsx" @'
import * as React from "react";
import { cn } from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn("app-input appearance-none", className)}
      {...props}
    >
      {children}
    </select>
  );
}
'@

Write-Utf8File "src/components/ui/badge.tsx" @'
type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  neutral: {
    backgroundColor: "var(--secondary)",
    color: "var(--muted-foreground)",
  },
  primary: {
    backgroundColor: "rgba(182,166,202,0.22)",
    color: "var(--primary-dark)",
  },
  success: {
    backgroundColor: "rgba(34,197,94,0.12)",
    color: "var(--success)",
  },
  warning: {
    backgroundColor: "rgba(245,158,11,0.14)",
    color: "var(--warning)",
  },
  danger: {
    backgroundColor: "rgba(232,93,117,0.14)",
    color: "var(--destructive)",
  },
  info: {
    backgroundColor: "rgba(96,165,250,0.14)",
    color: "var(--info)",
  },
};

export function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}
'@

Write-Utf8File "src/components/ui/card.tsx" @'
import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("app-card", className)}>{children}</div>;
}

export function CardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
'@

Write-Utf8File "src/components/layout/page-header.tsx" @'
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  primaryActionLabel,
}: {
  title: string;
  description?: string;
  primaryActionLabel?: string;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-[28px] border bg-white/70 px-6 py-6 backdrop-blur md:flex-row md:items-center md:justify-between"
      style={{ borderColor: "var(--border)" }}
    >
      <div>
        <h1>{title}</h1>
        {description ? <p className="mt-2 text-sm app-muted">{description}</p> : null}
      </div>

      {primaryActionLabel ? <Button>{primaryActionLabel}</Button> : null}
    </div>
  );
}
'@

Write-Utf8File "src/components/layout/sidebar.tsx" @'
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileClock,
  Home,
  ShieldBan,
  Users,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/admin/inicio", label: "Visão Geral", icon: Home },
  { href: "/admin/agenda", label: "Agenda Semanal", icon: CalendarDays },
  { href: "/admin/pacientes", label: "Pacientes", icon: Users },
  { href: "/admin/financeiro", label: "Financeiro", icon: CircleDollarSign },
  { href: "/admin/pre-reservas", label: "Pré-reservas", icon: FileClock },
  { href: "/admin/disponibilidade", label: "Disponibilidade", icon: Clock3 },
  { href: "/admin/bloqueios", label: "Bloqueios", icon: ShieldBan },
  { href: "/agendar", label: "Agendamento Online", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-[248px] shrink-0 flex-col justify-between border-r bg-white/70 backdrop-blur lg:flex"
      style={{ borderColor: "var(--border)" }}
    >
      <div>
        <div className="px-5 py-7">
          <p
            className="text-[18px] font-semibold leading-tight"
            style={{ color: "var(--primary)" }}
          >
            Boaventura
            <br />
            Psicologia
          </p>
          <p className="mt-3 text-sm app-muted">Gestão de Consultório</p>
        </div>

        <div
          className="h-px w-full"
          style={{ backgroundColor: "var(--border)" }}
        />

        <nav className="space-y-2 px-4 py-5">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "text-white shadow-[0_10px_24px_rgba(182,166,202,0.22)]"
                    : "hover:text-[var(--foreground)]"
                )}
                style={
                  active
                    ? { backgroundColor: "var(--primary)" }
                    : { color: "var(--foreground)" }
                }
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        <div
          className="h-px w-full"
          style={{ backgroundColor: "var(--border)" }}
        />

        <div className="flex items-center gap-3 px-5 py-6">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-medium"
            style={{ backgroundColor: "var(--secondary)", color: "var(--primary-dark)" }}
          >
            AP
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Ana Paula</p>
            <p className="text-sm app-muted">Psicóloga Clínica</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
'@

Write-Utf8File "src/components/layout/app-shell.tsx" @'
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell-bg min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <Sidebar />
        <main className="flex-1 px-6 py-6">
          <div className="mx-auto max-w-[1536px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
'@

Write-Utf8File "src/components/shared/stat-card.tsx" @'
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  title,
  value,
  helper,
  iconSlot,
}: {
  title: string;
  value: string;
  helper?: string;
  iconSlot?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium app-muted">{title}</p>
            <p className="mt-3 text-[44px] font-medium leading-none tracking-tight">{value}</p>
            {helper ? <p className="mt-3 text-sm app-muted">{helper}</p> : null}
          </div>
          {iconSlot ? <div>{iconSlot}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
'@

Write-Utf8File "src/components/shared/section-card.tsx" @'
import { Card, CardContent } from "@/components/ui/card";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h3>{title}</h3>
          {description ? <p className="mt-1 text-sm app-muted">{description}</p> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
'@

Write-Utf8File "src/app/layout.tsx" @'
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ana Psi",
  description: "Projeto Ana Psi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
'@

Write-Utf8File "src/app/page.tsx" @'
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
'@

Write-Utf8File "src/app/(admin)/admin/layout.tsx" @'
import { AppShell } from "@/components/layout/app-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
'@

Write-Utf8File "src/app/(admin)/admin/inicio/page.tsx" @'
import { Bell, CalendarDays, Clock3, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";

function SoftIcon({
  children,
  color = "var(--primary-dark)",
  background = "var(--secondary)",
}: {
  children: React.ReactNode;
  color?: string;
  background?: string;
}) {
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-2xl"
      style={{ color, backgroundColor: background }}
    >
      {children}
    </div>
  );
}

export default function InicioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Boa tarde, Ana</h1>
        <p className="mt-2 text-[18px] app-muted">Você tem 4 sessões hoje e 6 pendências</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        <StatCard
          title="Sessões Hoje"
          value="4"
          helper="240 minutos total"
          iconSlot={
            <SoftIcon>
              <CalendarDays size={20} />
            </SoftIcon>
          }
        />
        <StatCard
          title="Próximo Paciente"
          value="Mariana Silva"
          helper="09:00"
          iconSlot={
            <SoftIcon>
              <Clock3 size={20} />
            </SoftIcon>
          }
        />
        <StatCard
          title="Pagamentos Pendentes"
          value="4"
          helper="R$ 1060.00"
          iconSlot={
            <SoftIcon
              color="var(--warning)"
              background="rgba(245,158,11,0.12)"
            >
              <DollarSign size={20} />
            </SoftIcon>
          }
        />
        <StatCard
          title="Novas Solicitações"
          value="2"
          helper="Agendamentos pendentes"
          iconSlot={
            <SoftIcon
              color="var(--info)"
              background="rgba(96,165,250,0.12)"
            >
              <Bell size={20} />
            </SoftIcon>
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <Card>
          <CardContent className="space-y-4">
            <h3>Agenda de Hoje</h3>

            <div
              className="rounded-[22px] border bg-white px-5 py-4"
              style={{ borderColor: "var(--primary)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[18px] font-medium"
                      style={{ color: "var(--primary-dark)" }}
                    >
                      09:00
                    </span>
                    <Badge variant="primary">Próxima</Badge>
                  </div>
                  <p className="mt-3 text-[18px] font-medium">Mariana Silva</p>
                  <p className="text-sm app-muted">60 minutos</p>
                </div>

                <Button size="sm">Iniciar Sessão</Button>
              </div>
            </div>

            {[
              { time: "10:30", name: "Carlos Eduardo Santos" },
              { time: "14:00", name: "Júlia Oliveira" },
              { time: "16:00", name: "Roberto Almeida" },
            ].map((item) => (
              <div key={item.time} className="app-card-soft p-5">
                <p className="text-[18px] font-medium">{item.time}</p>
                <p className="mt-3 text-[18px] font-medium">{item.name}</p>
                <p className="text-sm app-muted">60 minutos</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-4">
              <h3>Alertas Prioritários</h3>

              <div className="app-card-soft p-4">
                <p className="font-medium">Cancelamento</p>
                <p className="text-sm app-muted">Fernanda Costa - 15:00 (10/03/2026)</p>
              </div>

              <div className="app-card-soft p-4">
                <p className="font-medium">Reagendamento</p>
                <p className="text-sm app-muted">Lucas Mendes - 14:00 → 16:30</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <h3>Central de Ações</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="app-card-soft flex min-h-[92px] items-center justify-center p-4 text-center text-sm font-medium">
                  Novo Paciente
                </div>
                <div className="app-card-soft flex min-h-[92px] items-center justify-center p-4 text-center text-sm font-medium">
                  Registrar Pagamento
                </div>
                <div className="app-card-soft flex min-h-[92px] items-center justify-center p-4 text-center text-sm font-medium">
                  Nova Consulta
                </div>
                <div className="app-card-soft flex min-h-[92px] items-center justify-center p-4 text-center text-sm font-medium">
                  Link Agendamento
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
'@

Write-Utf8File "src/app/(admin)/admin/agenda/page.tsx" @'
import { Card, CardContent } from "@/components/ui/card";

export default function AgendaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Agenda Semanal</h1>
        <p className="mt-2 text-[18px] app-muted">Base inicial da agenda da terapeuta.</p>
      </div>

      <Card>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-7">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
              <div key={day} className="app-card-soft min-h-[260px] p-4">
                <p className="text-sm font-semibold">{day}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'@

Write-Utf8File "src/app/(admin)/admin/agendamentos/[id]/page.tsx" @'
import { Card, CardContent } from "@/components/ui/card";

export default function AgendamentoDetalhePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Detalhes do Agendamento</h1>
        <p className="mt-2 text-[18px] app-muted">Hub central do atendimento.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardContent className="space-y-4">
            <h3>Resumo do atendimento</h3>
            <div className="app-card-soft p-4">Paciente: Mariana Silva</div>
            <div className="app-card-soft p-4">12/03/2026 · 09:00 às 09:50</div>
            <div className="app-card-soft p-4">Online · Pago</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h3>Pagamento</h3>
            <div className="app-card-soft p-4">Valor: R$ 100,00</div>
            <div className="app-card-soft p-4">PIX</div>
            <div className="app-card-soft p-4">Pago</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'@

Write-Utf8File "src/app/(admin)/admin/disponibilidade/page.tsx" @'
export default function DisponibilidadePage() {
  return (
    <div>
      <h1>Disponibilidade</h1>
      <p className="mt-2 text-[18px] app-muted">Página base em construção.</p>
    </div>
  );
}
'@

Write-Utf8File "src/app/(admin)/admin/bloqueios/page.tsx" @'
export default function BloqueiosPage() {
  return (
    <div>
      <h1>Bloqueios</h1>
      <p className="mt-2 text-[18px] app-muted">Página base em construção.</p>
    </div>
  );
}
'@

Write-Utf8File "src/app/(admin)/admin/pre-reservas/page.tsx" @'
export default function PreReservasPage() {
  return (
    <div>
      <h1>Pré-reservas</h1>
      <p className="mt-2 text-[18px] app-muted">Página base em construção.</p>
    </div>
  );
}
'@

Write-Utf8File "src/app/(admin)/admin/pacientes/page.tsx" @'
export default function PacientesPage() {
  return (
    <div>
      <h1>Pacientes</h1>
      <p className="mt-2 text-[18px] app-muted">Página base em construção.</p>
    </div>
  );
}
'@

Write-Utf8File "src/app/(admin)/admin/financeiro/page.tsx" @'
export default function FinanceiroPage() {
  return (
    <div>
      <h1>Financeiro</h1>
      <p className="mt-2 text-[18px] app-muted">Página base em construção.</p>
    </div>
  );
}
'@

Write-Utf8File "src/app/(public)/agendar/page.tsx" @'
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AgendarPage() {
  return (
    <main className="app-shell-bg min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-4">
            <h1>Agendamento Online</h1>
            <p className="text-sm app-muted">Base pública inicial.</p>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="app-card-soft p-4 text-center">10 mar</div>
              <div className="app-card-soft p-4 text-center">11 mar</div>
              <div className="app-card-soft p-4 text-center">12 mar</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h3>Resumo</h3>
            <div className="app-card-soft p-4">Consulta online · 50 min · R$ 100</div>
            <Button className="w-full">Continuar</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
'@

Write-Utf8File "src/app/(public)/resultado-agendamento/page.tsx" @'
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ResultadoAgendamentoPage() {
  return (
    <main className="app-shell-bg min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="space-y-4">
            <h1>Reserva Temporária Realizada</h1>
            <p className="text-sm app-muted">Complete o pagamento para confirmar sua sessão.</p>
            <div className="app-card-soft p-4">Tempo restante: 29:48</div>
            <div className="app-card-soft p-4">12/03/2026 · 09:00 · Online</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h3>Pagamento</h3>
            <div className="app-card-soft p-4">R$ 100,00 · PIX</div>
            <Button className="w-full">Pagar agora</Button>
            <Button className="w-full" variant="secondary">Copiar código PIX</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
'@

Write-Utf8File "src/app/style-guide/page.tsx" @'
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function StyleGuidePage() {
  return (
    <main className="app-shell-bg min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--primary-dark)" }}>
            Style Guide
          </p>
          <h1 className="mt-3">Base visual inicial</h1>
          <p className="mt-2 text-sm app-muted">
            Primeira camada para aproximar o projeto do Figma.
          </p>
        </div>

        <Card>
          <CardContent className="space-y-4">
            <h3>Botões</h3>
            <div className="flex flex-wrap gap-3">
              <Button>Primário</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h3>Badges</h3>
            <div className="flex flex-wrap gap-3">
              <Badge>Neutro</Badge>
              <Badge variant="primary">Primário</Badge>
              <Badge variant="success">Sucesso</Badge>
              <Badge variant="warning">Aviso</Badge>
              <Badge variant="danger">Erro</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="app-label">Input</label>
              <Input placeholder="Digite aqui" />
            </div>
            <div>
              <label className="app-label">Select</label>
              <Select defaultValue="retorno">
                <option value="retorno">Retorno</option>
                <option value="primeira">Primeira sessão</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="app-label">Textarea</label>
              <Textarea placeholder="Observação administrativa" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h3>Cards suaves</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="app-card-soft p-4">Card suave</div>
              <div className="app-card-soft p-4">Card suave</div>
              <div className="app-card-soft p-4">Card suave</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
'@

Write-Host ""
Write-Host "Foundation reescrita com sucesso." -ForegroundColor Green
Write-Host "Agora rode: npm run dev" -ForegroundColor Yellow