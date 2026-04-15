'use client';

import { Calendar, ChevronLeft, UserRound, Loader2, Check } from "lucide-react";
import { FormEvent, useMemo, useState, useEffect } from "react";
import { GroupTask, Group, fetchAllGroupsData, createTask, updateTask, deleteTask, fetchUsers, fetchTodoListsByGroupId, createTaskAssignment } from "../groupsData";
import Link from "next/link";
import { useParams } from "next/navigation";

// MODAL DE NUEVA TAREA

type NewTaskModalProps = {
  groupTitle: string;
  members: string[];
  onClose: () => void;
  onCreate: (task: Omit<GroupTask, "id" | "status">) => void;
  isLoading?: boolean;
};

function NewTaskModal({
  groupTitle,
  members,
  onClose,
  onCreate,
  isLoading = false,
}: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("El título de la tarea es requerido");
      return;
    }

    if (!assignee) {
      setError("Debe asignar la tarea a un miembro");
      return;
    }

    onCreate({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      assignee,
      dueDate: dueDate || null,
    });

    // Limpiar formulario
    setTitle("");
    setDescription("");
    setAssignee("");
    setDueDate("");
    setPriority("medium");
    setSuccess("¡Tarea creada exitosamente!");
    setTimeout(() => {
      onClose();
      setSuccess("");
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">Crear Nueva Tarea</h2>
        <p className="mt-1 text-gray-500">Agrega una tarea a {groupTitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Título de la Tarea *
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej: Implementar dashboard"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Añade más detalles (opcional)"
              className="h-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Asignar a *
              </label>
              <select
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                disabled={isLoading || members.length === 0}
              >
                <option value="">{members.length === 0 ? "No hay miembros" : "Seleccionar miembro"}</option>
                {members.map((member, idx) => (
                  <option key={`member-${idx}`} value={member}>
                    {member}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as "low" | "medium" | "high")}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                disabled={isLoading}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600 flex items-center gap-2">
              <Check size={16} />
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 rounded-lg bg-red-600 text-sm text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Tarea"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// COMPONENTE PRINCIPAL

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<GroupTask[]>([]);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [completingTask, setCompletingTask] = useState<number | null>(null);
  const [deletingTask, setDeletingTask] = useState<number | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadGroup = async () => {
      try {
        setLoading(true);
        const groups = await fetchAllGroupsData();
        const foundGroup = groups.find((item) => item.id === Number(params.id));
        
        if (foundGroup) {
          setGroup(foundGroup);
          setTasks(foundGroup.tasks);
          setError(null);
        } else {
          setError("Grupo no encontrado");
          setGroup(null);
        }
      } catch (err) {
        console.error("Error loading group:", err);
        setError("Error cargando el grupo. Asegúrate de que el backend esté corriendo en localhost:8080");
        setGroup(null);
      } finally {
        setLoading(false);
      }
    };

    loadGroup();
  }, [params.id]);

  const groupMembers = useMemo(() => {
    if (!group) return [];
    return group.members;
  }, [group]);

  const filteredTasks = useMemo(() => {
    if (selectedPerson === "All") return tasks;
    return tasks.filter((task) => task.assignee === selectedPerson);
  }, [selectedPerson, tasks]);

  const completed = tasks.filter((task) => task.status === "completed").length;
  const percent = tasks.length === 0 ? 0 : (completed / tasks.length) * 100;

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  };

  const handleCreateTask = async (task: Omit<GroupTask, "id" | "status">) => {
    try {
      setIsCreatingTask(true);
      
      if (!group) {
        alert("Error: Grupo no encontrado");
        return;
      }

      // Obtener los todo lists del grupo
      const todoLists = await fetchTodoListsByGroupId(group.id);
      
      if (!todoLists || todoLists.length === 0) {
        alert("Error: No hay listas de tareas en este grupo. Contacta al administrador.");
        return;
      }

      const todoListId = todoLists[0].id;

      // Obtener usuario para asignación
      const users = await fetchUsers();
      const user = users.find(u => u.name === task.assignee);
      
      if (!user) {
        alert("Error: Usuario no encontrado");
        return;
      }

      // Crear la tarea en la API con el usuario asignado
      const apiTask = await createTask({
        listId: todoListId,
        title: task.title,
        description: task.description || task.title, // Usar descripción o fallback a title
        priority: task.priority || "medium", // Usar prioridad del formulario
        dueDate: task.dueDate || undefined,
        createdById: user.id, // Asignar a este usuario
      });

      if (!apiTask) {
        alert("Error al crear la tarea en la BD. Intenta de nuevo.");
        return;
      }

      // Actualizar la lista local de tareas
      const newTask: GroupTask = {
        id: apiTask.id,
        status: apiTask.status || "pending",
        title: apiTask.title,
        description: apiTask.description,
        priority: apiTask.priority as "low" | "medium" | "high" | undefined,
        assignee: task.assignee,
        dueDate: task.dueDate,
      };

      setTasks((currentTasks) => [...currentTasks, newTask]);
      setIsModalOpen(false);
      
      alert("¡Tarea creada exitosamente!");
      
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Error al crear la tarea. Intenta de nuevo.");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: number) => {
    try {
      setCompletingTask(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const newStatus = task.status === "completed" ? "pending" : "completed";

      // Actualizar en la API
      const updatedTask = await updateTask(taskId, { status: newStatus });

      if (!updatedTask) {
        alert("Error al actualizar la tarea. Intenta de nuevo.");
        return;
      }

      // Actualizar localmente
      setTasks((currentTasks) =>
        currentTasks.map((t) =>
          t.id === taskId
            ? { ...t, status: newStatus }
            : t
        )
      );

    } catch (err) {
      console.error("Error updating task:", err);
      alert("Error al actualizar la tarea. Intenta de nuevo.");
    } finally {
      setCompletingTask(null);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) {
      return;
    }

    try {
      setDeletingTask(taskId);

      // Eliminar de la API
      const success = await deleteTask(taskId);

      if (!success) {
        alert("Error al eliminar la tarea. Intenta de nuevo.");
        return;
      }

      // Eliminar localmente
      setTasks((currentTasks) =>
        currentTasks.filter((t) => t.id !== taskId)
      );

      alert("Tarea eliminada correctamente");

    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Error al eliminar la tarea. Intenta de nuevo.");
    } finally {
      setDeletingTask(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando grupo...</p>
      </div>
    );
  }

  if (!group || error) {
    return (
      <div className="p-6 text-black">
        <Link
          href="/groups"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={16} />
          Volver a los Grupos
        </Link>
        <h1 className="text-2xl font-semibold">{error || "Grupo no encontrado"}</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <Link
              href="/groups"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={16} />
              Volver a los Grupos
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{group.title}</h1>
            <p className="mt-2 text-gray-600">{group.description}</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
          >
            + Nueva Tarea
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-gray-200 pb-4">
          <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
          {["All", ...groupMembers].map((person, index) => (
            <button
              key={`filter-${index}`}
              onClick={() => setSelectedPerson(person)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                selectedPerson === person
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {person === "All" ? "Todas" : person}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-gray-700">Progreso</span>
            <span className="text-gray-600">
              {completed} de {tasks.length} completadas
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">
                {selectedPerson === "All"
                  ? "No hay tareas en este grupo. ¡Crea una nueva!"
                  : `No hay tareas asignadas a ${selectedPerson}`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTasks.map((task, idx) => {
                const date = formatDate(task.dueDate);
                const completedTask = task.status === "completed";
                const isProcessing = completingTask === task.id;

                return (
                  <div
                    key={`task-${task.id}-${idx}`}
                    className="flex items-center gap-4 p-5 hover:bg-gray-50 transition group"
                  >
                    <button
                      onClick={() => handleToggleTaskStatus(task.id)}
                      disabled={isProcessing}
                      className={`shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition ${
                        completedTask
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-red-500"
                      } disabled:opacity-50`}
                    >
                      {completedTask && (
                        <Check size={14} className="text-red-600" />
                      )}
                      {isProcessing && (
                        <Loader2 size={14} className="text-gray-400 animate-spin" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-medium transition ${
                          completedTask
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <UserRound size={13} />
                          {task.assignee}
                        </span>
                        {date && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} />
                            {date}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={deletingTask === task.id}
                      className="shrink-0 opacity-0 group-hover:opacity-100 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                    >
                      {deletingTask === task.id ? (
                        <Loader2 size={14} className="inline animate-spin" />
                      ) : (
                        "Eliminar"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <NewTaskModal
          groupTitle={group.title}
          members={groupMembers}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateTask}
          isLoading={isCreatingTask}
        />
      )}
    </div>
  );
}