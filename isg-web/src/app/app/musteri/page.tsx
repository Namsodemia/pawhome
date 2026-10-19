"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChevronRight, FileDown, FileUp, Search, SearchX, UsersRound, X } from "lucide-react";
import { Button, Chips, Empty, Fab, Hero, HeroKicker, PageHeader, ProgressBar, Section, Segment } from "@/components/ui";
import { toast } from "@/components/feedback";
import { kursiyerTotals, useStore } from "@/lib/store";
import { cx, fmtDate, initials, money, moneyShort, norm, pct, today } from "@/lib/format";
import { exportTableXlsx, type XCol, type XValue } from "@/lib/table-xlsx";
import type { Calisan } from "@/lib/api";
import type { Firma } from "@/lib/types";
import { FirmaForm } from "./FirmaForm";
import { ImportSheet } from "./ImportSheet";
import { Calisanlar } from "./Calisanlar";
import { ATAMALAR, TEHLIKE_ETIKET, TehlikeBadge, atananAdi, isTehlike, useEkip, type EkipDurum } from "./ortak";

const NO_GROUP = "__grupsuz__";
type StatusFilter = "all" | "borclu" | "odendi";
type Sekme = "firmalar" | "calisanlar";

export default function MusteriPage() {
  return (
    <Suspense fallback={null}>
      <MusteriInner />
    </Suspense>
  );
}

interface EkipCtx {
  map: Map<number, Calisan>;
  durum: EkipDurum;
  sunucu: boolean;
}

/** Firmaya atanan ekip: [{kisa: "İGU", ad: "…"}] */
function ekibi(k: Firma, ctx: EkipCtx): { kisa: string; ad: string }[] {
  return ATAMALAR.filter((a) => k[a.alan]).map((a) => ({ kisa: a.kisa, ad: atananAdi(k[a.alan], ctx.map, ctx.durum, ctx.sunucu) }));
}

function MusteriInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sekme: Sekme = params.get("sekme") === "calisanlar" ? "calisanlar" : "firmalar";
  const firmalar = useStore((s) => s.kursiyerler);
  const kasalar = useStore((s) => s.kasalar);
  const { ekip, durum, sunucu } = useEkip();

  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [form, setForm] = useState<{ key: number } | null>(null);
  const [calisanYeni, setCalisanYeni] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const openForm = useCallback(() => setForm({ key: Date.now() }), []);
  const sekmeUrl = (s: Sekme) => (s === "calisanlar" ? "/app/musteri/?sekme=calisanlar" : "/app/musteri/");

  useEffect(() => {
    if (params.get("yeni") === "1") {
      if (sekme === "calisanlar") setCalisanYeni(Date.now());
      else openForm();
      router.replace(sekme === "calisanlar" ? "/app/musteri/?sekme=calisanlar" : "/app/musteri/", { scroll: false });
    }
  }, [params, router, openForm, sekme]);

  const ctx: EkipCtx = useMemo(() => ({ map: new Map(ekip.map((c) => [c.id, c])), durum, sunucu }), [ekip, durum, sunucu]);
  const active = useMemo(() => firmalar.filter((k) => k.is_active), [firmalar]);
  const tot = useMemo(() => kursiyerTotals(firmalar), [firmalar]);
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
    const digits = n.replace(/\D/g, "");
    return active
      .filter((k) => {
        if (group && (group === NO_GROUP ? (k.group_name || "").trim() !== "" : (k.group_name || "").trim() !== group)) return false;
        if (status === "borclu" && !(k.remaining_amount > 0)) return false;
        if (status === "odendi" && k.remaining_amount > 0) return false;
        if (n) {
          const ekipAd = ekibi(k, ctx)
            .map((e) => e.ad)
            .join(" ");
          const hay = norm(
            `${k.full_name} ${k.yetkili ?? ""} ${k.phone} ${k.tc} ${k.notes} ${k.group_name} ${k.email} ${k.city} ${k.adres ?? ""} ${k.list_no} ${k.plasiyer} ${k.nace_kodu ?? ""} ${k.sgk_sicil ?? ""} ${isTehlike(k.tehlike_sinifi) ? TEHLIKE_ETIKET[k.tehlike_sinifi] : ""} ${ekipAd}`,
          );
          if (!hay.includes(n) && !(digits.length >= 3 && (k.phone || "").replace(/\D/g, "").includes(digits))) return false;
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
  }, [active, q, group, status, ctx]);

  const listTot = useMemo(() => kursiyerTotals(list), [list]);
  const hasFilter = !!q.trim() || !!group || status !== "all";
  const toplamCalisan = useMemo(() => active.reduce((a, k) => a + (Number(k.calisan_sayisi) || 0), 0), [active]);

  async function exportExcel() {
    if (!list.length) {
      toast("Dışa aktarılacak firma yok.", "info");
      return;
    }
    setExporting(true);
    try {
      const firma = useStore.getState().settings.firma;
      const groupLabel = group ? (group === NO_GROUP ? "Hizmet belirtilmemiş" : group) : "Tüm hizmetler";
      const adOf = (k: Firma, alan: (typeof ATAMALAR)[number]["alan"]) => atananAdi(k[alan], ctx.map, ctx.durum, ctx.sunucu);
      const cols: (XCol<Firma> & { sum?: (k: Firma) => number })[] = [
        { header: "Firma", width: 32, value: (k) => k.full_name },
        { header: "Vergi / TC No", width: 14, value: (k) => k.tc },
        { header: "Yetkili", width: 20, value: (k) => k.yetkili ?? "" },
        { header: "Telefon", width: 16, value: (k) => k.phone },
        { header: "E-posta", width: 26, value: (k) => k.email },
        { header: "İl / İlçe", width: 18, value: (k) => k.city },
        { header: "Adres", width: 32, value: (k) => k.adres ?? "" },
        { header: "SGK Sicil No", width: 24, value: (k) => k.sgk_sicil ?? "" },
        { header: "NACE Kodu", width: 11, value: (k) => k.nace_kodu ?? "" },
        { header: "Tehlike Sınıfı", width: 15, value: (k) => k.tehlike_sinifi ?? "" },
        { header: "Çalışan Sayısı", width: 10, kind: "int", value: (k) => (k.calisan_sayisi ? k.calisan_sayisi : null), sum: (k) => Number(k.calisan_sayisi) || 0 },
        { header: "Hizmet", width: 22, value: (k) => k.group_name },
        { header: "Sözleşme No / Dönem", width: 16, value: (k) => k.list_no },
        { header: "Başlangıç", width: 12, kind: "date", value: (k) => k.invoice_issue_date },
        { header: "Bitiş", width: 12, kind: "date", value: (k) => k.sozlesme_bitis ?? "" },
        { header: "İGU", width: 20, value: (k) => adOf(k, "igu_id") },
        { header: "İşyeri Hekimi", width: 20, value: (k) => adOf(k, "ih_id") },
        { header: "DSP", width: 20, value: (k) => adOf(k, "dsp_id") },
        { header: "Sözleşme Tutarı", width: 16, kind: "money", value: (k) => k.total_amount, sum: (k) => k.total_amount },
        { header: "Nakit", width: 14, kind: "money", value: (k) => k.cash_amount, sum: (k) => k.cash_amount },
        { header: "Banka", width: 14, kind: "money", value: (k) => k.bank_amount, sum: (k) => k.bank_amount },
        { header: "Kalan", width: 14, kind: "money", value: (k) => k.remaining_amount, sum: (k) => k.remaining_amount },
        { header: "Durum", width: 10, value: (k) => (k.remaining_amount > 0 ? "BORÇLU" : "ÖDENDİ") },
        { header: "Kasa", width: 16, value: (k) => (k.kasa_id ? kasaTitle.get(k.kasa_id) ?? "" : "") },
        { header: "Satış Temsilcisi", width: 16, value: (k) => k.plasiyer },
        { header: "Not", width: 32, value: (k) => k.notes },
      ];
      const totals: XValue[] = cols.map((c, i) => (i === 0 ? "TOPLAM" : c.sum ? Math.round(list.reduce((a, k) => a + c.sum!(k), 0) * 100) / 100 : null));
      await exportTableXlsx<Firma>({
        filename: `firmalar_${today()}.xlsx`,
        sheet: "Firmalar",
        title: `${firma ? firma + " · " : ""}Müşteri Takip — Firma Listesi`,
        subtitle: `${groupLabel} · ${list.length} firma · Oluşturma: ${new Date().toLocaleString("tr-TR")}`,
        columns: cols,
        rows: list,
        totals,
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
        subtitle="Firmalar, sözleşmeler ve tahsilatlar"
        actions={
          sekme === "firmalar" ? (
            <>
              <Button kind="secondary" small icon={FileUp} onClick={() => setImportOpen(true)}>
                Excel&apos;den içe aktar
              </Button>
              <Button kind="ghost" small icon={FileDown} onClick={exportExcel} loading={exporting}>
                Excel&apos;e aktar
              </Button>
            </>
          ) : undefined
        }
      />

      <Segment<Sekme>
        className="mb-5 md:max-w-[380px]"
        value={sekme}
        onChange={(v) => router.replace(sekmeUrl(v), { scroll: false })}
        options={[
          {
            value: "firmalar",
            label: (
              <span className="inline-flex items-center justify-center gap-1.5">
                <Building2 size={15} /> Firmalar <span className="num text-[12px] opacity-60">{tot.n}</span>
              </span>
            ),
          },
          {
            value: "calisanlar",
            label: (
              <span className="inline-flex items-center justify-center gap-1.5">
                <UsersRound size={15} /> Çalışanlar {sunucu && durum === "hazir" ? <span className="num text-[12px] opacity-60">{ekip.length}</span> : null}
              </span>
            ),
          },
        ]}
      />

      {sekme === "calisanlar" ? (
        <Calisanlar yeniKey={calisanYeni} />
      ) : (
        <>
          <Hero>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <HeroKicker>MÜŞTERİ TAKİP · {tot.n} FİRMA</HeroKicker>
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
              <div className="hidden grid-cols-3 gap-2 md:grid">
                <HeroMini label="Borçlu" value={String(active.filter((k) => k.remaining_amount > 0).length)} />
                <HeroMini label="Ödedi" value={String(active.filter((k) => !(k.remaining_amount > 0)).length)} />
                <HeroMini label="Çalışan" value={toplamCalisan.toLocaleString("tr-TR")} />
              </div>
            </div>
          </Hero>

          <div className="mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-[1fr_auto] md:items-center">
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Firma, yetkili, telefon, vergi no…"
                className="field !pl-10 !pr-10 shadow-card"
                aria-label="Firma ara"
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
                ...groups.map(([g, v]) => ({ value: g, label: `${g === NO_GROUP ? "(Hizmet belirtilmemiş)" : g} (${v.n})` })),
              ]}
            />
          ) : null}

          <Section
            label={hasFilter ? "Süzülmüş liste" : "Firmalar"}
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
                  {list.length} firma{hasFilter && list.length ? ` · kalan ${moneyShort(listTot.remaining)}` : ""}
                </span>
              </div>
            }
          >
            {list.length === 0 ? (
              active.length === 0 ? (
                <Empty
                  icon={Building2}
                  title="Henüz firma yok"
                  text="Hizmet verdiğiniz firmaları ekleyin, Excel listenizi içe aktarın ya da asistana listeyi yapıştırın."
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button icon={Building2} onClick={openForm}>
                        Firma Ekle
                      </Button>
                      <Button kind="secondary" icon={FileUp} onClick={() => setImportOpen(true)}>
                        Excel&apos;den içe aktar
                      </Button>
                    </div>
                  }
                />
              ) : (
                <Empty icon={SearchX} title="Sonuç yok" text="Aramanıza uyan firma bulunamadı." />
              )
            ) : (
              <>
                {/* Mobil / tablet: kart satırlar */}
                <div className="space-y-2 lg:hidden">
                  {list.map((k) => (
                    <MobileRow key={k.id} k={k} ekip={ekibi(k, ctx)} />
                  ))}
                </div>

                {/* Masaüstü: tablo görünümü */}
                <div className="hidden overflow-hidden rounded-xl2 border border-line/70 bg-white shadow-card lg:block">
                  <div className={cx(GRID, "border-b border-line bg-paper/60 px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-wider text-muted")}>
                    <span>Firma</span>
                    <span>Hizmet · Dönem</span>
                    <span>Tehlike · Çalışan</span>
                    <span>Atanan ekip</span>
                    <span className="text-right">Sözleşme</span>
                    <span className="text-right">Kalan</span>
                    <span />
                  </div>
                  {list.map((k) => (
                    <DesktopRow key={k.id} k={k} ekip={ekibi(k, ctx)} />
                  ))}
                  <div className={cx(GRID, "border-t border-line bg-paper/60 px-4 py-3 text-[12.5px] font-bold text-navy")}>
                    <span>{list.length} firma</span>
                    <span className="num text-muted">Tahsil {moneyShort(listTot.collected)}</span>
                    <span className="num text-muted">{list.reduce((a, k) => a + (Number(k.calisan_sayisi) || 0), 0).toLocaleString("tr-TR")} çalışan</span>
                    <span />
                    <span className="num text-right">{moneyShort(listTot.total)}</span>
                    <span className={cx("num text-right", listTot.remaining > 0 ? "text-danger" : "text-success")}>{moneyShort(listTot.remaining)}</span>
                    <span />
                  </div>
                </div>
              </>
            )}
          </Section>

          <Fab label="Firma Ekle" icon={Building2} onClick={openForm} />
        </>
      )}

      {form ? <FirmaForm key={form.key} onClose={() => setForm(null)} /> : null}
      {importOpen ? <ImportSheet onClose={() => setImportOpen(false)} /> : null}
    </div>
  );
}

const GRID =
  "grid grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.5fr)_110px_120px_20px] items-center gap-3";

function HeroMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[96px] rounded-2xl border border-white/20 bg-white/10 px-3.5 py-2.5">
      <div className="text-[11px] font-semibold text-white/75">{label}</div>
      <div className="num text-[20px] font-extrabold">{value}</div>
    </div>
  );
}

function KAvatar({ k, size = 42 }: { k: Firma; size?: number }) {
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

function AmountCell({ k }: { k: Firma }) {
  const debt = k.remaining_amount > 0;
  return (
    <span className="flex shrink-0 flex-col items-end">
      <span className={cx("num text-[14px] font-bold", debt ? "text-danger" : "text-success")}>{debt ? moneyShort(k.remaining_amount) : "ÖDENDİ"}</span>
      <span className="num text-[11.5px] text-muted">/ {moneyShort(k.total_amount)}</span>
    </span>
  );
}

function MobileRow({ k, ekip }: { k: Firma; ekip: { kisa: string; ad: string }[] }) {
  const tehlike = isTehlike(k.tehlike_sinifi);
  return (
    <Link
      href={`/app/musteri/detay/?id=${k.id}`}
      className="flex items-center gap-3 rounded-2xl border border-line/70 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar"
    >
      <KAvatar k={k} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-bold text-ink">{k.full_name}</span>
        <span className="mt-0.5 block truncate text-[12px] text-muted">
          {k.group_name || "Hizmet belirtilmemiş"}
          {k.calisan_sayisi ? <span className="num"> · {k.calisan_sayisi} çalışan</span> : null}
          {!k.calisan_sayisi && k.phone ? <span className="num"> · {k.phone}</span> : null}
        </span>
        {tehlike || ekip.length ? (
          <span className="mt-1 flex min-w-0 flex-wrap items-center gap-1">
            <TehlikeBadge h={k.tehlike_sinifi} className="!px-2 !text-[10.5px]" />
            {ekip.map((e) => (
              <span key={e.kisa} className="max-w-[140px] truncate rounded-full bg-paper px-2 py-0.5 text-[10.5px] font-bold text-muted">
                {e.kisa} · {e.ad}
              </span>
            ))}
          </span>
        ) : null}
      </span>
      <AmountCell k={k} />
    </Link>
  );
}

function DesktopRow({ k, ekip }: { k: Firma; ekip: { kisa: string; ad: string }[] }) {
  return (
    <Link href={`/app/musteri/detay/?id=${k.id}`} className={cx(GRID, "group border-b border-line/70 px-4 py-2.5 transition last:border-b-0 hover:bg-soft-blue/40")}>
      <span className="flex min-w-0 items-center gap-3">
        <KAvatar k={k} size={36} />
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-bold text-ink group-hover:text-brand-blue">{k.full_name}</span>
          <span className="block truncate text-[11.5px] text-muted">
            {[k.yetkili, k.phone].filter(Boolean).join(" · ") || k.tc || "—"}
          </span>
        </span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-text">{k.group_name || "Hizmet belirtilmemiş"}</span>
        <span className="block truncate text-[11.5px] text-muted">
          {k.list_no || "—"}
          {k.invoice_issue_date ? <span className="num"> · {fmtDate(k.invoice_issue_date)}</span> : null}
        </span>
      </span>
      <span className="flex min-w-0 flex-col items-start gap-0.5">
        {isTehlike(k.tehlike_sinifi) ? <TehlikeBadge h={k.tehlike_sinifi} /> : <span className="text-[12px] text-muted">—</span>}
        {k.calisan_sayisi ? <span className="num text-[11.5px] text-muted">{k.calisan_sayisi} çalışan</span> : null}
      </span>
      <span className="min-w-0">
        {ekip.length ? (
          ekip.map((e) => (
            <span key={e.kisa} className="block truncate text-[12.5px] text-text">
              <b className="mr-1 text-[10.5px] font-extrabold text-muted">{e.kisa}</b>
              {e.ad}
            </span>
          ))
        ) : (
          <span className="text-[12px] text-muted">Atanmadı</span>
        )}
      </span>
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
