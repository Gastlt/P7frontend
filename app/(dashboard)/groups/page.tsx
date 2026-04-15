"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchAllGroupsData, fetchPeople, Group } from "./groupsData";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function GroupsPage() {
  const [selectedPerson, setSelectedPerson] = useState("All");
  const [groups, setGroups] = useState<Group[]>([]);
  const [people, setPeople] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [groupsData, peopleData] = await Promise.all([
          fetchAllGroupsData(),
          fetchPeople(),
        ]);
        setGroups(groupsData);
        setPeople(peopleData);
        setError(null);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Error cargando datos. Asegúrate de que el backend esté corriendo en localhost:8080");
        setGroups([]);
        setPeople(["All"]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredGroups = groups.filter((group) => {
    if (selectedPerson === "All") return true;
    return group.members.includes(selectedPerson);
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <p className="text-gray-600">Cargando grupos...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
    <div className="flex min-h-screen bg-gray-50">
      {/* Main */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl text-black font-semibold">Grupos de Trabajo</h1>
        <p className="text-gray-500 mb-6">Maneja las tareas por grupo</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="bg-white border rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-gray-600">Filtrar por persona:</span>

            {people.map((person, index) => (
              <button
                key={`person-${index}`}
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

        {/* Cards */}
        <div className="grid grid-cols-2 gap-6">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => {
              const percent = group.total > 0 ? (group.progress / group.total) * 100 : 0;

              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="bg-white border rounded-xl p-5 shadow-sm block hover:border-red-200 hover:shadow-md transition"
                >
                  <h3 className="font-semibold text-black">{group.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {group.description}
                  </p>

                  {/* Progress */}
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

                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-gray-600 mb-3">
                    <span>○ {group.members.length}</span>
                    <span>○ {group.total}</span>
                  </div>

                  {/* Members */}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {group.members.slice(0, 5).map((member, memberIndex) => (
                      <span
                        key={`member-${group.id}-${memberIndex}`}
                        className="px-2 py-1 bg-gray-100 rounded-md"
                      >
                        {member}
                      </span>
                    ))}
                    {group.members.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 rounded-md">
                        +{group.members.length - 5}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="text-gray-500 col-span-2">
              No hay grupos disponibles para {selectedPerson}.
            </p>
          )}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
