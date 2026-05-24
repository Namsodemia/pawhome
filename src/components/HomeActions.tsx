"use client";

import { useState } from "react";
import { AddPetModal } from "./AddPetModal";
import { AddReminderModal, type ReminderType } from "./AddReminderModal";

export function HomeQuickActions({
  petId,
  disabled,
}: {
  petId: number | null;
  disabled: boolean;
}) {
  const [modal, setModal] = useState<{ type: ReminderType; title: string } | null>(null);

  const actions: { type: ReminderType; title: string; icon: string; color: string; label: string }[] = [
    { type: "vaccine", title: "Aşı Takvimi", icon: "fa-syringe", color: "text-pw-primary", label: "Aşı" },
    { type: "food", title: "Mama Saati", icon: "fa-bone", color: "text-pw-secondary", label: "Mama" },
    { type: "walk", title: "Yürüyüş Planla", icon: "fa-paw", color: "text-pw-accent", label: "Gezdir" },
    { type: "vet", title: "Veteriner Randevusu", icon: "fa-user-doctor", color: "text-purple-500", label: "Vet" },
  ];

  return (
    <div
      className={`mb-8 ${disabled ? "opacity-50 pointer-events-none grayscale" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800">Hızlı İşlemler</h3>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((a) => (
          <button
            key={a.type}
            onClick={() => setModal({ type: a.type, title: a.title })}
            className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
          >
            <div
              className={`w-[68px] h-[68px] rounded-2xl bg-white ${a.color} flex items-center justify-center text-xl shadow-sm border border-slate-100`}
            >
              <i className={`fa-solid ${a.icon}`}></i>
            </div>
            <span className="text-[11px] font-medium text-slate-600">{a.label}</span>
          </button>
        ))}
      </div>

      <AddReminderModal
        open={!!modal}
        onClose={() => setModal(null)}
        petId={petId}
        type={modal?.type ?? "other"}
        title={modal?.title ?? ""}
      />
    </div>
  );
}

export function AddPetCard() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="bg-white rounded-3xl p-8 text-center mb-6 border-2 border-dashed border-pw-primary/30 hover:bg-blue-50 transition cursor-pointer group"
      >
        <div className="w-16 h-16 bg-blue-100 text-pw-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl group-hover:scale-110 transition-transform">
          <i className="fa-solid fa-plus"></i>
        </div>
        <h3 className="text-lg font-bold text-slate-800">Dostunu Ekle</h3>
        <p className="text-xs text-slate-500 mb-4 px-4">
          Uygulamayı kullanmaya başlamak için evcil hayvanının bilgilerini gir.
        </p>
        <button className="bg-pw-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/30">
          Hemen Ekle
        </button>
      </div>
      <AddPetModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
