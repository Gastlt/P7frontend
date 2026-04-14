"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, ChevronLeft, UserRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { GroupTask, mockGroups, people } from "../groupsData";

type NewTaskModalProps = {
  groupTitle: string;
  members: string[];
  onClose: () => void;
  onCreate: (task: Omit<GroupTask, "id" | "status">) => void;
};

function NewTaskModal({
  groupTitle,
  members,
  onClose,
  onCreate,
}: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    if (!assignee) {
      setError("Assign a member before creating the task");
      return;
    }

    onCreate({
      title: title.trim(),
      assignee,
      dueDate: dueDate || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
        <p className="mt-1 text-gray-500">Add a new task to {groupTitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm text-gray-700">
              Task Title *
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter task title"
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-700">
              Assign to *
            </label>
            <select
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-red-500"
            >
              <option value="">Select a member</option>
              {members.map((member) => (
                <option key={member} value={member}>
                  {member}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-700">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-red-500"
            />
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
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-lg bg-red-600 text-sm text-white hover:bg-red-700"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const group = mockGroups.find((item) => item.id === Number(params.id));
  const [selectedPerson, setSelectedPerson] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tasks, setTasks] = useState<GroupTask[]>(group?.tasks ?? []);

  const groupMembers = useMemo(() => {
    if (!group) return [];
    const names = group.members.map((member) => {
      const fullName = people.find((person) => person.startsWith(member));
      return fullName ?? member;
    });
    return Array.from(new Set(names));
  }, [group]);

  const filteredTasks = useMemo(() => {
    if (selectedPerson === "All") return tasks;
    return tasks.filter((task) => task.assignee === selectedPerson);
  }, [selectedPerson, tasks]);

  const completed = tasks.filter((task) => task.status === "completed").length;
  const percent = tasks.length === 0 ? 0 : (completed / tasks.length) * 100;

  const formatDate = (date: string | null) => {
    if (!date) return null;

    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  };

  const handleCreateTask = (task: Omit<GroupTask, "id" | "status">) => {
    setTasks((currentTasks) => [
      ...currentTasks,
      {
        id: Date.now(),
        status: "pending",
        ...task,
      },
    ]);
    setIsModalOpen(false);
  };

  if (!group) {
    return (
      <div className="p-6 text-black">
        <Link
          href="/groups"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft size={16} />
          Volver a los Grupos
        </Link>
        <h1 className="text-2xl font-semibold">Grupo no encontrado</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mb-5 flex items-start justify-between border-b border-gray-200 pb-5">
        <div>
          <Link
            href="/groups"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={16} />
            Volver a los Grupos
          </Link>
          <h1 className="text-2xl font-semibold">{group.title}</h1>
          <p className="mt-1 text-sm text-gray-500">{group.description}</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          New Task
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-gray-200 pb-4">
        <span className="text-sm text-gray-700">Filter by person:</span>
        {["All", ...groupMembers].map((person) => (
          <button
            key={person}
            onClick={() => setSelectedPerson(person)}
            className={`rounded-lg px-4 py-1.5 text-sm ${
              selectedPerson === person
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {person}
          </button>
        ))}
      </div>

      <div className="mb-4 w-full max-w-3xl">
        <div className="mb-1 flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>
            {completed} / {tasks.length}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-red-600"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-gray-200 bg-white">
        {filteredTasks.length === 0 ? (
          <div className="p-5 text-sm text-gray-500">
            No tasks found for this filter.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const date = formatDate(task.dueDate);
            const completedTask = task.status === "completed";

            return (
              <div
                key={task.id}
                className="flex gap-4 border-b border-gray-100 p-4 last:border-b-0"
              >
                <div
                  className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${
                    completedTask
                      ? "border-red-500 bg-red-50"
                      : "border-gray-400"
                  }`}
                />
                <div>
                  <h2
                    className={`text-sm font-medium ${
                      completedTask
                        ? "text-gray-400 line-through"
                        : "text-gray-900"
                    }`}
                  >
                    {task.title}
                  </h2>
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
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <NewTaskModal
          groupTitle={group.title}
          members={groupMembers}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateTask}
        />
      )}
    </div>
  );
}
