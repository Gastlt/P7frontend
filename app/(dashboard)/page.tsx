"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  TrendingUp,
  Users,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";

import {
  fetchCompletedTasksByUserSprintGroup,
  fetchEstimatedHoursByUserSprintGroup,
  fetchGroups,
  fetchSprints,
  type CompletedTasksKpi,
  type EstimatedHoursKpi,
  type Group,
  type Sprint,
} from "./dashboardData";
import { useTheme } from "@/lib/theme-context";
import { getUser } from "@/lib/session";

import {
    fetchMyGroupMembers,
    fetchTaskGroups,
} from "@/lib/groupsData";

const CHART_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#3b82f6", // blue
  "#22c55e", // green
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#eab308", // yellow
  "#6366f1", // indigo
  "#64748b", // slate
];

function getUserColor(index: number) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>();
  const [kpiData, setKpiData] = useState<CompletedTasksKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | undefined>();
  const [hoursData, setHoursData] = useState<EstimatedHoursKpi[]>([]);

  useEffect(() => {
  async function loadGroups() {
    try {
      setLoading(true);

      const [allGroups, myMemberships] = await Promise.all([
        fetchTaskGroups(),
        fetchMyGroupMembers(),
      ]);

      const myGroupIds = new Set(
        myMemberships
          .map((member) => member.groupId ?? member.group?.id)
          .filter((id): id is number => typeof id === "number")
      );

      const visibleGroups = allGroups.filter((group) =>
        myGroupIds.has(group.id)
      );

      const mappedGroups = visibleGroups.map((group) => ({
        id: group.id,
        name: group.name,
      }));

      setGroups(mappedGroups);

      if (mappedGroups.length === 0) {
        setSelectedGroupId(undefined);
        setSelectedSprintId(undefined);
        setSprints([]);
        setKpiData([]);
        setHoursData([]);
        setLoading(false);
        return;
      }

      setSelectedGroupId(mappedGroups[0].id);
    } catch (error) {
      console.error("Error loading groups:", error);

      setGroups([]);
      setSprints([]);
      setSelectedGroupId(undefined);
      setSelectedSprintId(undefined);
      setKpiData([]);
      setHoursData([]);
    } finally {
      setLoading(false);
    }
  }

  loadGroups();
}, []);

useEffect(() => {
  async function loadKpis() {
    if (!selectedGroupId) {
      setKpiData([]);
      setHoursData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [tasksResult, hoursResult] = await Promise.all([
        fetchCompletedTasksByUserSprintGroup(selectedGroupId, selectedSprintId),
        fetchEstimatedHoursByUserSprintGroup(selectedGroupId, selectedSprintId),
      ]);

      setKpiData(tasksResult);
      setHoursData(hoursResult);
    } catch (error) {
      console.error("Error loading KPIs:", error);
      setKpiData([]);
      setHoursData([]);
    } finally {
      setLoading(false);
    }
  }

  loadKpis();
}, [selectedGroupId, selectedSprintId]);

useEffect(() => {
  async function loadSprints() {
    try {
      if (groups.length === 0) {
        setSprints([]);
        return;
      }

      const data = await fetchSprints();

      const visibleGroupIds = new Set(groups.map((group) => group.id));

      const visibleSprints = data.filter((sprint) => {
        const sprintGroupId = sprint.groupId ?? sprint.group?.id;
        return sprintGroupId != null && visibleGroupIds.has(sprintGroupId);
      });

      setSprints(visibleSprints);
    } catch (error) {
      console.error("Error loading sprints:", error);
      setSprints([]);
    }
  }

  loadSprints();
}, [groups]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const totalCompletedTasks = useMemo(() => {
    return kpiData.reduce((sum, item) => sum + item.completedTasks, 0);
  }, [kpiData]);

  const totalUsers = useMemo(() => {
    return new Set(kpiData.map((item) => item.userId)).size;
  }, [kpiData]);

  const totalSprints = useMemo(() => {
    return new Set(kpiData.map((item) => item.sprintId)).size;
  }, [kpiData]);

  const velocity = useMemo(() => {
    if (totalSprints === 0) return 0;
    return Math.round((totalCompletedTasks / totalSprints) * 10) / 10;
  }, [totalCompletedTasks, totalSprints]);

  const chartData = useMemo(() => {
    const sprintMap = new Map<string, Record<string, string | number>>();

    kpiData.forEach((item) => {
      const sprintName = item.sprintName || `Sprint ${item.sprintId}`;

      if (!sprintMap.has(sprintName)) {
        sprintMap.set(sprintName, { sprint: sprintName });
      }

      sprintMap.get(sprintName)![item.userName] = item.completedTasks;
    });

    return Array.from(sprintMap.values());
  }, [kpiData]);

  const hoursChartData = useMemo(() => {
  const sprintMap = new Map<string, Record<string, string | number>>();

  hoursData.forEach((item) => {
    const sprintName = item.sprintName || `Sprint ${item.sprintId}`;

    if (!sprintMap.has(sprintName)) {
      sprintMap.set(sprintName, { sprint: sprintName });
    }

    sprintMap.get(sprintName)![item.userName] = item.estimatedHours;
  });

  return Array.from(sprintMap.values());
}, [hoursData]);

  const userNames = useMemo(() => {
    return Array.from(new Set(kpiData.map((item) => item.userName)));
  }, [kpiData]);

  const hoursUserNames = useMemo(() => {
  return Array.from(new Set(hoursData.map((item) => item.userName)));
}, [hoursData]);

  const isDark = theme === "dark";
  const chartGridColor = isDark ? "#334155" : "#e2e8f0";
  const chartAxisColor = isDark ? "#64748b" : "#94a3b8";
  const chartTextColor = isDark ? "#cbd5e1" : "#334155";
  const chartTooltipBg = isDark ? "#1e293b" : "#ffffff";
  const chartTooltipBorder = isDark ? "#334155" : "#e2e8f0";
  const chartTooltipLabel = isDark ? "#f8fafc" : "#0f172a";
  const chartTooltipShadow = isDark
    ? "0 18px 35px rgba(2, 6, 23, 0.35)"
    : "0 10px 25px rgba(15, 23, 42, 0.08)";

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 dark:border-slate-700 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Métricas y KPIs del equipo</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
    value={selectedGroupId ?? ""}
    onChange={(e) => setSelectedGroupId(Number(e.target.value))}
    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-white shadow-sm outline-none focus:border-red-400 dark:focus:border-red-500"
  >
    {groups.map((group) => (
      <option key={group.id} value={group.id}>
        {group.name}
      </option>
    ))}
  </select>

          <select
            value={selectedSprintId ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedSprintId(value ? Number(value) : undefined);
            }}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-white shadow-sm outline-none focus:border-red-400 dark:focus:border-red-500"
          >
            <option value="">Todos los sprints</option>

            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </select>

        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          {selectedGroup ? selectedGroup.name : "Grupo"} · KPIs de Desarrollo
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Tareas Completadas"
            value={totalCompletedTasks}
            subtitle="Total del grupo"
            icon={<CheckCircle2 size={20} />}
            trend="up"
          />

          <KpiCard
            title="Velocidad del Equipo"
            value={velocity}
            subtitle="tasks / sprint"
            icon={<TrendingUp size={20} />}
            trend="up"
          />

          <KpiCard
            title="Sprints Activos"
            value={totalSprints}
            subtitle="Con tareas completadas"
            icon={<Clock size={20} />}
            trend="neutral"
          />

          <KpiCard
            title="Miembros con actividad"
            value={totalUsers}
            subtitle="Usuarios asignados"
            icon={<Users size={20} />}
            trend="neutral"
          />
        </div>
      </section>

      <section className="mb-6">
  <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
    Métricas por Sprint
  </h2>

  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-slate-200">
        Tareas completadas por usuario y sprint
      </h3>

      {loading ? (
        <div className="flex h-72 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          Cargando métricas...
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          No hay tareas completadas para este grupo.
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />

              <XAxis
                dataKey="sprint"
                tick={{ fontSize: 12, fill: chartTextColor, fontWeight: 500 }}
                axisLine={{ stroke: chartAxisColor }}
                tickLine={{ stroke: chartAxisColor }}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: chartTextColor, fontWeight: 500 }}
                axisLine={{ stroke: chartAxisColor }}
                tickLine={{ stroke: chartAxisColor }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: chartTooltipBg,
                  border: `1px solid ${chartTooltipBorder}`,
                  borderRadius: "12px",
                  color: chartTooltipLabel,
                  boxShadow: chartTooltipShadow,
                }}
                labelStyle={{
                  color: chartTooltipLabel,
                  fontWeight: 700,
                }}
              />

              <Legend
                formatter={(value) => (
                  <span style={{ color: chartTextColor, fontWeight: 500 }}>
                    {value}
                  </span>
                )}
                wrapperStyle={{
                  fontSize: "12px",
                  paddingTop: "12px",
                }}
              />

              {userNames.map((userName, index) => (
                <Bar
                  key={userName}
                  dataKey={userName}
                  fill={getUserColor(index)}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>

    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-bold text-slate-800 dark:text-slate-200">
        Horas estimadas por usuario y sprint
      </h3>

      {loading ? (
        <div className="flex h-72 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          Cargando horas...
        </div>
      ) : hoursChartData.length === 0 ? (
        <div className="flex h-72 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          No hay horas estimadas para este grupo.
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hoursChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />

              <XAxis
                dataKey="sprint"
                tick={{ fontSize: 12, fill: chartTextColor, fontWeight: 500 }}
                axisLine={{ stroke: chartAxisColor }}
                tickLine={{ stroke: chartAxisColor }}
              />

              <YAxis
                tick={{ fontSize: 12, fill: chartTextColor, fontWeight: 500 }}
                axisLine={{ stroke: chartAxisColor }}
                tickLine={{ stroke: chartAxisColor }}
              />

              <Tooltip
                formatter={(value) => [`${value} h`, "Horas estimadas"]}
                contentStyle={{
                  backgroundColor: chartTooltipBg,
                  border: `1px solid ${chartTooltipBorder}`,
                  borderRadius: "12px",
                  color: chartTooltipLabel,
                  boxShadow: chartTooltipShadow,
                }}
                labelStyle={{
                  color: chartTooltipLabel,
                  fontWeight: 700,
                }}
              />

              <Legend
                formatter={(value) => (
                  <span style={{ color: chartTextColor, fontWeight: 500 }}>
                    {value}
                  </span>
                )}
                wrapperStyle={{
                  fontSize: "12px",
                  paddingTop: "12px",
                }}
              />

              {hoursUserNames.map((userName, index) => (
                <Bar
                  key={userName}
                  dataKey={userName}
                  fill={getUserColor(index)}
                  radius={[6, 6, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  </div>
</section>

      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-700 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Detalle por usuario
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-5 py-3">Grupo</th>
                <th className="px-5 py-3">Sprint</th>
                <th className="px-5 py-3">Persona</th>
                <th className="px-5 py-3">Tareas completadas</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {kpiData.map((item) => (
                <tr
                  key={`${item.groupId}-${item.sprintId}-${item.userId}`}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/70"
                >
                  <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-100">
                    {item.groupName}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-200">
                    {item.sprintName}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-200">
                    {item.userName}
                  </td>
                  <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                    {item.completedTasks}
                  </td>
                </tr>
              ))}

              {!loading && kpiData.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No hay información disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
    </ProtectedRoute>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-6 flex items-start justify-between">
        <div className="rounded-xl bg-red-50 dark:bg-red-950 p-3 text-red-500">
          {icon}
        </div>

        {trend === "up" && (
          <TrendingUp size={16} className="text-emerald-500" />
        )}

        {trend === "down" && (
          <AlertTriangle size={16} className="text-red-500" />
        )}

        {trend === "neutral" && (
          <Activity size={16} className="text-slate-400 dark:text-slate-600" />
        )}
      </div>

      <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
        {title}
      </p>

      <div className="flex items-end gap-2">
        <span className="text-3xl font-black text-slate-900 dark:text-white">
          {value}
        </span>
      </div>

      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}
