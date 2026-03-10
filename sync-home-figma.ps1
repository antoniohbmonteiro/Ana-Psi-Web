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
  "src/components/shared",
  "src/components/layout",
  "src/app/(admin)/admin/inicio"
)

foreach ($folder in $folders) {
  New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

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

  --layout-sidebar-width: 256px;
  --layout-content-max: 1600px;
  --layout-page-padding: 32px;
  --layout-grid-gap: 24px;
  --layout-right-column: 400px;
  --layout-today-scroll-height: 460px;

  --radius-card: 12px;
  --radius-soft: 12px;
  --radius-control: 12px;
  --radius-pill: 999px;

  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-card-soft: 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-primary: 0 4px 12px rgba(182, 166, 202, 0.28);

  --font-page-title-size: 30px;
  --font-page-title-line: 36px;
  --font-page-title-weight: 400;

  --font-page-subtitle-size: 16px;
  --font-page-subtitle-line: 24px;
  --font-page-subtitle-weight: 400;

  --font-card-label-size: 14px;
  --font-card-label-line: 20px;
  --font-card-label-weight: 400;

  --font-metric-value-size: 30px;
  --font-metric-value-line: 36px;
  --font-metric-value-weight: 500;

  --font-metric-helper-size: 12px;
  --font-metric-helper-line: 16px;
  --font-metric-helper-weight: 400;

  --font-next-patient-name-size: 18px;
  --font-next-patient-name-line: 28px;
  --font-next-patient-name-weight: 500;

  --font-section-title-size: 18px;
  --font-section-title-line: 28px;
  --font-section-title-weight: 500;

  --font-item-title-size: 16px;
  --font-item-title-line: 24px;
  --font-item-title-weight: 500;

  --font-sidebar-brand-size: 20px;
  --font-sidebar-brand-line: 28px;
  --font-sidebar-brand-weight: 400;

  --font-sidebar-subtitle-size: 14px;
  --font-sidebar-subtitle-line: 20px;
  --font-sidebar-subtitle-weight: 400;

  --font-sidebar-item-size: 14px;
  --font-sidebar-item-line: 20px;
  --font-sidebar-item-weight: 500;

  --font-user-name-size: 14px;
  --font-user-name-line: 20px;
  --font-user-name-weight: 400;

  --font-user-role-size: 12px;
  --font-user-role-line: 16px;
  --font-user-role-weight: 400;
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
  h1, h2, h3, p {
    margin: 0;
  }

  button, input, textarea, select {
    font: inherit;
  }
}

@layer components {
  .app-shell-bg {
    background:
      radial-gradient(circle at top left, rgba(182, 166, 202, 0.18), transparent 22%),
      linear-gradient(180deg, #faf9fc 0%, #f4f2f7 100%);
  }

  .app-card {
    background: var(--card);
    color: var(--card-foreground);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
  }

  .app-card-soft {
    background: var(--accent);
    border: 1px solid var(--border);
    border-radius: var(--radius-soft);
    box-shadow: var(--shadow-card-soft);
  }

  .app-input {
    height: 44px;
    width: 100%;
    border-radius: var(--radius-control);
    border: 1px solid var(--border);
    background: var(--input-background);
    color: var(--foreground);
    padding-inline: 16px;
    outline: none;
    transition: all 160ms ease;
  }

  .app-input::placeholder {
    color: var(--muted-foreground);
  }

  .app-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(182, 166, 202, 0.16);
  }

  .app-label {
    margin-bottom: 8px;
    display: block;
    font-size: 14px;
    line-height: 20px;
    font-weight: 500;
    color: var(--foreground);
  }

  .app-muted {
    color: var(--muted-foreground);
  }

  .text-page-title {
    font-size: var(--font-page-title-size);
    line-height: var(--font-page-title-line);
    font-weight: var(--font-page-title-weight);
    color: var(--foreground);
  }

  .text-page-subtitle {
    font-size: var(--font-page-subtitle-size);
    line-height: var(--font-page-subtitle-line);
    font-weight: var(--font-page-subtitle-weight);
    color: var(--muted-foreground);
  }

  .text-card-label {
    font-size: var(--font-card-label-size);
    line-height: var(--font-card-label-line);
    font-weight: var(--font-card-label-weight);
    color: var(--muted-foreground);
  }

  .text-metric-value {
    font-size: var(--font-metric-value-size);
    line-height: var(--font-metric-value-line);
    font-weight: var(--font-metric-value-weight);
    color: var(--foreground);
  }

  .text-metric-helper {
    font-size: var(--font-metric-helper-size);
    line-height: var(--font-metric-helper-line);
    font-weight: var(--font-metric-helper-weight);
    color: var(--muted-foreground);
  }

  .text-next-patient-name {
    font-size: var(--font-next-patient-name-size);
    line-height: var(--font-next-patient-name-line);
    font-weight: var(--font-next-patient-name-weight);
    color: var(--foreground);
  }

  .text-section-title {
    font-size: var(--font-section-title-size);
    line-height: var(--font-section-title-line);
    font-weight: var(--font-section-title-weight);
    color: var(--foreground);
  }

  .text-item-title {
    font-size: var(--font-item-title-size);
    line-height: var(--font-item-title-line);
    font-weight: var(--font-item-title-weight);
    color: var(--foreground);
  }

  .text-sidebar-brand {
    font-size: var(--font-sidebar-brand-size);
    line-height: var(--font-sidebar-brand-line);
    font-weight: var(--font-sidebar-brand-weight);
    color: var(--primary);
  }

  .text-sidebar-subtitle {
    font-size: var(--font-sidebar-subtitle-size);
    line-height: var(--font-sidebar-subtitle-line);
    font-weight: var(--font-sidebar-subtitle-weight);
    color: var(--muted-foreground);
  }

  .text-sidebar-item {
    font-size: var(--font-sidebar-item-size);
    line-height: var(--font-sidebar-item-line);
    font-weight: var(--font-sidebar-item-weight);
  }

  .text-user-name {
    font-size: var(--font-user-name-size);
    line-height: var(--font-user-name-line);
    font-weight: var(--font-user-name-weight);
    color: var(--foreground);
  }

  .text-user-role {
    font-size: var(--font-user-role-size);
    line-height: var(--font-user-role-line);
    font-weight: var(--font-user-role-weight);
    color: var(--muted-foreground);
  }
}
'@

Write-Utf8File "src/components/layout/sidebar.tsx" @'
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileClock,
  Home,
  ShieldBan,
  Users,
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
      className="hidden h-screen shrink-0 flex-col justify-between border-r bg-white lg:flex"
      style={{ width: "var(--layout-sidebar-width)", borderColor: "var(--border)" }}
    >
      <div>
        <div className="border-b px-6 py-6" style={{ borderColor: "var(--border)" }}>
          <p className="text-sidebar-brand">
            Boaventura Psicologia
          </p>
          <p className="mt-1 text-sidebar-subtitle">Gestão de Consultório</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 transition",
                      active
                        ? "text-white shadow-sm"
                        : "hover:bg-[var(--background)] hover:text-[var(--primary)]"
                    )}
                    style={
                      active
                        ? { backgroundColor: "var(--primary)" }
                        : { color: "var(--foreground)" }
                    }
                  >
                    <Icon size={20} />
                    <span className="text-sidebar-item">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="border-t p-4" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 px-4 py-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--secondary)", color: "var(--primary-dark)" }}
          >
            AP
          </div>
          <div>
            <p className="text-user-name">Ana Paula</p>
            <p className="text-user-role">Psicóloga Clínica</p>
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
      <div
        className="mx-auto flex min-h-screen"
        style={{ maxWidth: "var(--layout-content-max)" }}
      >
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-auto">
          <div
            className="mx-auto"
            style={{
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
'@

Write-Utf8File "src/components/shared/metric-card.tsx" @'
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  title,
  value,
  helper,
  icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  helper?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-card-label">{title}</p>
            <p className="mt-2 text-metric-value">{value}</p>
            {helper ? <p className="mt-1 text-metric-helper">{helper}</p> : null}
          </div>

          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
'@

Write-Utf8File "src/components/shared/next-patient-card.tsx" @'
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function NextPatientCard({
  name,
  time,
  countdown,
}: {
  name: string;
  time: string;
  countdown: string;
}) {
  return (
    <Card
      className="rounded-xl p-0"
      style={{
        background: "linear-gradient(to bottom right, rgba(182,166,202,0.05), transparent)",
        borderColor: "rgba(182,166,202,0.20)",
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-card-label">Próximo Paciente</p>
            <p className="mt-2 text-next-patient-name">{name}</p>

            <div className="mt-2 flex items-center gap-2">
              <Clock size={16} color="var(--primary)" />
              <span className="text-sm app-muted">{time}</span>
              <Badge variant="primary">{countdown}</Badge>
            </div>
          </div>

          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "rgba(182,166,202,0.10)",
              color: "var(--primary)",
            }}
          >
            <Clock size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
'@

Write-Utf8File "src/app/(admin)/admin/inicio/page.tsx" @'
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Play,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { NextPatientCard } from "@/components/shared/next-patient-card";

const todaySessions = [
  { id: 1, time: "09:00", patientName: "Mariana Silva", duration: 60, next: true },
  { id: 2, time: "10:30", patientName: "Carlos Eduardo Santos", duration: 60 },
  { id: 3, time: "14:00", patientName: "Júlia Oliveira", duration: 60 },
  { id: 4, time: "16:00", patientName: "Roberto Almeida", duration: 60 },
];

const alerts = [
  {
    id: 1,
    title: "Cancelamento",
    description: "Fernanda Costa - 15:00 (10/03/2026)",
    icon: <XCircle size={18} color="#ef4444" />,
  },
  {
    id: 2,
    title: "Reagendamento",
    description: "Lucas Mendes - 14:00 → 16:30",
    icon: <AlertCircle size={18} color="#f59e0b" />,
  },
];

const quickActions = [
  "Novo Paciente",
  "Registrar Pagamento",
  "Nova Consulta",
  "Link Agendamento",
];

export default function InicioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title">Boa tarde, Ana</h1>
        <p className="mt-1 text-page-subtitle">
          Você tem 4 sessões hoje e 6 pendências
        </p>
      </div>

      <div
        className="grid grid-cols-1 gap-6 xl:grid-cols-4"
        style={{ gap: "var(--layout-grid-gap)" }}
      >
        <MetricCard
          title="Sessões Hoje"
          value="4"
          helper="240 minutos total"
          icon={<Calendar size={24} />}
          iconBg="rgba(182,166,202,0.10)"
          iconColor="var(--primary)"
        />

        <NextPatientCard
          name="Mariana Silva"
          time="09:00"
          countdown="9h 44m"
        />

        <MetricCard
          title="Pagamentos Pendentes"
          value="4"
          helper="R$ 1060.00"
          icon={<DollarSign size={24} />}
          iconBg="rgba(245,158,11,0.10)"
          iconColor="#f59e0b"
        />

        <MetricCard
          title="Novas Solicitações"
          value="2"
          helper="Agendamentos pendentes"
          icon={<Bell size={24} />}
          iconBg="rgba(59,130,246,0.10)"
          iconColor="#3b82f6"
        />
      </div>

      <div
        className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_400px]"
        style={{ gap: "var(--layout-grid-gap)" }}
      >
        <Card className="rounded-xl">
          <CardContent className="p-6">
            <h2 className="text-section-title mb-4">Agenda de Hoje</h2>

            <div
              className="space-y-3 overflow-auto pr-2"
              style={{ height: "var(--layout-today-scroll-height)" }}
            >
              {todaySessions.map((session) => {
                const isNext = Boolean(session.next);

                return (
                  <div
                    key={session.id}
                    className="cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md"
                    style={
                      isNext
                        ? {
                            backgroundColor: "rgba(182,166,202,0.05)",
                            borderColor: "var(--primary)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                          }
                        : {
                            backgroundColor: "var(--accent)",
                            borderColor: "var(--border)",
                          }
                    }
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <span
                            className="text-item-title"
                            style={{ color: isNext ? "var(--primary)" : "var(--foreground)" }}
                          >
                            {session.time}
                          </span>

                          {isNext ? (
                            <Badge variant="primary">Próxima</Badge>
                          ) : null}
                        </div>

                        <p className="text-item-title">{session.patientName}</p>
                        <p className="mt-1 text-sm app-muted">
                          {session.duration} minutos
                        </p>
                      </div>

                      {isNext ? (
                        <Button
                          className="rounded-xl"
                          size="sm"
                          style={{ backgroundColor: "var(--primary)" }}
                        >
                          <Play size={16} className="mr-2" />
                          Iniciar Sessão
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h2 className="text-section-title mb-4">Alertas Prioritários</h2>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="app-card-soft p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{alert.icon}</div>
                      <div>
                        <p className="text-item-title">{alert.title}</p>
                        <p className="text-sm app-muted">{alert.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardContent className="p-6">
              <h2 className="text-section-title mb-4">Central de Ações</h2>

              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <div
                    key={action}
                    className="app-card-soft flex min-h-[92px] items-center justify-center p-4 text-center"
                  >
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {action}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
'@

Write-Host ""
Write-Host "Home sincronizada com a escala do Dev Mode." -ForegroundColor Green
Write-Host "Agora rode: npm run dev" -ForegroundColor Yellow