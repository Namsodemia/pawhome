"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  AlarmClock,
  CalendarClock,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  Printer,
  Search,
  SearchX,
  ShieldAlert,
  Stethoscope,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { Muayene } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useSync } from "@/lib/sync";
import { useProfil } from "@/lib/roles";
import { cx, fmtDate, norm, pct, today } from "@/lib/format";
import { exportTableXlsx } from "@/lib/table-xlsx";
import {
  DURUM_META,
  MUAYENE_TUR_LABEL,
  PERIYOT_SATIRLARI,
  SONUC_LABEL,
  durum,
  durumText,
  muayeneStats,
  siraliSonraki,
  sonKayitlar,
  type MuayeneDurum,
} from "@/lib/muayene";
import { Button, Chips, Empty, Fab, Hero, HeroKicker, PageHeader, ProgressBar } from "@/components/ui";
import { toast } from "@/components/feedback";
import { MuayeneForm } from "./MuayeneForm";
import { DurumBadge, MAvatar, SonucBadge, TurBadge, printMuayene } from "./shared";

type DurumFilter = "hepsi" | MuayeneDurum;

const COLS = "grid-cols-[minmax(0,2fr)_minmax(0,1.7fr)_minmax(0,1.4fr)_108px_150px_40px]";

export default function MuayenePage() {
  const muayeneler = useStore((s) => s.muayeneler);
  const firma = useStore((s) => s.settings.firma);
  const profil = useProfil();
  const syncAd = useSync((s) => s.ad);
  const hekim = (profil.ad_soyad || syncAd || "").trim();

  const [filter, setFilter] = useState<DurumFilter>("hepsi");
  const [isyeri, setIsyeri] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<{ key: string; m: Partial<Muayene> } | null>(null);
  const [exporting, setExporting] = useState(false);
  const seq = useRef(0);

  const open = (m: Partial<Muayene>) => setEditing({ key: m.id ? `id-${m.id}` : `yeni-${++seq.current}`, m });

  // Derin bağlantı: /app/muayene/?yeni=1 (yeni kayıt) veya ?id=5 (kaydı aç)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const id = Number(p.get("id"));
    if (p.get("yeni") === "1") {
      setEditing({ key: "yeni-link", m: {} });
    } else if (id) {
      const m = useStore.getState().muayeneler.find((x) => x.id === id);
      if (m) setEditing({ key: `id-${m.id}`, m });
    }
    if (p.has("yeni") || p.has("id")) window.history.replaceState(null, "", "/app/muayene/");
  }, []);

  const now = today();
  const son = useMemo(() => siraliSonraki(sonKayitlar(muayeneler)), [muayeneler]);
  const stats = useMemo(() => muayeneStats(muayeneler, now), [muayeneler, now]);

  const isyerleri = useMemo(() => {
    const map = new Map<string, { key: string; name: string; n: number }>();
    for (const m of son) {
      const key = norm(m.isyeri);
      if (!key) continue;
      const cur = map.get(key);
      if (cur) cur.n += 1;
      else map.set(key, { key, name: m.isyeri.trim(), n: 1 });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [son]);

  // seçili işyeri silinen kayıtlarla birlikte kaybolduysa filtreyi sıfırla
  const isyeriKey = isyerleri.some((x) => x.key === isyeri) ? isyeri : "";

  const nq = norm(q);
  const base = son.filter((m) => {
    if (isyeriKey && norm(m.isyeri) !== isyeriKey) return false;
    if (!nq) return true;
    return norm(`${m.calisan} ${m.tc} ${m.isyeri} ${m.gorev}`).includes(nq);
  });
  const counts = { gecikmis: 0, yaklasan: 0, guncel: 0 } as Record<MuayeneDurum, number>;
  for (const m of base) counts[durum(m, now)] += 1;
  const list = filter === "hepsi" ? base : base.filter((m) => durum(m, now) === filter);

  const durumOpts: { value: DurumFilter; label: string }[] = [
    { value: "hepsi", label: `Tümü (${base.length})` },
    { value: "gecikmis", label: `Gecikmiş (${counts.gecikmis})` },
    { value: "yaklasan", label: `Yaklaşan (${counts.yaklasan})` },
    { value: "guncel", label: `Güncel (${counts.guncel})` },
  ];

  const zamaninda = pct(stats.guncel + stats.yaklasan, stats.calisan);

  async function exportExcel() {
    if (!list.length) {
      toast("Dışa aktarılacak kayıt yok.", "info");
      return;
    }
    setExporting(true);
    try {
      const isyeriAd = isyeriKey ? isyerleri.find((x) => x.key === isyeriKey)?.name ?? "" : "Tüm işyerleri";
      await exportTableXlsx<Muayene>({
        filename: `periyodik_muayene_${today()}.xlsx`,
        sheet: "Periyodik Muayene",
        title: `${firma ? firma + " · " : ""}Periyodik Muayene / Sağlık Gözetimi`,
        subtitle: `${isyeriAd} · ${list.length} çalışan · Oluşturma: ${new Date().toLocaleString("tr-TR")}`,
        columns: [
          { header: "Çalışan", width: 24, value: (m) => m.calisan },
          { header: "T.C. Kimlik No", width: 15, value: (m) => m.tc },
          { header: "İşyeri", width: 30, value: (m) => m.isyeri },
          { header: "Görev", width: 22, value: (m) => m.gorev },
          { header: "Tehlike Sınıfı", width: 15, value: (m) => m.hazard_class },
          { header: "Muayene Türü", width: 16, value: (m) => MUAYENE_TUR_LABEL[m.tur] },
          { header: "Muayene Tarihi", width: 14, kind: "date", value: (m) => m.tarih },
          { header: "Sonraki Muayene", width: 15, kind: "date", value: (m) => m.sonraki },
          { header: "Durum", width: 16, value: (m) => durumText(m, now) },
          { header: "Sonuç", width: 18, value: (m) => SONUC_LABEL[m.sonuc] },
          { header: "Tetkikler", width: 36, value: (m) => m.tetkikler.join(", ") },
          { header: "Notlar", width: 40, value: (m) => m.notlar },
        ],
        rows: list,
      });
      toast("Excel dosyası indirildi.");
    } catch {
      toast("Excel dosyası oluşturulamadı.", "error");
    } finally {
      setExporting(false);
    }
  }

  const print = (m: Muayene) => printMuayene(m, { firma, hekim });

  return (
    <div>
      <PageHeader
        title="Periyodik Muayene"
        subtitle="Sağlık gözetimi · işe giriş ve periyodik muayene takibi"
        actions={
          <>
            {muayeneler.length ? (
              <Button kind="ghost" small icon={FileSpreadsheet} onClick={exportExcel} loading={exporting}>
                Excel
              </Button>
            ) : null}
            <Button icon={Plus} onClick={() => open({})} className="hidden lg:inline-flex">
              Muayene Ekle
            </Button>
          </>
        }
      />

      <Hero>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1">
            <HeroKicker>SAĞLIK GÖZETİMİ</HeroKicker>
            <div className="mt-2 flex items-end gap-2.5">
              <div className="num text-[40px] font-extrabold leading-none tracking-tight md:text-[46px]">{stats.calisan}</div>
              <div className="mb-1 text-[13.5px] font-semibold text-white/85">
                çalışan{stats.isyeri ? ` · ${stats.isyeri} işyeri` : ""}
              </div>
            </div>
            {stats.calisan ? (
              <>
                <ProgressBar value={zamaninda} tone="white" track="bg-white/20" className="mt-4 max-w-md" />
                <div className="num mt-2 text-[12px] text-white/85">
                  Muayenesi zamanında: %{zamaninda} · {muayeneler.length} kayıt
                </div>
              </>
            ) : (
              <div className="mt-3 max-w-md text-[13px] text-white/85">
                Kayıt ekledikçe bir sonraki muayene tarihi tehlike sınıfına göre otomatik hesaplanır.
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 md:w-[390px]">
            <HeroCell icon={AlarmClock} label="Gecikmiş" value={stats.gecikmis} />
            <HeroCell icon={CalendarClock} label="30 gün içinde" value={stats.yaklasan} />
            <HeroCell icon={ShieldAlert} label="Kısıtlı / çalışamaz" value={stats.kisitli} />
          </div>
        </div>
      </Hero>

      {stats.gecikmis ? (
        <button
          type="button"
          onClick={() => {
            setFilter("gecikmis");
            setIsyeri("");
            setQ("");
          }}
          className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-soft-danger px-4 py-3 text-left text-[13.5px] font-bold text-danger transition hover:brightness-[.98]"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white">
            <TriangleAlert size={16} />
          </span>
          <span className="flex-1">{stats.gecikmis} çalışanın periyodik muayenesi gecikti.</span>
          <span className="hidden text-[12.5px] font-semibold sm:inline">Göster</span>
          <ChevronRight size={18} />
        </button>
      ) : null}

      {muayeneler.length ? (
        <div className="mt-6 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Chips options={durumOpts} value={filter} onChange={setFilter} scroll className="min-w-0 flex-1" />
            <div className="relative md:w-72">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Çalışan, TC, işyeri, görev…"
                className="field h-10 py-2 pl-10 text-[14px]"
                aria-label="Muayene kayıtlarında ara"
              />
            </div>
          </div>
          {isyerleri.length > 1 ? (
            <Chips
              options={[{ value: "", label: "Tüm işyerleri" }, ...isyerleri.map((x) => ({ value: x.key, label: `${x.name} (${x.n})` }))]}
              value={isyeriKey}
              onChange={setIsyeri}
              scroll
            />
          ) : null}
        </div>
      ) : null}

      <div className="mt-4">
        {muayeneler.length === 0 ? (
          <Empty
            icon={Stethoscope}
            title="Henüz muayene kaydı yok"
            text="Çalışanların işe giriş ve periyodik muayenelerini kaydedin. Bir sonraki muayene tarihi tehlike sınıfına göre otomatik hesaplanır; yaklaşan ve geciken muayeneler burada uyarı olarak görünür."
            action={
              <Button icon={Plus} onClick={() => open({})}>
                İlk muayeneyi ekle
              </Button>
            }
          />
        ) : list.length === 0 ? (
          <Empty icon={SearchX} title="Eşleşen kayıt yok" text="Filtreyi veya arama ifadesini değiştirin." />
        ) : (
          <>
            {/* Mobil / tablet: kartlar */}
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:hidden">
              {list.map((m) => (
                <MobileRow key={m.id} m={m} now={now} onOpen={() => open(m)} onPrint={() => print(m)} />
              ))}
            </div>

            {/* Masaüstü: tablo görünümü */}
            <div className="hidden overflow-hidden rounded-xl2 border border-line/70 bg-white shadow-card lg:block">
              <div
                className={cx(
                  "grid items-center gap-3 border-b border-line bg-paper/60 px-4 py-2.5 text-[10.5px] font-extrabold uppercase tracking-wider text-muted",
                  COLS,
                )}
              >
                <span>Çalışan</span>
                <span>İşyeri · Görev</span>
                <span>Tür · Sonuç</span>
                <span>Son muayene</span>
                <span className="text-right">Sonraki muayene</span>
                <span />
              </div>
              {list.map((m) => (
                <DesktopRow key={m.id} m={m} now={now} onOpen={() => open(m)} onPrint={() => print(m)} />
              ))}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line bg-paper/60 px-4 py-2.5 text-[12px] text-muted">
                <span className="font-bold text-navy">{list.length} çalışan</span>
                <span>Periyot:</span>
                {PERIYOT_SATIRLARI.map(([k, v]) => (
                  <span key={k}>
                    {k} <b className="text-text">{v}</b>
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Fab label="Muayene Ekle" icon={Plus} onClick={() => open({})} />

      {editing ? (
        <MuayeneForm key={editing.key} initial={editing.m} firma={firma} hekim={hekim} onClose={() => setEditing(null)} onOpen={open} />
      ) : null}
    </div>
  );
}

function HeroCell({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
      <Icon size={15} className="opacity-90" />
      <div className="mt-1 truncate text-[11.5px] font-semibold text-white/85">{label}</div>
      <div className="num text-[18px] font-extrabold leading-tight">{value}</div>
    </div>
  );
}

function PrintButton({ onPrint }: { onPrint: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onPrint();
      }}
      onKeyDown={(e) => e.stopPropagation()}
      title="Muayene formunu yazdır"
      aria-label="Muayene formunu yazdır"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-paper hover:text-brand-blue"
    >
      <Printer size={17} />
    </button>
  );
}

interface RowProps {
  m: Muayene;
  now: string;
  onOpen: () => void;
  onPrint: () => void;
}

function rowKeys(onOpen: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };
}

function MobileRow({ m, now, onOpen, onPrint }: RowProps) {
  const d = durum(m, now);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={rowKeys(onOpen)}
      className="relative flex cursor-pointer gap-3 overflow-hidden rounded-2xl border border-line/70 bg-white p-3 pl-3.5 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar"
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: DURUM_META[d].color }} aria-hidden />
      <MAvatar m={m} now={now} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[14.5px] font-bold text-ink">{m.calisan}</div>
            <div className="truncate text-[12px] text-muted">
              {m.isyeri}
              {m.gorev ? ` · ${m.gorev}` : ""}
            </div>
          </div>
          <DurumBadge m={m} now={now} className="shrink-0" />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <TurBadge m={m} />
          <SonucBadge m={m} />
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="num text-[12px] text-muted">
            Son muayene {fmtDate(m.tarih)} · Sonraki <b className={cx(d === "gecikmis" ? "text-danger" : d === "yaklasan" ? "text-warn" : "text-text")}>{fmtDate(m.sonraki)}</b>
          </div>
          <PrintButton onPrint={onPrint} />
        </div>
      </div>
    </div>
  );
}

function DesktopRow({ m, now, onOpen, onPrint }: RowProps) {
  const d = durum(m, now);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={rowKeys(onOpen)}
      className={cx("group grid cursor-pointer items-center gap-3 border-b border-line/70 px-4 py-2.5 transition last:border-b-0 hover:bg-soft-blue/40", COLS)}
    >
      <span className="flex min-w-0 items-center gap-3">
        <MAvatar m={m} now={now} size={36} />
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-bold text-ink group-hover:text-brand-blue">{m.calisan}</span>
          <span className="num block truncate text-[11.5px] text-muted">{m.tc || "TC girilmemiş"}</span>
        </span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-text">{m.isyeri}</span>
        <span className="block truncate text-[11.5px] text-muted">
          {m.gorev || "—"} · {m.hazard_class.toLocaleLowerCase("tr-TR")}
        </span>
      </span>
      <span className="flex min-w-0 flex-wrap gap-1">
        <TurBadge m={m} />
        <SonucBadge m={m} />
      </span>
      <span className="num text-[13px] text-text">{fmtDate(m.tarih)}</span>
      <span className="flex flex-col items-end gap-1">
        <span className={cx("num text-[13.5px] font-bold", d === "gecikmis" ? "text-danger" : d === "yaklasan" ? "text-warn" : "text-navy")}>{fmtDate(m.sonraki)}</span>
        <DurumBadge m={m} now={now} />
      </span>
      <span className="flex justify-end">
        <PrintButton onPrint={onPrint} />
      </span>
    </div>
  );
}
