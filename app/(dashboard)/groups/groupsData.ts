/**
 * Real data fetched from backend API running on localhost:8080
 * Endpoints:
 *  - GET /api/users
 *  - GET /api/taskgroups
 *  - GET /api/group-members
 *  - GET /api/todolists
 *  - GET /api/tasks
 *  - GET /api/task-assignments
 *  - GET /todolist
 */

import { getToken } from "@/lib/session";

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

const API_BASE_URL = "http://localhost:8080";

export type User = {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
};

export type TaskGroup = {
  id: number;
  name: string;
  createdBy?: User;
  createdAt?: string;
};

export type GroupMember = {
  id: number;
  groupId?: number;
  userId?: number;
  group?: TaskGroup;
  user?: User;
  role?: {
    id: number;
    name: string;
    description?: string;
  };
  roleId?: number | null;
  roleName?: string | null;
  joinedAt?: string | null;
};

export type TodoList = {
  id: number;
  groupId?: number;
  name: string;
  createdBy?: User;
  createdAt?: string;
  group?: TaskGroup;
};

export type Task = {
  id: number;
  listId?: number;
  title: string;
  description?: string | null;
  status?: "pending" | "completed";
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
  createdBy?: User;
  createdAt?: string;
  todoList?: TodoList;
  groupName?: string;
  assigneeName?: string;
  sprintId?: number | null;
};

export type TaskAssignment = {
  id: number;
  taskId?: number;
  userId?: number;
  task?: Task;
  user?: User;
};

export type ToDoItem = {
  id: number;
  description: string;
  done: boolean;
  creation_ts?: string;
};

// ========== API Fetch Functions ==========

/**
 * Fetch all users
 */
export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Failed to fetch users: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

/**
 * Fetch all task groups
 */
export async function fetchTaskGroups(): Promise<TaskGroup[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/taskgroups`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
      if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to fetch task groups: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }
    return await response.json();
  } catch (error) {
    console.error("Error fetching task groups:", error);
    return [];
  }
}

/**
 * Fetch all group members
 */
export async function fetchGroupMembers(): Promise<GroupMember[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/group-members`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
      if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to fetch task groups: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }
    return await response.json();
  } catch (error) {
    console.error("Error fetching group members:", error);
    return [];
  }
}

export async function fetchMyGroupMembers(): Promise<GroupMember[]> {
  const response = await fetch(`${API_BASE_URL}/api/group-members/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to fetch my group memberships: ${response.status} - ${errorBody}`
    );
  }

  return response.json();
}

/**
 * Fetch group members by group ID
 */
export async function fetchGroupMembersByGroupId(groupId: number): Promise<GroupMember[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/group-members/group/${groupId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Failed to fetch group members for group ${groupId}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching group members for group ${groupId}:`, error);
    return [];
  }
}

/**
 * Fetch all todo lists
 */
export async function fetchTodoLists(): Promise<TodoList[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/todolists`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Failed to fetch todo lists: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching todo lists:", error);
    return [];
  }
}

/**
 * Fetch todo lists by group ID
 */
export async function fetchTodoListsByGroupId(groupId: number): Promise<TodoList[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/todolists/group/${groupId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Failed to fetch todo lists for group ${groupId}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching todo lists for group ${groupId}:`, error);
    return [];
  }
}

/**
 * Fetch all tasks
 */
export async function fetchTasks(): Promise<Task[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to fetch tasks: ${response.status} ${response.statusText} - ${errorBody}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

/**
 * Fetch task by ID
 */
export async function fetchTaskById(taskId: number): Promise<Task | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    return null;
  }
}

/**
 * Fetch all task assignments
 */
export async function fetchTaskAssignments(): Promise<TaskAssignment[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/task-assignments`, {
      method: "GET",
    });
      if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to fetch task groups: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }
    return await response.json();
  } catch (error) {
    console.error("Error fetching task assignments:", error);
    return [];
  }
}

/**
 * Fetch task assignments by task ID
 */
export async function fetchTaskAssignmentsByTaskId(taskId: number): Promise<TaskAssignment[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/task-assignments/task/${taskId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Failed to fetch assignments for task ${taskId}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching assignments for task ${taskId}:`, error);
    return [];
  }
}

/**
 * Fetch all to-do items (legacy endpoint)
 */
export async function fetchToDoItems(): Promise<ToDoItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/todolist`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Failed to fetch to-do items: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching to-do items:", error);
    return [];
  }
}

/**
 * Fetch to-do item by ID (legacy endpoint)
 */
export async function fetchToDoItemById(id: number): Promise<ToDoItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/todolist/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Error fetching to-do item ${id}:`, error);
    return null;
  }
}

// ========== Convenience Derived Types ==========

export type GroupTaskStatus = "pending" | "completed";
export type GroupTask = {
  id: number;
  title: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  assignee: string;
  dueDate: string | null;
  status: GroupTaskStatus;
};

export type Group = {
  id: number;
  title: string;
  description: string;
  progress: number;
  total: number;
  members: string[];
  tasks: GroupTask[];
};

// ========== Convenience Functions ==========

/**
 * Fetch all data and build the Group[] structure for UI compatibility
 */
export async function fetchAllGroupsData(): Promise<Group[]> {
  try {
    const [taskGroups, users, groupMembers, todoLists, tasks, taskAssignments] =
      await Promise.all([
        fetchTaskGroups(),
        fetchUsers(),
        fetchMyGroupMembers(),
        fetchTodoLists(),
        fetchTasks(),
        fetchTaskAssignments(),
      ]);

    console.log("Fetched data:", {
      taskGroupsCount: taskGroups.length,
      usersCount: users.length,
      myGroupMembersCount: groupMembers.length,
      todoListsCount: todoLists.length,
      tasksCount: tasks.length,
      taskAssignmentsCount: taskAssignments.length,
    });

    const myGroupIds = groupMembers
      .map((m) => m.groupId ?? m.group?.id)
      .filter((id): id is number => id !== undefined && id !== null);

    const myTaskGroups = taskGroups.filter((g) =>
      myGroupIds.includes(g.id)
    );

    console.log("My group IDs:", myGroupIds);
    console.log("My task groups:", myTaskGroups);

    return myTaskGroups.map((g) => {
      const lists = todoLists.filter(
        (l) => l.groupId === g.id || l.group?.id === g.id
      );

      const groupTasks = tasks.filter((t) => {
        if (t.listId) {
          return lists.some((l) => l.id === t.listId);
        }

        if (t.groupName) {
          return t.groupName === g.name;
        }

        return false;
      });

      const dbMembers = groupMembers
        .filter((m) => {
          const memberGroupId = m.groupId ?? m.group?.id;
          return memberGroupId === g.id;
        })
        .map((m) => {
          const userId = m.userId ?? m.user?.id;
          const user = m.user || users.find((x) => x.id === userId);

          return user
            ? user.name
            : m.userName ?? m.userEmail ?? `user-${userId}`;
        });

      const members = dbMembers;

      console.log(
        `Group ${g.id} (${g.name}): ${members.length} members -`,
        members
      );

      return {
        id: g.id,
        title: g.name,
        description: g.name,
        progress: groupTasks.filter((t) => t.status === "completed").length,
        total: groupTasks.length || 0,
        members,
        tasks: groupTasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority as "low" | "medium" | "high" | undefined,
          assignee:
            t.assigneeName ??
            users.find(
              (u) =>
                u.id ===
                (taskAssignments.find((a) => a.taskId === t.id)?.userId ?? -1)
            )?.name ??
            "Unassigned",
          dueDate: t.dueDate ?? null,
          status: t.status as GroupTaskStatus,
        })),
      } as Group;
    });
  } catch (error) {
    console.error("Error fetching all groups data:", error);
    return [];
  }
}

/**
 * Fetch people list (all user names with "All" prefix)
 */
export async function fetchPeople(): Promise<string[]> {
  try {
    const users = await fetchUsers();
    return ["All", ...users.map((u) => u.name)];
  } catch (error) {
    console.error("Error fetching people:", error);
    return ["All"];
  }
}

// ========== Task CRUD Operations ==========

/**
 * Create a new task
 */
export async function createTask(task: {
  listId: number;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  createdById?: number;
}): Promise<Task | null> {
  try {
    // Preparar datos para enviar al backend
    const taskData = {
      listId: task.listId,
      title: task.title,
      description: task.description || "",
      status: "pending",
      priority: task.priority || "medium",
      // NO enviar dueDate por ahora - causando problemas de conversión
      createdById: task.createdById || 1, // Usar el usuario proporcionado o fallback
    };

    console.log("Creating task with data:", taskData);
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    
    const responseText = await response.text();
    console.log("Task creation response status:", response.status);
    console.log("Task creation response:", responseText);
    
    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.status} ${responseText}`);
    }
    
    return responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    console.error("Error creating task:", error);
    return null;
  }
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: number,
  updates: Partial<{
    title: string;
    description: string;
    status: "pending" | "completed";
    priority: "low" | "medium" | "high";
    dueDate: string;
  }>
): Promise<Task | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error(`Failed to update task: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    return null;
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: number): Promise<boolean> {
  try {
    console.log(`Deleting task ${taskId}...`);
    const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    
    console.log(`Delete response status: ${response.status}`);
    
    // Aceptar 200 OK, 204 No Content o 202 Accepted
    if (response.ok || response.status === 204) {
      console.log(`Task ${taskId} deleted successfully`);
      return true;
    }
    
    throw new Error(`Failed to delete task: ${response.statusText}`);
  } catch (error) {
    console.error(`Error deleting task ${taskId}:`, error);
    return false;
  }
}

/**
 * Create a task assignment (assign a task to a user)
 */
export async function createTaskAssignment(taskId: number, userId: number): Promise<TaskAssignment | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/task-assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, userId }),
    });
    if (!response.ok) throw new Error(`Failed to create task assignment: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error("Error creating task assignment:", error);
    return null;
  }
}

/**
 * Delete a task assignment
 */
export async function deleteTaskAssignment(assignmentId: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/task-assignments/${assignmentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error(`Failed to delete task assignment: ${response.statusText}`);
    return true;
  } catch (error) {
    console.error(`Error deleting task assignment ${assignmentId}:`, error);
    return false;
  }
}

// ========== Group CRUD Operations ==========

/**
 * Create a new task group
 */
export async function createTaskGroup(group: {
  name: string;
}): Promise<TaskGroup | null> {
  try {
    const groupData = {
      name: group.name,
    };

    console.log("Creating task group with data:", groupData);
    const response = await fetch(`${API_BASE_URL}/api/taskgroups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groupData),
    });

    const responseText = await response.text();
    console.log("Group creation response status:", response.status);
    console.log("Group creation response:", responseText);

    if (!response.ok) {
      throw new Error(`Failed to create task group: ${response.status} ${responseText}`);
    }

    return responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    console.error("Error creating task group:", error);
    return null;
  }
}

/**
 * Add a user to a task group
 */
export async function createGroupMember(groupId: number, userId: number): Promise<GroupMember | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/group-members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group: { id: groupId },
        user: { id: userId },
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Failed to add group member: ${response.status} ${responseText}`);
    }

    return responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    console.error(`Error adding user ${userId} to group ${groupId}:`, error);
    return null;
  }
}

/**
 * Delete a task group
 */
export async function deleteTaskGroup(groupId: number): Promise<boolean> {
  try {
    console.log(`Deleting task group ${groupId}...`);
    const response = await fetch(`${API_BASE_URL}/api/taskgroups/${groupId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    console.log(`Delete response status: ${response.status}`);

    // Aceptar 200 OK, 204 No Content o 202 Accepted
    if (response.ok || response.status === 204) {
      console.log(`Task group ${groupId} deleted successfully`);
      return true;
    }

    throw new Error(`Failed to delete task group: ${response.statusText}`);
  } catch (error) {
    console.error(`Error deleting task group ${groupId}:`, error);
    return false;
  }
}

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
  createdAt?: string;
};

export async function fetchSprints(): Promise<Sprint[]> {
  const response = await fetch(`${API_BASE_URL}/api/sprints`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to fetch sprints: ${response.status} - ${errorBody}`
    );
  }

  return response.json();
}
