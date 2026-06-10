"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getTasks, getUserGroups, updateTaskStatus, createTask, getTodoListsByGroup, TaskDTO, Group, CreateTaskRequest, updateTask } from "@/lib/api";
import { getUser, clearSession } from "@/lib/session";
import { Plus, Clock, CheckCircle2, AlertCircle, X, SquareChartGantt, LogOut, LayoutDashboard, Folder, CheckSquare, MoreVertical } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable, useDraggable } from "@dnd-kit/core";


export default function UserViewPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [allTasks, setAllTasks] = useState<TaskDTO[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTask, setActiveTask] = useState<TaskDTO | null>(null);

  const [formData, setFormData] = useState({
    groupId: "",
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    sprint: "",
  });

  // Load data on mount
  useEffect(() => {
    const userData = getUser();
    setUser(userData);

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [groupsData, tasksData] = await Promise.all([
          getUserGroups(),
          getTasks(),
        ]);
        setGroups(groupsData);
        setAllTasks(tasksData);
        if (groupsData.length > 0) {
          setSelectedGroupId(groupsData[0].id);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter tasks by selected group
  const filteredTasks = allTasks.filter((task) => {
    if (!selectedGroupId) return false;
    const group = groups.find((g) => g.id === selectedGroupId);
    return task.groupName === group?.title;
  });

  // Separate tasks by status
  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in_progress");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");

  // Get user info
  const userName = user?.name || "Usuario";

  // Handle create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.groupId) {
      setError("El título y el grupo son obligatorios");
      return;
    }

    const selectedGroup = groups.find((g) => g.id === Number(formData.groupId));
    if (!selectedGroup) {
      setError("Grupo no válido");
      return;
    }

    try {
      setCreating(true);
      const todoLists = await getTodoListsByGroup(selectedGroup.id);
      const targetTodoList = todoLists[0];

      if (!targetTodoList) {
        setError("El grupo seleccionado no tiene listas de tareas disponibles");
        return;
      }

      const payload: CreateTaskRequest = {
        listId: targetTodoList.id,
        title: formData.title,
        description: formData.description || null,
        status: "pending",
        priority: formData.priority,
        dueDate: formData.dueDate ? `${formData.dueDate}T00:00:00` : null,
        createdById: user?.userId || 0,
        sprint: formData.sprint || null,
      };

      await createTask(payload);

      // Reload tasks
      const updatedTasks = await getTasks();
      setAllTasks(updatedTasks);

      // Reset form
      setFormData({
        groupId: formData.groupId,
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        sprint: "",
      });
      setShowCreateModal(false);
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la tarea");
    } finally {
      setCreating(false);
    }
  };

  // Handle status update
  const handleStatusChange = async (taskId: number, newStatus: "pending" | "in_progress" | "completed") => {
    try {
      setUpdating(taskId);
      await updateTaskStatus(taskId, newStatus);

      // Update local state
      setAllTasks((tasks) =>
        tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el estado");
    } finally {
      setUpdating(null);
    }
  };

  // Handle drag and drop
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = parseInt(event.active.id.toString().replace("task-", ""));
    setActiveTask(allTasks.find((task) => task.id === taskId) ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = parseInt(active.id.toString().replace("task-", ""));
    const newStatus = over.id as "pending" | "in_progress" | "completed";

    // Get current task
    const currentTask = allTasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    const previousTasks = [...allTasks];

    try {
      // Optimistic update
      setAllTasks((tasks) =>
        tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      setUpdating(taskId);
      await updateTaskStatus(taskId, newStatus);
    } catch (err) {
      console.error(err);
      // Revert on error
      setAllTasks(previousTasks);
      setError("No se pudo actualizar el estado de la tarea");
    } finally {
      setUpdating(null);
    }
  };

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

  const getPriorityColor = (priority: TaskDTO["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  return (
    <ProtectedRoute>

      <main className="flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Cargando tareas...</p>
            </div>
          </div>
        ) : groups.length === 0 ? (
          // Empty state - centered card
          <div className="flex items-center justify-center min-h-[60vh]">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <AlertCircle size={64} className="mx-auto text-slate-300 dark:text-slate-600 mb-6" />
              <h2 className="text-2xl text-slate-900 dark:text-white font-semibold mb-3">
                Sin grupos asignados
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-lg mb-2">
                No perteneces a ningún grupo todavía.
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Contacta con un administrador para que te asigne a un grupo y comienza a gestionar tus tareas.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl text-slate-900 dark:text-white font-semibold">Mis Tareas</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Hola, {userName} 👋</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <span>{error}</span>
                <button onClick={() => setError("")} className="text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200">
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Group selector and create button */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6 flex gap-4 items-end shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
                  Selecciona un grupo
                </label>
                <select
                  value={selectedGroupId || ""}
                  onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setFormData({ ...formData, groupId: String(selectedGroupId) });
                  setShowCreateModal(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus size={20} />
                Nueva Tarea
              </button>
            </div>

            {/* Kanban Board */}
            {filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <AlertCircle size={48} className="mx-auto text-slate-400 dark:text-slate-600 mb-4" />
                <p className="text-slate-600 dark:text-slate-300 text-lg">No tienes tareas en este grupo</p>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Crea una nueva tarea para empezar</p>
              </div>
            ) : (
              <DndContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveTask(null)}
              >
                <div className="grid grid-cols-3 gap-6">
                  {/* Pendiente Column */}
                  <DroppableKanbanColumn
                    columnId="pending"
                    title="Pendiente"
                    tasks={pendingTasks}
                    updating={updating}
                    mapStatusToSpanish={mapStatusToSpanish}
                    mapPriorityToSpanish={mapPriorityToSpanish}
                    getPriorityColor={getPriorityColor}
                    onTaskClick={(task) => {
                      setSelectedTask(task);
                      setShowDetailModal(true);
                    }}
                  />

                  {/* En Progreso Column */}
                  <DroppableKanbanColumn
                    columnId="in_progress"
                    title="En Progreso"
                    tasks={inProgressTasks}
                    updating={updating}
                    mapStatusToSpanish={mapStatusToSpanish}
                    mapPriorityToSpanish={mapPriorityToSpanish}
                    getPriorityColor={getPriorityColor}
                    onTaskClick={(task) => {
                      setSelectedTask(task);
                      setShowDetailModal(true);
                    }}
                  />

                  {/* Completada Column */}
                  <DroppableKanbanColumn
                    columnId="completed"
                    title="Completada"
                    tasks={completedTasks}
                    updating={updating}
                    mapStatusToSpanish={mapStatusToSpanish}
                    mapPriorityToSpanish={mapPriorityToSpanish}
                    getPriorityColor={getPriorityColor}
                    onTaskClick={(task) => {
                      setSelectedTask(task);
                      setShowDetailModal(true);
                    }}
                  />
                </div>

                <DragOverlay adjustScale={false}>
                  {activeTask ? (
                    <TaskCardSurface
                      task={activeTask}
                      updating={updating}
                      mapPriorityToSpanish={mapPriorityToSpanish}
                      getPriorityColor={getPriorityColor}
                      onTaskClick={() => undefined}
                      className="pointer-events-none rotate-1 shadow-xl"
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {/* Create Task Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
                <div className="w-full max-w-md max-h-screen overflow-y-auto rounded-xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl text-slate-900 font-semibold dark:text-white">Nueva Tarea</h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateTask}>
                    <div className="mb-4">
                      <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                        Grupo *
                      </label>
                      <select
                        required
                        value={formData.groupId}
                        onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="">Selecciona un grupo</option>
                        {groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                        Título *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ej: Diseñar nueva página"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe los detalles de la tarea..."
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                        Prioridad
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                        Sprint
                      </label>
                      <input
                        type="text"
                        value={formData.sprint}
                        onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
                        placeholder="Sprint 1"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                      />
                    </div>

                    <div className="mb-6">
                      <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                        Fecha de Vencimiento
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={creating}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 disabled:opacity-50"
                      >
                        {creating ? "Creando..." : "Crear Tarea"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Task Detail Modal */}
            {showDetailModal && selectedTask && (
              <TaskDetailModal
                task={selectedTask}
                onClose={() => setShowDetailModal(false)}
                onTaskUpdate={(updatedTask) => {
                  setAllTasks((tasks) =>
                    tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
                  );
                  setShowDetailModal(false);
                  setSelectedTask(null);
                }}
                mapStatusToSpanish={mapStatusToSpanish}
                mapPriorityToSpanish={mapPriorityToSpanish}
              />
            )}
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}


// Droppable Kanban Column Component
function DroppableKanbanColumn({
  columnId,
  title,
  tasks,
  updating,
  mapStatusToSpanish,
  mapPriorityToSpanish,
  getPriorityColor,
  onTaskClick,
}: {
  columnId: "pending" | "in_progress" | "completed";
  title: string;
  tasks: TaskDTO[];
  updating: number | null;
  mapStatusToSpanish: (status: TaskDTO["status"]) => string;
  mapPriorityToSpanish: (priority: TaskDTO["priority"]) => string;
  getPriorityColor: (priority: TaskDTO["priority"]) => string;
  onTaskClick: (task: TaskDTO) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  });

  const getColumnColor = (title: string) => {
    if (title === "Pendiente") return "bg-slate-50 dark:bg-slate-900";
    if (title === "En Progreso") return "bg-blue-50 dark:bg-slate-900";
    if (title === "Completada") return "bg-green-50 dark:bg-slate-900";
    return "bg-slate-50 dark:bg-slate-900";
  };

  return (
    <div
      ref={setNodeRef}
      className={`${getColumnColor(title)} rounded-2xl border border-slate-200 p-4 min-h-96 shadow-sm transition-colors dark:border-slate-700 ${
        isOver ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-950/40" : ""
      }`}
    >
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Sin tareas</p>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              updating={updating}
              mapStatusToSpanish={mapStatusToSpanish}
              mapPriorityToSpanish={mapPriorityToSpanish}
              getPriorityColor={getPriorityColor}
              onTaskClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Draggable Task Card Component
function DraggableTaskCard({
  task,
  updating,
  mapPriorityToSpanish,
  getPriorityColor,
  onTaskClick,
}: {
  task: TaskDTO;
  updating: number | null;
  mapStatusToSpanish: (status: TaskDTO["status"]) => string;
  mapPriorityToSpanish: (priority: TaskDTO["priority"]) => string;
  getPriorityColor: (priority: TaskDTO["priority"]) => string;
  onTaskClick: (task: TaskDTO) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-30" : "opacity-100"}
    >
      <TaskCardSurface
        task={task}
        updating={updating}
        mapPriorityToSpanish={mapPriorityToSpanish}
        getPriorityColor={getPriorityColor}
        onTaskClick={onTaskClick}
        className="cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}

function TaskCardSurface({
  task,
  updating,
  mapPriorityToSpanish,
  getPriorityColor,
  onTaskClick,
  className = "",
}: {
  task: TaskDTO;
  updating: number | null;
  mapPriorityToSpanish: (priority: TaskDTO["priority"]) => string;
  getPriorityColor: (priority: TaskDTO["priority"]) => string;
  onTaskClick: (task: TaskDTO) => void;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-slate-900 dark:text-white text-sm flex-1">{task.title}</h4>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTaskClick(task);
          }}
          className="text-slate-400 hover:text-slate-600 p-1 ml-2 dark:hover:text-slate-200"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex gap-2 mb-3 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
          {mapPriorityToSpanish(task.priority)}
        </span>
        {task.storyPoints && (
          <span className="text-xs text-slate-700 px-2 py-1 bg-slate-100 rounded dark:bg-slate-700 dark:text-slate-300">
            {task.storyPoints} SP
          </span>
        )}
        {task.dueDate && (
          <span className="text-xs text-slate-600 px-2 py-1 bg-slate-100 rounded dark:bg-slate-700 dark:text-slate-300">
            {new Intl.DateTimeFormat("es-MX", {
              month: "short",
              day: "numeric",
            }).format(new Date(task.dueDate))}
          </span>
        )}
      </div>

      {updating === task.id && (
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-1">Actualizando...</div>
      )}
    </div>
  );
}

// Task Detail Modal Component
function TaskDetailModal({
  task,
  onClose,
  onTaskUpdate,
  mapStatusToSpanish,
  mapPriorityToSpanish,
}: {
  task: TaskDTO;
  onClose: () => void;
  onTaskUpdate: (updatedTask: TaskDTO) => void;
  mapStatusToSpanish: (status: TaskDTO["status"]) => string;
  mapPriorityToSpanish: (priority: TaskDTO["priority"]) => string;
}) {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    storyPoints: task.storyPoints || "",
    sprint: task.sprint || "",
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    status: task.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess(false);

      // Validate title
      if (!formData.title.trim()) {
        setError("El título es obligatorio");
        return;
      }

      // Call API to update task
      const storyPointsValue = formData.storyPoints ? parseInt(String(formData.storyPoints), 10) : null;

      const updatedTask = await updateTask(task.id, {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority as "low" | "medium" | "high",
        storyPoints: storyPointsValue,
        sprint: formData.sprint || null,
        dueDate: formData.dueDate ? `${formData.dueDate}T00:00:00` : null,
        status: formData.status as "pending" | "in_progress" | "completed",
      } as Partial<TaskDTO>);

      setSuccess(true);
      setTimeout(() => {
        onTaskUpdate(updatedTask);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-end z-50">
      <div className="w-full max-w-md max-h-screen overflow-y-auto rounded-l-xl border-l border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs text-slate-500 font-semibold dark:text-slate-400">#{task.id}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-300">
            ✓ Cambios guardados correctamente
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
              Título
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          {/* Properties */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-4 dark:text-slate-300">Propiedades</h4>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "pending" | "in_progress" | "completed" })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completada</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                  Prioridad
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as "low" | "medium" | "high" })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              {/* Story Points */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                  Story Points
                </label>
                <input
                  type="number"
                  value={formData.storyPoints}
                  onChange={(e) => setFormData({ ...formData, storyPoints: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Sprint */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                  Sprint
                </label>
                <input
                  type="text"
                  value={formData.sprint}
                  onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
                  placeholder="Sprint 1"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none placeholder:text-slate-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>

              {/* Assigned User (read-only) */}
              {task.assigneeName && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                    Asignado a
                  </label>
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {task.assigneeName}
                  </div>
                </div>
              )}

              {/* Group (read-only) */}
              {task.groupName && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                    Grupo
                  </label>
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {task.groupName}
                  </div>
                </div>
              )}

              {/* Todo List (read-only) */}
              {task.todoListName && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2 dark:text-slate-300">
                    Lista
                  </label>
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {task.todoListName}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Kanban Column Component (kept for backwards compatibility, now unused)
function KanbanColumn({
  title,
  tasks,
  onStatusChange,
  updating,
  mapStatusToSpanish,
  mapPriorityToSpanish,
  getPriorityColor,
}: {
  title: string;
  tasks: TaskDTO[];
  onStatusChange: (taskId: number, status: "pending" | "in_progress" | "completed") => void;
  updating: number | null;
  mapStatusToSpanish: (status: TaskDTO["status"]) => string;
  mapPriorityToSpanish: (priority: TaskDTO["priority"]) => string;
  getPriorityColor: (priority: TaskDTO["priority"]) => string;
}) {
  const getColumnColor = (title: string) => {
    if (title === "Pendiente") return "bg-slate-50 dark:bg-slate-900";
    if (title === "En Progreso") return "bg-blue-50 dark:bg-slate-900";
    if (title === "Completada") return "bg-green-50 dark:bg-slate-900";
    return "bg-slate-50 dark:bg-slate-900";
  };

  const getNextStatus = (currentStatus: TaskDTO["status"]): TaskDTO["status"] => {
    if (currentStatus === "pending") return "in_progress";
    if (currentStatus === "in_progress") return "completed";
    return "pending";
  };

  return (
    <div className={`${getColumnColor(title)} rounded-2xl border border-slate-200 p-4 min-h-96 shadow-sm dark:border-slate-700`}>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Sin tareas</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">{task.title}</h4>
              {task.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{task.description}</p>
              )}

              <div className="flex gap-2 mb-3 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                  {mapPriorityToSpanish(task.priority)}
                </span>
                {task.dueDate && (
                  <span className="text-xs text-slate-600 px-2 py-1 bg-slate-100 rounded dark:bg-slate-700 dark:text-slate-300">
                    {new Intl.DateTimeFormat("es-MX", {
                      month: "short",
                      day: "numeric",
                    }).format(new Date(task.dueDate))}
                  </span>
                )}
              </div>

              <button
                onClick={() => onStatusChange(task.id, getNextStatus(task.status))}
                disabled={updating === task.id}
                className="w-full text-xs bg-red-600 hover:bg-red-700 text-white rounded px-3 py-2 disabled:opacity-50 transition-colors"
              >
                {updating === task.id ? "Actualizando..." : `→ ${mapStatusToSpanish(getNextStatus(task.status))}`}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
