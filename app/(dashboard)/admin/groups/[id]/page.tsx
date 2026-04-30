'use client';

import { Calendar, ChevronLeft, UserRound, Loader2, Check } from "lucide-react";
import { FormEvent, useMemo, useState, useEffect } from "react";
import { GroupTask,
     Group, 
     fetchAllGroupsDataForAdmin, 
     createTask, 
     updateTask, 
     deleteTask, 
     fetchUsers, 
     fetchTodoListsByGroupId,
     createGroupMember,
     createTaskAssignment,
     User, } from "@/lib/groupsData";
import Link from "next/link";
import NewTaskModal, {
  type NewTaskPayload,
} from "@/components/NewTaskModal";
import AddMemberModal from "@/components/AddMemberModal";
import { useParams } from "next/navigation";
import type { TodoList } from "@/lib/groupsData";

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando grupo...</p>
      </div>
    );
  }

  if (!group || error) {
    return (
      <div className="p-6 text-black">
        <Link
          href="/admin/groups"
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
              href="/admin/groups"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft size={16} />
              Volver a los Grupos
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{group.title}</h1>
            <p className="mt-2 text-gray-600">{group.description}</p>
          </div>

          <div className="flex gap-3">
                <button
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="rounded-lg border border-red-200 bg-white px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                    + Agregar integrante
                </button>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                >
                    + Nueva Tarea
                </button>
            </div>
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