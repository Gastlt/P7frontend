export type GroupTaskStatus = "pending" | "completed";

export type GroupTask = {
  id: number;
  title: string;
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

export const people = [
  "All",
  "Alice Johnson",
  "Bob Smith",
  "Carol White",
  "David Brown",
];

export const mockGroups: Group[] = [
  {
    id: 1,
    title: "Marketing Campaign",
    description: "prueba",
    progress: 1,
    total: 4,
    members: ["Alice", "Bob", "Carol", "David", "Emma", "Grace", "Henry", "Frank"],
    tasks: [
      {
        id: 1,
        title: "Create social media content calendar",
        assignee: "Alice Johnson",
        dueDate: null,
        status: "pending",
      },
      {
        id: 2,
        title: "Design banner ads",
        assignee: "Bob Smith",
        dueDate: null,
        status: "completed",
      },
      {
        id: 3,
        title: "Write blog posts",
        assignee: "Alice Johnson",
        dueDate: "2026-03-01",
        status: "pending",
      },
      {
        id: 4,
        title: "Schedule email campaigns",
        assignee: "Carol White",
        dueDate: null,
        status: "pending",
      },
    ],
  },
  {
    id: 2,
    title: "Frontend Revamp",
    description: "Website UI refresh",
    progress: 1,
    total: 4,
    members: ["Alice", "Bob", "Carol", "David", "Emma", "Grace", "Henry", "Frank"],
    tasks: [
      {
        id: 1,
        title: "Audit current screens",
        assignee: "Alice Johnson",
        dueDate: null,
        status: "completed",
      },
      {
        id: 2,
        title: "Update dashboard cards",
        assignee: "Bob Smith",
        dueDate: "2026-03-04",
        status: "pending",
      },
      {
        id: 3,
        title: "Create responsive states",
        assignee: "Carol White",
        dueDate: null,
        status: "pending",
      },
      {
        id: 4,
        title: "Review sidebar navigation",
        assignee: "David Brown",
        dueDate: null,
        status: "pending",
      },
    ],
  },
  {
    id: 3,
    title: "Customer Onboarding",
    description: "New user setup workflow",
    progress: 1,
    total: 4,
    members: ["Alice", "Bob", "Carol", "David", "Emma", "Grace", "Henry", "Frank"],
    tasks: [
      {
        id: 1,
        title: "Map welcome flow",
        assignee: "Alice Johnson",
        dueDate: null,
        status: "pending",
      },
      {
        id: 2,
        title: "Draft first email",
        assignee: "Bob Smith",
        dueDate: null,
        status: "completed",
      },
      {
        id: 3,
        title: "Prepare tutorial copy",
        assignee: "Carol White",
        dueDate: "2026-03-02",
        status: "pending",
      },
      {
        id: 4,
        title: "Add onboarding checklist",
        assignee: "David Brown",
        dueDate: null,
        status: "pending",
      },
    ],
  },
  {
    id: 4,
    title: "Ops Automation",
    description: "Internal workflow improvements",
    progress: 1,
    total: 4,
    members: ["Alice", "Bob", "Carol", "David", "Emma", "Grace", "Henry", "Frank"],
    tasks: [
      {
        id: 1,
        title: "Identify repetitive handoffs",
        assignee: "Alice Johnson",
        dueDate: null,
        status: "completed",
      },
      {
        id: 2,
        title: "Create automation backlog",
        assignee: "Bob Smith",
        dueDate: null,
        status: "pending",
      },
      {
        id: 3,
        title: "Test notification rules",
        assignee: "Carol White",
        dueDate: null,
        status: "pending",
      },
      {
        id: 4,
        title: "Document release checklist",
        assignee: "David Brown",
        dueDate: "2026-03-06",
        status: "pending",
      },
    ],
  },
];
