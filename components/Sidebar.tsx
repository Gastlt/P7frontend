"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Folder,
  CheckSquare,
  Clock,
  BarChart3,
  CheckCircle,
  Settings,
  SquareChartGantt,
  LogOut,
  CalendarRange
} from "lucide-react";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/session";

import { clearSession } from "@/lib/session";

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser();
      setUser(userData);
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/auth/login");
  };

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
        <Icon
          size={18}
          className={active ? "text-white" : "text-gray-500"}
        />
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-white border-r p-4 flex flex-col justify-between">
      {/* TOP */}
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-red-500 text-white p-2 rounded-lg">
            <SquareChartGantt size={20} />
          </div>

          <div>
            <h2 className="font-bold text-l text-black leading-tight">
              {user ? `Hola, ${user.name}` : "Cargando..."}
            </h2>
            <p className="text-sm text-gray-600">
              {user?.email || "Usuario"}
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {link("/", "Dashboard", LayoutDashboard)}
          {link("/tasks", "Mis Tareas", CheckSquare)}
          {link("/groups", "Mis Grupos", Folder)}
          {link("/sprints", "Sprints", CalendarRange)}
          {link("/alltasks", "Todas las Tareas", CheckSquare)}

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
      </div>

      {/* LOGOUT BUTTON */}
      <div className="pt-6 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
