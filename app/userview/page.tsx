"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getTasks, getUserGroups, updateTaskStatus, createTask, getTodoListsByGroup, TaskDTO, Group, CreateTaskRequest } from "@/lib/api";
import { getUser, clearSession } from "@/lib/session";
import { Plus, Clock, CheckCircle2, AlertCircle, X, SquareChartGantt, LogOut, LayoutDashboard, Folder, CheckSquare } from "lucide-react";
import { DndContext, DragEndEvent, useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// User sidebar component
function UserSidebar({ userName }: { userName: string }) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.push("/auth/login");
  };

  return (
    <aside className="w-64 bg-white border-r p-4 flex flex-col justify-between">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="bg-red-500 text-white p-2 rounded-lg">
            <SquareChartGantt size={20} />
          </div>

          <div>
            <h2 className="font-bold text-sm text-black leading-tight">
              {userName}
            </h2>
            <p className="text-sm text-gray-600">
              Usuario
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <LayoutDashboard size={18} className="text-gray-500" />
            Dashboard
          </a>
          <a
            href="/userview"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500 text-white transition-colors"
          >
            <CheckSquare size={18} />
            Mis Tareas
          </a>
        </nav>
      </div>

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

  const [formData, setFormData] = useState({
    groupId: "",
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
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
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

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
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <ProtectedRoute>
      <UserSidebar userName={userName} />

      <main className="flex-1 p-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
              <p className="text-gray-500">Cargando tareas...</p>
            </div>
          </div>
        ) : groups.length === 0 ? (
          // Empty state - centered card
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white border rounded-xl p-12 w-full max-w-md text-center shadow-sm">
              <AlertCircle size={64} className="mx-auto text-gray-300 mb-6" />
              <h2 className="text-2xl text-black font-semibold mb-3">
                Sin grupos asignados
              </h2>
              <p className="text-gray-600 text-lg mb-2">
                No perteneces a ningún grupo todavía.
              </p>
              <p className="text-gray-500">
                Contacta con un administrador para que te asigne a un grupo y comienza a gestionar tus tareas.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl text-black font-semibold">Mis Tareas</h1>
              <p className="text-gray-600 mt-1">Hola, {userName} 👋</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 flex justify-between items-center">
                <span>{error}</span>
                <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Group selector and create button */}
            <div className="bg-white border rounded-xl p-5 mb-6 flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Selecciona un grupo
                </label>
                <select
                  value={selectedGroupId || ""}
                  onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-gray-600"
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
              <div className="bg-white border rounded-xl p-12 text-center">
                <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">No tienes tareas en este grupo</p>
                <p className="text-gray-500 mt-2">Crea una nueva tarea para empezar</p>
              </div>
            ) : (
              <DndContext onDragEnd={handleDragEnd}>
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
                  />
                </div>
              </DndContext>
            )}

            {/* Create Task Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8 w-full max-w-md max-h-screen overflow-y-auto shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl text-black font-semibold">Nueva Tarea</h2>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateTask}>
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Grupo *
                      </label>
                      <select
                        required
                        value={formData.groupId}
                        onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-gray-600"
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
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Título *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ej: Diseñar nueva página"
                        className="w-full border rounded-lg px-3 py-2 text-gray-600"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe los detalles de la tarea..."
                        rows={3}
                        className="w-full border rounded-lg px-3 py-2 text-gray-600"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Prioridad
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-gray-600"
                      >
                        <option value="low">Baja</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>

                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Fecha de Vencimiento
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-gray-600"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 border rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50"
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
}: {
  columnId: "pending" | "in_progress" | "completed";
  title: string;
  tasks: TaskDTO[];
  updating: number | null;
  mapStatusToSpanish: (status: TaskDTO["status"]) => string;
  mapPriorityToSpanish: (priority: TaskDTO["priority"]) => string;
  getPriorityColor: (priority: TaskDTO["priority"]) => string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  });

  const getColumnColor = (title: string) => {
    if (title === "Pendiente") return "bg-gray-50";
    if (title === "En Progreso") return "bg-blue-50";
    if (title === "Completada") return "bg-green-50";
    return "bg-gray-50";
  };

  return (
    <div
      ref={setNodeRef}
      className={`${getColumnColor(title)} border rounded-xl p-4 min-h-96 transition-colors ${
        isOver ? "ring-2 ring-red-500 bg-red-50" : ""
      }`}
    >
      <h3 className="text-lg font-semibold text-black mb-4">{title}</h3>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Sin tareas</p>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              updating={updating}
              mapStatusToSpanish={mapStatusToSpanish}
              mapPriorityToSpanish={mapPriorityToSpanish}
              getPriorityColor={getPriorityColor}
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
  mapStatusToSpanish,
  mapPriorityToSpanish,
  getPriorityColor,
}: {
  task: TaskDTO;
  updating: number | null;
  mapStatusToSpanish: (status: TaskDTO["status"]) => string;
  mapPriorityToSpanish: (priority: TaskDTO["priority"]) => string;
  getPriorityColor: (priority: TaskDTO["priority"]) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
  });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <h4 className="font-semibold text-black text-sm mb-2">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex gap-2 mb-3 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
          {mapPriorityToSpanish(task.priority)}
        </span>
        {task.dueDate && (
          <span className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded">
            {new Intl.DateTimeFormat("es-MX", {
              month: "short",
              day: "numeric",
            }).format(new Date(task.dueDate))}
          </span>
        )}
      </div>

      {updating === task.id && (
        <div className="text-xs text-gray-500 text-center py-1">Actualizando...</div>
      )}
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
    if (title === "Pendiente") return "bg-gray-50";
    if (title === "En Progreso") return "bg-blue-50";
    if (title === "Completada") return "bg-green-50";
    return "bg-gray-50";
  };

  const getNextStatus = (currentStatus: TaskDTO["status"]): TaskDTO["status"] => {
    if (currentStatus === "pending") return "in_progress";
    if (currentStatus === "in_progress") return "completed";
    return "pending";
  };

  return (
    <div className={`${getColumnColor(title)} border rounded-xl p-4 min-h-96`}>
      <h3 className="text-lg font-semibold text-black mb-4">{title}</h3>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Sin tareas</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow"
            >
              <h4 className="font-semibold text-black text-sm mb-2">{task.title}</h4>
              {task.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
              )}

              <div className="flex gap-2 mb-3 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                  {mapPriorityToSpanish(task.priority)}
                </span>
                {task.dueDate && (
                  <span className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded">
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
