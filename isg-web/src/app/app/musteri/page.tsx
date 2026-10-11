"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, FileDown, FileUp, Search, SearchX, UserPlus, Users, X } from "lucide-react";
import { Button, Chips, Empty, Fab, Hero, HeroKicker, PageHeader, ProgressBar, Section, Segment } from "@/components/ui";
import { toast } from "@/components/feedback";
import { kursiyerTotals, useStore } from "@/lib/store";
import { cx, fmtDate, initials, money, moneyShort, norm, pct, today } from "@/lib/format";
import { exportTableXlsx } from "@/lib/table-xlsx";
import type { Kursiyer } from "@/lib/types";
import { KursiyerForm } from "./KursiyerForm";
import { ImportSheet } from "./ImportSheet";

const NO_GROUP = "__grupsuz__";
type StatusFilter = "all" | "borclu" | "odendi";

export default function MusteriPage() {
  return (
    <Suspense fallback={null}>
      <MusteriInner />
    </Suspense>
  );
}

function MusteriInner() {
  const router = useRouter();
  const params = useSearchParams();
  const kursiyerler = useStore((s) => s.kursiyerler);
  const kasalar = useStore((s) => s.kasalar);

  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [form, setForm] = useState<{ key: number } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const openForm = useCallback(() => setForm({ key: Date.now() }), []);

  useEffect(() => {
    if (params.get("yeni") === "1") {
      openForm();
      router.replace("/app/musteri", { scroll: false });
    }
  }, [params, router, openForm]);

  const active = useMemo(() => kursiyerler.filter((k) => k.is_active), [kursiyerler]);
  const tot = useMemo(() => kursiyerTotals(kursiyerler), [kursiyerler]);
  const collectedPct = pct(tot.collected, tot.total);
  const kasaTitle = useMemo(() => new Map(kasalar.map((k) => [k.id, k.title])), [kasalar]);

  const groups = useMemo(() => {
    const m = new Map<string, { n: number; remaining: number }>();
    for (const k of active) {
      const g = (k.group_name || "").trim() || NO_GROUP;
      const cur = m.get(g) ?? { n: 0, remaining: 0 };
      cur.n += 1;
      cur.remaining += k.remaining_amount;
      m.set(g, cur);
    }
    return [...m.entries()].sort((a, b) => b[1].remaining - a[1].remaining || b[1].n - a[1].n);
  }, [active]);

  const list = useMemo(() => {
    const n = norm(q);
    return active
      .filter((k) => {
        if (group && (group === NO_GROUP ? (k.group_name || "").trim() !== "" : (k.group_name || "").trim() !== group)) return false;
        if (status === "borclu" && !(k.remaining_amount > 0)) return false;
        if (status === "odendi" && k.remaining_amount > 0) return false;
        if (n) {
          const hay = norm(`${k.full_name} ${k.phone} ${k.tc} ${k.notes} ${k.group_name} ${k.email} ${k.city} ${k.list_no} ${k.plasiyer}`);
          if (!hay.includes(n) && !(n.replace(/\D/g, "").length >= 3 && (k.phone || "").replace(/\D/g, "").includes(n.replace(/\D/g, "")))) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = a.remaining_amount > 0 ? 1 : 0;
        const db = b.remaining_amount > 0 ? 1 : 0;
        if (da !== db) return db - da;
        if (b.remaining_amount !== a.remaining_amount) return b.remaining_amount - a.remaining_amount;
        return a.full_name.localeCompare(b.full_name, "tr");
      });
  }, [active, q, group, status]);

  const listTot = useMemo(() => kursiyerTotals(list), [list]);
  const hasFilter = !!q.trim() || !!group || status !== "all";

  async function exportExcel() {
    if (!list.length) {
      toast("Dışa aktarılacak kayıt yok.", "info");
      return;
    }
    setExporting(true);
    try {
      const firma = useStore.getState().settings.firma;
      const groupLabel = group ? (group === NO_GROUP ? "Grupsuz" : group) : "Tüm programlar";
      await exportTableXlsx<Kursiyer>({
        filename: `kursiyerler_${today()}.xlsx`,
        sheet: "Kursiyerler",
        title: `${firma ? firma + " · " : ""}Müşteri Takip — Kursiyer Listesi`,
        subtitle: `${groupLabel} · ${list.length} kişi · Oluşturma: ${new Date().toLocaleString("tr-TR")}`,
        columns: [
          { header: "Ad Soyad", width: 26, value: (k) => k.full_name },
          { header: "TC", width: 14, value: (k) => k.tc },
          { header: "Telefon", width: 16, value: (k) => k.phone },
          { header: "E-posta", width: 24, value: (k) => k.email },
          { header: "İl / İlçe", width: 16, value: (k) => k.city },
          { header: "Program", width: 26, value: (k) => k.group_name },
          { header: "Dönem", width: 14, value: (k) => k.list_no },
          { header: "Sözleşme Tutarı", width: 16, kind: "money", value: (k) => k.total_amount },
          { header: "Nakit", width: 14, kind: "money", value: (k) => k.cash_amount },
          { header: "Banka", width: 14, kind: "money", value: (k) => k.bank_amount },
          { header: "Kalan", width: 14, kind: "money", value: (k) => k.remaining_amount },
          { header: "Durum", width: 10, value: (k) => (k.remaining_amount > 0 ? "BORÇLU" : "ÖDENDİ") },
          { header: "Kasa", width: 16, value: (k) => (k.kasa_id ? kasaTitle.get(k.kasa_id) ?? "" : "") },
          { header: "Tarih", width: 12, kind: "date", value: (k) => k.invoice_issue_date },
          { header: "Plasiyer", width: 14, value: (k) => k.plasiyer },
          { header: "Not", width: 32, value: (k) => k.notes },
        ],
        rows: list,
        totals: [
          "TOPLAM",
          null,
          null,
          null,
          null,
          null,
          null,
          listTot.total,
          list.reduce((a, k) => a + k.cash_amount, 0),
          list.reduce((a, k) => a + k.bank_amount, 0),
          listTot.remaining,
          null,
          null,
          null,
          null,
          null,
        ],
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
        title="Müşteri Takip"
        subtitle="Kursiyerler, sözleşmeler ve tahsilatlar"
        actions={
          <>
            <Button kind="secondary" small icon={FileUp} onClick={() => setImportOpen(true)}>
              Excel&apos;den içe aktar
            </Button>
            <Button kind="ghost" small icon={FileDown} onClick={exportExcel} loading={exporting}>
              Excel&apos;e aktar
            </Button>
          </>
        }
      />

      <Hero>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <HeroKicker>MÜŞTERİ TAKİP · {tot.n} KİŞİ</HeroKicker>
            <div className="mt-2 flex items-end gap-2.5">
              <div className="num text-[34px] font-extrabold leading-none tracking-tight md:text-[42px]">{moneyShort(tot.remaining)}</div>
              <div className="mb-1 text-[13px] font-semibold text-white/80">alacak</div>
            </div>
            <ProgressBar value={collectedPct} tone="white" track="bg-white/20" className="mt-4 !h-2.5" />
            <div className="num mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[12px] text-white/85">
              <span>
                Tahsil {moneyShort(tot.collected)} · %{collectedPct}
              </span>
              <span>Sözleşme {moneyShort(tot.total)}</span>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-2 md:grid">
            <HeroMini label="Borçlu" value={String(active.filter((k) => k.remaining_amount > 0).length)} />
            <HeroMini label="Ödedi" value={String(active.filter((k) => !(k.remaining_amount > 0)).length)} />
          </div>
        </div>
      </Hero>

      <div className="mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ad, telefon, TC, not…"
            className="field !pl-10 !pr-10 shadow-card"
            aria-label="Kursiyer ara"
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
        <Segment
          className="md:w-[280px]"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "Tümü" },
            { value: "borclu", label: "Borçlu" },
            { value: "odendi", label: "Ödendi" },
          ]}
        />
      </div>

      {groups.length ? (
        <Chips
          scroll
          className="mt-3"
          value={group}
          onChange={setGroup}
          options={[
            { value: "", label: "Tümü" },
            ...groups.map(([g, v]) => ({ value: g, label: `${g === NO_GROUP ? "(Grupsuz)" : g} (${v.n})` })),
          ]}
        />
      ) : null}

      <Section
        label={hasFilter ? "Süzülmüş liste" : "Kursiyerler"}
        right={
          <div className="flex items-center gap-2">
            {hasFilter ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setGroup("");
                  setStatus("all");
                }}
                className="text-[12px] font-bold text-brand-blue hover:underline"
              >
                Süzgeci temizle
              </button>
            ) : null}
            <span className="num text-[11.5px] text-muted">
              {list.length} kişi{hasFilter && list.length ? ` · kalan ${moneyShort(listTot.remaining)}` : ""}
            </span>
          </div>
        }
      >
        {list.length === 0 ? (
          active.length === 0 ? (
            <Empty
              icon={Users}
              title="Kursiyer / müşteri yok"
              text="Ekleyin, Excel listenizi içe aktarın ya da asistana listeyi yapıştırın."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button icon={UserPlus} onClick={openForm}>
                    Kursiyer Ekle
                  </Button>
                  <Button kind="secondary" icon={FileUp} onClick={() => setImportOpen(true)}>
                    Excel&apos;den içe aktar
                  </Button>
                </div>
              }
            />
          ) : (
            <Empty icon={SearchX} title="Sonuç yok" text="Aramanıza uyan kayıt bulunamadı." />
          )
        ) : (
          <>
            {/* Mobil / tablet: kart satırlar */}
            <div className="space-y-2 lg:hidden">
              {list.map((k) => (
                <MobileRow key={k.id} k={k} />
              ))}
            </div>

            {/* Masaüstü: tablo görünümü */}
            <div className="hidden overflow-hidden rounded-xl2 border border-line/70 bg-white shadow-card lg:block">
              <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_110px_120px_20px] items-center gap-3 border-b border-line bg-paper/60 px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-wider text-muted">
                <span>Kursiyer</span>
                <span>Program · Dönem</span>
                <span>Kasa</span>
                <span>Plasiyer</span>
                <span className="text-right">Sözleşme</span>
                <span className="text-right">Kalan</span>
                <span />
              </div>
              {list.map((k) => (
                <DesktopRow key={k.id} k={k} kasa={k.kasa_id ? kasaTitle.get(k.kasa_id) ?? "" : ""} />
              ))}
              <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_110px_120px_20px] items-center gap-3 border-t border-line bg-paper/60 px-4 py-3 text-[12.5px] font-bold text-navy">
                <span>{list.length} kişi</span>
                <span className="num text-muted">Tahsil {moneyShort(listTot.collected)}</span>
                <span />
                <span />
                <span className="num text-right">{moneyShort(listTot.total)}</span>
                <span className={cx("num text-right", listTot.remaining > 0 ? "text-danger" : "text-success")}>{moneyShort(listTot.remaining)}</span>
                <span />
              </div>
            </div>
          </>
        )}
      </Section>

      <Fab label="Kursiyer Ekle" icon={UserPlus} onClick={openForm} />

      {form ? <KursiyerForm key={form.key} onClose={() => setForm(null)} /> : null}
      {importOpen ? <ImportSheet onClose={() => setImportOpen(false)} /> : null}
    </div>
  );
}

function HeroMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[96px] rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5">
      <div className="text-[11px] font-semibold text-white/75">{label}</div>
      <div className="num text-[20px] font-extrabold">{value}</div>
    </div>
  );
}

function KAvatar({ k, size = 42 }: { k: Kursiyer; size?: number }) {
  const debt = k.remaining_amount > 0;
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center rounded-[14px] font-extrabold", debt ? "bg-soft-orange text-orange" : "bg-soft-green text-success")}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials(k.full_name)}
    </span>
  );
}

function AmountCell({ k }: { k: Kursiyer }) {
  const debt = k.remaining_amount > 0;
  return (
    <span className="flex flex-col items-end">
      <span className={cx("num text-[14px] font-bold", debt ? "text-danger" : "text-success")}>{debt ? moneyShort(k.remaining_amount) : "ÖDENDİ"}</span>
      <span className="num text-[11.5px] text-muted">/ {moneyShort(k.total_amount)}</span>
    </span>
  );
}

function MobileRow({ k }: { k: Kursiyer }) {
  return (
    <Link
      href={`/app/musteri/${k.id}`}
      className="flex items-center gap-3 rounded-2xl border border-line/70 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar"
    >
      <KAvatar k={k} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-bold text-ink">{k.full_name}</span>
        <span className="mt-0.5 block truncate text-[12px] text-muted">
          {k.group_name || "Grupsuz"}
          {k.phone ? (
            <>
              {" · "}
              <span className="num">{k.phone}</span>
            </>
          ) : null}
        </span>
      </span>
      <AmountCell k={k} />
    </Link>
  );
}

function DesktopRow({ k, kasa }: { k: Kursiyer; kasa: string }) {
  return (
    <Link
      href={`/app/musteri/${k.id}`}
      className="group grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)_110px_120px_20px] items-center gap-3 border-b border-line/70 px-4 py-2.5 transition last:border-b-0 hover:bg-soft-blue/40"
    >
      <span className="flex min-w-0 items-center gap-3">
        <KAvatar k={k} size={36} />
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-bold text-ink group-hover:text-brand-blue">{k.full_name}</span>
          <span className="num block truncate text-[11.5px] text-muted">{k.phone || k.tc || "—"}</span>
        </span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-text">{k.group_name || "Grupsuz"}</span>
        <span className="block truncate text-[11.5px] text-muted">
          {k.list_no || "—"}
          {k.invoice_issue_date ? <span className="num"> · {fmtDate(k.invoice_issue_date)}</span> : null}
        </span>
      </span>
      <span className="truncate text-[13px] text-text">{kasa || <span className="text-muted">—</span>}</span>
      <span className="truncate text-[13px] text-text">{k.plasiyer || <span className="text-muted">—</span>}</span>
      <span className="num text-right text-[13px] text-text">{money(k.total_amount)}</span>
      <span className="flex justify-end">
        {k.remaining_amount > 0 ? (
          <span className="num text-[13.5px] font-bold text-danger">{money(k.remaining_amount)}</span>
        ) : (
          <span className="rounded-full bg-soft-green px-2.5 py-0.5 text-[11px] font-extrabold text-success">ÖDENDİ</span>
        )}
      </span>
      <ChevronRight size={16} className="text-muted/60 group-hover:text-brand-blue" />
    </Link>
  );
}
