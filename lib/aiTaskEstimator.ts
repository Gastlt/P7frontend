import { sendAiChatMessage } from "@/lib/api";
import { getToken } from "@/lib/session";

type EstimateResponse = {
  estimatedHours?: number;
  minHours?: number;
  maxHours?: number;
  confidence?: string;
  reason?: string;
  message?: string;
  error?: string;
};

const ESTIMATE_INTENT_PATTERN =
  /(estima|estimar|estimacion|calcula|calcular|pronostica|cu[aá]ntas?\s+horas|cu[aá]nto\s+(tiempo|tardar))/i;
const TASK_CONTEXT_PATTERN =
  /(tarea|task|historia|story|bug|feature|funcionalidad|desarrollo|implementar|corregir|crear|endpoint|pantalla|componente)/i;

function shouldEstimateTaskHours(message: string) {
  return (
    ESTIMATE_INTENT_PATTERN.test(message) && TASK_CONTEXT_PATTERN.test(message)
  );
}

function extractStoryPoints(message: string) {
  const match =
    message.match(/(\d+(?:\.\d+)?)\s*(?:sp|story\s*points?|puntos?)/i) ||
    message.match(/(?:sp|story\s*points?|puntos?)\s*:?\s*(\d+(?:\.\d+)?)/i);

  return match ? Number(match[1]) : undefined;
}

function extractPriority(message: string) {
  if (/\b(alta|high|urgente|urgent)\b/i.test(message)) {
    return "high";
  }

  if (/\b(baja|low)\b/i.test(message)) {
    return "low";
  }

  if (/\b(media|medium|normal)\b/i.test(message)) {
    return "medium";
  }

  return undefined;
}

function getAuthHeaders() {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = getToken() || localStorage.getItem("accessToken");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

function formatEstimateResponse(data: EstimateResponse) {
  if (typeof data.estimatedHours !== "number") {
    throw new Error(data.message || data.error || "No se pudo estimar la tarea.");
  }

  const range =
    typeof data.minHours === "number" && typeof data.maxHours === "number"
      ? ` Rango sugerido: ${data.minHours}-${data.maxHours} horas.`
      : "";
  const confidence = data.confidence
    ? ` Confianza: ${data.confidence}.`
    : "";
  const reason = data.reason ? ` ${data.reason}` : "";

  return `Estimo ${data.estimatedHours} horas para esta tarea.${range}${confidence}${reason}`;
}

async function estimateTaskHours(message: string) {
  const response = await fetch("/api/ai/estimate-hours", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      title: message,
      description: message,
      priority: extractPriority(message),
      storyPoints: extractStoryPoints(message),
    }),
  });

  const rawBody = await response.text();
  const data = rawBody ? (JSON.parse(rawBody) as EstimateResponse) : {};

  if (!response.ok) {
    throw new Error(data.message || data.error || "No se pudo estimar la tarea.");
  }

  return formatEstimateResponse(data);
}

export async function sendPower7AssistantMessage(message: string) {
  if (shouldEstimateTaskHours(message)) {
    return estimateTaskHours(message);
  }

  return sendAiChatMessage(message);
}
