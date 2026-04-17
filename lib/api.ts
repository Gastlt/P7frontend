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

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to login");
  }

  return response.json();
}

/**
 * Sign up new user
 */
export async function signupUser(data: {
  email: string;
  password: string;
  phone: string;
}) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to sign up");
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return response.json();
}

/**
 * Logout user
 */
export async function logoutUser() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    console.error("Failed to logout");
  }

  return response.ok;
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

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  password?: string;
  createdAt: string | null;
};

export async function getUsers(): Promise<ApiUser[]> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return response.json();
}

export type ApiTaskGroup = {
  id: number;
  name: string;
  description: string | null;
  createdBy: ApiUser | null;
  createdAt: string | null;
};

export type ApiGroupMember = {
  id: number;
  name: string;
  role: string | null;
};

export type ApiGroupTask = {
  id: number;
  title: string;
  status: "pending" | "in_progress" | "completed" | null;
  dueDate: string | null;
  assignees: ApiGroupMember[];
};

export type ApiTaskGroupSummary = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string | null;
  createdBy: ApiGroupMember | null;
  completedTasks: number;
  totalTasks: number;
  members: ApiGroupMember[];
};

export type ApiTaskGroupDetail = ApiTaskGroupSummary & {
  tasks: ApiGroupTask[];
};

export async function getTaskGroups(): Promise<ApiTaskGroup[]> {
  const response = await fetch(`${API_BASE_URL}/taskgroups`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch task groups");
  }

  return response.json();
}

export async function getTaskGroupSummaries(): Promise<ApiTaskGroupSummary[]> {
  const response = await fetch(`${API_BASE_URL}/taskgroups/summary`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch task group summaries");
  }

  return response.json();
}

export async function getTaskGroupById(id: number): Promise<ApiTaskGroup> {
  const response = await fetch(`${API_BASE_URL}/taskgroups/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch task group");
  }

  return response.json();
}

export async function getTaskGroupDetail(id: number): Promise<ApiTaskGroupDetail> {
  const response = await fetch(`${API_BASE_URL}/taskgroups/${id}/detail`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch task group detail");
  }

  return response.json();
}

export type CreateGroupTaskRequest = {
  title: string;
  dueDate?: string | null;
  assigneeId: number;
};

export async function createGroupTask(
  groupId: number,
  payload: CreateGroupTaskRequest
): Promise<ApiGroupTask> {
  const response = await fetch(`${API_BASE_URL}/taskgroups/${groupId}/tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...payload,
      dueDate: payload.dueDate ? `${payload.dueDate}T00:00:00` : null,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo crear la tarea");
  }

  return response.json();
}

export async function updateTaskStatus(
  taskId: number,
  status: "pending" | "completed"
): Promise<TaskDTO> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo actualizar la tarea");
  }

  return response.json();
}

export async function deleteTask(taskId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo eliminar la tarea");
  }
}

export type CreateTaskGroupRequest = {
  name: string;
  description?: string | null;
  createdById: number;
  memberIds?: number[];
};

export async function createTaskGroup(
  payload: CreateTaskGroupRequest
): Promise<ApiTaskGroupSummary> {
  const response = await fetch(`${API_BASE_URL}/taskgroups`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo crear el grupo");
  }

  return response.json();
}

export async function deleteTaskGroup(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/taskgroups/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo eliminar el grupo");
  }
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
