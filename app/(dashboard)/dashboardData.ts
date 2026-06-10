const API_BASE_URL = "/api";

const TOKEN_KEY = "todo_token";

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type Group = {
  id: number;
  name: string;
};

export type CompletedTasksKpi = {
  groupId: number;
  groupName: string;
  sprintId: number;
  sprintName: string;
  userId: number;
  userName: string;
  completedTasks: number;
};

export type EstimatedHoursKpi = {
  groupId: number;
  groupName: string;
  sprintId: number;
  sprintName: string;
  userId: number;
  userName: string;
  estimatedHours: number;
};

export type Sprint = {
  id: number;
  name: string;
  groupId?: number;
  group?: {
    id: number;
    name: string;
  };
  startDate?: string;
  endDate?: string;
  status?: "planned" | "active" | "completed";
};

export async function fetchGroups(): Promise<Group[]> {
  const response = await fetch(`${API_BASE_URL}/taskgroups`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch groups");
  }

  return response.json();
}

export async function fetchSprints(): Promise<Sprint[]> {
  const response = await fetch(`${API_BASE_URL}/sprints`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch sprints");
  }

  return response.json();
}

export async function fetchCompletedTasksByUserSprintGroup(
  groupId?: number,
  sprintId?: number
): Promise<CompletedTasksKpi[]> {
  const params = new URLSearchParams();

  if (groupId) params.append("groupId", String(groupId));
  if (sprintId) params.append("sprintId", String(sprintId));

  const response = await fetch(
    `${API_BASE_URL}/kpis/completed-by-user?${params.toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch KPI data: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

export async function fetchEstimatedHoursByUserSprintGroup(
  groupId?: number,
  sprintId?: number
): Promise<EstimatedHoursKpi[]> {
  const params = new URLSearchParams();

  if (groupId) params.append("groupId", String(groupId));
  if (sprintId) params.append("sprintId", String(sprintId));

  const queryString = params.toString();

  const response = await fetch(
    `${API_BASE_URL}/kpis/hours-by-sprint${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to fetch estimated hours KPI: ${response.status} - ${errorBody}`
    );
  }

  return response.json();
}