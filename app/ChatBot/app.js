const taskList = document.getElementById("task-list");
const taskForm = document.getElementById("task-form");
const refreshTasksButton = document.getElementById("refresh-tasks");
const chatMessages = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatSubmitButton = chatForm.querySelector("button[type='submit']");
const CHAT_STREAM_ENDPOINT = "/api/assistant/chat/stream";
const STREAM_CHAR_DELAY_MS = 28;
const STREAM_COMMA_DELAY_MS = 85;
const STREAM_PUNCTUATION_DELAY_MS = 140;
const STREAM_LINE_DELAY_MS = 180;

let assistantIsResponding = false;

async function fetchTasks() {
  const response = await fetch("/api/tasks");
  const tasks = await response.json();
  renderTasks(tasks);
}

function renderTasks(tasks) {
  taskList.innerHTML = "";

  if (!tasks.length) {
    taskList.innerHTML = "<p>No hay tareas registradas.</p>";
    return;
  }

  tasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = "task-card";
    const badgeClass = task.status === "DONE" ? "done" : task.status === "IN_PROGRESS" ? "progress" : "pending";

    card.innerHTML = `
      <h3>${escapeHtml(task.title)}</h3>
      <div class="task-meta">
        <span class="badge ${badgeClass}">${escapeHtml(task.status)}</span>
        <span>Responsable: ${escapeHtml(task.assignee)}</span>
        <span>${task.storyPoints} pts</span>
        <span>${escapeHtml(task.sprintName)}</span>
        <span>Entrega: ${escapeHtml(task.dueDate)}</span>
      </div>
    `;
    taskList.appendChild(card);
  });
}

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    title: document.getElementById("title").value.trim(),
    assignee: document.getElementById("assignee").value.trim(),
    storyPoints: Number(document.getElementById("storyPoints").value || 3),
    sprintName: document.getElementById("sprintName").value.trim(),
  };

  await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  taskForm.reset();
  await fetchTasks();
});

refreshTasksButton.addEventListener("click", fetchTasks);

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (assistantIsResponding) return;

  const message = chatInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  chatInput.value = "";
  setChatBusy(true);

  const assistantMessage = appendThinkingMessage();

  try {
    const response = await fetch(CHAT_STREAM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Assistant request failed with status ${response.status}`);
    }

    if (response.body) {
      const streamedText = await streamResponseBody(assistantMessage, response.body);
      if (!streamedText.trim()) {
        await streamMessage(assistantMessage, "Listo.");
      }
    } else {
      const text = await response.text();
      await streamMessage(assistantMessage, text || "Listo.");
    }
    await fetchTasks();
  } catch (error) {
    console.error(error);
    assistantMessage.classList.add("error");
    await streamMessage(
      assistantMessage,
      "No pude responder en este momento. Revisa el servidor e intenta otra vez."
    );
  } finally {
    setChatBusy(false);
    chatInput.focus();
  }
});

document.querySelectorAll(".hint").forEach((button) => {
  button.addEventListener("click", () => {
    chatInput.value = button.dataset.message;
    chatInput.focus();
  });
});

function appendMessage(role, text) {
  const item = document.createElement("div");
  item.className = `message ${role}`;
  item.textContent = text;
  chatMessages.appendChild(item);
  scrollChatToBottom();
  return item;
}

function appendThinkingMessage() {
  const item = document.createElement("div");
  item.className = "message assistant thinking";
  item.setAttribute("aria-label", "El asistente esta pensando");
  item.innerHTML = "<span></span><span></span><span></span>";
  chatMessages.appendChild(item);
  scrollChatToBottom();
  return item;
}

function streamMessage(item, text) {
  prepareStreamingMessage(item);

  return Array.from(text).reduce((chain, character) => {
    return chain.then(async () => {
      item.textContent += character;
      scrollChatToBottom(false);
      await delay(delayFor(character));
    });
  }, Promise.resolve()).then(() => {
    item.classList.remove("streaming");
  });
}

async function streamResponseBody(item, body) {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let streamedText = "";
  let started = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    if (!chunk) continue;

    if (!started) {
      prepareStreamingMessage(item);
      started = true;
    }

    streamedText += chunk;
    item.textContent = streamedText;
    scrollChatToBottom(false);
  }

  const finalChunk = decoder.decode();
  if (finalChunk) {
    if (!started) {
      prepareStreamingMessage(item);
      started = true;
    }
    streamedText += finalChunk;
    item.textContent = streamedText;
  }

  if (started) {
    item.classList.remove("streaming");
  }

  return streamedText;
}

function prepareStreamingMessage(item) {
  item.classList.remove("thinking");
  item.classList.add("streaming");
  item.textContent = "";
}

function delayFor(character) {
  if (character === "\n") return STREAM_LINE_DELAY_MS;
  if (character === ",") return STREAM_COMMA_DELAY_MS;
  if (".!?;:".includes(character)) return STREAM_PUNCTUATION_DELAY_MS;
  return STREAM_CHAR_DELAY_MS;
}

function delay(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function scrollChatToBottom(smooth = true) {
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: smooth ? "smooth" : "auto",
  });
}

function setChatBusy(isBusy) {
  assistantIsResponding = isBusy;
  chatInput.disabled = isBusy;
  chatSubmitButton.disabled = isBusy;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

streamMessage(
  appendMessage("assistant", ""),
  "Hola. Puedo ayudarte con tareas, sprint y carga del equipo."
);
fetchTasks();
