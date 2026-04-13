"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/lib/api";

export default function CreateTaskPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [listId, setListId] = useState("");
  const [createdById, setCreatedById] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    if (!listId) {
      setError("El listId es obligatorio");
      return;
    }

    if (!createdById) {
      setError("El createdById es obligatorio");
      return;
    }

    try {
      setLoading(true);

      await createTask({
        listId: Number(listId),
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        dueDate: dueDate ? `${dueDate}T00:00:00` : null,
        createdById: Number(createdById),
      });

      router.push("/tasks");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al crear la tarea";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-black">Crear Nueva Tarea</h1>
        <p className="text-gray-600">
          Completa la información para registrar una nueva tarea
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-black"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-black min-h-[120px]"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-black"
                disabled={loading}
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-black"
                disabled={loading}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Fecha de vencimiento
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-black"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">List ID</label>
              <input
                type="number"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                placeholder="Ej. 1"
                className="w-full border rounded-lg px-3 py-2 text-black"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Created By ID</label>
              <input
                type="number"
                value={createdById}
                onChange={(e) => setCreatedById(e.target.value)}
                placeholder="Ej. 1"
                className="w-full border rounded-lg px-3 py-2 text-black"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear tarea"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/tasks")}
              disabled={loading}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}