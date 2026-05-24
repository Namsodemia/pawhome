"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddPetModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<"dog" | "cat">("dog");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/pets", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        type,
        breed: fd.get("breed"),
        age: fd.get("age") ? Number(fd.get("age")) : null,
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
          <h3 className="text-xl font-bold text-slate-800">Yeni Dost Ekle</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value="dog"
                checked={type === "dog"}
                onChange={() => setType("dog")}
                className="peer hidden"
              />
              <div
                className={`border-2 rounded-2xl p-3 text-center transition-all ${
                  type === "dog"
                    ? "border-pw-primary bg-blue-50"
                    : "border-slate-100"
                }`}
              >
                <span className="text-2xl block mb-1">🐕</span>
                <span
                  className={`text-xs font-bold ${
                    type === "dog" ? "text-pw-primary" : "text-slate-600"
                  }`}
                >
                  Köpek
                </span>
              </div>
            </label>
            <label className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value="cat"
                checked={type === "cat"}
                onChange={() => setType("cat")}
                className="peer hidden"
              />
              <div
                className={`border-2 rounded-2xl p-3 text-center transition-all ${
                  type === "cat"
                    ? "border-pw-primary bg-blue-50"
                    : "border-slate-100"
                }`}
              >
                <span className="text-2xl block mb-1">🐈</span>
                <span
                  className={`text-xs font-bold ${
                    type === "cat" ? "text-pw-primary" : "text-slate-600"
                  }`}
                >
                  Kedi
                </span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">İsim</label>
            <input
              type="text"
              name="name"
              placeholder="Örn: Luna"
              required
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary transition-all"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Cins</label>
              <input
                type="text"
                name="breed"
                placeholder="Örn: Golden"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary transition-all"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Yaş</label>
              <input
                type="number"
                name="age"
                placeholder="3"
                min="0"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-pw-primary text-white py-4 rounded-2xl font-bold text-base shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-transform mt-2 disabled:opacity-60"
          >
            {submitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
        <div className="h-6"></div>
      </div>
    </div>
  );
}
