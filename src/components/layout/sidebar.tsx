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