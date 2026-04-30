"use client";

import { FormEvent, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import type { TodoList, User } from "@/lib/groupsData";

export type NewTaskPayload = {
  listId: number;
  title: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  startDate: string | null;
  dueDate: string | null;
  estimatedHours?: number | null;
  assigneeIds: number[];
};

type NewTaskModalProps = {
  groupTitle: string;
  users: User[];
  todoLists: TodoList[];
  isLoading?: boolean;
  onClose: () => void;
  onCreate: (task: NewTaskPayload) => void;
};

export default function NewTaskModal({
  groupTitle,
  users,
  todoLists,
  isLoading = false,
  onClose,
  onCreate,
}: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [listId, setListId] = useState<number | "">("");
  const [estimatedHours, setEstimatedHours] = useState<number | "">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const toggleAssignee = (userId: number) => {
    setAssigneeIds((currentIds) =>
      currentIds.includes(userId)
        ? currentIds.filter((id) => id !== userId)
        : [...currentIds, userId]
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("El título de la tarea es requerido");
      return;
    }

    if (!listId) {
      setError("Debe seleccionar una lista");
      return;
    }

    if (assigneeIds.length === 0) {
      setError("Debe asignar la tarea a al menos un miembro");
      return;
    }

    if (estimatedHours !== "" && estimatedHours < 0) {
      setError("Las horas estimadas no pueden ser negativas");
      return;
    }

    onCreate({
      listId: Number(listId),
      title: title.trim(),
      description: description.trim() || null,
      priority,
      startDate: startDate || null,
      dueDate: dueDate || null,
      estimatedHours: estimatedHours === "" ? null : Number(estimatedHours),
      assigneeIds,
    });

    setTitle("");
    setDescription("");
    setAssigneeIds([]);
    setDueDate("");
    setPriority("medium");
    setListId("");
    setEstimatedHours("");
    setSuccess("¡Tarea creada exitosamente!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">
          Crear Nueva Tarea
        </h2>

        <p className="mt-1 text-gray-500">
          Agrega una tarea a {groupTitle}
        </p>

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
              placeholder="Añade más detalles"
              className="h-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Lista *
            </label>
            <select
              value={listId}
              onChange={(event) =>
                setListId(event.target.value ? Number(event.target.value) : "")
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              disabled={isLoading || todoLists.length === 0}
            >
              <option value="">
                {todoLists.length === 0
                  ? "No hay listas disponibles"
                  : "Seleccionar lista"}
              </option>

              {todoLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Asignar a *
              </label>

              <span className="text-xs text-gray-500">
                {assigneeIds.length} seleccionados
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white">
              {users.length > 0 ? (
                users.map((user) => {
                  const checked = assigneeIds.includes(user.id);

                  return (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-red-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAssignee(user.id)}
                        className="h-4 w-4 rounded border-gray-300 accent-red-600"
                        disabled={isLoading}
                      />

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-800">
                          {user.name}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {user.email}
                        </span>
                      </span>
                    </label>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500">
                  No hay usuarios disponibles.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as "low" | "medium" | "high")
                }
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                disabled={isLoading}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Horas estimadas
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(event) =>
                  setEstimatedHours(
                    event.target.value === "" ? "" : Number(event.target.value)
                  )
                }
                placeholder="Ej: 4"
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                Fecha de inicio
                </label>
                <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                disabled={isLoading}
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                Fecha de vencimiento
                </label>
                <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                disabled={isLoading}
                />
            </div>
            </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-600">
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
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm text-white hover:bg-red-700 disabled:opacity-50"
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