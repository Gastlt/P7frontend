"use client";

import { useMemo, useState } from "react";
import { adminTasks } from "./allTasksData";
import { Filter, ArrowUpDown } from "lucide-react";

export default function AllTasksPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const groups = Array.from(new Set(adminTasks.map((task) => task.group)));
  const statuses = ["Completada", "En Progreso", "Backlog"];

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...adminTasks]
      .filter((task) => {
        const matchesSearch =
          normalizedQuery.length === 0 ||
          task.title.toLowerCase().includes(normalizedQuery) ||
          task.status.toLowerCase().includes(normalizedQuery) ||
          task.group.toLowerCase().includes(normalizedQuery);

        const matchesStatus =
          !statusFilter ||
          task.status.toLowerCase() === statusFilter.toLowerCase();

        const matchesGroup =
          !groupFilter ||
          task.group.toLowerCase() === groupFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesGroup;
      })
      .sort((a, b) => {
        const left = new Date(a.createdAt).getTime();
        const right = new Date(b.createdAt).getTime();

        return sortDirection === "desc" ? right - left : left - right;
      });
  }, [groupFilter, query, sortDirection, statusFilter]);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl text-black font-semibold">Todas las Tareas</h1>
        <p className="text-gray-700">
          Vista completa de todas las tareas registradas en el sistema
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          
          {/* Search */}
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

          {/* Status */}
          <div>
            <label className="text-sm text-gray-700">Estado</label>
            <select
              className="w-full h-10 border rounded-lg px-3 mt-1 text-gray-600"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Group */}
          <div>
            <label className="text-sm text-gray-700">Grupo</label>
            <select
              className="w-full h-10 border rounded-lg px-3 mt-1 text-gray-600"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {groups.map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Mostrando {filteredTasks.length} de {adminTasks.length} tareas
          </p>

          <button
            className="flex items-center gap-2 border px-3 py-2 rounded-lg text-white bg-red-500 hover:bg-red-800"
            onClick={() =>
              setSortDirection((s) => (s === "desc" ? "asc" : "desc"))
            }
          >
            <ArrowUpDown size={16} />
            Ordenar por fecha
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-sm text-gray-600">
            <tr>
              <th className="p-4">Tarea</th>
              <th className="p-4">Grupo</th>
              <th className="p-4">Asignado a</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Tiempo Est.</th>
              <th className="p-4">Fecha Creación</th>
            </tr>
          </thead>

          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id} className="border-t">
                
                {/* Task */}
                <td className="p-4">
                  <div>
                    <div className="font-semibold text-black">{task.title}</div>
                    <div className="text-sm text-gray-600">
                      {task.description}
                    </div>
                  </div>
                </td>

                {/* Group */}
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-600">
                    {task.group}
                  </span>
                </td>

                {/* Assignee */}
                <td className="p-4">
                  <div className="flex items-center gap-2 text-black">
                    <div className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                      {task.assigneeInitials}
                    </div>
                    {task.assignee}
                  </div>
                </td>

                {/* Status */}
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-md text-sm
                    ${
                      task.status === "Completada"
                        ? "bg-green-100 text-green-700"
                        : task.status === "En Progreso"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {task.status}
                  </span>
                </td>

                <td className="p-4 text-black">{task.estimatedHours}</td>
                <td className="p-4 text-black">{formatDate(task.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}