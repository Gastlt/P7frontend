"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { User } from "@/lib/groupsData";

type AddMemberModalProps = {
  users: User[];
  currentMembers: string[];
  isLoading?: boolean;
  onClose: () => void;
  onAdd: (userId: number) => void;
};

export default function AddMemberModal({
  users,
  currentMembers,
  isLoading = false,
  onClose,
  onAdd,
}: AddMemberModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const availableUsers = useMemo(() => {
    return users.filter((user) => !currentMembers.includes(user.name));
  }, [users, currentMembers]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUserId) {
      setError("Selecciona un usuario");
      return;
    }

    setError("");
    onAdd(selectedUserId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Agregar integrante
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Selecciona un usuario para asignarlo a este grupo.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Usuario
            </label>

            <select
              value={selectedUserId ?? ""}
              onChange={(event) =>
                setSelectedUserId(Number(event.target.value))
              }
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              disabled={isLoading || availableUsers.length === 0}
            >
              <option value="">
                {availableUsers.length === 0
                  ? "No hay usuarios disponibles"
                  : "Seleccionar usuario"}
              </option>

              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.email}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              disabled={isLoading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              disabled={isLoading || availableUsers.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Agregando...
                </>
              ) : (
                "Agregar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
