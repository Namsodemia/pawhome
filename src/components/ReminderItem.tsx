"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReminderItem({
  id,
  title,
  type,
  description,
  dueLabel,
  icon,
  bgClass,
  textClass,
  borderClass,
}: {
  id: number;
  title: string;
  type: string;
  description: string;
  dueLabel: string;
  icon: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function complete() {
    if (busy || done) return;
    setBusy(true);
    setDone(true);
    const res = await fetch("/api/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isCompleted: true }),
    });
    if (!res.ok) {
      setDone(false);
      setBusy(false);
      return;
    }
    // Animasyon için kısa bekleme, sonra listeden çıkar
    setTimeout(() => router.refresh(), 400);
  }

  return (
    <div
      className={`bg-white p-4 rounded-2xl border-l-4 ${borderClass} shadow-sm flex items-center justify-between transition-all duration-300 ${
        done ? "opacity-40 scale-95" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full ${bgClass} ${textClass} flex items-center justify-center text-sm`}
        >
          <i className={`fa-solid ${icon}`}></i>
        </div>
        <div>
          <h4 className={`text-sm font-bold text-slate-800 ${done ? "line-through" : ""}`}>
            {title}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {dueLabel} {description ? `• ${description}` : ""}
          </p>
        </div>
      </div>
      <button
        onClick={complete}
        disabled={busy}
        title={done ? "Tamamlandı" : "Tamamlandı olarak işaretle"}
        className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
          done
            ? "border-green-300 bg-green-50 text-green-600"
            : "border-slate-200 text-slate-400 hover:bg-green-50 hover:text-green-500 hover:border-green-200"
        } disabled:cursor-not-allowed`}
      >
        <i className={`fa-solid ${done ? "fa-circle-check" : "fa-check"}`}></i>
      </button>
    </div>
  );
}
