"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Folder,
  CheckSquare,
  Clock,
  BarChart3,
  CheckCircle,
  Settings,
  SquareChartGantt
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const link = (href: string, label: string, Icon: LucideIcon) => {
    const active = pathname === href;

    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
        ${active 
          ? "bg-red-500 text-white" 
          : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        <Icon size={18}
        className={active ? "text-white" : "text-gray-500"} />
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-white border-r p-4">
        <div className="mb-8 flex items-center gap-3">
        <div className="bg-red-500 text-white p-2 rounded-lg">
            <SquareChartGantt size={20} />
        </div>

        <div>
            <h2 className="font-bold text-l text-black leading-tight">
            Dashboard de Gestión
            </h2>
            <p className="text-sm text-gray-600">
            Super Admin
            </p>
        </div>
        </div>

      <nav className="space-y-2">
        {link("/", "Dashboard", LayoutDashboard)}
        {link("/groups", "Grupos", Folder)}
        {link("/tasks", "Todas las Tareas", CheckSquare)}

        <div className="pt-6 text-sm text-gray-500">
          Acceso Rápido
        </div>

        {link("/backlog", "Backlog", Clock)}
        {link("/in-progress", "En Progreso", BarChart3)}
        {link("/completed", "Completadas", CheckCircle)}

        <div className="pt-6 text-sm text-gray-500">
          Ajustes
        </div>

        {link("/settings", "Configuración", Settings)}
      </nav>
    </aside>
  );
}
