"use client";

import {
  ApiUser,
  createTaskGroup,
  deleteTaskGroup,
  getTaskGroupSummaries,
  getUsers,
} from "@/lib/api";
import Link from "next/link";
import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { Group, taskGroupSummaryToGroup } from "./groupsData";

type CreateGroupModalProps = {
  users: ApiUser[];
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    description: string | null;
    createdById: number;
    memberIds: number[];
  }) => Promise<void>;
};

function CreateGroupModal({ users, onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createdById, setCreatedById] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedMemberIdSet = useMemo(
    () => new Set(selectedMemberIds),
    [selectedMemberIds]
  );

  const handleCreatorChange = (value: string) => {
    setCreatedById(value);
    if (!value) return;

    const creatorId = Number(value);
    setSelectedMemberIds((currentIds) =>
      currentIds.includes(creatorId) ? currentIds : [...currentIds, creatorId]
    );
  };

  const handleMemberToggle = (userId: number) => {
    const creatorId = Number(createdById);
    if (userId === creatorId) return;

    setSelectedMemberIds((currentIds) =>
      currentIds.includes(userId)
        ? currentIds.filter((id) => id !== userId)
        : [...currentIds, userId]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre del grupo es obligatorio");
      return;
    }

    if (!createdById) {
      setError("Selecciona quien crea el grupo");
      return;
    }

    try {
      setSaving(true);
      await onCreate({
        name: name.trim(),
        description: description.trim() || null,
        createdById: Number(createdById),
        memberIds: selectedMemberIds,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo crear el grupo";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">Crear Grupo</h2>
        <p className="mt-1 text-gray-500">Agrega un nuevo grupo de trabajo</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-700">
              Nombre *
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre del grupo"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-red-500"
              disabled={saving}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-700">
              Descripcion
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe el grupo"
              className="min-h-24 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-500"
              disabled={saving}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-700">
              Creado por *
            </label>
            <select
              value={createdById}
              onChange={(event) => handleCreatorChange(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-red-500"
              disabled={saving}
            >
              <option value="">Selecciona un usuario</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-700">
              Miembros del grupo
            </label>
            <div className="max-h-44 overflow-y-auto rounded-lg border border-gray-300 p-2">
              {users.map((user) => {
                const isCreator = user.id === Number(createdById);
                const checked = selectedMemberIdSet.has(user.id);

                return (
                  <label
                    key={user.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleMemberToggle(user.id)}
                      disabled={saving || isCreator}
                      className="h-4 w-4 accent-red-600"
                    />
                    <span>{user.name}</span>
                    {isCreator && (
                      <span className="ml-auto text-xs text-gray-400">
                        creador
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              El creador se agrega automaticamente como miembro.
            </p>
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
              className="h-10 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-10 rounded-lg bg-red-600 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Creando..." : "Crear Grupo"}
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
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        setError("");
        const [data, userData] = await Promise.all([
          getTaskGroupSummaries(),
          getUsers(),
        ]);
        setGroups(data.map(taskGroupSummaryToGroup));
        setUsers(userData);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar los grupos");
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  const handleCreateGroup = async (payload: {
    name: string;
    description: string | null;
    createdById: number;
    memberIds: number[];
  }) => {
    const created = await createTaskGroup(payload);
    setGroups((currentGroups) => [
      ...currentGroups,
      taskGroupSummaryToGroup(created),
    ]);
    setSelectedPerson("All");
    setIsCreateOpen(false);
  };

  const handleDeleteGroup = async (
    event: MouseEvent<HTMLButtonElement>,
    group: Group
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDeleteError("");

    const confirmed = window.confirm(
      `Eliminar el grupo "${group.title}"? Esta accion tambien elimina sus listas, tareas y miembros.`
    );

    if (!confirmed) return;

    try {
      await deleteTaskGroup(group.id);
      setGroups((currentGroups) =>
        currentGroups.filter((item) => item.id !== group.id)
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar el grupo";
      setDeleteError(message);
    }
  };

  const people = useMemo(() => {
    const members = groups.flatMap((group) => group.members);
    return ["All", ...Array.from(new Set(members))];
  }, [groups]);

  const filteredGroups = useMemo(() => {
    if (selectedPerson === "All") return groups;
    return groups.filter((group) => group.members.includes(selectedPerson));
  }, [groups, selectedPerson]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="flex-1 p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl text-black font-semibold">
              Grupos de Trabajo
            </h1>
            <p className="text-gray-500">Maneja las tareas por grupo</p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Nuevo Grupo
          </button>
        </div>

        <div className="bg-white border rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-gray-600">Filtrar por persona:</span>

            {people.map((person) => (
              <button
                key={person}
                onClick={() => setSelectedPerson(person)}
                className={`px-4 py-1.5 rounded-lg text-sm text-gray-600 ${
                  selectedPerson === person
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {person}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border bg-white p-6 text-gray-600">
            Cargando grupos...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
            {error}
          </div>
        )}

        {deleteError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {deleteError}
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="rounded-xl border bg-white p-6 text-gray-600">
            No existen grupos de trabajo.
          </div>
        )}

        {!loading && !error && groups.length > 0 && filteredGroups.length === 0 && (
          <div className="rounded-xl border bg-white p-6 text-gray-600">
            No hay grupos para este filtro.
          </div>
        )}

        {!loading && !error && filteredGroups.length > 0 && (
          <div className="grid grid-cols-2 gap-6">
            {filteredGroups.map((group) => {
              const percent =
                group.total === 0 ? 0 : (group.progress / group.total) * 100;

              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="relative bg-white border rounded-xl p-5 shadow-sm block hover:border-red-200 hover:shadow-md transition"
                >
                  <button
                    type="button"
                    onClick={(event) => handleDeleteGroup(event, group)}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Eliminar ${group.title}`}
                  >
                    x
                  </button>

                  <h3 className="font-semibold text-black">{group.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {group.description}
                  </p>

                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>
                      {group.progress} / {group.total}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span>Done {group.progress}</span>
                    <span>Open {Math.max(group.total - group.progress, 0)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {group.members.length === 0 ? (
                      <span className="px-2 py-1 bg-gray-100 rounded-md">
                        Sin miembros
                      </span>
                    ) : (
                      group.members.map((member) => (
                        <span
                          key={member}
                          className="px-2 py-1 bg-gray-100 rounded-md"
                        >
                          {member}
                        </span>
                      ))
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {isCreateOpen && (
          <CreateGroupModal
            users={users}
            onClose={() => setIsCreateOpen(false)}
            onCreate={handleCreateGroup}
          />
        )}
      </main>
    </div>
  );
}
