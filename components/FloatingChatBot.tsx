"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
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

function isSafeLink(url: string) {
  return /^(https?:\/\/|mailto:)/i.test(url);
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const elements: ReactNode[] = [];
  const inlinePattern =
    /(\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const key = `${keyPrefix}-${match.index}`;

    if (match[2] && match[3] && isSafeLink(match[3])) {
      elements.push(
        <a key={key} href={match[3]} target="_blank" rel="noreferrer">
          {renderInlineMarkdown(match[2], `${key}-link`)}
        </a>
      );
    } else if (match[4]) {
      elements.push(<code key={key}>{match[4]}</code>);
    } else if (match[5] || match[6]) {
      elements.push(
        <strong key={key}>
          {renderInlineMarkdown(match[5] ?? match[6] ?? "", `${key}-strong`)}
        </strong>
      );
    } else if (match[7] || match[8]) {
      elements.push(
        <em key={key}>
          {renderInlineMarkdown(match[7] ?? match[8] ?? "", `${key}-em`)}
        </em>
      );
    } else {
      elements.push(match[0]);
    }

    lastIndex = inlinePattern.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

function renderInlineWithBreaks(text: string, keyPrefix: string) {
  return text.split("\n").flatMap((line, index) => {
    const content = renderInlineMarkdown(line, `${keyPrefix}-${index}`);
    if (index === 0) return content;

    return [<br key={`${keyPrefix}-br-${index}`} />, ...content];
  });
}

function isMarkdownBlockStart(line: string) {
  return (
    /^```/.test(line) ||
    /^#{1,3}\s+/.test(line) ||
    /^\s*[-*]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    /^>\s?/.test(line)
  );
}

function MarkdownMessage({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !/^```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) index += 1;

      blocks.push(
        <pre key={`code-${index}`}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headingMatch) {
      const headingLevel = headingMatch[1].length;
      const headingContent = renderInlineMarkdown(
        headingMatch[2],
        `heading-${index}`
      );

      blocks.push(
        headingLevel === 1 ? (
          <h3 key={`heading-${index}`}>{headingContent}</h3>
        ) : (
          <h4 key={`heading-${index}`}>{headingContent}</h4>
        )
      );
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];

      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ""));
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`${index}-${itemIndex}`}>
              {renderInlineMarkdown(item, `ul-${index}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];

      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
        index += 1;
      }

      blocks.push(
        <ol key={`ol-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`${index}-${itemIndex}`}>
              {renderInlineMarkdown(item, `ol-${index}-${itemIndex}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];

      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push(
        <blockquote key={`quote-${index}`}>
          {renderInlineWithBreaks(quoteLines.join("\n"), `quote-${index}`)}
        </blockquote>
      );
      continue;
    }

    const paragraphLines = [line];
    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !isMarkdownBlockStart(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push(
      <p key={`p-${index}`}>
        {renderInlineWithBreaks(paragraphLines.join("\n"), `p-${index}`)}
      </p>
    );
  }

  return <div className={styles.markdown}>{blocks}</div>;
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
                    <>
                      {message.role === "assistant" ? (
                        <MarkdownMessage text={message.text} />
                      ) : (
                        <span className={styles.plainText}>
                          {message.text}
                        </span>
                      )}
                    </>
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
