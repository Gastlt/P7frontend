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