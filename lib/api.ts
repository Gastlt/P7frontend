const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

/**
 * Get authorization headers with the access token
 */
function getAuthHeaders() {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}



export async function getTasks() {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}

export type CreateTaskRequest = {
  listId: number;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  createdById: number;
};

export type TaskDTO = {
  id: number;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  createdAt: string;
  assigneeName: string | null;
  groupName: string | null;
  todoListName: string | null;
};

export async function createTask(payload: CreateTaskRequest): Promise<TaskDTO> {
  const response = await fetch("http://localhost:8080/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo crear la tarea");
  }

  return response.json();
}