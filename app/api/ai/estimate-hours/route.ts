import { type NextRequest, NextResponse } from "next/server";

const DEFAULT_BACKEND_DESTINATION =
  "http://todolistapp-backend-router.mtdrworkshop.svc.cluster.local";

type TaskEstimateRequest = {
  title?: unknown;
  description?: unknown;
  priority?: unknown;
  storyPoints?: unknown;
  groupId?: unknown;
  sprintId?: unknown;
  assigneeId?: unknown;
};

type HoursBySprintKpi = {
  groupId?: number;
  groupName?: string;
  sprintId?: number;
  sprintName?: string;
  userId?: number;
  userName?: string;
  estimatedHours?: number;
};

type CompletedByUserKpi = {
  groupId?: number;
  sprintId?: number;
  userId?: number;
  completedTasks?: number;
};

type VelocityKpi = {
  averageCompletedTasksPerSprint?: number;
};

type BackendFetchOptions = {
  authorization: string | null;
  path: string;
};

function getBackendBaseUrl() {
  return (
    process.env.BACKEND_INTERNAL_URL || DEFAULT_BACKEND_DESTINATION
  ).replace(/\/$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function average(values: number[]) {
  if (!values.length) {
    return undefined;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function roundToHalfHour(value: number) {
  return Math.round(value * 2) / 2;
}

function normalizePriority(priority: unknown) {
  const value = readString(priority).toLowerCase();

  if (["high", "alta", "urgent", "urgente"].includes(value)) {
    return "high";
  }

  if (["low", "baja"].includes(value)) {
    return "low";
  }

  if (["medium", "media", "normal"].includes(value)) {
    return "medium";
  }

  return undefined;
}

function createKpiQuery(payload: TaskEstimateRequest) {
  const query = new URLSearchParams();
  const groupId = readNumber(payload.groupId);
  const sprintId = readNumber(payload.sprintId);

  if (groupId) {
    query.set("groupId", String(groupId));
  }

  if (sprintId) {
    query.set("sprintId", String(sprintId));
  }

  return query.toString();
}

async function fetchBackendJson<T>({
  authorization,
  path,
}: BackendFetchOptions): Promise<T> {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    cache: "no-store",
    headers: authorization ? { Authorization: authorization } : undefined,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      body || `El backend respondio con estado ${response.status}.`
    );
  }

  return response.json() as Promise<T>;
}

function matchesRequest(
  item: Pick<HoursBySprintKpi, "groupId" | "sprintId" | "userId">,
  payload: TaskEstimateRequest
) {
  const groupId = readNumber(payload.groupId);
  const sprintId = readNumber(payload.sprintId);
  const assigneeId = readNumber(payload.assigneeId);

  return (
    (!groupId || item.groupId === groupId) &&
    (!sprintId || item.sprintId === sprintId) &&
    (!assigneeId || item.userId === assigneeId)
  );
}

function estimateFromKpis(
  payload: TaskEstimateRequest,
  hoursBySprint: HoursBySprintKpi[],
  completedByUser: CompletedByUserKpi[],
  velocity: VelocityKpi
) {
  const comparableHours = hoursBySprint.filter(
    (item) =>
      matchesRequest(item, payload) &&
      typeof item.estimatedHours === "number" &&
      item.estimatedHours > 0
  );

  const completedLookup = new Map<string, number>();
  completedByUser
    .filter((item) => matchesRequest(item, payload))
    .forEach((item) => {
      if (!item.groupId || !item.sprintId || !item.userId) {
        return;
      }

      completedLookup.set(
        `${item.groupId}:${item.sprintId}:${item.userId}`,
        item.completedTasks || 0
      );
    });

  const perTaskSamples = comparableHours.flatMap((item) => {
    if (!item.groupId || !item.sprintId || !item.userId) {
      return [];
    }

    const completedTasks =
      completedLookup.get(`${item.groupId}:${item.sprintId}:${item.userId}`) ||
      0;

    if (!completedTasks || !item.estimatedHours) {
      return [];
    }

    return [item.estimatedHours / completedTasks];
  });

  const averagePerTask = average(perTaskSamples);
  const averageSprintHours = average(
    comparableHours
      .map((item) => item.estimatedHours)
      .filter((value): value is number => typeof value === "number")
  );
  const velocityAverage = velocity.averageCompletedTasksPerSprint || 0;
  const velocityPerTask =
    averageSprintHours && velocityAverage > 0
      ? averageSprintHours / velocityAverage
      : undefined;

  const baselineHours = averagePerTask || velocityPerTask || 6;
  const storyPoints = readNumber(payload.storyPoints);
  const priority = normalizePriority(payload.priority);
  const title = readString(payload.title);
  const description = readString(payload.description);
  const textLength = `${title} ${description}`.trim().length;

  const storyMultiplier = storyPoints
    ? clamp(storyPoints / 3, 0.6, 2.75)
    : 1;
  const priorityMultiplier =
    priority === "high" ? 1.2 : priority === "low" ? 0.85 : 1;
  const textMultiplier = textLength > 500 ? 1.15 : textLength < 80 ? 0.9 : 1;

  const estimatedHours = roundToHalfHour(
    clamp(baselineHours * storyMultiplier * priorityMultiplier * textMultiplier, 1, 80)
  );
  const confidence =
    perTaskSamples.length >= 3
      ? "alta"
      : perTaskSamples.length >= 1 || velocityPerTask
        ? "media"
        : "baja";
  const uncertainty = confidence === "alta" ? 0.2 : confidence === "media" ? 0.35 : 0.5;

  return {
    estimatedHours,
    minHours: roundToHalfHour(clamp(estimatedHours * (1 - uncertainty), 1, 80)),
    maxHours: roundToHalfHour(clamp(estimatedHours * (1 + uncertainty), 1, 80)),
    confidence,
    reason:
      perTaskSamples.length > 0
        ? "Estimacion basada en horas historicas por tarea completada para usuarios, grupos y sprints comparables."
        : velocityPerTask
          ? "Estimacion basada en horas historicas por sprint y velocidad promedio de tareas completadas."
          : "Estimacion base por defecto porque no hay KPIs historicos suficientes para comparar.",
    signals: {
      comparableSamples: perTaskSamples.length,
      baselineHours: roundToHalfHour(baselineHours),
      priority: priority || "medium",
      storyPoints: storyPoints || null,
      velocityAverageCompletedTasksPerSprint: velocityAverage,
    },
  };
}

export async function POST(request: NextRequest) {
  let payload: TaskEstimateRequest;

  try {
    const body = await request.json();
    payload = isRecord(body) ? body : {};
  } catch {
    return NextResponse.json(
      { message: "El cuerpo de la solicitud debe ser JSON valido." },
      { status: 400 }
    );
  }

  const title = readString(payload.title);
  const description = readString(payload.description);
  const storyPoints = readNumber(payload.storyPoints);

  if (!title && !description && !storyPoints) {
    return NextResponse.json(
      {
        message:
          "Incluye al menos titulo, descripcion o storyPoints para estimar la tarea.",
      },
      { status: 400 }
    );
  }

  const authorization = request.headers.get("authorization");
  const hoursQuery = createKpiQuery(payload);
  const sprintId = readNumber(payload.sprintId);
  const completedQuery = sprintId ? `?sprintId=${sprintId}` : "";

  try {
    const [hoursBySprint, completedByUser, velocity] = await Promise.all([
      fetchBackendJson<HoursBySprintKpi[]>({
        authorization,
        path: `/api/kpis/hours-by-sprint${hoursQuery ? `?${hoursQuery}` : ""}`,
      }),
      fetchBackendJson<CompletedByUserKpi[]>({
        authorization,
        path: `/api/kpis/completed-by-user${completedQuery}`,
      }),
      fetchBackendJson<VelocityKpi>({
        authorization,
        path: "/api/kpis/velocity",
      }),
    ]);

    return NextResponse.json(
      estimateFromKpis(payload, hoursBySprint, completedByUser, velocity)
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron consultar los KPIs para estimar la tarea.";

    return NextResponse.json({ message }, { status: 502 });
  }
}
