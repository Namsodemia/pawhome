"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowDownWideNarrow,
  CalendarClock,
  CalendarDays,
  CirclePause,
  FileSpreadsheet,
  Info,
  ListOrdered,
  LoaderCircle,
  Play,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  ShieldQuestion,
  Sparkles,
  Square,
  Trash2,
  TriangleAlert,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Badge, Button, ButtonLink, Card, Chips, Empty, Hero, HeroKicker, Input, PageHeader, ProgressBar, ScoreBox, Section, Segment, Loading } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { aiMode, describeError, subscribeAiConfig, type AiMode } from "@/lib/ai/client";
import { clearJob, resumeGeneration, startGeneration, stopGeneration, useRiskJob } from "@/lib/ai/riskRunner";
import { LEVELS, RISK_META, level, type Level } from "@/lib/risk";
import { cx, fmtDate, norm } from "@/lib/format";
import { sektorItems, sortedRows, validUntil, validityYears } from "@/lib/export/risk-common";
import { exportRiskExcel } from "@/lib/export/risk-excel";
import { printRiskPdf } from "@/lib/export/risk-pdf";
import type { RiskRow } from "@/lib/types";
import { RiskMatrix, type MatrixCell } from "./RiskMatrix";
import { RowEditor } from "./RowEditor";

const ALL = "__tumu__";
type SortMode = "sira" | "skor";

function RiskDetailPageView() {
  const params = { id: useSearchParams().get("id") ?? "" };
  const id = Number(params?.id);
  const router = useRouter();

  const a = useStore((s) => s.analyses.find((x) => x.id === id));
  const allRows = useStore((s) => s.riskRows);
  const rows = useMemo(() => sortedRows(allRows, id), [allRows, id]);
  const job = useRiskJob(id);
  const running = !!job?.running;

  const [section, setSection] = useState<string>(ALL);
  const [lvFilter, setLvFilter] = useState<Level | null>(null);
  const [cell, setCell] = useState<MatrixCell | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("sira");
  const [editing, setEditing] = useState<{ rowId: number | null; key: number } | null>(null);
  const [busy, setBusy] = useState<"excel" | "pdf" | null>(null);
  const [mode, setMode] = useState<AiMode | null>(null);

  useEffect(() => {
    let alive = true;
    const check = () => {
      void aiMode().then((m) => {
        if (alive) setMode(m);
      });
    };
    check();
    const unsub = subscribeAiConfig(check);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  // ---------------------------------------------------------------- türetilmiş veriler
  const numberOf = useMemo(() => new Map(rows.map((r, i) => [r.id, i + 1])), [rows]);
  const sections = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.bolum, (m.get(r.bolum) ?? 0) + 1);
    return Array.from(m, ([name, n]) => ({ name, n }));
  }, [rows]);
  const counts = useMemo(() => {
    const c: Record<Level, number> = { low: 0, mid: 0, high: 0, crit: 0 };
    for (const r of rows) c[level(r.o * r.s)] += 1;
    return c;
  }, [rows]);

  const activeSection = section !== ALL && sections.some((s) => s.name === section) ? section : ALL;
  const shown = useMemo(() => {
    const n = norm(q);
    const list = rows.filter((r) => {
      if (activeSection !== ALL && r.bolum !== activeSection) return false;
      if (lvFilter && level(r.o * r.s) !== lvFilter) return false;
      if (cell && (r.o !== cell.o || r.s !== cell.s)) return false;
      if (n && !norm(`${r.bolum} ${r.faaliyet} ${r.tehlike} ${r.risk} ${r.onlem} ${r.sorumlu}`).includes(n)) return false;
      return true;
    });
    if (sort === "skor") list.sort((x, y) => y.o * y.s - x.o * x.s || (numberOf.get(x.id) ?? 0) - (numberOf.get(y.id) ?? 0));
    return list;
  }, [rows, activeSection, lvFilter, cell, q, sort, numberOf]);

  const editingRow = editing?.rowId ? rows.find((r) => r.id === editing.rowId) ?? null : null;
  const closeEditor = useCallback(() => setEditing(null), []);
  const openRow = useCallback((rowId: number | null) => setEditing({ rowId, key: Date.now() }), []);

  // ---------------------------------------------------------------- işlemler
  if (!a) {
    return (
      <div>
        <PageHeader title="Risk Analizi" back="/app/risk" />
        <Empty
          icon={ShieldQuestion}
          title="Analiz bulunamadı"
          text="Bu analiz silinmiş ya da hiç oluşturulmamış olabilir."
          action={
            <ButtonLink href="/app/risk" kind="secondary">
              Analizlere dön
            </ButtonLink>
          }
        />
      </div>
    );
  }
  const an = a;

  async function exportExcel() {
    setBusy("excel");
    try {
      await exportRiskExcel(an, rows);
      toast("Excel dosyası indirildi.");
    } catch (e) {
      toast(`Dışa aktarılamadı: ${describeError(e)}`, "error");
    } finally {
      setBusy(null);
    }
  }

  function exportPdf() {
    setBusy("pdf");
    try {
      printRiskPdf(an, rows);
    } catch (e) {
      toast(`PDF üretilemedi: ${describeError(e)}`, "error");
    } finally {
      setBusy(null);
    }
  }

  function generate() {
    if (mode === "none") {
      toast("Yapay zekâ henüz etkin değil; site yöneticisi ortak anahtarı tanımlayınca açılır.", "error");
      return;
    }
    void startGeneration(an.id);
  }

  function resume() {
    if (mode === "none") {
      toast("Yapay zekâ henüz etkin değil; site yöneticisi ortak anahtarı tanımlayınca açılır.", "error");
      return;
    }
    void resumeGeneration(an.id);
  }

  function stop() {
    stopGeneration(an.id);
    toast("Üretim durduruldu. Kaydedilen maddeler korunuyor.", "info");
  }

  async function regenerate() {
    const ok = await confirmDialog({ title: "Yeniden üret", text: "Mevcut maddeler silinip baştan üretilecek.", okLabel: "Yeniden Üret", danger: true });
    if (ok) generate();
  }

  async function remove() {
    const ok = await confirmDialog({ title: "Analizi sil", text: "Bu analiz ve tüm maddeleri silinecek. Emin misiniz?", okLabel: "Sil", danger: true });
    if (!ok) return;
    stopGeneration(an.id);
    useStore.getState().deleteAnalysis(an.id);
    clearJob(an.id);
    toast("Analiz silindi.");
    router.replace("/app/risk");
  }

  function toggleLevel(k: Level) {
    setCell(null);
    setLvFilter((p) => (p === k ? null : k));
  }
  function selectCell(c: MatrixCell | null) {
    setLvFilter(null);
    setCell(c);
  }

  const pct = running ? Math.max(4, Math.round(((job?.done ?? 0) * 100) / Math.max(1, job?.total ?? 1))) : 0;
  const incomplete = rows.length < a.item_count;
  const showResumeCard = !running && !job?.error && a.status === "uretiliyor";
  const showEmpty = !running && rows.length === 0 && !job?.error && a.status !== "uretiliyor";
  const until = validUntil(a);
  const hasFilter = activeSection !== ALL || !!lvFilter || !!cell || !!q.trim();
  const su = sektorItems(a.sektor_uygulama);

  return (
    <div>
      <PageHeader title="Risk Değerlendirmesi" subtitle="5x5 L tipi matris · olasılık × şiddet" back="/app/risk" />

      <div className={cx("grid gap-4", rows.length > 0 && "lg:grid-cols-[minmax(0,1fr)_360px]")}>
        {/* Başlık kartı */}
        <Hero tone="dark">
          <HeroKicker>İSG RİSK DEĞERLENDİRME</HeroKicker>
          <h2 className="mt-2 text-[22px] font-extrabold leading-tight tracking-tight md:text-[26px]">{a.title}</h2>
          <div className="mt-1 text-[13.5px] text-white/80">
            <span className="num">NACE {a.nace_code || "—"}</span> · {a.sector_name}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="orange">{a.hazard_class}</Badge>
            <HeroChip>
              <CalendarDays size={12} />
              <span className="num">{fmtDate(a.analysis_date)}</span>
            </HeroChip>
            <HeroChip>
              <span className="num">
                {rows.length}/{a.item_count}
              </span>{" "}
              madde
            </HeroChip>
            {a.hazard_auto ? <HeroChip>Sınıf: otomatik</HeroChip> : null}
          </div>
          {a.activity_desc ? <p className="mt-3.5 text-[14px] leading-relaxed text-white/90">{a.activity_desc}</p> : null}
          <div className="mt-4 grid grid-cols-1 gap-2.5 border-t border-white/15 pt-3.5 text-[12.5px] sm:grid-cols-3">
            <Info2 icon={Users} label="Çalışanlar" value={a.personnel || "—"} />
            <Info2 icon={UserRound} label="İşveren / Yetkili" value={a.employer_label || "—"} />
            <Info2
              icon={CalendarClock}
              label="Geçerlilik"
              value={
                <>
                  <span className="num">{fmtDate(until)}</span> <span className="text-white/60">({validityYears(a)} yıl)</span>
                </>
              }
            />
          </div>
        </Hero>

        {rows.length > 0 ? <RiskMatrix rows={rows} selected={cell} onSelect={selectCell} /> : null}
      </div>

      {/* Canlı ilerleme */}
      {running && job ? (
        <div className="mt-4 rounded-xl2 border border-brand-mint bg-soft-green p-4 shadow-card md:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-teal shadow-card">
              <LoaderCircle size={20} className="animate-spin" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-bold text-brand-teal">{job.step}</div>
              <div className="num text-[12px] text-brand-teal/80">
                Adım {Math.min(job.done + 1, job.total)}/{job.total} · {rows.length}/{a.item_count} madde hazır
              </div>
            </div>
            <Button kind="ghost" small icon={Square} onClick={stop} className="bg-white">
              Durdur
            </Button>
          </div>
          <ProgressBar value={pct} className="mt-3" track="bg-white" />
          <div className="mt-2.5 text-[12.5px] leading-relaxed text-brand-teal">
            Sekmeyi kapatmayın; başka sayfalara geçebilirsiniz, üretim arka planda sürer. Maddeler bölüm bölüm kaydediliyor.
          </div>
        </div>
      ) : null}

      {/* Hata */}
      {!running && job?.error ? (
        <div className="mt-4 rounded-xl2 border border-danger/40 bg-soft-danger p-4 md:p-5">
          <div className="flex items-start gap-3">
            <TriangleAlert size={20} className="mt-0.5 shrink-0 text-danger" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-danger">{job.error}</div>
              <div className="mt-0.5 text-[12.5px] text-danger/80">
                <span className="num">
                  {rows.length}/{a.item_count}
                </span>{" "}
                madde kaydedildi; kaldığı yerden devam edebilirsiniz.
              </div>
            </div>
            <button type="button" onClick={() => clearJob(a.id)} aria-label="Kapat" className="rounded-lg p-1 text-danger/70 hover:bg-white/60 hover:text-danger">
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button small icon={Play} onClick={resume}>
              Kaldığı yerden devam
            </Button>
            <ButtonLink href="/app/ayarlar" small kind="ghost" icon={Settings} className="bg-white">
              Ayarlar
            </ButtonLink>
          </div>
        </div>
      ) : null}

      {/* Durduruldu / yarım kaldı */}
      {showResumeCard ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl2 border border-[#F3DFA8] bg-soft-warn p-4 md:p-5">
          <CirclePause size={22} className="shrink-0 text-warn" />
          <div className="min-w-0 flex-1 text-[13.5px] text-[#7A5312]">
            <div className="font-bold">{job?.stopped ? "Üretim durduruldu." : "Üretim yarım kaldı."}</div>
            <div className="text-[12.5px]">
              <span className="num">
                {rows.length}/{a.item_count}
              </span>{" "}
              madde kaydedildi. Eksik maddeler kaldığı yerden tamamlanabilir.
            </div>
          </div>
          <Button small kind="orange" icon={Play} onClick={resume}>
            Kaldığı yerden devam
          </Button>
        </div>
      ) : null}

      {/* Boş durum */}
      {showEmpty ? (
        <div className="mt-4">
          <Empty
            icon={Sparkles}
            title="Henüz madde yok."
            text={
              mode === "none"
                ? "Yapay zekâ henüz etkin değil (site yöneticisi ortak anahtarı tanımlamalı); maddeleri elle girebilirsiniz."
                : "Yapay zekâ işletme tanımınıza göre maddeleri bölüm bölüm üretsin ya da maddeleri elle ekleyin."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {mode === "none" ? (
                  <ButtonLink href="/app/ayarlar" kind="secondary" icon={Settings}>
                    Ayarlar
                  </ButtonLink>
                ) : (
                  <Button kind="orange" icon={Sparkles} onClick={generate}>
                    Yapay zekâ ile üret
                  </Button>
                )}
                <Button kind="ghost" icon={Plus} onClick={() => openRow(null)}>
                  Madde ekle
                </Button>
              </div>
            }
          />
        </div>
      ) : null}

      {rows.length > 0 ? (
        <>
          {/* Seviye kutuları */}
          <div className="mt-4 grid grid-cols-4 gap-2 md:gap-3">
            {LEVELS.map((k) => {
              const active = lvFilter === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleLevel(k)}
                  className={cx(
                    "rounded-2xl px-2 py-3 text-center shadow-card transition hover:-translate-y-0.5 md:py-4",
                    active && "ring-2 ring-navy ring-offset-2",
                    lvFilter && !active && "opacity-60",
                  )}
                  style={{ background: RISK_META[k].color, color: RISK_META[k].text }}
                  title={`${RISK_META[k].label} · Termin: ${RISK_META[k].termin}`}
                >
                  <div className="num text-[22px] font-extrabold leading-none md:text-[26px]">{counts[k]}</div>
                  <div className="mt-1 text-[11.5px] font-bold">{RISK_META[k].short}</div>
                  <div className="mt-0.5 hidden text-[10.5px] font-semibold opacity-75 md:block">{RISK_META[k].termin}</div>
                </button>
              );
            })}
          </div>

          {/* İşlemler */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button small icon={FileSpreadsheet} onClick={exportExcel} loading={busy === "excel"}>
              Excel
            </Button>
            <Button small kind="secondary" icon={Printer} onClick={exportPdf} loading={busy === "pdf"}>
              PDF
            </Button>
            <Button small kind="ghost" icon={Plus} onClick={() => openRow(null)} disabled={running}>
              Madde ekle
            </Button>
            {incomplete && !running ? (
              <Button small kind="orange" icon={Play} onClick={resume}>
                Tamamla
              </Button>
            ) : null}
          </div>

          {/* Maddeler */}
          <Section
            label="Risk maddeleri"
            right={
              <span className="num text-[12px] font-semibold text-muted">
                {shown.length === rows.length ? rows.length : `${shown.length}/${rows.length}`}
              </span>
            }
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Maddelerde ara (tehlike, risk, önlem, sorumlu…)" className="pl-11" aria-label="Maddelerde ara" />
              </div>
              <Segment<SortMode>
                className="md:w-[260px]"
                value={sort}
                onChange={setSort}
                options={[
                  {
                    value: "sira",
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <ListOrdered size={15} /> Sıra
                      </span>
                    ),
                  },
                  {
                    value: "skor",
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <ArrowDownWideNarrow size={15} /> Skora göre
                      </span>
                    ),
                  },
                ]}
              />
            </div>

            <Chips
              scroll
              className="mt-3"
              value={activeSection}
              onChange={setSection}
              options={[
                { value: ALL, label: `Tümü (${rows.length})` },
                ...sections.map((s) => ({
                  value: s.name,
                  label: (
                    <span>
                      {s.name || "Bölümsüz"} <span className="num opacity-60">{s.n}</span>
                    </span>
                  ),
                })),
              ]}
            />

            {lvFilter || cell ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
                <span>Filtre:</span>
                <button
                  type="button"
                  onClick={() => {
                    setLvFilter(null);
                    setCell(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 font-bold text-navy hover:border-brand-blue/40"
                >
                  {lvFilter ? (
                    <>
                      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: RISK_META[lvFilter].color }} />
                      {RISK_META[lvFilter].label}
                    </>
                  ) : cell ? (
                    <span className="num">
                      Olasılık {cell.o} × Şiddet {cell.s} = {cell.o * cell.s}
                    </span>
                  ) : null}
                  <X size={14} />
                </button>
              </div>
            ) : null}

            {shown.length === 0 ? (
              <div className="mt-4">
                <Empty icon={Search} title="Eşleşen madde yok" text={hasFilter ? "Filtreleri değiştirip tekrar deneyin." : undefined} />
              </div>
            ) : (
              <div className="mt-4 space-y-2.5 lg:space-y-0 lg:overflow-hidden lg:rounded-xl2 lg:border lg:border-line/70 lg:bg-white lg:shadow-card">
                <div className="hidden bg-paper/70 px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-muted lg:grid lg:grid-cols-[60px_minmax(0,1.2fr)_minmax(0,1.4fr)_150px] lg:gap-4">
                  <div>Skor</div>
                  <div>Faaliyet · Tehlike · Risk</div>
                  <div>Alınacak önlem</div>
                  <div>Sorumlu · Termin</div>
                </div>
                {shown.map((r) => (
                  <RowItem key={r.id} r={r} n={numberOf.get(r.id) ?? 0} onOpen={() => openRow(r.id)} />
                ))}
              </div>
            )}
          </Section>
        </>
      ) : null}

      {/* Sektöre özel uygulama */}
      {su.length > 0 ? (
        <Section label="Sektöre Özel Uygulama">
          <Card>
            <ol className="space-y-3">
              {su.map((x, i) => (
                <li key={i} className="flex gap-3">
                  <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-brandSoft text-[12.5px] font-extrabold text-brand-teal">{i + 1}</span>
                  <SuText text={x} />
                </li>
              ))}
            </ol>
          </Card>
        </Section>
      ) : null}

      {/* Alt işlemler */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5">
        <Button small kind="ghost" icon={RefreshCw} onClick={regenerate} disabled={running}>
          Yeniden üret
        </Button>
        <Button small kind="danger" icon={Trash2} onClick={remove}>
          Analizi sil
        </Button>
      </div>

      {editing ? (
        <RowEditor
          key={editing.key}
          analysis={a}
          row={editingRow}
          defaultBolum={activeSection !== ALL ? activeSection : ""}
          sections={sections.map((s) => s.name).filter(Boolean)}
          onClose={closeEditor}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- parçalar

function HeroChip({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-bold text-white ring-1 ring-white/15">{children}</span>;
}

function Info2({ icon: Icon, label, value }: { icon: typeof Info; label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 gap-2">
      <Icon size={15} className="mt-0.5 shrink-0 text-brand-mint" />
      <div className="min-w-0">
        <div className="text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-white/60">{label}</div>
        <div className="mt-0.5 leading-snug text-white/90">{value}</div>
      </div>
    </div>
  );
}

/** "Kritik faaliyet: önlem" biçimindeki maddede başlığı kalın gösterir. */
function SuText({ text }: { text: string }) {
  const i = text.indexOf(":");
  if (i > 0 && i < 90) {
    return (
      <p className="pt-0.5 text-[14px] leading-relaxed text-text">
        <b className="text-navy">{text.slice(0, i)}:</b>
        {text.slice(i + 1)}
      </p>
    );
  }
  return <p className="pt-0.5 text-[14px] leading-relaxed text-text">{text}</p>;
}

function RowItem({ r, n, onOpen }: { r: RiskRow; n: number; onOpen: () => void }) {
  const lv = level(r.o * r.s);
  const m = RISK_META[lv];
  const badges = (
    <>
      <Badge tone="blue">{r.sorumlu || "İŞVEREN"}</Badge>
      <Badge tone={lv === "crit" ? "red" : "gray"}>{m.termin}</Badge>
    </>
  );
  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-xl2 border border-line/70 bg-white p-3.5 text-left shadow-card transition hover:border-brand-blue/30 hover:shadow-bar lg:rounded-none lg:border-0 lg:border-t lg:px-4 lg:py-3 lg:shadow-none lg:hover:bg-paper/60 lg:hover:shadow-none"
    >
      <div className="flex gap-3 lg:grid lg:grid-cols-[60px_minmax(0,1.2fr)_minmax(0,1.4fr)_150px] lg:items-start lg:gap-4">
        <ScoreBox o={r.o} s={r.s} size={52} />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">
            <span className="num">{n}.</span> {r.bolum}
            {r.faaliyet ? ` · ${r.faaliyet}` : ""}
          </div>
          <div className="mt-0.5 text-[14.5px] font-extrabold leading-snug text-ink">{r.tehlike}</div>
          {r.risk ? <div className="mt-0.5 text-[13.5px] font-bold text-orange">→ {r.risk}</div> : null}
          {r.onlem ? <div className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-text lg:hidden">{r.onlem}</div> : null}
          <div className="mt-2 flex flex-wrap gap-1.5 lg:hidden">{badges}</div>
        </div>
        <div className="hidden text-[13px] leading-relaxed text-text lg:line-clamp-4">{r.onlem || <span className="text-muted">—</span>}</div>
        <div className="hidden flex-col items-start gap-1.5 lg:flex">{badges}</div>
      </div>
    </button>
  );
}

export default function RiskDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RiskDetailPageView />
    </Suspense>
  );
}
