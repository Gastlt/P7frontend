"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { getToken } from "@/lib/session";
import styles from "./FloatingChatBot.module.css";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  status?: "thinking" | "streaming" | "error";
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const CHAT_STREAM_ENDPOINT = `${API_BASE_URL}/assistant/chat/stream`;

const initialMessage: ChatMessage = {
  id: "initial-assistant-message",
  role: "assistant",
  text: "Hola. Puedo ayudarte con tareas, sprint y carga del equipo.",
};

const hints = [
  { label: "Ana", message: "que tareas tiene ana" },
  { label: "Sprint", message: "como va el sprint actual" },
  { label: "Carga", message: "quien tiene mas carga" },
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const token = getToken() || localStorage.getItem("accessToken");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export default function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [assistantIsResponding, setAssistantIsResponding] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [isOpen, messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const updateMessage = (id: string, patch: Partial<ChatMessage>) => {
    setMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, ...patch } : message))
    );
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = input.trim();
    if (!message || assistantIsResponding) return;

    const assistantMessageId = createId();
    setMessages((current) => [
      ...current,
      { id: createId(), role: "user", text: message },
      { id: assistantMessageId, role: "assistant", text: "", status: "thinking" },
    ]);
    setInput("");
    setAssistantIsResponding(true);

    try {
      const response = await fetch(CHAT_STREAM_ENDPOINT, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Assistant request failed with status ${response.status}`);
      }

      if (!response.body) {
        const text = await response.text();
        updateMessage(assistantMessageId, {
          text: text || "Listo.",
          status: undefined,
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamedText = "";

      updateMessage(assistantMessageId, { status: "streaming" });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        streamedText += chunk;
        updateMessage(assistantMessageId, { text: streamedText });
      }

      const finalChunk = decoder.decode();
      if (finalChunk) {
        streamedText += finalChunk;
      }

      updateMessage(assistantMessageId, {
        text: streamedText.trim() ? streamedText : "Listo.",
        status: undefined,
      });
    } catch (error) {
      console.error(error);
      updateMessage(assistantMessageId, {
        text: "No pude responder en este momento. Revisa el servidor e intenta otra vez.",
        status: "error",
      });
    } finally {
      setAssistantIsResponding(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className={styles.launcher}
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chatbot"
          title="Abrir chatbot"
        >
          <MessageCircle size={26} aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <section className={styles.panel} aria-label="Chatbot asistente">
          <header className={styles.header}>
            <div className={styles.titleGroup}>
              <div className={styles.avatar} aria-hidden="true">
                <Bot size={20} />
              </div>
              <div>
                <h2 className={styles.title}>Asistente</h2>
                <p className={styles.subtitle}>Tareas, sprint y carga del equipo</p>
              </div>
            </div>

            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chatbot"
              title="Cerrar"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div ref={messagesRef} className={styles.messages} aria-live="polite">
            {messages.map((message) => {
              const className = [
                styles.message,
                message.role === "user" ? styles.userMessage : styles.assistantMessage,
                message.status === "thinking" ? styles.thinking : "",
                message.status === "streaming" ? styles.streaming : "",
                message.status === "error" ? styles.errorMessage : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div key={message.id} className={className}>
                  {message.status === "thinking" ? (
                    <>
                      <span />
                      <span />
                      <span />
                    </>
                  ) : (
                    message.text
                  )}
                </div>
              );
            })}
          </div>

          <footer className={styles.footer}>
            <form className={styles.form} onSubmit={sendMessage}>
              <input
                ref={inputRef}
                className={styles.input}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Pregunta algo..."
                disabled={assistantIsResponding}
                aria-label="Mensaje para el asistente"
              />
              <button
                type="submit"
                className={styles.sendButton}
                disabled={assistantIsResponding || !input.trim()}
                aria-label="Enviar mensaje"
                title="Enviar"
              >
                <Send size={18} aria-hidden="true" />
              </button>
            </form>

            <div className={styles.hints}>
              {hints.map((hint) => (
                <button
                  key={hint.label}
                  type="button"
                  className={styles.hint}
                  onClick={() => {
                    setInput(hint.message);
                    inputRef.current?.focus();
                  }}
                >
                  {hint.label}
                </button>
              ))}
            </div>
          </footer>
        </section>
      )}
    </>
  );
}
