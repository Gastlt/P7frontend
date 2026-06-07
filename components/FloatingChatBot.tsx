"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bot,
  MessageCircle,
  RotateCcw,
  SendHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { sendAiChatMessage } from "@/lib/api";
import styles from "./FloatingChatBot.module.css";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  status?: "thinking" | "error";
};

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "¡Hola! Soy tu asistente de Power7. Puedo consultar tus tareas, grupos y sprints para ayudarte a organizar el trabajo.",
};

const QUICK_PROMPTS = [
  "¿Qué tareas vencidas tengo?",
  "¿Cómo va el sprint actual?",
  "Resume mis tareas pendientes",
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isOpen, messages]);

  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();

    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || isSending) return;

    const assistantMessageId = createId();

    setMessages((current) => [
      ...current,
      { id: createId(), role: "user", text: message },
      {
        id: assistantMessageId,
        role: "assistant",
        text: "",
        status: "thinking",
      },
    ]);
    setInput("");
    setIsSending(true);

    try {
      const answer = await sendAiChatMessage(message);

      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessageId
            ? { ...item, text: answer, status: undefined }
            : item
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pude responder en este momento.";

      setMessages((current) =>
        current.map((item) =>
          item.id === assistantMessageId
            ? {
                ...item,
                text: `${message} Intenta nuevamente en unos segundos.`,
                status: "error",
              }
            : item
        )
      );
    } finally {
      setIsSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  const clearConversation = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <>
      {isOpen && (
        <section
          className={styles.panel}
          role="dialog"
          aria-label="Asistente de Power7"
          aria-live="polite"
        >
          <header className={styles.header}>
            <div className={styles.identity}>
              <div className={styles.avatar} aria-hidden="true">
                <Bot size={22} strokeWidth={2.2} />
                <span className={styles.avatarSpark}>
                  <Sparkles size={10} />
                </span>
              </div>

              <div>
                <h2 className={styles.title}>Asistente Power7</h2>
                <div className={styles.status}>
                  <span className={styles.statusDot} />
                  Listo para ayudarte
                </div>
              </div>
            </div>

            <button
              type="button"
              className={styles.headerButton}
              onClick={clearConversation}
              aria-label="Limpiar conversación"
              title="Nueva conversación"
              disabled={isSending}
            >
              <RotateCcw size={17} />
            </button>
          </header>

          <div className={styles.messages}>
            <div className={styles.intro}>
              <span className={styles.introIcon}>
                <Sparkles size={14} />
              </span>
              Consulta información real de tus proyectos
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.messageRow} ${
                  message.role === "user" ? styles.userRow : styles.assistantRow
                }`}
              >
                {message.role === "assistant" && (
                  <div className={styles.messageAvatar} aria-hidden="true">
                    <Bot size={15} />
                  </div>
                )}

                <div
                  className={`${styles.messageBubble} ${
                    message.role === "user"
                      ? styles.userBubble
                      : styles.assistantBubble
                  } ${message.status === "error" ? styles.errorBubble : ""}`}
                >
                  {message.status === "thinking" ? (
                    <div className={styles.typing} aria-label="Pensando">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <footer className={styles.footer}>
            <div className={styles.quickPrompts}>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className={styles.quickPrompt}
                  onClick={() => void sendMessage(prompt)}
                  disabled={isSending}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <textarea
                ref={inputRef}
                className={styles.input}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Escribe tu pregunta..."
                rows={1}
                maxLength={1000}
                disabled={isSending}
                aria-label="Mensaje para el asistente"
              />

              <button
                type="submit"
                className={styles.sendButton}
                disabled={isSending || !input.trim()}
                aria-label="Enviar mensaje"
                title="Enviar mensaje"
              >
                <SendHorizontal size={19} />
              </button>
            </form>

            <p className={styles.disclaimer}>
              Enter para enviar · Shift + Enter para nueva línea
            </p>
          </footer>
        </section>
      )}

      <button
        type="button"
        className={`${styles.launcher} ${isOpen ? styles.launcherOpen : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente"}
        aria-expanded={isOpen}
        title={isOpen ? "Cerrar asistente" : "Abrir asistente"}
      >
        <span className={styles.launcherGlow} aria-hidden="true" />
        {isOpen ? (
          <X size={25} strokeWidth={2.4} />
        ) : (
          <MessageCircle size={27} strokeWidth={2.3} />
        )}
        {!isOpen && <span className={styles.notificationDot} />}
      </button>
    </>
  );
}
