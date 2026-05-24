"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "model"; content: string };

export function VetAIChat({ petName }: { petName: string | null }) {
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      role: "model",
      content: petName
        ? `Merhaba! Ben VetAI 🐾 — ${petName} hakkında ne sormak istersin?`
        : "Merhaba! Ben VetAI 🐾 — evcil dostun hakkında ne sormak istersin?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/vet-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => m.role === "user" || m.role === "model"),
          petName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "model", content: `⚠️ ${data.error ?? "Bir hata oluştu."}` },
        ]);
      } else {
        setMessages((m) => [...m, { role: "model", content: data.reply }]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "model", content: "⚠️ Ağ hatası. Daha sonra tekrar dene." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 hide-scrollbar">
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.role === "model" ? (
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : (
              <span>{m.content}</span>
            )}
          </Bubble>
        ))}
        {loading && (
          <Bubble role="model">
            <span className="inline-flex gap-1 items-center text-slate-400">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span
                className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              ></span>
              <span
                className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              ></span>
            </span>
          </Bubble>
        )}
      </div>

      <form
        onSubmit={send}
        className="px-4 py-3 border-t border-slate-100 bg-white flex items-center gap-2 pb-safe"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Soru yaz..."
          disabled={loading}
          className="flex-1 bg-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pw-primary/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-11 h-11 rounded-full bg-pw-primary text-white flex items-center justify-center shadow-md shadow-blue-500/30 active:scale-95 transition-transform disabled:opacity-50"
        >
          <i className="fa-solid fa-paper-plane text-sm"></i>
        </button>
      </form>
    </>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "model";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-pw-primary text-white rounded-br-md"
            : "bg-white text-slate-800 border border-slate-100 rounded-bl-md shadow-sm"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
