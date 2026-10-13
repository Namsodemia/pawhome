"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, FileSpreadsheet, Plus, Search, SearchX, Wallet, X } from "lucide-react";
import { Badge, Button, Card, Empty, Fab, Hero, HeroKicker, PageHeader, Section, Segment } from "@/components/ui";
import { toast } from "@/components/feedback";
import { kasaBalances, trxTotals, useStore } from "@/lib/store";
import { cx, fmtDate, money, moneyShort, norm, safeFileName, thisMonth, today } from "@/lib/format";
import { exportTableXlsx } from "@/lib/table-xlsx";
import type { Trx } from "@/lib/types";
import { TrxForm } from "./TrxForm";

type KasaFilter = number | "none" | null;
type TypeFilter = "all" | "gelir" | "gider";

const METHOD_LABEL: Record<string, string> = { nakit: "Nakit", banka: "Banka / EFT", kart: "Kredi Kartı" };

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  return s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);
}

function lastMonths(n: number): string[] {
  const [y, m] = thisMonth().split("-").map(Number);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(y, m - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function dayLabel(iso: string): string {
  const t = today();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  const yIso = `${y.getFullYear()}-${p(y.getMonth() + 1)}-${p(y.getDate())}`;
  const [yy, mm, dd] = iso.split("-").map(Number);
  const long = new Date(yy, mm - 1, dd).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
  if (iso === t) return `Bugün · ${long}`;
  if (iso === yIso) return `Dün · ${long}`;
  return long;
}

export default function KasaPage() {
  return (
    <Suspense fallback={null}>
      <KasaInner />
    </Suspense>
  );
}

function KasaInner() {
  const router = useRouter();
  const params = useSearchParams();
  const kasalar = useStore((s) => s.kasalar);
  const transactions = useStore((s) => s.transactions);
  const categories = useStore((s) => s.categories);

  const [kasa, setKasa] = useState<KasaFilter>(null);
  const [type, setType] = useState<TypeFilter>("all");
  const [month, setMonth] = useState("");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<{ key: number; id: number | null } | null>(null);
  const [exporting, setExporting] = useState(false);

  const openForm = useCallback((id: number | null) => setForm({ key: Date.now(), id }), []);

  // ?yeni=1 → formu aç (komut paleti / ana sayfa hızlı işlem)
  useEffect(() => {
    if (params.get("yeni") === "1") {
      openForm(null);
      router.replace("/app/kasa", { scroll: false });
    }
  }, [params, router, openForm]);

  const balances = useMemo(() => kasaBalances({ kasalar, transactions }), [kasalar, transactions]);
  const net = balances.reduce((a, b) => a + b.bakiye, 0);
  const gelir = balances.reduce((a, b) => a + b.gelir, 0);
  const gider = balances.reduce((a, b) => a + b.gider, 0);
  const kasasiz = useMemo(() => {
    const list = transactions.filter((t) => !t.kasa_id);
    return list.length ? trxTotals(list) : null;
  }, [transactions]);

  const kasaTitle = useMemo(() => new Map(kasalar.map((k) => [k.id, k.title])), [kasalar]);
  const catName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const months = useMemo(() => lastMonths(12), []);

  const filtered = useMemo(() => {
    const n = norm(q);
    return transactions
      .filter((t) => {
        if (kasa === "none" ? t.kasa_id : kasa !== null && t.kasa_id !== kasa) return false;
        if (type !== "all" && t.type !== type) return false;
        if (month && t.trx_date.slice(0, 7) !== month) return false;
        if (n) {
          const hay = norm(`${t.description} ${t.category_id ? catName.get(t.category_id) ?? "" : ""}`);
          if (!hay.includes(n)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.trx_date === b.trx_date ? b.id - a.id : a.trx_date < b.trx_date ? 1 : -1));
  }, [transactions, kasa, type, month, q, catName]);

  const ftot = useMemo(() => trxTotals(filtered), [filtered]);

  const groups = useMemo(() => {
    const out: { date: string; items: Trx[]; net: number }[] = [];
    for (const t of filtered) {
      let g = out[out.length - 1];
      if (!g || g.date !== t.trx_date) {
        g = { date: t.trx_date, items: [], net: 0 };
        out.push(g);
      }
      g.items.push(t);
      g.net += t.type === "gelir" ? t.amount : -t.amount;
    }
    return out;
  }, [filtered]);

  const catBreakdown = useMemo(() => {
    const kind: "gelir" | "gider" = type === "gelir" ? "gelir" : "gider";
    const m = new Map<string, number>();
    for (const t of filtered) {
      if (t.type !== kind) continue;
      const name = (t.category_id && catName.get(t.category_id)) || "Kategorisiz";
      m.set(name, (m.get(name) ?? 0) + t.amount);
    }
    const list = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = list[0]?.[1] ?? 0;
    return { kind, list, max };
  }, [filtered, type, catName]);

  const filterDesc = [
    kasa === null ? "Tüm kasalar" : kasa === "none" ? "Kasasız" : kasaTitle.get(kasa) ?? "Kasa",
    type === "all" ? "Gelir + gider" : type === "gelir" ? "Yalnız gelir" : "Yalnız gider",
    month ? monthLabel(month) : "Tüm zamanlar",
    q.trim() ? `Arama: “${q.trim()}”` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const hasFilter = kasa !== null || type !== "all" || !!month || !!q.trim();

  function onRow(t: Trx) {
    if (t.ref_type === "kursiyer" && t.ref_id) router.push(`/app/musteri/detay/?id=${t.ref_id}`);
    else openForm(t.id);
  }

  async function exportExcel() {
    if (!filtered.length) {
      toast("Dışa aktarılacak hareket yok.", "info");
      return;
    }
    setExporting(true);
    try {
      const firma = useStore.getState().settings.firma;
      await exportTableXlsx<Trx>({
        filename: `kasa_hareketleri_${month || "tum"}_${kasa === null ? "tum_kasalar" : kasa === "none" ? "kasasiz" : safeFileName(kasaTitle.get(kasa) ?? "kasa")}_${today()}.xlsx`,
        sheet: "Kasa Hareketleri",
        title: `${firma ? firma + " · " : ""}Kasa / Cari Hareketleri`,
        subtitle: `${filterDesc} · ${filtered.length} hareket · Oluşturma: ${new Date().toLocaleString("tr-TR")}`,
        columns: [
          { header: "Tarih", width: 12, kind: "date", value: (t) => t.trx_date },
          { header: "Tür", width: 8, value: (t) => (t.type === "gelir" ? "Gelir" : "Gider") },
          { header: "Açıklama", width: 44, value: (t) => t.description },
          { header: "Kategori", width: 20, value: (t) => (t.category_id ? catName.get(t.category_id) ?? "" : "") },
          { header: "Kasa", width: 18, value: (t) => (t.kasa_id ? kasaTitle.get(t.kasa_id) ?? "" : "Kasasız") },
          { header: "Ödeme aracı", width: 14, value: (t) => METHOD_LABEL[t.payment_method] ?? t.payment_method },
          { header: "Kaynak", width: 11, value: (t) => (t.ref_type === "kursiyer" ? "Kursiyer" : "Manuel") },
          { header: "Gelir", width: 15, kind: "money", value: (t) => (t.type === "gelir" ? t.amount : null) },
          { header: "Gider", width: 15, kind: "money", value: (t) => (t.type === "gider" ? t.amount : null) },
          { header: "Tutar (±)", width: 16, kind: "money", value: (t) => (t.type === "gelir" ? t.amount : -t.amount) },
        ],
        rows: filtered,
        totals: ["TOPLAM", null, `${filtered.length} hareket`, null, null, null, null, ftot.gelir, ftot.gider, ftot.net],
      });
      toast("Excel dosyası indirildi.");
    } catch (e) {
      toast(`Excel oluşturulamadı: ${(e as Error).message}`, "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Kasa / Cari"
        subtitle="Gelir, gider ve kasa bakiyeleri"
        actions={
          <Button kind="ghost" small icon={FileSpreadsheet} onClick={exportExcel} loading={exporting}>
            Excel
          </Button>
        }
      />

      <Hero>
        <HeroKicker>KASA / CARİ</HeroKicker>
        <div className="num mt-2 text-[34px] font-extrabold leading-none tracking-tight md:text-[42px]">{money(net)}</div>
        <div className="num mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-white/85">
          <span>
            <span className="text-brand-mint">▲</span> {moneyShort(gelir)}
          </span>
          <span>
            <span className="text-[#FFC59E]">▼</span> {moneyShort(gider)}
          </span>
        </div>
        <div className="scroll-x -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
          <KasaPill label="Tümü" value={net} active={kasa === null} onClick={() => setKasa(null)} />
          {balances.map((b) => (
            <KasaPill key={b.id} label={b.title} value={b.bakiye} active={kasa === b.id} onClick={() => setKasa(kasa === b.id ? null : b.id)} />
          ))}
          {kasasiz ? (
            <KasaPill label="Kasasız" value={kasasiz.net} active={kasa === "none"} onClick={() => setKasa(kasa === "none" ? null : "none")} muted />
          ) : null}
        </div>
      </Hero>

      {/* Filtreler */}
      <div className="mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-[1fr_auto_auto] md:items-center">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hareket ara…"
            className="field !pl-10 !pr-10 shadow-card"
            aria-label="Hareket ara"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Aramayı temizle"
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-navy"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2.5 md:contents">
          <Segment
            className="md:w-[260px]"
            value={type}
            onChange={setType}
            options={[
              { value: "all", label: "Tümü" },
              { value: "gelir", label: "Gelir" },
              { value: "gider", label: "Gider" },
            ]}
          />
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Dönem"
            className="field !w-auto cursor-pointer !py-2.5 pr-8 text-[14px] font-semibold md:min-w-[170px]"
          >
            <option value="">Tüm zamanlar</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {/* Mobil: süzülmüş toplamlar şeridi */}
          <TotalsStrip t={ftot} className="mt-4 lg:hidden" />

          <Section
            label="Son hareketler"
            right={
              <div className="flex items-center gap-2">
                {hasFilter ? (
                  <button
                    type="button"
                    onClick={() => {
                      setKasa(null);
                      setType("all");
                      setMonth("");
                      setQ("");
                    }}
                    className="text-[12px] font-bold text-brand-blue hover:underline"
                  >
                    Süzgeci temizle
                  </button>
                ) : null}
                <span className="num text-[11.5px] text-muted">{filtered.length} hareket</span>
              </div>
            }
          >
            {filtered.length === 0 ? (
              transactions.length === 0 ? (
                <Empty
                  icon={Wallet}
                  title="Henüz hareket yok"
                  text="Gelir/gider ekleyin ya da asistana söyleyin. Kursiyer tahsilatları da kasa seçiliyse buraya otomatik düşer."
                  action={
                    <Button icon={Plus} onClick={() => openForm(null)}>
                      Gelir / Gider ekle
                    </Button>
                  }
                />
              ) : (
                <Empty icon={SearchX} title="Sonuç yok" text="Bu süzgece uyan hareket bulunamadı." />
              )
            ) : (
              <div className="space-y-5">
                {groups.map((g) => (
                  <div key={g.date}>
                    <div className="mb-2 flex items-center justify-between gap-3 px-1">
                      <div className="text-[12px] font-bold capitalize text-muted">{dayLabel(g.date)}</div>
                      <div className={cx("num text-[11.5px] font-semibold", g.net >= 0 ? "text-success" : "text-danger")}>
                        {g.net >= 0 ? "+" : "−"}
                        {money(Math.abs(g.net))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {g.items.map((t) => (
                        <TrxRow
                          key={t.id}
                          t={t}
                          kasaTitle={t.kasa_id ? kasaTitle.get(t.kasa_id) ?? null : null}
                          category={t.category_id ? catName.get(t.category_id) ?? null : null}
                          onClick={() => onRow(t)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* Masaüstü yan panel */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4 pt-6">
            <Card>
              <div className="section-label">Süzülmüş toplam</div>
              <div className="mt-1.5 text-[12px] leading-relaxed text-muted">{filterDesc}</div>
              <div className="mt-4 space-y-2.5">
                <TotalLine label="Gelir" value={ftot.gelir} tone="text-success" />
                <TotalLine label="Gider" value={ftot.gider} tone="text-danger" />
                <div className="h-px bg-line" />
                <TotalLine label="Net" value={ftot.net} tone={ftot.net >= 0 ? "text-navy" : "text-danger"} big />
              </div>
              <Button kind="secondary" small block icon={FileSpreadsheet} onClick={exportExcel} loading={exporting} className="mt-4">
                Excel&apos;e aktar ({filtered.length})
              </Button>
            </Card>
            {catBreakdown.list.length ? (
              <Card>
                <div className="section-label">{catBreakdown.kind === "gelir" ? "Gelir kategorileri" : "Gider kategorileri"}</div>
                <div className="mt-3.5 space-y-3">
                  {catBreakdown.list.map(([name, v]) => (
                    <div key={name}>
                      <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                        <span className="truncate font-semibold text-text">{name}</span>
                        <span className="num shrink-0 text-muted">{moneyShort(v)}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper">
                        <div
                          className={cx("h-full rounded-full", catBreakdown.kind === "gelir" ? "bg-brand" : "bg-[#F08A9B]")}
                          style={{ width: `${catBreakdown.max ? Math.max(4, (v * 100) / catBreakdown.max) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </aside>
      </div>

      <Fab label="Gelir / Gider" icon={Plus} onClick={() => openForm(null)} />

      {form ? <TrxForm key={form.key} id={form.id} onClose={() => setForm(null)} /> : null}
    </div>
  );
}

function KasaPill({ label, value, active, onClick, muted }: { label: string; value: number; active: boolean; onClick: () => void; muted?: boolean }) {
  const neg = value < -0.004;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "min-w-[128px] shrink-0 rounded-2xl border px-3.5 py-2.5 text-left transition",
        active ? "border-white bg-white text-navy shadow-card" : "border-white/20 bg-white/10 text-white hover:bg-white/20",
        muted && !active && "border-dashed",
      )}
    >
      <div className={cx("max-w-[160px] truncate text-[11.5px] font-semibold", active ? "text-muted" : "text-white/80")}>{label}</div>
      <div className={cx("num mt-0.5 whitespace-nowrap text-[13.5px] font-semibold", neg ? (active ? "text-danger" : "text-[#FFD0D7]") : active ? "text-navy" : "text-white")}>
        {money(value)}
      </div>
    </button>
  );
}

function TrxRow({ t, kasaTitle, category, onClick }: { t: Trx; kasaTitle: string | null; category: string | null; onClick: () => void }) {
  const gelir = t.type === "gelir";
  const linked = t.ref_type === "kursiyer";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-line/70 bg-white p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:border-brand-blue/25 hover:shadow-bar md:p-3.5"
    >
      <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", gelir ? "bg-soft-green text-success" : "bg-soft-danger text-danger")}>
        {gelir ? <ArrowDownLeft size={19} strokeWidth={2.4} /> : <ArrowUpRight size={19} strokeWidth={2.4} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[14.5px] font-bold text-ink">{t.description || category || "-"}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-1 text-[12px] text-muted">
          <span className="num">{fmtDate(t.trx_date)}</span>
          <span>·</span>
          <span>{kasaTitle ?? "Kasasız"}</span>
          <span>·</span>
          <span>{category ?? "-"}</span>
          {linked ? (
            <Badge tone="teal" className="ml-1 !px-2 !py-0.5 !text-[10.5px]">
              Kursiyer
            </Badge>
          ) : null}
        </span>
      </span>
      <span className={cx("num shrink-0 text-right text-[14px] font-semibold", gelir ? "text-success" : "text-danger")}>
        {gelir ? "+" : "−"}
        {money(t.amount)}
      </span>
    </button>
  );
}

function TotalsStrip({ t, className }: { t: { gelir: number; gider: number; net: number }; className?: string }) {
  return (
    <div className={cx("grid grid-cols-3 gap-2", className)}>
      {(
        [
          ["Gelir", t.gelir, "text-success"],
          ["Gider", t.gider, "text-danger"],
          ["Net", t.net, t.net >= 0 ? "text-navy" : "text-danger"],
        ] as const
      ).map(([label, v, tone]) => (
        <div key={label} className="rounded-2xl border border-line/70 bg-white px-3 py-2.5 shadow-card">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{label}</div>
          <div className={cx("num mt-0.5 truncate text-[12.5px] font-bold sm:text-[13.5px]", tone)}>{moneyShort(v)}</div>
        </div>
      ))}
    </div>
  );
}

function TotalLine({ label, value, tone, big }: { label: string; value: number; tone: string; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={cx("font-semibold text-muted", big ? "text-[13px]" : "text-[12.5px]")}>{label}</span>
      <span className={cx("num font-bold", tone, big ? "text-[18px]" : "text-[14px]")}>{money(value)}</span>
    </div>
  );
}
