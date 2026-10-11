"use client";

import { Check } from "lucide-react";
import { cx, upperTR } from "@/lib/format";

/** Mobil uygulamadaki SINIF_RENKLERI — aynı sıra. */
export const SINIF_RENKLERI = ["#0E7C86", "#1D9BF0", "#F4772E", "#5B4BB7", "#0F8A5F", "#C8102E", "#B45309", "#0B1F27"];

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">Renk</div>
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Sınıf rengi">
        {SINIF_RENKLERI.map((c) => {
          const on = value.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={c}
              onClick={() => onChange(c)}
              className={cx(
                "flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-105",
                on ? "ring-[3px] ring-navy ring-offset-2" : "ring-1 ring-black/5",
              )}
              style={{ background: c }}
            >
              {on ? <Check size={16} strokeWidth={3} className="text-white" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Sınıf listesindeki renkli baş harf avatarı. */
export function SinifInitial({ ad, renk, size = 46 }: { ad: string; renk: string; size?: number }) {
  const ch = upperTR((ad || "?").trim().slice(0, 1)) || "?";
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{ width: size, height: size, background: renk, fontSize: Math.round(size * 0.4) }}
    >
      {ch}
    </span>
  );
}

/** "Bugün" / "Dün" / "7 Eylül 2026" */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const key = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const now = new Date();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (key(d) === key(now)) return "Bugün";
  if (key(d) === key(y)) return "Dün";
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

/** Panoya kopyalar; Clipboard API yoksa gizli textarea ile dener. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
