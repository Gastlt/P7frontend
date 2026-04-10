"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, ArrowUpDown } from "lucide-react";
import { getTasks } from "@/lib/api";

type TaskDTO = {
  id: number;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  createdAt: string;
  assigneeName: string | null;
  groupName: string | null;
  todoListName: string | null;
};

export default function AllTasksPage() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getTasks();
        setTasks(data);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las tareas");
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const mapStatusToSpanish = (status: TaskDTO["status"]) => {
    switch (status) {
      case "completed":
        return "Completada";
      case "in_progress":
        return "En Progreso";
      case "pending":
        return "Pendiente";
      default:
        return status;
    }
  };

  const mapPriorityToSpanish = (priority: TaskDTO["priority"]) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Media";
      case "low":
        return "Baja";
      default:
        return priority;
    }
  };

  const groups = Array.from(
    new Set(tasks.map((task) => task.groupName || "Sin grupo"))
  );

  const statuses = ["Completada", "En Progreso", "Pendiente"];

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...tasks]
      .filter((task) => {
        const title = task.title.toLowerCase();
        const description = (task.description || "").toLowerCase();
        const status = mapStatusToSpanish(task.status).toLowerCase();
        const group = (task.groupName || "Sin grupo").toLowerCase();
        const assignee = (task.assigneeName || "Sin asignar").toLowerCase();
        const todoList = (task.todoListName || "Sin lista").toLowerCase();
        const priority = mapPriorityToSpanish(task.priority).toLowerCase();

        const matchesSearch =
          normalizedQuery.length === 0 ||
          title.includes(normalizedQuery) ||
          description.includes(normalizedQuery) ||
          status.includes(normalizedQuery) ||
          group.includes(normalizedQuery) ||
          assignee.includes(normalizedQuery) ||
          todoList.includes(normalizedQuery) ||
          priority.includes(normalizedQuery);

        const matchesStatus =
          !statusFilter || status === statusFilter.toLowerCase();

        const matchesGroup =
          !groupFilter || group === groupFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesGroup;
      })
      .sort((a, b) => {
        const left = new Date(a.createdAt).getTime();
        const right = new Date(b.createdAt).getTime();
        return sortDirection === "desc" ? right - left : left - right;
      });
  }, [tasks, query, statusFilter, groupFilter, sortDirection]);

  const formatDate = (date: string | null) => {
    if (!date) return "Sin fecha";

    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const getInitials = (name: string | null) => {
    if (!name) return "--";

    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return <div className="p-6 text-black">Cargando tareas...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl text-black font-semibold">Todas las Tareas</h1>
        <p className="text-gray-700">
          Vista completa de todas las tareas registradas en el sistema
        </p>
      </div>

      <div className="bg-white border rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-sm text-gray-700">Buscar</label>
            <div className="flex items-center border rounded-lg px-3 h-10 mt-1 text-gray-600">
              <Filter size={16} className="text-gray-500 mr-2" />
              <input
                className="w-full outline-none"
                placeholder="Buscar tareas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-700">Estado</label>
            <select
              className="w-full h-10 border rounded-lg px-3 mt-1 text-gray-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700">Grupo</label>
            <select
              className="w-full h-10 border rounded-lg px-3 mt-1 text-gray-600"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Mostrando {filteredTasks.length} de {tasks.length} tareas
          </p>

          <button
            className="flex items-center gap-2 border px-3 py-2 rounded-lg text-white bg-red-500 hover:bg-red-800"
            onClick={() =>
              setSortDirection((s) => (s === "desc" ? "asc" : "desc"))
            }
          >
            <ArrowUpDown size={16} />
            Ordenar por fecha de creación
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-600">
            <tr>
              <th className="p-4">Tarea</th>
              <th className="p-4">Lista</th>
              <th className="p-4">Grupo</th>
              <th className="p-4">Creada por</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Prioridad</th>
              <th className="p-4">Vencimiento</th>
              <th className="p-4">Fecha Creación</th>
            </tr>
          </thead>

          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id} className="border-t">
                <td className="p-4">
                  <div>
                    <div className="font-semibold text-black">{task.title}</div>
                    <div className="text-sm text-gray-600">
                      {task.description || "Sin descripción"}
                    </div>
                  </div>
                </td>

                <td className="p-4 text-black">
                  {task.todoListName || "Sin lista"}
                </td>

                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-600">
                    {task.groupName || "Sin grupo"}
                  </span>
                </td>

                <td className="p-4">
                  <div className="flex items-center gap-2 text-black">
                    <div className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                      {getInitials(task.assigneeName)}
                    </div>
                    {task.assigneeName || "Sin asignar"}
                  </div>
                </td>

                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-md text-sm ${
                      task.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : task.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {mapStatusToSpanish(task.status)}
                  </span>
                </td>

                <td className="p-4 text-black">
                  {mapPriorityToSpanish(task.priority)}
                </td>

                <td className="p-4 text-black">{formatDate(task.dueDate)}</td>

                <td className="p-4 text-black">{formatDate(task.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}