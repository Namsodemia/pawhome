"use client";

import { Fragment, useMemo } from "react";
import type { RiskRow } from "@/lib/types";
import { OLASILIK_LABELS, RISK_META, SIDDET_LABELS, level } from "@/lib/risk";
import { cx } from "@/lib/format";

export interface MatrixCell {
  o: number;
  s: number;
}

/** "#RRGGBB" + saydamlık → rgba */
function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/**
 * 5×5 risk matrisi ısı haritası: satırlar olasılık (5 → 1), kolonlar şiddet (1 → 5).
 * Hücre rengi risk seviyesine göre; içinde o hücreye düşen madde sayısı. Tıklayınca liste filtrelenir.
 */
export function RiskMatrix({ rows, selected, onSelect }: { rows: RiskRow[]; selected: MatrixCell | null; onSelect: (c: MatrixCell | null) => void }) {
  const grid = useMemo(() => {
    const g = Array.from({ length: 5 }, () => [0, 0, 0, 0, 0]);
    for (const r of rows) {
      const o = Math.min(5, Math.max(1, r.o));
      const s = Math.min(5, Math.max(1, r.s));
      g[o - 1][s - 1] += 1;
    }
    return g;
  }, [rows]);

  return (
    <div className="rounded-xl2 border border-line/70 bg-white p-4 shadow-card md:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="section-label">Risk matrisi</div>
        {selected ? (
          <button type="button" onClick={() => onSelect(null)} className="text-[12px] font-bold text-brand-blue hover:underline">
            Seçimi kaldır
          </button>
        ) : (
          <span className="text-[11.5px] text-muted">Hücreye tıklayıp filtreleyin</span>
        )}
      </div>

      <div className="mt-3 flex gap-1.5">
        <div className="flex w-4 items-center justify-center">
          <span className="whitespace-nowrap text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            Olasılık
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-[20px_repeat(5,minmax(0,1fr))] gap-1.5">
            {[5, 4, 3, 2, 1].map((o) => (
              <Fragment key={o}>
                <div className="num flex items-center justify-center text-[12px] font-bold text-muted" title={OLASILIK_LABELS[o - 1]}>
                  {o}
                </div>
                {[1, 2, 3, 4, 5].map((s) => {
                  const n = grid[o - 1][s - 1];
                  const sc = o * s;
                  const m = RISK_META[level(sc)];
                  const active = selected?.o === o && selected?.s === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={!n}
                      onClick={() => onSelect(active ? null : { o, s })}
                      title={`Olasılık ${o} (${OLASILIK_LABELS[o - 1]}) × Şiddet ${s} (${SIDDET_LABELS[s - 1]}) = ${sc} · ${m.label}${n ? ` · ${n} madde` : ""}`}
                      className={cx(
                        "relative flex aspect-square items-center justify-center rounded-xl transition",
                        n ? "cursor-pointer hover:scale-[1.06] hover:shadow-card" : "cursor-default",
                        active && "ring-2 ring-navy ring-offset-2",
                        selected && !active && n ? "opacity-55" : "",
                      )}
                      style={{ background: n ? m.color : alpha(m.color, 0.2), color: n ? m.text : alpha("#1E3145", 0.35) }}
                    >
                      {n ? (
                        <>
                          <span className="num text-[16px] font-extrabold leading-none md:text-[17px]">{n}</span>
                          <span className="num absolute right-1 top-0.5 text-[8.5px] font-bold opacity-70">{sc}</span>
                        </>
                      ) : (
                        <span className="num text-[10.5px] font-semibold">{sc}</span>
                      )}
                    </button>
                  );
                })}
              </Fragment>
            ))}
            <div />
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="num pt-0.5 text-center text-[12px] font-bold text-muted" title={SIDDET_LABELS[s - 1]}>
                {s}
              </div>
            ))}
          </div>
          <div className="mt-1 pl-5 text-center text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">Şiddet</div>
        </div>
      </div>
    </div>
  );
}
