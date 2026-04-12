"use client";

import { useState } from "react";

type Group = {
  id: number;
  title: string;
  description: string;
  progress: number;
  total: number;
  members: string[];
};

const people = [
  "All",
  "Alice Johnson",
  "Bob Smith",
  "Carol White",
  "David Brown",
];

const mockGroups: Group[] = [
  {
    id: 1,
    title: "Marketing Campaign",
    description: "prueba",
    progress: 1,
    total: 4,
    members: ["Alice", "Bob", "Carol", "David", "Emma", "Grace", "Henry", "Frank"],
  },
  {
    id: 2,
    title: "Frontend Revamp",
    description: "Website UI refresh",
    progress: 1,
    total: 4,
    members: ["Alice", "Bob", "Carol", "David", "Emma", "Grace", "Henry", "Frank"],
  },
  {
    id: 3,
    title: "Customer Onboarding",
    description: "New user setup workflow",
    progress: 1,
    total: 4,
    members: ["Alice", "Bob", "Carol", "David", "Emma", "Grace", "Henry", "Frank"],
  },
  {
    id: 4,
    title: "Ops Automation",
    description: "Internal workflow improvements",
    progress: 1,
    total: 4,
    members: ["Alice", "Bob", "Carol", "David", "Emma", "Grace", "Henry", "Frank"],
  },
];

export default function GroupsPage() {
  const [selectedPerson, setSelectedPerson] = useState("All");

  return (
    <div className="flex min-h-screen bg-gray-50">
 

      {/* Main */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl text-black font-semibold">Grupos de Trabajo</h1>
        <p className="text-gray-500 mb-6">Maneja las tareas por grupo</p>

        {/* Filter */}
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

        {/* Cards */}
        <div className="grid grid-cols-2 gap-6">
          {mockGroups.map((group) => {
            const percent = (group.progress / group.total) * 100;

            return (
              <div
                key={group.id}
                className="bg-white border rounded-xl p-5 shadow-sm"
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
                  <span>○ 1</span>
                  <span>○ 3</span>
                </div>

                {/* Members */}
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  {group.members.map((member) => (
                    <span
                      key={member}
                      className="px-2 py-1 bg-gray-100 rounded-md"
                    >
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}