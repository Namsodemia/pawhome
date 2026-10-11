"use client";

import { Check, CircleCheck, CircleX, ShieldQuestion, X } from "lucide-react";
import type { BetaToolUseBlock } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { FIELD_LABELS, TOOL_LABELS } from "@/lib/ai/assistant";
import { money } from "@/lib/format";
import { Button } from "@/components/ui";
import type { Decision } from "./session";
import { toolTitle } from "./session";

const MAX_ROWS = 50;

function fmtVal(key: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  if (key === "tutar" && typeof v === "number") return money(v);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

const label = (k: string) => FIELD_LABELS[k] ?? k;

/** "İşlem onayı · {araç adı}" kartı — girdileri tablo hâlinde gösterir; Onayla / Vazgeç */
export function ActionCard({
  tool,
  decision,
  disabled,
  onDecide,
}: {
  tool: BetaToolUseBlock;
  decision?: Decision;
  disabled?: boolean;
  onDecide: (d: Decision) => void;
}) {
  const input = (tool.input ?? {}) as Record<string, unknown>;
  const entries = Object.entries(input).filter(([, v]) => v !== "" && v !== null && v !== undefined);
  const scalars = entries.filter(([, v]) => !Array.isArray(v));
  const arrays = entries.filter(([, v]) => Array.isArray(v)) as [string, unknown[]][];

  return (
    <div className="animate-slide-up rounded-xl2 border border-brand-mint bg-soft-green/70 p-4 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <ShieldQuestion size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-extrabold text-brand-teal">İşlem onayı · {toolTitle(tool.name)}</div>
          <div className="text-[12px] text-muted">{TOOL_LABELS[tool.name] ?? tool.name} — onaylamadan hiçbir kayıt yapılmaz.</div>
        </div>
      </div>

      {scalars.length ? (
        <dl className="mt-3 overflow-hidden rounded-xl border border-line/70 bg-white text-[13px]">
          {scalars.map(([k, v]) => (
            <div key={k} className="flex gap-3 border-t border-line/70 px-3 py-1.5 first:border-t-0">
              <dt className="w-28 shrink-0 font-bold text-brand-teal">{label(k)}</dt>
              <dd className={k === "tutar" ? "num min-w-0 font-bold text-ink" : "min-w-0 text-text"}>{fmtVal(k, v)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {arrays.map(([k, list]) => {
        const shown = list.slice(0, MAX_ROWS);
        const objRows = shown.filter((r): r is Record<string, unknown> => !!r && typeof r === "object" && !Array.isArray(r));
        const cols = [...new Set(objRows.flatMap((r) => Object.keys(r).filter((c) => r[c] !== "" && r[c] != null)))];
        const total = objRows.reduce((a, r) => a + (typeof r.tutar === "number" ? r.tutar : 0), 0);
        return (
          <div key={k} className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[12.5px] font-bold text-brand-teal">
              <span>
                {label(k)} ({list.length} kayıt)
              </span>
              {total ? <span className="num text-ink">Toplam {money(total)}</span> : null}
            </div>
            <div className="max-h-80 overflow-auto rounded-xl border border-line/70 bg-white">
              {objRows.length ? (
                <table className="w-full border-collapse text-[12.5px]">
                  <thead className="sticky top-0 bg-paper">
                    <tr>
                      <th className="px-2.5 py-1.5 text-left font-extrabold text-muted">#</th>
                      {cols.map((c) => (
                        <th key={c} className="whitespace-nowrap px-2.5 py-1.5 text-left font-extrabold text-navy">
                          {label(c)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {objRows.map((r, i) => (
                      <tr key={i} className="border-t border-line/70">
                        <td className="num px-2.5 py-1.5 text-muted">{i + 1}</td>
                        {cols.map((c) => (
                          <td key={c} className={c === "tutar" ? "num whitespace-nowrap px-2.5 py-1.5 font-bold" : "px-2.5 py-1.5"}>
                            {fmtVal(c, r[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <ul className="p-3 text-[13px]">
                  {shown.map((r, i) => (
                    <li key={i}>• {String(r)}</li>
                  ))}
                </ul>
              )}
            </div>
            {list.length > MAX_ROWS ? <div className="mt-1 text-[12px] text-muted">… ve {list.length - MAX_ROWS} kayıt daha (en fazla 200 kayıt işlenir)</div> : null}
          </div>
        );
      })}

      <div className="mt-3.5 flex items-center gap-2">
        {decision ? (
          <span
            className={
              decision === "ok"
                ? "inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-success"
                : "inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-muted"
            }
          >
            {decision === "ok" ? <CircleCheck size={16} /> : <CircleX size={16} />}
            {decision === "ok" ? "Onaylandı — diğer işlemler bekleniyor" : "Vazgeçildi — diğer işlemler bekleniyor"}
          </span>
        ) : (
          <>
            <Button small icon={Check} onClick={() => onDecide("ok")} disabled={disabled} className="flex-1 sm:flex-none">
              Onayla
            </Button>
            <Button small kind="ghost" icon={X} onClick={() => onDecide("no")} disabled={disabled} className="bg-white">
              Vazgeç
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
