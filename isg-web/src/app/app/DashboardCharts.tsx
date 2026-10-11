"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Section } from "@/components/ui";
import { LEVELS, RISK_META, level } from "@/lib/risk";
import type { RiskRow, Trx } from "@/lib/types";
import { cx, money, moneyShort } from "@/lib/format";

// Doğrulanmış iki seri paleti (validate_palette: CVD ΔE 19.9). Turuncu düşük kontrastlı olduğu için tablo görünümü de var.
const GELIR = "#107398";
const GIDER = "#F4772E";

function lastMonths(n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
    out.push({ key, label: x.toLocaleDateString("tr-TR", { month: "short" }) });
  }
  return out;
}

function shortTL(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} Mn`;
  if (a >= 1000) return `${(v / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} B`;
  return v.toLocaleString("tr-TR");
}

interface MonthRow {
  key: string;
  label: string;
  gelir: number;
  gider: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: MonthRow }> }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-2xl border border-line bg-white px-3.5 py-2.5 text-[12.5px] shadow-pop">
      <div className="mb-1 font-extrabold capitalize text-navy">{r.label}</div>
      <div className="flex items-center gap-2 text-text">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GELIR }} /> Gelir <span className="num ml-auto pl-4 font-bold">{money(r.gelir)}</span>
      </div>
      <div className="flex items-center gap-2 text-text">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GIDER }} /> Gider <span className="num ml-auto pl-4 font-bold">{money(r.gider)}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 border-t border-line pt-1 text-muted">
        Net <span className="num ml-auto pl-4 font-bold text-navy">{money(r.gelir - r.gider)}</span>
      </div>
    </div>
  );
}

export function DashboardCharts({ transactions, riskRows }: { transactions: Trx[]; riskRows: RiskRow[] }) {
  const [table, setTable] = useState(false);

  const months = useMemo<MonthRow[]>(() => {
    const ms = lastMonths(6);
    const map = new Map(ms.map((m) => [m.key, { ...m, gelir: 0, gider: 0 }]));
    for (const t of transactions) {
      const row = map.get(t.trx_date.slice(0, 7));
      if (!row) continue;
      if (t.type === "gelir") row.gelir += t.amount;
      else row.gider += t.amount;
    }
    return ms.map((m) => map.get(m.key)!);
  }, [transactions]);

  const dist = useMemo(() => {
    const c = { low: 0, mid: 0, high: 0, crit: 0 };
    for (const r of riskRows) c[level(r.o * r.s)] += 1;
    return c;
  }, [riskRows]);
  const distMax = Math.max(1, ...Object.values(dist));
  const hasMoney = months.some((m) => m.gelir || m.gider);

  return (
    <div className="mt-2 grid gap-5 lg:grid-cols-12">
      <Section
        label="Son 6 ay · gelir / gider"
        className="lg:col-span-8"
        right={
          <button onClick={() => setTable((v) => !v)} className="text-[12.5px] font-bold text-brand-blue hover:underline">
            {table ? "Grafik" : "Tablo"}
          </button>
        }
      >
        <Card>
          <div className="mb-2 flex items-center gap-4 text-[12.5px] font-bold text-text">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GELIR }} /> Gelir
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GIDER }} /> Gider
            </span>
          </div>
          {table ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="py-1.5">Ay</th>
                  <th className="py-1.5 text-right">Gelir</th>
                  <th className="py-1.5 text-right">Gider</th>
                  <th className="py-1.5 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.key} className="border-t border-line">
                    <td className="py-2 font-bold capitalize text-navy">{m.label}</td>
                    <td className="num py-2 text-right">{moneyShort(m.gelir)}</td>
                    <td className="num py-2 text-right">{moneyShort(m.gider)}</td>
                    <td className={cx("num py-2 text-right font-bold", m.gelir - m.gider < 0 ? "text-danger" : "text-navy")}>{moneyShort(m.gelir - m.gider)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : hasMoney ? (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E6EBF0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#6E7C8C", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} width={48} tick={{ fill: "#6E7C8C", fontSize: 11 }} tickFormatter={shortTL} />
                  <Tooltip cursor={{ fill: "rgba(16,115,152,0.06)" }} content={<ChartTooltip />} />
                  <Bar dataKey="gelir" name="Gelir" fill={GELIR} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="gider" name="Gider" fill={GIDER} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-[13.5px] text-muted">Son 6 ayda kasa hareketi yok.</div>
          )}
        </Card>
      </Section>

      <Section label="Risk maddeleri · seviye" className="lg:col-span-4">
        <Card>
          {riskRows.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-center text-[13.5px] text-muted">Henüz risk maddesi yok.</div>
          ) : (
            <div className="space-y-3.5 py-1">
              {[...LEVELS].reverse().map((lv) => {
                const m = RISK_META[lv];
                const n = dist[lv];
                return (
                  <div key={lv}>
                    <div className="mb-1 flex items-center justify-between text-[12.5px]">
                      <span className="font-bold text-navy">{m.label}</span>
                      <span className="num font-bold text-text">{n}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper">
                      <div className="h-full rounded-full" style={{ width: `${(n * 100) / distMax}%`, background: m.color }} />
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted">Termin: {m.termin}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Section>
    </div>
  );
}
