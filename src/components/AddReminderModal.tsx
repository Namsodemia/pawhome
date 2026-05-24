"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ReminderType = "walk" | "vaccine" | "food" | "vet" | "other";

const presets: Record<ReminderType, string> = {
  vaccine: "Karma Aşı",
  food: "Mama Siparişi",
  walk: "Akşam Yürüyüşü",
  vet: "Rutin Kontrol",
  other: "",
};

export function AddReminderModal({
  open,
  onClose,
  petId,
  type,
  title,
}: {
  open: boolean;
  onClose: () => void;
  petId: number | null;
  type: ReminderType;
  title: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!petId) {
      alert("Önce bir evcil hayvan ekleyin.");
      return;
    }
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/reminders", {
      method: "POST",
      body: JSON.stringify({
        pet_id: petId,
        type,
        title: fd.get("title"),
        date: fd.get("date"),
      }),
      headers: { "Content-Type": "application/json" },
    });
    setSubmitting(false);
    if (res.ok) {
      onClose();
      router.refresh();
    }
  }

  return (
    <div className={`fixed inset-0 z-[60] ${open ? "" : "hidden"}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute bottom-0 w-full bg-white rounded-t-[32px] p-6 transform transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Başlık</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fa-solid fa-pen text-slate-400"></i>
              </div>
              <input
                type="text"
                name="title"
                defaultValue={presets[type]}
                placeholder="Örn: Kuduz Aşısı"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
              Tarih ve Saat
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fa-regular fa-calendar text-slate-400"></i>
              </div>
              <input
                type="datetime-local"
                name="date"
                required
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary transition-all text-slate-600"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-base shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-transform mt-2 disabled:opacity-60"
          >
            {submitting ? "Kaydediliyor..." : "Planı Kaydet"}
          </button>
        </form>
        <div className="h-6"></div>
      </div>
    </div>
  );
}
