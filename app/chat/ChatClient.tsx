// app/chat/ChatClient.tsx
"use client";

import { useState, useRef, useEffect } from "react";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatClientProps = {
  userId: string;
  initialMessages?: Message[];
};

export default function ChatClient({
  userId,
  initialMessages = [],
}: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setInput("");
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          userId,
          history: messages,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(
          `Failed to parse JSON from /api/chat (status ${res.status})`
        );
      }

      if (!res.ok || !data?.reply) {
        const msg =
          data?.error || `Request failed with status ${res.status}`;
        throw new Error(msg);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply as string,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
      const message =
        err instanceof Error ? err.message : "Unknown error";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error from server: ${message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl border rounded-xl p-4 flex flex-col gap-4">
      <div className="flex-1 min-h-[300px] border rounded-lg p-3 bg-white overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-3 p-2 rounded-md text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-blue-100 text-right"
                : "bg-gray-100 text-left"
            }`}
          >
            {m.content}
          </div>
        ))}

        {isLoading && (
          <div className="italic text-gray-400 text-sm">Thinking…</div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your data or ask how to evolve it…"
          className="flex-1 border rounded-md px-3 py-2"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:bg-blue-300"
          disabled={isLoading}
        >
          Send
        </button>
      </form>
    </div>
  );
}
