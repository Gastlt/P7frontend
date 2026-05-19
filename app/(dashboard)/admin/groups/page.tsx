"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import {
  createGroupMember,
  createTaskGroup,
  fetchAllGroupsDataForAdmin,
  fetchUsers,
  Group,
  User,
} from "@/lib/groupsData";
import ProtectedRoute from "@/components/ProtectedRoute";

type NewGroupModalProps = {
  users: User[];
  isLoading: boolean;
  onClose: () => void;
  onCreate: (name: string, userIds: number[]) => void;
};

function NewGroupModal({
  users,
  isLoading,
  onClose,
  onCreate,
}: NewGroupModalProps) {
  const [name, setName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("El nombre del grupo es requerido");
      return;
    }

    setError("");
    onCreate(trimmedName, selectedUserIds);
  };

  const toggleUser = (userId: number) => {
    setSelectedUserIds((currentIds) =>
      currentIds.includes(userId)
        ? currentIds.filter((id) => id !== userId)
        : [...currentIds, userId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Crear Grupo
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Organiza tareas y miembros en un nuevo espacio de trabajo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
            disabled={isLoading}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nombre del grupo
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej: Equipo de producto"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">
                Integrantes
              </label>
              <span className="text-xs text-gray-500">
                {selectedUserIds.length} seleccionados
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white">
              {users.length > 0 ? (
                users.map((user) => {
                  const checked = selectedUserIds.includes(user.id);

                  return (
                    <label
                      key={user.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-red-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUser(user.id)}
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

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
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
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Crear
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const [selectedPerson, setSelectedPerson] = useState("All");
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [people, setPeople] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const [groupsData, usersData] = await Promise.all([
        fetchAllGroupsDataForAdmin(),
        fetchUsers(),
      ]);

      setGroups(groupsData);
      setUsers(usersData);
      setPeople(["All", ...usersData.map((user) => user.name)]);
      setError(null);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(
        "Error cargando datos. Asegúrate de que el backend esté corriendo en localhost:8080"
      );
      setGroups([]);
      setUsers([]);
      setPeople(["All"]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredGroups = groups.filter((group) => {
    if (selectedPerson === "All") return true;
    return group.members.includes(selectedPerson);
  });

  const handleCreateGroup = async (name: string, userIds: number[]) => {
    try {
      setIsCreatingGroup(true);

      const createdGroup = await createTaskGroup({ name });

      if (!createdGroup) {
        throw new Error("No se pudo crear el grupo");
      }

      const memberResults = await Promise.all(
        userIds.map((userId) => createGroupMember(createdGroup.id, userId))
      );

      if (memberResults.some((member) => member === null)) {
        throw new Error("No se pudieron agregar todos los integrantes");
      }

      setIsCreateModalOpen(false);
      await loadData(false);
      setError(null);
    } catch (err) {
      console.error("Error creating group:", err);
      setError(
        "Error creando el grupo o agregando integrantes. Revisa que el backend esté disponible."
      );
    } finally {
      setIsCreatingGroup(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Cargando grupos...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-black">
                Grupos de Trabajo
              </h1>
              <p className="text-gray-500">
                Maneja las tareas por grupo
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Plus size={16} />
              Crear grupo
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6 rounded-xl border bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-600">Filtrar por persona:</span>

              {people.map((person, index) => (
                <button
                  key={`person-${index}`}
                  onClick={() => setSelectedPerson(person)}
                  className={`rounded-lg px-4 py-1.5 text-sm ${
                    selectedPerson === person
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {person === "All" ? "Todos" : person}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => {
                const percent =
                  group.total > 0 ? (group.progress / group.total) * 100 : 0;

                return (
                  <Link
                    key={group.id}
                    href={`/admin/groups/${group.id}`}
                    className="block rounded-xl border bg-white p-5 shadow-sm transition hover:border-red-200 hover:shadow-md"
                  >
                    <h3 className="font-semibold text-black">
                      {group.title}
                    </h3>

                    <p className="mb-4 text-sm text-gray-500">
                      {group.description}
                    </p>

                    <div className="mb-1 flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>
                        {group.progress} / {group.total}
                      </span>
                    </div>

                    <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-red-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="mb-3 flex gap-4 text-sm text-gray-600">
                      <span>○ {group.members.length}</span>
                      <span>○ {group.total}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      {group.members.slice(0, 5).map((member, memberIndex) => (
                        <span
                          key={`member-${group.id}-${memberIndex}`}
                          className="rounded-md bg-gray-100 px-2 py-1"
                        >
                          {member}
                        </span>
                      ))}

                      {group.members.length > 5 && (
                        <span className="rounded-md bg-gray-100 px-2 py-1">
                          +{group.members.length - 5}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="col-span-2 text-gray-500">
                No hay grupos disponibles para{" "}
                {selectedPerson === "All" ? "todos" : selectedPerson}.
              </p>
            )}
          </div>
        </main>

        {isCreateModalOpen && (
          <NewGroupModal
            users={users}
            isLoading={isCreatingGroup}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateGroup}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}