import { getToken } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

/**
 * Get authorization headers with the access token
 */
function getAuthHeaders() {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = getToken() || localStorage.getItem("accessToken");
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
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo crear la tarea");
  }

  return response.json();
}

export type Group = {
  id: number;
  title: string;
  description: string;
  progress: number;
  total: number;
  members: string[];
};

export type TodoListDTO = {
  id: number;
  name: string;
};

export async function getUserGroups(): Promise<Group[]> {
  const response = await fetch(`${API_BASE_URL}/groups/user`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("getUserGroups failed:", response.status, response.statusText, errorText);
    throw new Error(`Error al obtener los grupos: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getTodoListsByGroup(groupId: number): Promise<TodoListDTO[]> {
  const response = await fetch(`${API_BASE_URL}/todolists/group/${groupId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudieron cargar las listas del grupo");
  }

  return response.json();
}

export async function updateTaskStatus(
  taskId: number,
  status: "pending" | "in_progress" | "completed"
): Promise<TaskDTO> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Error al actualizar el estado de la tarea");
  }

  return response.json();
}