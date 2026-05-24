"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddPostModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/posts", {
      method: "POST",
      body: JSON.stringify({
        category: fd.get("category"),
        title: fd.get("title"),
        content: fd.get("content"),
      }),
      headers: { "Content-Type": "application/json" },
    });
    setSubmitting(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Bir hata oluştu.");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-5 w-12 h-12 bg-white text-pw-primary border border-pw-primary/20 rounded-full shadow-lg flex items-center justify-center text-xl z-30 active:scale-90 transition-transform"
      >
        <i className="fa-solid fa-pen"></i>
      </button>

      <div className={`fixed inset-0 z-[60] ${open ? "" : "hidden"}`}>
        <div
          onClick={() => setOpen(false)}
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
            <h3 className="text-xl font-bold text-slate-800">Soru Sor / Paylaş</h3>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs font-medium px-4 py-2 rounded-xl mb-3 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
                Kategori
              </label>
              <select
                name="category"
                defaultValue="beslenme"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary appearance-none"
              >
                <option value="beslenme">Beslenme</option>
                <option value="saglik">Sağlık</option>
                <option value="egitim">Eğitim</option>
                <option value="hikaye">Hikaye Paylaş</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
                Konu Başlığı
              </label>
              <input
                type="text"
                name="title"
                placeholder="Örn: Yavru kedim sürekli miyavlıyor"
                required
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">
                Detaylar
              </label>
              <textarea
                name="content"
                rows={4}
                placeholder="Durumu detaylıca anlat..."
                required
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-pw-primary transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-pw-primary text-white py-4 rounded-2xl font-bold text-base shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-transform mt-2 disabled:opacity-60"
            >
              {submitting ? "Paylaşılıyor..." : "Paylaş"}
            </button>
          </form>
          <div className="h-6"></div>
        </div>
      </div>
    </>
  );
}
