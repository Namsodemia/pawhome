"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LoaderCircle, Search, ShieldCheck, Sparkles, TriangleAlert, X } from "lucide-react";
import { Badge, ButtonLink, Card, Empty, Fab, Hero, HeroKicker, Input, PageHeader, ProgressBar, Section } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useRiskRunner, type RiskJob } from "@/lib/ai/riskRunner";
import { LEVELS, RISK_META, level } from "@/lib/risk";
import { cx, fmtDate, norm } from "@/lib/format";
import type { Analysis } from "@/lib/types";

const RANGES = { low: "1-7", mid: "8-14", high: "15-19", crit: "20-25" } as const;

export default function RiskListPage() {
  const router = useRouter();
  const analyses = useStore((s) => s.analyses);
  const riskRows = useStore((s) => s.riskRows);
  const jobs = useRiskRunner((s) => s.jobs);
  const [q, setQ] = useState("");

  // Komut paleti / kısayol: /app/risk?yeni=1 → yeni analiz formu
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("yeni") === "1") router.replace("/app/risk/yeni");
  }, [router]);

  const stats = useMemo(() => {
    const m = new Map<number, { rows: number; max: number }>();
    for (const r of riskRows) {
      const x = m.get(r.analysis_id) ?? { rows: 0, max: 0 };
      x.rows += 1;
      x.max = Math.max(x.max, r.o * r.s);
      m.set(r.analysis_id, x);
    }
    return m;
  }, [riskRows]);

  const items = useMemo(() => [...analyses].sort((a, b) => b.id - a.id), [analyses]);
  const totalRows = useMemo(() => items.reduce((t, a) => t + (stats.get(a.id)?.rows ?? 0), 0), [items, stats]);
  const crit = useMemo(() => items.filter((a) => (stats.get(a.id)?.max ?? 0) >= 20).length, [items, stats]);

  const shown = useMemo(() => {
    const n = norm(q);
    if (!n) return items;
    return items.filter((a) => norm(`${a.title} ${a.nace_code} ${a.sector_name} ${a.hazard_class}`).includes(n));
  }, [items, q]);

  return (
    <div>
      <PageHeader title="Risk Analizi" subtitle="Yapay zekâ destekli 5x5 L tipi matris risk değerlendirmesi" />

      <Hero>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <HeroKicker>RİSK DEĞERLENDİRME · 5x5 L TİPİ MATRİS</HeroKicker>
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
              <Big n={items.length} l="analiz" />
              <Big n={totalRows} l="madde" />
              <Big n={crit} l="kabul edilemez" danger={crit > 0} />
            </div>
          </div>
          <ButtonLink href="/app/risk/yeni" kind="white" icon={Sparkles} className="hidden md:inline-flex">
            Yeni Risk Analizi
          </ButtonLink>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/15 pt-3.5">
          {LEVELS.map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-semibold text-white/90 ring-1 ring-white/15">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: RISK_META[k].color }} />
              {RISK_META[k].short}
              <span className="num text-[11px] text-white/60">{RANGES[k]}</span>
            </span>
          ))}
        </div>
      </Hero>

      <Section
        label="Analizler"
        right={items.length ? <span className="num text-[12px] font-semibold text-muted">{shown.length === items.length ? items.length : `${shown.length}/${items.length}`}</span> : null}
      >
        {items.length > 0 ? (
          <div className="relative mb-3">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="İşyeri, NACE kodu veya sektör ara…" className="pl-11 pr-10" aria-label="Analiz ara" />
            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Aramayı temizle"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-navy"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        ) : null}

        {items.length === 0 ? (
          <Empty
            icon={ShieldCheck}
            title="Henüz risk analizi yok."
            text="İşletmeyi tanımlayın, yapay zekâ 5x5 matris maddelerini üretsin."
            action={
              <ButtonLink href="/app/risk/yeni" kind="orange" icon={Sparkles}>
                Yeni Risk Analizi
              </ButtonLink>
            }
          />
        ) : shown.length === 0 ? (
          <Empty icon={Search} title="Sonuç yok" text="Aramanızla eşleşen analiz bulunamadı." />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {shown.map((a) => (
              <AnalysisCard key={a.id} a={a} st={stats.get(a.id) ?? { rows: 0, max: 0 }} job={jobs[a.id]} />
            ))}
          </div>
        )}
      </Section>

      <Fab label="Yeni Risk Analizi" icon={Sparkles} href="/app/risk/yeni" />
    </div>
  );
}

function Big({ n, l, danger }: { n: number; l: string; danger?: boolean }) {
  return (
    <div>
      <div className={cx("num text-[30px] font-extrabold leading-none tracking-tight md:text-[34px]", danger ? "text-[#FFC9D1]" : "text-white")}>{n}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[11.5px] font-semibold text-white/75">
        {danger ? <span className="h-2 w-2 rounded-full bg-[#D6334C] ring-2 ring-white/40" /> : null}
        {l}
      </div>
    </div>
  );
}

function AnalysisCard({ a, st, job }: { a: Analysis; st: { rows: number; max: number }; job?: RiskJob }) {
  const lv = st.max ? level(st.max) : null;
  const m = lv ? RISK_META[lv] : null;
  const running = !!job?.running;
  const pct = running ? Math.max(4, Math.round(((job?.done ?? 0) * 100) / Math.max(1, job?.total ?? 1))) : 0;
  return (
    <Card href={`/app/risk/detay/?id=${a.id}`} padded={false} className="p-3.5 md:p-4">
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-[56px] w-[52px] shrink-0 flex-col items-center justify-center rounded-2xl"
          style={{ background: m ? m.color : "#E8ECEA", color: m ? m.text : "#6E7C8C" }}
          title={m ? `En yüksek skor: ${st.max} · ${m.label}` : "Henüz madde yok"}
        >
          <span className="num text-[20px] font-extrabold leading-none">{st.max || "–"}</span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-wider opacity-80">maks</span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-[15px] font-bold leading-snug text-ink">{a.title}</div>
          <div className="mt-0.5 truncate text-[12.5px] text-muted">
            <span className="num">NACE {a.nace_code || "—"}</span> · {a.sector_name}
          </div>
          {running ? (
            <div className="mt-2.5">
              <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-brand-teal">
                <LoaderCircle size={13} className="shrink-0 animate-spin" />
                <span className="truncate">{job?.step}</span>
                <span className="num ml-auto shrink-0 text-muted">
                  {st.rows}/{a.item_count}
                </span>
              </div>
              <ProgressBar value={pct} className="mt-1.5 !h-1.5" />
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="orange">{a.hazard_class}</Badge>
              <Badge tone="gray">
                <span className="num">{st.rows}</span> madde
              </Badge>
              {job?.error ? (
                <Badge tone="red">
                  <TriangleAlert size={12} /> Hata
                </Badge>
              ) : a.status === "uretiliyor" ? (
                <Badge tone="warn">Yarım kaldı</Badge>
              ) : a.status === "taslak" ? (
                <Badge tone="gray">Taslak</Badge>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 self-stretch">
          <span className="num text-[11px] text-muted">{fmtDate(a.analysis_date)}</span>
          <ChevronRight size={18} className="mt-auto text-[#B4BFC5]" />
        </div>
      </div>
    </Card>
  );
}
