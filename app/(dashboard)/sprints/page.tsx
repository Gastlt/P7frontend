"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { getUser } from "@/lib/session";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
  RefreshCcw,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchGroupMembers,
  fetchTaskGroups,
  fetchTasks,
  fetchSprints,
  GroupMember,
  Task,
  TaskGroup,
  Sprint,
} from "../../../lib/groupsData";

type TaskStatus = "pending" | "in_progress" | "completed";

const columns: Array<{
  id: TaskStatus;
  title: string;
  subtitle: string;
  icon: typeof Circle;
  className: string;
}> = [
  {
    id: "pending",
    title: "Backlog",
    subtitle: "Por iniciar",
    icon: Circle,
    className: "bg-gray-100 text-gray-700",
  },
  {
    id: "in_progress",
    title: "In Progress",
    subtitle: "En ejecución",
    icon: Clock3,
    className: "bg-blue-100 text-blue-700",
  },
  {
    id: "completed",
    title: "Done",
    subtitle: "Finalizadas",
    icon: CheckCircle2,
    className: "bg-green-100 text-green-700",
  },
];

function normalizeStatus(status?: string | null): TaskStatus {
  if (status === "completed") return "completed";
  if (status === "in_progress") return "in_progress";
  return "pending";
}

function formatDate(date?: string | null) {
  if (!date) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name?: string | null) {
  if (!name) return "--";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function groupIdFromMember(member: GroupMember) {
  return member.groupId ?? member.group?.id;
}

function userMatchesSession(member: GroupMember, sessionUserId?: number) {
  const memberUserId = member.userId ?? member.user?.id;
  return sessionUserId != null && memberUserId === sessionUserId;
}

type SprintWithGroup = Sprint & {
  groupName: string;
};

export default function SprintsPage() {
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [sprints, setSprints] = useState<SprintWithGroup[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const sessionUser = getUser();

      const [taskGroups, memberships, sprintsData, allTasks] =
        await Promise.all([
          fetchTaskGroups(),
          fetchGroupMembers(),
          fetchSprints(),
          fetchTasks(),
        ]);

      const myGroupIds = new Set(
        memberships
          .filter((member) => userMatchesSession(member, sessionUser?.userId))
          .map(groupIdFromMember)
          .filter((id): id is number => typeof id === "number")
      );

      const visibleGroups = taskGroups.filter((group) =>
        myGroupIds.has(group.id)
      );

      const groupNameById = new Map(
        visibleGroups.map((group) => [group.id, group.name])
      );

      const visibleSprints = sprintsData
        .filter((sprint) => {
          const groupId = sprint.groupId ?? sprint.group?.id;
          return groupId != null && myGroupIds.has(groupId);
        })
        .map((sprint) => {
          const groupId = sprint.groupId ?? sprint.group?.id;

          return {
            ...sprint,
            groupName:
              groupId != null
                ? groupNameById.get(groupId) ??
                  sprint.group?.name ??
                  "Sin grupo"
                : "Sin grupo",
          };
        });

      setGroups(visibleGroups);
      setSprints(visibleSprints);
      setTasks(allTasks);

      setSelectedSprintId((current) => {
        if (current && visibleSprints.some((sprint) => sprint.id === current)) {
          return current;
        }

        return visibleSprints[0]?.id ?? null;
      });
    } catch (err) {
      console.error("Error loading sprints:", err);
      setError(
        "No se pudieron cargar los sprints. Verifica que el backend esté corriendo."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredSprints = useMemo(() => {
  if (selectedGroupId === "all") return sprints;

  return sprints.filter((sprint) => {
    const groupId = sprint.groupId ?? sprint.group?.id;
    return groupId === selectedGroupId;
  });
  }, [sprints, selectedGroupId]);

  const selectedSprint = useMemo(
  () =>
    filteredSprints.find((sprint) => sprint.id === selectedSprintId) ??
    filteredSprints[0] ??
    null,
  [selectedSprintId, filteredSprints]
  );

  const selectedTasks = useMemo(() => {
    if (!selectedSprint) return [];

    return tasks.filter((task) => {
      const taskSprintId = task.sprintId 
      return taskSprintId === selectedSprint.id;
    });
  }, [selectedSprint, tasks]);


  const taskCounts = useMemo(() => {
    return columns.reduce<Record<TaskStatus, number>>(
      (acc, column) => {
        acc[column.id] = selectedTasks.filter(
          (task) => normalizeStatus(task.status) === column.id
        ).length;
        return acc;
      },
      { pending: 0, in_progress: 0, completed: 0 }
    );
  }, [selectedTasks]);

  const progress =
    selectedTasks.length === 0
      ? 0
      : (taskCounts.completed / selectedTasks.length) * 100;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-[60vh] items-center justify-center text-gray-600">
          <Loader2 size={18} className="mr-2 animate-spin" />
          Cargando sprints...
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6 text-gray-900">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-2xl font-semibold text-black">Sprints</h1>
            <p className="mt-1 text-gray-600">
              Visualiza los ciclos disponibles y sus tareas organizadas por
              estado.
            </p>
          </div>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <RefreshCcw size={16} />
            Actualizar
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Sprints disponibles
              </h2>
              <p className="text-sm text-gray-500">
                {groups.length} grupos asignados
              </p>
            </div>

            <select
              value={selectedGroupId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedGroupId(value === "all" ? "all" : Number(value));
                setSelectedSprintId(null);
              }}
              className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
            >
              <option value="all">Todos los grupos</option>

              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

            {filteredSprints.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                No hay sprints disponibles para tus grupos.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSprints.map((sprint) => {
                  const active = sprint.id === selectedSprintId;

                  return (
                    <button
                      key={sprint.id}
                      onClick={() => setSelectedSprintId(sprint.id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        active
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 bg-white hover:border-red-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-gray-900">
                        {sprint.name}
                      </span>

                      <span className="mt-1 block text-xs text-gray-500">
                        {sprint.groupName}
                      </span>

                      <span className="mt-2 block text-xs text-gray-400">
                        {formatDate(sprint.startDate)} -{" "}
                        {formatDate(sprint.endDate)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          

          <section className="space-y-5">
            {selectedSprint ? (
              <>
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-700">
                        <CalendarDays size={15} />
                        {selectedSprint.groupName}
                      </div>

                      <h2 className="mt-3 text-xl font-semibold text-gray-900">
                        {selectedSprint.name}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        {formatDate(selectedSprint.startDate)} -{" "}
                        {formatDate(selectedSprint.endDate)}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {selectedTasks.length} tareas asociadas a este sprint
                      </p>
                    </div>

                    <div className="min-w-48">
                      <div className="mb-2 flex justify-between text-sm text-gray-600">
                        <span>Progreso</span>
                        <span>
                          {taskCounts.completed} de {selectedTasks.length}
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-red-600 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedTasks.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
                    <h3 className="text-base font-semibold text-gray-900">
                      No hay tareas en este sprint
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Cuando se asignen tareas a este sprint aparecerán aquí.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-3">
                    {columns.map((column) => {
                      const Icon = column.icon;
                      const columnTasks = selectedTasks.filter(
                        (task) => normalizeStatus(task.status) === column.id
                      );

                      return (
                        <div
                          key={column.id}
                          className="rounded-lg border border-gray-200 bg-white shadow-sm"
                        >
                          <div className="flex items-center justify-between border-b border-gray-100 p-4">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {column.title}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {column.subtitle}
                              </p>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm ${column.className}`}
                            >
                              <Icon size={14} />
                              {columnTasks.length}
                            </span>
                          </div>

                          <div className="min-h-64 space-y-3 p-4">
                            {columnTasks.length === 0 ? (
                              <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                                Sin tareas
                              </div>
                            ) : (
                              columnTasks.map((task) => {
                                const taskWithExtra = task as Task & {
                                  assigneeName?: string | null;
                                };

                                return (
                                  <article
                                    key={task.id}
                                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                                  >
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                      <h4 className="text-sm font-semibold text-gray-900">
                                        {task.title}
                                      </h4>

                                      <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                                        {task.priority || "medium"}
                                      </span>
                                    </div>

                                    <p className="mb-4 line-clamp-2 text-sm text-gray-500">
                                      {task.description || "Sin descripción"}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                                        {getInitials(
                                          taskWithExtra.assigneeName
                                        )}
                                      </div>

                                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                                        <UserRound size={14} />
                                        {taskWithExtra.assigneeName ||
                                          "Sin asignar"}
                                      </span>
                                    </div>

                                    <div className="mt-3 text-xs text-gray-500">
                                      Creada: {formatDate(task.createdAt)}
                                    </div>
                                  </article>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Sin sprint seleccionado
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Selecciona un sprint de la lista para ver sus tareas.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}