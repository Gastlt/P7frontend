'use client';

import { Calendar, ChevronLeft, UserRound, Loader2, Check } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { GroupTask,
     Group, 
     fetchAllGroupsDataForAdmin, 
     createTask, 
     updateTask, 
     deleteTask, 
     fetchUsers, 
     createTodoList,
     fetchTodoListsByGroupId,
     createGroupMember,
     createTaskAssignment,
     deleteTaskAssignment,
     deleteTaskAssignmentByTaskAndUser,
     User, } from "@/lib/groupsData";
import Link from "next/link";
import NewTaskModal, {
  type NewTaskPayload,
} from "@/components/NewTaskModal";
import AddMemberModal from "@/components/AddMemberModal";
import { useParams } from "next/navigation";
import type { TodoList } from "@/lib/groupsData";
import { getUser } from "@/lib/session";

// MODAL DE NUEVA TAREA


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
  const [users, setUsers] = useState<User[]>([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [createListError, setCreateListError] = useState("");
  const [editingTask, setEditingTask] = useState<GroupTask | null>(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [editTaskError, setEditTaskError] = useState("");
  const [originalEditAssigneeIds, setOriginalEditAssigneeIds] = useState<number[]>([]);

const [editTaskForm, setEditTaskForm] = useState({
  title: "",
  description: "",
  priority: "medium" as "low" | "medium" | "high",
  status: "pending" as "pending" | "in_progress" | "completed",
  dueDate: "",
  estimatedHours: "",
  listId: "",
  assigneeIds: [] as number[],
});

  const [listForm, setListForm] = useState({
  name: "",
  groupId: "",
  });

  // Load data on mount
  useEffect(() => {
  const loadGroup = async () => {
    try {
      setLoading(true);

      const [groups, usersData, groupTodoLists] = await Promise.all([
        fetchAllGroupsDataForAdmin(),
        fetchUsers(),
        fetchTodoListsByGroupId(Number(params.id)),
      ]);

      const foundGroup = groups.find((item) => item.id === Number(params.id));

      setUsers(usersData);
      setTodoLists(groupTodoLists);

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
      setError("Error cargando el grupo.");
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

 const openEditTaskModal = (task: GroupTask) => {
  setEditingTask(task);
  setEditTaskError("");

  const assigneeNames = task.assignee
    ? task.assignee.split(",").map((name) => name.trim())
    : [];

  const currentAssigneeIds = users
    .filter((user) => assigneeNames.includes(user.name))
    .map((user) => user.id);

  setOriginalEditAssigneeIds(currentAssigneeIds);

  setEditTaskForm({
    title: task.title || "",
    description: task.description || "",
    priority: task.priority || "medium",
    status: task.status || "pending",
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    estimatedHours:
      task.estimatedHours != null ? String(task.estimatedHours) : "",
    listId: task.listId != null ? String(task.listId) : "",
    assigneeIds: currentAssigneeIds,
  });
};

const toggleEditAssignee = (userId: number) => {
  setEditTaskForm((current) => {
    const alreadySelected = current.assigneeIds.includes(userId);

    return {
      ...current,
      assigneeIds: alreadySelected
        ? current.assigneeIds.filter((id) => id !== userId)
        : [...current.assigneeIds, userId],
    };
  });
};

const handleUpdateTask = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!editingTask) return;

  try {
    setIsUpdatingTask(true);
    setEditTaskError("");

    if (!editTaskForm.title.trim()) {
      setEditTaskError("El título de la tarea es obligatorio.");
      return;
    }

    const estimatedHoursValue =
      editTaskForm.estimatedHours.trim() === ""
        ? null
        : Number(editTaskForm.estimatedHours);

    const listIdValue = editTaskForm.listId
      ? Number(editTaskForm.listId)
      : editingTask.listId;

    const updatedTask = await updateTask(editingTask.id, {
      title: editTaskForm.title.trim(),
      description: editTaskForm.description.trim() || undefined,
      priority: editTaskForm.priority,
      status: editTaskForm.status,
      dueDate: editTaskForm.dueDate
        ? `${editTaskForm.dueDate}T00:00:00`
        : undefined,
      estimatedHours: estimatedHoursValue,
      listId: listIdValue,
    });

    if (!updatedTask) {
      setEditTaskError("No se pudo actualizar la tarea.");
      return;
    }

    const selectedAssigneeIds = editTaskForm.assigneeIds;

const assigneeIdsToAdd = selectedAssigneeIds.filter(
  (id) => !originalEditAssigneeIds.includes(id)
);

const assigneeIdsToDelete = originalEditAssigneeIds.filter(
  (id) => !selectedAssigneeIds.includes(id)
);

const deleteResults = await Promise.all(
  assigneeIdsToDelete.map((userId) =>
    deleteTaskAssignmentByTaskAndUser(editingTask.id, userId)
  )
);

const addResults = await Promise.all(
  assigneeIdsToAdd.map((userId) =>
    createTaskAssignment(editingTask.id, userId)
  )
);

if (deleteResults.some((result) => result === false)) {
  setEditTaskError(
    "La tarea se actualizó, pero no se pudieron eliminar algunos asignados."
  );
  return;
}

if (addResults.some((result) => result === null)) {
  setEditTaskError(
    "La tarea se actualizó, pero no se pudieron agregar algunos asignados."
  );
  return;
}

    setTasks((currentTasks) =>
      currentTasks.map((task): GroupTask => {
        if (task.id !== editingTask.id) {
          return task;
        }

        const selectedList = todoLists.find(
          (list) => list.id === listIdValue
        );

        return {
          ...task,
          title: editTaskForm.title.trim(),
          description: editTaskForm.description.trim() || "",
          priority: editTaskForm.priority,
          status: editTaskForm.status,
          dueDate: editTaskForm.dueDate
            ? `${editTaskForm.dueDate}T00:00:00`
            : null,
          estimatedHours: estimatedHoursValue,
          listId: listIdValue,
          todoListName: selectedList?.name ?? task.todoListName,
        };
      })
    );

    setEditingTask(null);
  } catch (err) {
    console.error("Error updating task:", err);
    setEditTaskError("Error al guardar los cambios.");
  } finally {
    setIsUpdatingTask(false);
  }
};

  const handleCreateTodoList = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  try {
    setCreatingList(true);
    setCreateListError("");

    if (!listForm.name.trim()) {
      setCreateListError("El nombre de la lista es obligatorio.");
      return;
    }

    if (!listForm.groupId) {
      setCreateListError("Selecciona un grupo.");
      return;
    }

    const sessionUser = getUser();

  const createdList = await createTodoList({
    name: listForm.name.trim(),
    groupId: Number(listForm.groupId),
    createdById: sessionUser?.userId,
});

setTodoLists((current) => [...current, createdList]);

    setListForm({
      name: "",
      groupId: "",
    });

    setShowCreateList(false);

  } catch (err) {
    console.error("Error creating todo list:", err);
    setCreateListError("No se pudo crear la lista.");
  } finally {
    setCreatingList(false);
  }
};

  const handleCreateTask = async (task: NewTaskPayload) => {
  try {
    setIsCreatingTask(true);

    if (!group) {
      alert("Error: Grupo no encontrado");
      return;
    }

    const apiTask = await createTask({
      listId: task.listId,
      title: task.title,
      description: task.description || task.title,
      priority: task.priority || "medium",
      startDate: task.startDate,
      dueDate: task.dueDate || undefined,
      estimatedHours: task.estimatedHours ?? undefined,
    });

    if (!apiTask) {
      alert("Error al crear la tarea en la BD. Intenta de nuevo.");
      return;
    }

    const assignmentResults = await Promise.all(
      task.assigneeIds.map((userId) =>
        createTaskAssignment(apiTask.id, userId)
      )
    );

    if (assignmentResults.some((assignment) => assignment === null)) {
      alert("La tarea se creó, pero no se pudieron asignar todos los usuarios.");
    }

    const selectedUsers = users.filter((user) =>
      task.assigneeIds.includes(user.id)
    );

    const selectedList = todoLists.find((list) => list.id === task.listId);

    const newTask: GroupTask = {
      id: apiTask.id,
      status: apiTask.status || "pending",
      title: apiTask.title,
      description: apiTask.description,
      priority: apiTask.priority as "low" | "medium" | "high" | undefined,
      assignee:
        selectedUsers.length > 0
          ? selectedUsers.map((user) => user.name).join(", ")
          : "Unassigned",
      dueDate: task.dueDate,
      startDate: task.startDate,
      listId: task.listId,
      todoListName: selectedList?.name,
      estimatedHours: task.estimatedHours ?? null,
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


  const handleAddMember = async (userId: number) => {
    try {
        setIsAddingMember(true);

        if (!group) {
        alert("Error: Grupo no encontrado");
        return;
        }

        const addedMember = await createGroupMember(group.id, userId);

        if (!addedMember) {
        alert("Error al agregar integrante. Intenta de nuevo.");
        return;
        }

        const addedUser = users.find((user) => user.id === userId);

        if (addedUser) {
        setGroup((currentGroup) => {
            if (!currentGroup) return currentGroup;

            return {
            ...currentGroup,
            members: [...currentGroup.members, addedUser.name],
            };
        });
        }

        setIsAddMemberModalOpen(false);
    } catch (err) {
        console.error("Error adding group member:", err);
        alert("Error al agregar integrante. Intenta de nuevo.");
    } finally {
        setIsAddingMember(false);
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-600 dark:text-slate-400">Cargando grupo...</p>
      </div>
    );
  }

  if (!group || error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-white">
        <Link
          href="/admin/groups"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ChevronLeft size={16} />
          Volver a los Grupos
        </Link>
        <h1 className="text-2xl font-semibold">{error || "Grupo no encontrado"}</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-start justify-between border-b border-slate-200 pb-6 dark:border-slate-800">
          <div>
            <Link
              href="/admin/groups"
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              <ChevronLeft size={16} />
              Volver a los Grupos
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{group.title}</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">{group.description}</p>
          </div>

          <div className="flex gap-3">
                <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="rounded-lg border border-red-200 bg-white px-6 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                    + Agregar integrante
                </button>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                >
                    + Nueva Tarea
                </button>
                <button
                   onClick={() => {
                      setListForm({
                        name: "",
                        groupId: String(group.id),
                      });
                      setCreateListError("");
                      setShowCreateList(true);
                    }}
                  className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                >
                  + Nueva lista
                </button>
            </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filtrar por:</span>
          {["All", ...groupMembers].map((person, index) => (
            <button
              key={`filter-${index}`}
              onClick={() => setSelectedPerson(person)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                selectedPerson === person
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {person === "All" ? "Todas" : person}
            </button>
          ))}
        </div>

        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Progreso</span>
            <span className="text-slate-600 dark:text-slate-400">
              {completed} de {tasks.length} completadas
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400">
                {selectedPerson === "All"
                  ? "No hay tareas en este grupo. ¡Crea una nueva!"
                  : `No hay tareas asignadas a ${selectedPerson}`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredTasks.map((task, idx) => {
                const date = formatDate(task.dueDate);
                const completedTask = task.status === "completed";
                const isProcessing = completingTask === task.id;

                return (
                  <div
                    key={`task-${task.id}-${idx}`}
                    onClick={() => openEditTaskModal(task)}
                    className="flex cursor-pointer items-center gap-4 p-5 hover:bg-gray-50 transition group"
                  >
                    <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTaskStatus(task.id);
                        }}
                      disabled={isProcessing}
                      className={`shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition ${
                        completedTask
                          ? "border-red-500 bg-red-50"
                          : "border-slate-300 hover:border-red-500 dark:border-slate-600"
                      } disabled:opacity-50`}
                    >
                      {completedTask && (
                        <Check size={14} className="text-red-600" />
                      )}
                      {isProcessing && (
                        <Loader2 size={14} className="animate-spin text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-sm font-medium transition ${
                          completedTask
                            ? "text-slate-400 line-through dark:text-slate-500"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {task.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                      disabled={deletingTask === task.id}
                      className="shrink-0 rounded px-3 py-1 text-xs text-red-600 opacity-0 transition hover:bg-red-50 group-hover:opacity-100 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/40"
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

      {showCreateList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Crear lista
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Crea una nueva lista de tareas para este grupo.
              </p>
            </div>

            {createListError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {createListError}
              </div>
            )}

            <form onSubmit={handleCreateTodoList} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre de la lista
                </label>

                <input
                  type="text"
                  value={listForm.name}
                  onChange={(e) =>
                    setListForm((current) => ({
                      ...current,
                      name: e.target.value,
                      groupId: String(group.id),
                    }))
                  }
                  placeholder="Ej. Backlog, Pendientes, General"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                Grupo: <span className="font-medium text-gray-900">{group.title}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateList(false);
                    setCreateListError("");
                    setListForm({
                      name: "",
                      groupId: "",
                    });
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={creatingList}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {creatingList && <Loader2 size={16} className="animate-spin" />}
                  {creatingList ? "Creando..." : "Crear lista"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTask && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Editar tarea
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Actualiza la información de la tarea seleccionada.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setEditTaskError("");
          }}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
        >
          ×
        </button>
      </div>

      {editTaskError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {editTaskError}
        </div>
      )}

      <form onSubmit={handleUpdateTask} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Título
          </label>
          <input
            type="text"
            value={editTaskForm.title}
            onChange={(e) =>
              setEditTaskForm((current) => ({
                ...current,
                title: e.target.value,
              }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            value={editTaskForm.description}
            onChange={(e) =>
              setEditTaskForm((current) => ({
                ...current,
                description: e.target.value,
              }))
            }
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Prioridad
            </label>
            <select
              value={editTaskForm.priority}
              onChange={(e) =>
                setEditTaskForm((current) => ({
                  ...current,
                  priority: e.target.value as "low" | "medium" | "high",
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              value={editTaskForm.status}
              onChange={(e) =>
                setEditTaskForm((current) => ({
                  ...current,
                  status: e.target.value as
                    | "pending"
                    | "in_progress"
                    | "completed",
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
            >
              <option value="pending">Pendiente</option>
              <option value="in_progress">En progreso</option>
              <option value="completed">Completada</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Fecha límite
            </label>
            <input
              type="date"
              value={editTaskForm.dueDate}
              onChange={(e) =>
                setEditTaskForm((current) => ({
                  ...current,
                  dueDate: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Horas estimadas
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={editTaskForm.estimatedHours}
              onChange={(e) =>
                setEditTaskForm((current) => ({
                  ...current,
                  estimatedHours: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Lista
          </label>
          <select
            value={editTaskForm.listId}
            onChange={(e) =>
              setEditTaskForm((current) => ({
                ...current,
                listId: e.target.value,
              }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500"
          >
            <option value="">Mantener lista actual</option>
            {todoLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </div>

        <div>
  <div className="mb-1 flex items-center justify-between">
    <label className="block text-sm font-medium text-gray-700">
      Asignar a *
    </label>

    <span className="text-xs text-gray-500">
      {editTaskForm.assigneeIds.length} seleccionados
    </span>
  </div>

  <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
    {users
      .filter((user) => group.members.includes(user.name))
      .map((user) => {
        const checked = editTaskForm.assigneeIds.includes(user.id);

        return (
          <label
            key={user.id}
            className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-3 last:border-b-0 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleEditAssignee(user.id)}
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />

            <div>
              <p className="text-sm font-medium text-gray-900">
                {user.name}
              </p>
              <p className="text-xs text-gray-500">
                {user.email}
              </p>
            </div>
          </label>
        );
      })}
  </div>
</div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setEditTaskError("");
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isUpdatingTask}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUpdatingTask && <Loader2 size={16} className="animate-spin" />}
            {isUpdatingTask ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {isModalOpen && (
        <NewTaskModal
        groupTitle={group.title}
        users={users.filter((user) => group.members.includes(user.name))}
        todoLists={todoLists}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateTask}
        isLoading={isCreatingTask}
        />
      )}

      {isAddMemberModalOpen && group && (
        <AddMemberModal
            users={users}
            currentMembers={group.members}
            isLoading={isAddingMember}
            onClose={() => setIsAddMemberModalOpen(false)}
            onAdd={handleAddMember}
        />
        )}
    </div>
  );
}
