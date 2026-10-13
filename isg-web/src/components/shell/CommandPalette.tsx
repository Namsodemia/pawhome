"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { create } from "zustand";
import { ArrowRight, MessagesSquare, Plus, Search, ShieldCheck, User, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { ALL_NAV } from "@/lib/nav";
import { cx, norm } from "@/lib/format";

export const useCommandPalette = create<{ visible: boolean; open: () => void; close: () => void }>((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));

interface Cmd {
  id: string;
  label: string;
  sub?: string;
  href: string;
  icon: LucideIcon;
  color: string;
  group: string;
}

const QUICK: Cmd[] = [
  { id: "q-risk", label: "Yeni risk analizi", href: "/app/risk/yeni", icon: Plus, color: "#5CBD7D", group: "Hızlı işlem" },
  { id: "q-kasa", label: "Gelir / gider ekle", href: "/app/kasa?yeni=1", icon: Plus, color: "#107398", group: "Hızlı işlem" },
  { id: "q-kur", label: "Kursiyer ekle", href: "/app/musteri?yeni=1", icon: Plus, color: "#0B6F7B", group: "Hızlı işlem" },
  { id: "q-olay", label: "Kaza / ramak kala kaydet", href: "/app/kaza?yeni=1", icon: Plus, color: "#D6334C", group: "Hızlı işlem" },
  { id: "q-den", label: "Saha denetimi başlat", href: "/app/denetim?yeni=1", icon: Plus, color: "#3AA466", group: "Hızlı işlem" },
  { id: "q-deneme", label: "25 soruluk deneme sınavı", href: "/app/sinav/deneme?n=25", icon: Plus, color: "#6C5CE7", group: "Hızlı işlem" },
];

export function CommandPalette() {
  const router = useRouter();
  const { visible, open, close } = useCommandPalette();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const kursiyerler = useStore((s) => s.kursiyerler);
  const analyses = useStore((s) => s.analyses);
  const siniflar = useStore((s) => s.siniflar);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (useCommandPalette.getState().visible) close();
        else open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (visible) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [visible]);

  const results = useMemo(() => {
    const n = norm(q);
    const pages: Cmd[] = ALL_NAV.map((p) => ({ id: p.href, label: p.label, href: p.href, icon: p.icon, color: p.color, group: "Sayfalar" }));
    const data: Cmd[] = [
      ...kursiyerler
        .filter((k) => k.is_active)
        .map((k) => ({
          id: `k${k.id}`,
          label: k.full_name,
          sub: [k.group_name, k.phone].filter(Boolean).join(" · "),
          href: `/app/musteri/detay/?id=${k.id}`,
          icon: User,
          color: "#0B6F7B",
          group: "Kursiyerler",
        })),
      ...analyses.map((a) => ({
        id: `a${a.id}`,
        label: a.title,
        sub: `NACE ${a.nace_code || "-"} · ${a.sector_name}`,
        href: `/app/risk/detay/?id=${a.id}`,
        icon: ShieldCheck,
        color: "#5CBD7D",
        group: "Risk analizleri",
      })),
      ...siniflar.map((s) => ({ id: `s${s.id}`, label: s.ad, sub: s.aciklama, href: `/app/siniflar/detay/?id=${s.id}`, icon: MessagesSquare, color: s.renk, group: "Sınıflar" })),
    ];
    if (!n) return [...QUICK, ...pages];
    const match = (c: Cmd) => norm(`${c.label} ${c.sub || ""}`).includes(n);
    return [...QUICK.filter(match), ...pages.filter(match), ...data.filter(match)].slice(0, 30);
  }, [q, kursiyerler, analyses, siniflar]);

  const go = (c: Cmd | undefined) => {
    if (!c) return;
    close();
    router.push(c.href);
  };

  if (!visible) return null;
  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-navy-deep/45 backdrop-blur-[2px]" onClick={close} />
      <div className="relative w-full max-w-xl animate-pop-in overflow-hidden rounded-xl3 bg-white shadow-pop">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} className="text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((v) => Math.min(results.length - 1, v + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((v) => Math.max(0, v - 1));
              } else if (e.key === "Enter") go(results[sel]);
            }}
            placeholder="Sayfa, kursiyer, analiz veya sınıf ara…"
            className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-[#9AA6B2]"
          />
          <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[11px] font-bold text-muted">ESC</kbd>
        </div>
        <div className="max-h-[56vh] overflow-y-auto p-2">
          {results.length === 0 ? <div className="px-3 py-8 text-center text-[14px] text-muted">Sonuç bulunamadı.</div> : null}
          {results.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            const Icon = c.icon;
            return (
              <div key={c.id}>
                {header ? <div className="px-3 pb-1 pt-3 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#9AA6B2]">{header}</div> : null}
                <button
                  onMouseEnter={() => setSel(i)}
                  onClick={() => go(c)}
                  className={cx("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition", i === sel ? "bg-soft-blue" : "hover:bg-paper")}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: c.color }}>
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-navy">{c.label}</span>
                    {c.sub ? <span className="block truncate text-[12px] text-muted">{c.sub}</span> : null}
                  </span>
                  {i === sel ? <ArrowRight size={16} className="text-brand-blue" /> : null}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
