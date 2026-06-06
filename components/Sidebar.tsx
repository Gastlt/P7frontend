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
import SettingsModal from "@/components/SettingsModal";

import { clearSession } from "@/lib/session";
import { fetchCurrentUser } from "@/lib/api";

export default function Sidebar() {
  const [user, setUser] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

    const isAdmin =
    user?.role === "SUPERADMIN" ||
    user?.roleName === "SUPERADMIN" ||
    user?.role?.name === "SUPERADMIN";

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser();
      
      console.log("getUser() devuelve:", userData);


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
          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200"
        }`}
      >
        <Icon
          size={18}
          className={active ? "text-white" : "text-gray-500 dark:text-gray-400"}
        />
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between">
      {/* TOP */}
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-red-500 text-white p-2 rounded-lg">
            <SquareChartGantt size={20} />
          </div>

          <div>
            <h2 className="font-bold text-l text-black dark:text-white leading-tight">
              {user ? `Hola, ${user.name}` : "Cargando..."}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
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

          {isAdmin && (
              <>
                <div className="pt-6 text-sm text-gray-500 dark:text-gray-400">
                  Admin
                </div>

                {link("/admin/groups", "Administrar Grupos", Folder)}
              </>
            )}

          <div className="pt-6 text-sm text-gray-500 dark:text-gray-400">
            Ajustes
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-200 transition-colors"
          >
            <Settings size={18} className="text-gray-500 dark:text-gray-400" />
            Configuración
          </button>
        </nav>
      </div>

      {/* LOGOUT BUTTON */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>
  );
}