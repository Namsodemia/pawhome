"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlarmClock,
  Award,
  BookOpen,
  Building2,
  Calculator,
  CalendarClock,
  ChevronRight,
  CircleCheck,
  CirclePlay,
  CircleX,
  ClipboardCheck,
  Flame,
  GraduationCap,
  HardHat,
  HeartPulse,
  KeyRound,
  Lightbulb,
  Megaphone,
  MessagesSquare,
  Phone,
  Presentation,
  School,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
  TriangleAlert,
  UserPlus,
  Users,
  Wallet,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, ButtonLink, Card, Hero, HeroKicker, ProgressBar, Section } from "@/components/ui";
import { toast } from "@/components/feedback";
import { AiQuotaWarning, useAiQuota } from "@/components/AiQuota";
import { analysisSummary, olayStats, useStore } from "@/lib/store";
import { useSync } from "@/lib/sync";
import { rolBilgi, useProfil, type Modul, type Rol } from "@/lib/roles";
import { aiMode, subscribeAiConfig, type AiMode } from "@/lib/ai/client";
import { atamalarim, siniflarim, type AtananFirma, type SinifimItem } from "@/lib/api";
import { normPhone, prettyPhone } from "@/lib/phone";
import { bestByDers, GECME_NOTU, LETTERS, sonucPct, TUR_LABEL, useQuestionBank, type Ders, type Soru } from "@/lib/sinav";
import { DURUM_META, PERIYOT_SATIRLARI, durum, durumText, muayeneStats, siraliSonraki, sonKayitlar } from "@/lib/muayene";
import { RISK_META, level } from "@/lib/risk";
import { cx, fmtDate, greeting, initials, longDateTR, today } from "@/lib/format";
import type { EgitimKayit, HazardClass, OlayTur } from "@/lib/types";

// =====================================================================================
// Ortak parçalar
// =====================================================================================

const ROL_TONE: Record<Rol, "blue" | "green" | "red" | "violet"> = { osgb: "blue", uzman: "green", hekim: "red", dsp: "red", ogrenci: "violet" };
const ROL_ICON: Record<Rol, LucideIcon> = { osgb: Building2, uzman: HardHat, hekim: Stethoscope, dsp: HeartPulse, ogrenci: GraduationCap };

const TILE: Record<Modul, { label: string; href: string; icon: LucideIcon; color: string }> = {
  risk: { label: "Risk Analizi", href: "/app/risk/", icon: ShieldCheck, color: "#5CBD7D" },
  kasa: { label: "Kasa / Cari", href: "/app/kasa/", icon: Wallet, color: "#107398" },
  musteri: { label: "Müşteri Takip", href: "/app/musteri/", icon: Users, color: "#0B6F7B" },
  siniflar: { label: "Sınıflar", href: "/app/siniflar/", icon: MessagesSquare, color: "#1B8ECF" },
  sinav: { label: "Sınav Hazırlık", href: "/app/sinav/", icon: GraduationCap, color: "#6C5CE7" },
  asistan: { label: "İsgora Asistan", href: "/app/asistan/", icon: Sparkles, color: "#107398" },
  mevzuat: { label: "Mevzuat", href: "/app/mevzuat/", icon: BookOpen, color: "#1E3145" },
  kaza: { label: "Kaza / Ramak Kala", href: "/app/kaza/", icon: Siren, color: "#D6334C" },
  denetim: { label: "Saha Denetimi", href: "/app/denetim/", icon: ClipboardCheck, color: "#3AA466" },
  hesap: { label: "Hesaplayıcı", href: "/app/hesap/", icon: Calculator, color: "#F4772E" },
  muayene: { label: "Periyodik Muayene", href: "/app/muayene/", icon: Stethoscope, color: "#0B6F7B" },
  egitim: { label: "Eğitimler", href: "/app/egitim/", icon: Presentation, color: "#E0812B" },
  sinifim: { label: "Sınıfım", href: "/app/sinifim/", icon: School, color: "#1B8ECF" },
};

/** Hazır eğitim: Temel İş Sağlığı ve Güvenliği Eğitimi */
const TEMEL_EGITIM = "temel-isg";

/** Eğitimler modülündeki hazır eğitimin ilerleme özeti (store: egitimler) */
function useEgitimOzet() {
  const kayit = useStore((s) => s.egitimler.find((e) => e.kurs_id === TEMEL_EGITIM)) as EgitimKayit | undefined;
  const ders = kayit?.tamamlanan.length ?? 0;
  const sertifika = !!kayit?.basarili_at;
  const sub = sertifika ? "Sertifika alındı" : ders ? `${ders} ders tamamlandı` : "Temel İSG eğitimi · sertifika";
  return { kayit, ders, sertifika, puan: kayit?.sinav_puan ?? null, sub };
}

function egitimTile(sub: string): TileItem {
  return { m: "egitim", sub };
}

const OLAY_META: Record<OlayTur, { label: string; color: string }> = {
  kaza: { label: "İş kazası", color: "#D6334C" },
  ramak_kala: { label: "Ramak kala", color: "#F4772E" },
  tehlikeli_durum: { label: "Tehlikeli durum", color: "#1B8ECF" },
  meslek_hastaligi: { label: "Meslek hastalığı şüphesi", color: "#6C5CE7" },
};

/** Selamlama ve tarih saat dilimine bağlı olduğu için yalnızca istemcide (efektte) hesaplanır. */
function useHello() {
  const [hello, setHello] = useState({ g: "Merhaba", d: "", iso: "" });
  useEffect(() => {
    setHello({ g: greeting(), d: longDateTR(), iso: today() });
  }, []);
  return hello;
}

function Greeting({ rol, hello }: { rol: Rol; hello: { g: string; d: string } }) {
  const profil = useProfil();
  const syncAd = useSync((s) => s.ad);
  const parts = (profil.ad_soyad || syncAd || "").trim().split(/\s+/).filter(Boolean);
  // "Dr. Ayşe Yılmaz" → "Ayşe"
  const first = parts.find((p) => !p.endsWith(".")) ?? parts[0] ?? "";
  const info = rolBilgi(rol);
  const Icon = ROL_ICON[rol];
  return (
    <div className="mb-5">
      <h1 className="text-[26px] font-extrabold tracking-tight text-navy md:text-[30px]">
        {hello.g}
        {first ? `, ${first}` : ""} <span aria-hidden>👋</span>
      </h1>
      <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[14px] text-muted">
        {/* Uzun rol adları ("İş Sağlığı ve Güvenliği Uzmanı") dar ekranda taşmasın: rozet satır kırabilir */}
        <Badge tone={ROL_TONE[rol]} className="max-w-full !whitespace-normal text-left leading-tight">
          <Icon size={12} strokeWidth={2.6} className="shrink-0" />
          <span className="min-w-0 break-words">{info.kisa}</span>
        </Badge>
        {profil.kurum ? <span className="font-semibold text-text">{profil.kurum}</span> : null}
        {hello.d ? <span className="capitalize">{hello.d}</span> : null}
      </div>
    </div>
  );
}

function HeroCell({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
      <Icon size={15} className="opacity-90" />
      <div className="mt-1 text-[11.5px] font-semibold leading-tight text-white/85">{label}</div>
      <div className="num mt-0.5 text-[14px] font-extrabold leading-tight md:text-[15px]">{value}</div>
    </div>
  );
}

type BannerTone = "blue" | "red" | "orange";
const BANNER_CLS: Record<BannerTone, string> = {
  blue: "bg-soft-blue text-brand-blue",
  red: "bg-soft-danger text-danger",
  orange: "bg-soft-orange text-[#C0561A]",
};

function Banner({ href, icon: Icon, tone, children }: { href: string; icon: LucideIcon; tone: BannerTone; children: ReactNode }) {
  return (
    <Link href={href} className={cx("flex items-center gap-3 rounded-2xl px-4 py-3 text-[13.5px] font-bold transition hover:brightness-[.98]", BANNER_CLS[tone])}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white">
        <Icon size={16} />
      </span>
      <span className="flex-1">{children}</span>
      <ChevronRight size={18} />
    </Link>
  );
}

/** Yapay zekâ yapılandırılmamışsa (ya da ücretsiz sorgular bittiyse) ayarlara yönlendiren bant */
function AiBanner() {
  const [mode, setMode] = useState<AiMode | null>(null);
  const quota = useAiQuota();
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      void aiMode().then((m) => {
        if (alive) setMode(m);
      });
    refresh();
    const unsub = subscribeAiConfig(refresh);
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  if (quota.kind === "bitti") return <AiQuotaWarning limit={quota.limit} />;
  if (mode !== "none") return null;
  return (
    <Banner href="/app/ayarlar/" icon={KeyRound} tone="blue">
      Yapay zekâ için API anahtarı girilmemiş. Ayarlar&apos;dan ekleyin.
    </Banner>
  );
}

interface QuickItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

function QuickActions({ items }: { items: QuickItem[] }) {
  return (
    <Section label="Hızlı işlem" className="!mt-6">
      <div className="grid grid-cols-4 gap-2">
        {items.map((q) => {
          const Icon = q.icon;
          return (
            <Link key={q.label} href={q.href} className="group flex flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center transition hover:bg-white">
              <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand text-white shadow-fab transition group-hover:-translate-y-0.5">
                <Icon size={24} />
              </span>
              <span className="text-[12.5px] font-bold leading-tight text-navy">{q.label}</span>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

interface TileItem {
  m: Modul;
  sub: string;
  /** sağ üstte kırmızı uyarı hapı (ör. "2 gecikmiş") */
  alert?: string;
}

function ModuleGrid({ items }: { items: TileItem[] }) {
  return (
    <Section label="Modüller">
      <div className={cx("grid grid-cols-2 gap-3", items.length % 3 === 0 ? "md:grid-cols-3" : "md:grid-cols-4")}>
        {items.map(({ m, sub, alert }, i) => {
          const t = TILE[m];
          const Icon = t.icon;
          // Tek sayıda karoda mobildeki son karo tüm satırı kaplar (boşluk kalmasın)
          const wide = items.length % 2 === 1 && i === items.length - 1;
          return (
            <Link
              key={m}
              href={t.href}
              className={cx(
                "group relative min-w-0 rounded-xl2 border border-line/70 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar",
                wide && "col-span-2 md:col-span-1",
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: t.color }}>
                <Icon size={21} />
              </span>
              {alert ? (
                <span className="num absolute right-3 top-3 rounded-full bg-soft-danger px-2 py-0.5 text-[11px] font-extrabold text-danger">{alert}</span>
              ) : null}
              <div className="mt-3 text-[15px] font-extrabold text-navy">{t.label}</div>
              <div className="mt-0.5 truncate text-[12.5px] text-muted">{sub}</div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

function SeeAll({ href, label = "Tümü" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="text-[12.5px] font-bold text-brand-blue hover:underline">
      {label}
    </Link>
  );
}

/** Sağ sütundaki liste kartlarının boş hâli: kısa metin + ilk adım bağlantısı */
function EmptyRow({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="p-4 text-[13.5px] text-muted">
      {text}{" "}
      <Link href={href} className="font-bold text-brand-blue hover:underline">
        {cta} →
      </Link>
    </div>
  );
}

function rowCls(i: number) {
  return cx("flex items-center gap-3 px-4 py-3 transition hover:bg-paper", i > 0 && "border-t border-line");
}

function Welcome({ icon: Icon, title, text, children }: { icon: LucideIcon; title: string; text: string; children: ReactNode }) {
  return (
    <Card className="border-dashed bg-brandSoft">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-blue shadow-card">
          <Icon size={22} />
        </span>
        <div className="min-w-[200px] flex-1">
          <div className="text-[15.5px] font-extrabold text-navy">{title}</div>
          <div className="text-[13.5px] text-muted">{text}</div>
        </div>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
    </Card>
  );
}

function DemoButton() {
  const loadDemo = useStore((s) => s.loadDemo);
  return (
    <Button
      kind="secondary"
      onClick={() => {
        loadDemo();
        toast("Örnek veriler yüklendi. Ayarlar'dan istediğiniz zaman silebilirsiniz.");
      }}
    >
      Örnek veri yükle
    </Button>
  );
}

function puanCls(p: number): string {
  if (p >= 80) return "bg-soft-green text-success";
  if (p >= 60) return "bg-soft-warn text-warn";
  return "bg-soft-danger text-danger";
}

function byTarihDesc<T extends { tarih: string; id: number }>(a: T, b: T): number {
  if (a.tarih !== b.tarih) return a.tarih < b.tarih ? 1 : -1;
  return b.id - a.id;
}

// ---------------------------------------------------------------- OSGB çalışanı: atandığı firmalar

const TEHLIKE_TONE: Record<HazardClass, "green" | "orange" | "red"> = {
  "AZ TEHLİKELİ": "green",
  TEHLİKELİ: "orange",
  "ÇOK TEHLİKELİ": "red",
};
const TEHLIKE_TEXT: Record<HazardClass, string> = {
  "AZ TEHLİKELİ": "Az tehlikeli",
  TEHLİKELİ: "Tehlikeli",
  "ÇOK TEHLİKELİ": "Çok tehlikeli",
};
const GOREV_META: Record<AtananFirma["gorev"][number], { label: string; title: string; tone: "green" | "red" | "teal" }> = {
  igu: { label: "İGU", title: "İş Sağlığı ve Güvenliği Uzmanı", tone: "green" },
  ih: { label: "İH", title: "İşyeri Hekimi", tone: "red" },
  dsp: { label: "DSP", title: "Diğer Sağlık Personeli", tone: "teal" },
};

function telHref(raw: string): { href: string; text: string } | null {
  const t = (raw || "").trim();
  if (!t) return null;
  const n = normPhone(t);
  if (n) return { href: `tel:+${n}`, text: prettyPhone(n) };
  const digits = t.replace(/[^\d+]/g, "");
  return digits ? { href: `tel:${digits}`, text: t } : null;
}

/**
 * Hesap bir OSGB'nin İGU / İH / DSP çalışanıysa: OSGB'nin bu kişiye atadığı firmalar.
 * Hesap bağımsızsa (osgb yok) ya da sunucu hata verirse hiç gösterilmez.
 */
function AtananFirmalar() {
  const osgb = useSync((s) => s.osgb);
  const backend = useSync((s) => s.backend);
  const osgbId = osgb?.id ?? null;
  const [data, setData] = useState<{ osgbAd: string | null; firmalar: AtananFirma[] } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (osgbId == null || backend !== true) return;
    let alive = true;
    setFailed(false);
    atamalarim()
      .then((j) => {
        if (alive) setData({ osgbAd: j.osgb?.ad ?? null, firmalar: Array.isArray(j.firmalar) ? j.firmalar : [] });
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [osgbId, backend]);

  if (!osgb || backend !== true || failed) return null;
  const osgbAd = data?.osgbAd || osgb.ad;
  const firmalar = data?.firmalar ?? [];

  return (
    <Section label="Atandığınız firmalar" className="!mt-6" right={data && firmalar.length ? <span className="num text-[12.5px] font-bold text-muted">{firmalar.length} firma</span> : null}>
      <Card padded={false}>
        <div className="flex items-center gap-2.5 border-b border-line bg-paper/60 px-4 py-2.5 text-[13px] text-muted">
          <Building2 size={16} className="shrink-0 text-brand-blue" />
          <span className="min-w-0">
            Bağlı olduğunuz OSGB: <span className="font-bold text-navy">{osgbAd}</span>
          </span>
        </div>
        {!data ? (
          <div className="space-y-2 p-4">
            <div className="skeleton h-12 w-full rounded-xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </div>
        ) : firmalar.length === 0 ? (
          <div className="p-4 text-[13.5px] text-muted">Henüz size atanmış firma yok. Atamaları OSGB yöneticiniz Müşteri Takip modülünden yapar.</div>
        ) : (
          firmalar.map((f, i) => {
            const tel = telHref(f.telefon);
            const hz = f.tehlike_sinifi || null;
            return (
              <div key={f.id} className={cx("flex items-start gap-3 px-4 py-3", i > 0 && "border-t border-line")}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-soft-blue text-[13px] font-extrabold text-brand-blue" aria-hidden>
                  {initials(f.ad)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="break-words text-[14px] font-bold leading-snug text-navy">{f.ad}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {hz ? <Badge tone={TEHLIKE_TONE[hz] ?? "gray"}>{TEHLIKE_TEXT[hz] ?? hz}</Badge> : null}
                    {(f.gorev ?? []).map((g) =>
                      GOREV_META[g] ? (
                        <span key={g} title={GOREV_META[g].title}>
                          <Badge tone={GOREV_META[g].tone}>{GOREV_META[g].label}</Badge>
                        </span>
                      ) : null,
                    )}
                  </div>
                  <div className="mt-1 text-[12.5px] leading-relaxed text-muted">
                    {[
                      f.calisan_sayisi ? `${f.calisan_sayisi} çalışan` : null,
                      f.yetkili ? `Yetkili: ${f.yetkili}` : null,
                      f.il || null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Ayrıntı girilmemiş"}
                  </div>
                </div>
                {tel ? (
                  <a
                    href={tel.href}
                    aria-label={`${f.ad} telefon: ${tel.text}`}
                    title={tel.text}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-soft-green px-2.5 py-2 text-[12.5px] font-bold text-success transition hover:brightness-[.97]"
                  >
                    <Phone size={14} />
                    <span className="num hidden sm:inline">{tel.text}</span>
                  </a>
                ) : null}
              </div>
            );
          })
        )}
      </Card>
    </Section>
  );
}

// =====================================================================================
// İş Sağlığı ve Güvenliği Uzmanı (İGU)
// =====================================================================================

export function UzmanDashboard() {
  const analyses = useStore((s) => s.analyses);
  const riskRows = useStore((s) => s.riskRows);
  const denetimler = useStore((s) => s.denetimler);
  const olaylar = useStore((s) => s.olaylar);
  const egitim = useEgitimOzet();
  const hello = useHello();

  const os = useMemo(() => olayStats(olaylar), [olaylar]);
  const risk = useMemo(() => {
    let crit = 0;
    let high = 0;
    for (const r of riskRows) {
      const sc = r.o * r.s;
      if (sc >= 20) crit += 1;
      else if (sc >= 15) high += 1;
    }
    return { crit, high };
  }, [riskRows]);
  const avgDen = denetimler.length ? Math.round(denetimler.reduce((a, d) => a + (Number(d.puan) || 0), 0) / denetimler.length) : null;

  const sonAnaliz = useMemo(
    () =>
      [...analyses]
        .sort((a, b) => b.id - a.id)
        .slice(0, 4)
        .map((a) => ({ a, sum: analysisSummary(riskRows, a.id) })),
    [analyses, riskRows],
  );
  const sonOlay = useMemo(() => [...olaylar].sort(byTarihDesc).slice(0, 4), [olaylar]);
  const sonDenetim = useMemo(() => [...denetimler].sort(byTarihDesc).slice(0, 4), [denetimler]);
  const isEmpty = !analyses.length && !olaylar.length && !denetimler.length;

  const quick: QuickItem[] = [
    { label: "Yeni risk analizi", href: "/app/risk/yeni/", icon: WandSparkles },
    { label: "Saha denetimi", href: "/app/denetim/detay/?id=yeni", icon: ClipboardCheck },
    { label: "Kaza kaydı", href: "/app/kaza/?yeni=1", icon: Siren },
    { label: "Hesaplayıcı", href: "/app/hesap/", icon: Calculator },
  ];

  const tiles: TileItem[] = [
    { m: "risk", sub: `${analyses.length} analiz · ${riskRows.length} madde`, alert: risk.crit ? `${risk.crit} kritik` : undefined },
    { m: "denetim", sub: denetimler.length ? `${denetimler.length} denetim · ort. %${avgDen}` : "Kontrol listesi · PDF" },
    { m: "kaza", sub: `${os.kaza} kaza · ${os.ramak} ramak kala`, alert: os.bildirilmemis ? `${os.bildirilmemis} SGK` : undefined },
    egitimTile(egitim.sub),
    { m: "mevzuat", sub: "6331 saha rehberi" },
    { m: "hesap", sub: "Uzman süresi · KSH" },
    { m: "asistan", sub: "Yapay zekâ İSG asistanı" },
  ];

  return (
    <div>
      <Greeting rol="uzman" hello={hello} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Hero>
            <HeroKicker>İSG DURUMU</HeroKicker>
            <div className="mt-1 flex flex-wrap items-end gap-x-2.5">
              <div className="num text-[34px] font-extrabold leading-tight md:text-[42px]">{riskRows.length}</div>
              <div className="mb-1.5 text-[13.5px] font-semibold text-white/85">
                risk maddesi · {analyses.length} analiz
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <HeroCell icon={Flame} label="Kabul edilemez" value={risk.crit} />
              <HeroCell icon={TriangleAlert} label="Yüksek" value={risk.high} />
              <HeroCell icon={ClipboardCheck} label="Ort. denetim uygunluğu" value={avgDen != null ? `%${avgDen}` : "-"} />
            </div>
          </Hero>

          <AiBanner />
          {os.bildirilmemis > 0 ? (
            <Banner href="/app/kaza/" icon={Siren} tone="red">
              {os.bildirilmemis} iş kazası SGK&apos;ya bildirilmedi (3 iş günü).
            </Banner>
          ) : null}
          {risk.crit > 0 ? (
            <Banner href="/app/risk/" icon={Flame} tone="orange">
              {risk.crit} kabul edilemez risk var — derhal önlem alınmalı.
            </Banner>
          ) : null}

          {isEmpty ? (
            <Welcome
              icon={HardHat}
              title="İş Sağlığı ve Güvenliği Uzmanı paneline hoş geldiniz"
              text="İlk risk analizinizi yapay zekâ ile birkaç dakikada oluşturun ya da örnek verilerle modülleri keşfedin."
            >
              <ButtonLink href="/app/risk/yeni/" icon={WandSparkles}>
                Risk analizi oluştur
              </ButtonLink>
              <DemoButton />
            </Welcome>
          ) : null}

          <AtananFirmalar />
          <QuickActions items={quick} />
          <ModuleGrid items={tiles} />
        </div>

        <div className="space-y-5 lg:col-span-4">
          <Section label="Son risk analizleri" className="!mt-0" right={<SeeAll href="/app/risk/" />}>
            <Card padded={false}>
              {sonAnaliz.length === 0 ? <EmptyRow text="Henüz risk analizi yok." href="/app/risk/yeni/" cta="İlk analizi oluştur" /> : null}
              {sonAnaliz.map(({ a, sum }, i) => {
                const m = RISK_META[level(sum.max)];
                return (
                  <Link key={a.id} href={`/app/risk/detay/?id=${a.id}`} className={rowCls(i)}>
                    <span
                      className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl"
                      style={sum.max ? { background: m.color, color: m.text } : undefined}
                      title={sum.max ? `En yüksek skor ${sum.max} · ${m.label}` : "Madde yok"}
                    >
                      {sum.max ? (
                        <>
                          <span className="num text-[15px] font-extrabold leading-none">{sum.max}</span>
                          <span className="mt-0.5 text-[9px] font-bold uppercase opacity-80">maks</span>
                        </>
                      ) : (
                        <span className="flex h-full w-full items-center justify-center rounded-xl bg-paper text-muted">
                          <ShieldCheck size={18} />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold text-navy">{a.title}</span>
                      <span className="num block truncate text-[12px] text-muted">
                        {sum.rows} madde · {fmtDate(a.analysis_date)}
                      </span>
                    </span>
                    {a.status !== "hazir" ? <Badge tone={a.status === "uretiliyor" ? "blue" : "gray"}>{a.status === "uretiliyor" ? "Üretiliyor" : "Taslak"}</Badge> : null}
                  </Link>
                );
              })}
            </Card>
          </Section>

          <Section label="Son olaylar" right={<SeeAll href="/app/kaza/" />}>
            <Card padded={false}>
              {sonOlay.length === 0 ? <EmptyRow text="Kayıtlı olay yok." href="/app/kaza/?yeni=1" cta="Olay kaydet" /> : null}
              {sonOlay.map((o, i) => {
                const m = OLAY_META[o.tur];
                return (
                  <Link key={o.id} href="/app/kaza/" className={rowCls(i)}>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.color }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-navy">{o.aciklama || m.label}</span>
                      <span className="block truncate text-[12px] text-muted">
                        {m.label}
                        {o.isyeri ? ` · ${o.isyeri}` : ""} · <span className="num">{fmtDate(o.tarih)}</span>
                      </span>
                    </span>
                    {o.tur === "kaza" && !o.sgk_bildirildi ? <Badge tone="red">SGK</Badge> : null}
                  </Link>
                );
              })}
            </Card>
          </Section>

          <Section label="Son denetimler" right={<SeeAll href="/app/denetim/" />}>
            <Card padded={false}>
              {sonDenetim.length === 0 ? <EmptyRow text="Henüz saha denetimi yok." href="/app/denetim/detay/?id=yeni" cta="Denetim başlat" /> : null}
              {sonDenetim.map((d, i) => (
                <Link key={d.id} href={`/app/denetim/detay/?id=${d.id}`} className={rowCls(i)}>
                  <span className={cx("num flex h-10 w-12 shrink-0 items-center justify-center rounded-xl text-[13.5px] font-extrabold", puanCls(d.puan))}>%{d.puan}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-navy">{d.isyeri || "İsimsiz işyeri"}</span>
                    <span className="num block text-[12px] text-muted">{fmtDate(d.tarih)}</span>
                  </span>
                  <ChevronRight size={16} className="text-muted/60" />
                </Link>
              ))}
            </Card>
          </Section>
        </div>
      </div>
    </div>
  );
}

// =====================================================================================
// İşyeri Hekimi (İH) ve Diğer Sağlık Personeli (DSP) — aynı pano, role göre metinler
// =====================================================================================

type SaglikRol = "hekim" | "dsp";

const SAGLIK_METIN: Record<SaglikRol, { welcomeTitle: string; welcomeText: string; hesapSub: string; muayeneSub: string }> = {
  hekim: {
    welcomeTitle: "İşyeri Hekimi paneline hoş geldiniz",
    welcomeText:
      "Çalışanların işe giriş ve periyodik muayenelerini kaydedin; bir sonraki muayene tarihi tehlike sınıfına göre otomatik hesaplanır.",
    hesapSub: "Hekim süresi · KSH",
    muayeneSub: "Sağlık gözetimi takibi",
  },
  dsp: {
    welcomeTitle: "Diğer Sağlık Personeli paneline hoş geldiniz",
    welcomeText:
      "Periyodik muayene takvimini izleyin, ilk yardım ve iş kazası kayıtlarını tutun; yaklaşan ve geciken muayeneler burada listelenir.",
    hesapSub: "DSP süresi · ilk yardımcı",
    muayeneSub: "Muayene takibi",
  },
};

/** İlkyardım Yönetmeliği: tehlike sınıfına göre her N çalışana en az 1 ilk yardımcı */
const ILK_YARDIM_SATIRLARI: [string, string, string][] = [
  ["Az tehlikeli", "her 20 çalışana 1", "#5CBD7D"],
  ["Tehlikeli", "her 15 çalışana 1", "#F4772E"],
  ["Çok tehlikeli", "her 10 çalışana 1", "#D6334C"],
];

function SaglikDashboard({ rol }: { rol: SaglikRol }) {
  const muayeneler = useStore((s) => s.muayeneler);
  const olaylar = useStore((s) => s.olaylar);
  const analyses = useStore((s) => s.analyses);
  const egitim = useEgitimOzet();
  const hello = useHello();
  const metin = SAGLIK_METIN[rol];
  const dsp = rol === "dsp";

  const now = today();
  const ms = useMemo(() => muayeneStats(muayeneler, now), [muayeneler, now]);
  const os = useMemo(() => olayStats(olaylar), [olaylar]);
  const meslek = useMemo(() => olaylar.filter((o) => o.tur === "meslek_hastaligi").length, [olaylar]);
  const yaklasanlar = useMemo(() => siraliSonraki(sonKayitlar(muayeneler)).slice(0, 6), [muayeneler]);
  const isEmpty = !muayeneler.length && !olaylar.length;

  const quick: QuickItem[] = dsp
    ? [
        { label: "Muayene ekle", href: "/app/muayene/?yeni=1", icon: UserPlus },
        { label: "Kaza kaydı", href: "/app/kaza/?yeni=1", icon: Siren },
        { label: "İlk yardımcı hesabı", href: "/app/hesap/", icon: HeartPulse },
        { label: "Asistan", href: "/app/asistan/", icon: Sparkles },
      ]
    : [
        { label: "Muayene ekle", href: "/app/muayene/?yeni=1", icon: UserPlus },
        { label: "Olay kaydı", href: "/app/kaza/?yeni=1", icon: Siren },
        { label: "Mevzuat", href: "/app/mevzuat/", icon: BookOpen },
        { label: "Asistan", href: "/app/asistan/", icon: Sparkles },
      ];

  const tiles: TileItem[] = [
    {
      m: "muayene",
      sub: ms.calisan ? `${ms.calisan} çalışan · ${ms.yaklasan} yaklaşan` : metin.muayeneSub,
      alert: ms.gecikmis ? `${ms.gecikmis} gecikmiş` : undefined,
    },
    dsp
      ? { m: "kaza", sub: `${os.kaza} kaza · ${os.ramak} ramak kala`, alert: os.bildirilmemis ? `${os.bildirilmemis} SGK` : undefined }
      : { m: "kaza", sub: `${meslek} meslek hast. · ${os.kaza} kaza` },
    { m: "risk", sub: analyses.length ? `${analyses.length} risk analizi` : "Risk değerlendirmesi" },
    egitimTile(egitim.sub),
    { m: "mevzuat", sub: "6331 saha rehberi" },
    { m: "hesap", sub: metin.hesapSub },
    { m: "asistan", sub: "Yapay zekâ İSG asistanı" },
  ];

  return (
    <div>
      <Greeting rol={rol} hello={hello} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Hero>
            <HeroKicker>{dsp ? "SAĞLIK GÖZETİMİ VE İLK YARDIM" : "SAĞLIK GÖZETİMİ"}</HeroKicker>
            <div className="mt-1 flex flex-wrap items-end gap-x-2.5">
              <div className="num text-[34px] font-extrabold leading-tight md:text-[42px]">{ms.calisan}</div>
              <div className="mb-1.5 text-[13.5px] font-semibold text-white/85">
                çalışan{ms.isyeri ? ` · ${ms.isyeri} işyeri` : ""}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <HeroCell icon={AlarmClock} label="Gecikmiş" value={ms.gecikmis} />
              <HeroCell icon={CalendarClock} label="30 gün içinde" value={ms.yaklasan} />
              {dsp ? (
                <HeroCell icon={Siren} label="İş kazası" value={os.kaza} />
              ) : (
                <HeroCell icon={Stethoscope} label="Meslek hast. şüphesi" value={meslek} />
              )}
            </div>
          </Hero>

          <AiBanner />
          {ms.gecikmis > 0 ? (
            <Banner href="/app/muayene/" icon={AlarmClock} tone="red">
              {ms.gecikmis} çalışanın periyodik muayenesi gecikti.
            </Banner>
          ) : null}
          {dsp && os.bildirilmemis > 0 ? (
            <Banner href="/app/kaza/" icon={Siren} tone="orange">
              {os.bildirilmemis} iş kazası SGK&apos;ya bildirilmedi (3 iş günü).
            </Banner>
          ) : null}

          {isEmpty ? (
            <Welcome icon={dsp ? HeartPulse : Stethoscope} title={metin.welcomeTitle} text={metin.welcomeText}>
              <ButtonLink href="/app/muayene/?yeni=1" icon={UserPlus}>
                İlk muayeneyi ekle
              </ButtonLink>
              <DemoButton />
            </Welcome>
          ) : null}

          <AtananFirmalar />
          <QuickActions items={quick} />
          <ModuleGrid items={tiles} />
        </div>

        <div className="space-y-5 lg:col-span-4">
          <Section label="Yaklaşan muayeneler" className="!mt-0" right={<SeeAll href="/app/muayene/" />}>
            <Card padded={false}>
              {yaklasanlar.length === 0 ? <EmptyRow text="Henüz muayene kaydı yok." href="/app/muayene/?yeni=1" cta="Muayene ekle" /> : null}
              {yaklasanlar.map((m, i) => {
                const d = durum(m, now);
                const meta = DURUM_META[d];
                return (
                  <Link key={m.id} href={`/app/muayene/?id=${m.id}`} className={rowCls(i)}>
                    <span
                      className={cx(
                        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-[13px] font-extrabold",
                        d === "gecikmis" ? "bg-soft-danger text-danger" : d === "yaklasan" ? "bg-soft-warn text-warn" : "bg-soft-green text-success",
                      )}
                      aria-hidden
                    >
                      {initials(m.calisan)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-navy">{m.calisan}</span>
                      <span className="block truncate text-[12px] text-muted">{m.isyeri}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="num text-[12px] font-bold text-text">{fmtDate(m.sonraki)}</span>
                      <Badge tone={meta.tone} className="num">
                        {durumText(m, now)}
                      </Badge>
                    </span>
                  </Link>
                );
              })}
            </Card>
          </Section>

          {dsp ? (
            <Section label="İlk yardım">
              <Card>
                <div className="text-[14px] font-extrabold text-navy">İlk yardımcı sayısı</div>
                <div className="mt-0.5 text-[12px] text-muted">İşyerinin tehlike sınıfına göre en az</div>
                <div className="mt-3 space-y-2">
                  {ILK_YARDIM_SATIRLARI.map(([k, v, c]) => (
                    <div key={k} className="flex items-center gap-2.5 rounded-xl bg-paper px-3 py-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c }} aria-hidden />
                      <span className="flex-1 text-[13px] font-semibold text-text">{k}</span>
                      <span className="text-[13px] font-extrabold text-navy">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-muted">
                  İlk yardım dolabı / çantası malzemelerini ve son kullanma tarihlerini düzenli kontrol edin; ilk yardımcı belgeleri 3 yılda bir
                  güncelleme eğitimiyle yenilenir (İlkyardım Yönetmeliği).
                </p>
                <Link href="/app/hesap/" className="mt-2 inline-block text-[12.5px] font-bold text-brand-blue hover:underline">
                  Firmaya göre hesapla →
                </Link>
              </Card>
            </Section>
          ) : null}

          <Section label="Periyot">
            <Card>
              <div className="text-[14px] font-extrabold text-navy">Periyodik muayene sıklığı</div>
              <div className="mt-0.5 text-[12px] text-muted">İşyerinin tehlike sınıfına göre</div>
              <div className="mt-3 space-y-2">
                {PERIYOT_SATIRLARI.map(([k, v], i) => (
                  <div key={k} className="flex items-center gap-2.5 rounded-xl bg-paper px-3 py-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ["#D6334C", "#F4772E", "#5CBD7D"][i] }} aria-hidden />
                    <span className="flex-1 text-[13px] font-semibold text-text">{k}</span>
                    <span className="text-[13px] font-extrabold text-navy">{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-muted">
                İşe girişte ve görev değişikliğinde muayene zorunludur; iş kazası, meslek hastalığı veya sağlık nedeniyle tekrarlanan uzaklaşmalardan sonra
                işe dönüşte çalışanın talebi hâlinde yapılır (6331 s. Kanun m.15).
              </p>
            </Card>
          </Section>
        </div>
      </div>
    </div>
  );
}

export function HekimDashboard() {
  return <SaglikDashboard rol="hekim" />;
}

export function DspDashboard() {
  return <SaglikDashboard rol="dsp" />;
}

// =====================================================================================
// Öğrenci / uzman adayı
// =====================================================================================

/** "B" → "B Sınıfı"; eski kısaltmalı değerler uzun hâle; diğerleri olduğu gibi */
function hedefText(h?: string): string {
  const t = (h || "").trim();
  if (!t) return "";
  if (/^[abc]$/i.test(t)) return `${t.toUpperCase()} Sınıfı`;
  return t.replace("İSG Uzmanlığı", "İş Sağlığı ve Güvenliği Uzmanlığı");
}

type SinifDurum = { state: "hidden" } | { state: "loading" } | { state: "ok"; siniflar: SinifimItem[] };

/** Öğrencinin katıldığı sınıflar (sunucu). Arka uç yoksa ya da hata olursa "hidden". */
function useSiniflarim(): SinifDurum {
  const backend = useSync((s) => s.backend);
  const [st, setSt] = useState<SinifDurum>({ state: "loading" });
  useEffect(() => {
    if (backend !== true) return;
    let alive = true;
    siniflarim()
      .then((l) => {
        if (alive) setSt({ state: "ok", siniflar: Array.isArray(l) ? l : [] });
      })
      .catch(() => {
        if (alive) setSt({ state: "hidden" });
      });
    return () => {
      alive = false;
    };
  }, [backend]);
  return backend === true ? st : { state: "hidden" };
}

function sonDuyuru(siniflar: SinifimItem[]): { metin: string; created_at: string; sinif: string } | null {
  let son: { metin: string; created_at: string; sinif: string } | null = null;
  for (const s of siniflar) {
    const list = Array.isArray(s.mesajlar) ? s.mesajlar : [];
    const m = list[list.length - 1];
    if (m && (!son || m.created_at > son.created_at)) son = { metin: m.metin, created_at: m.created_at, sinif: s.ad };
  }
  return son;
}

function ilkSatir(t: string): string {
  return (
    (t || "")
      .split(/\r?\n/)
      .map((x) => x.trim())
      .find(Boolean) ?? ""
  );
}

function OzetKart({ icon: Icon, color, title, href, cta, children }: { icon: LucideIcon; color: string; title: string; href: string; cta: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: color }}>
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1 text-[15px] font-extrabold text-navy">{title}</div>
      </div>
      <div className="mt-3 min-w-0 flex-1">{children}</div>
      <Link href={href} className="mt-3 inline-flex items-center gap-1 self-start text-[13px] font-bold text-brand-blue hover:underline">
        {cta} <ChevronRight size={15} />
      </Link>
    </Card>
  );
}

function SinifimKart({ durum }: { durum: SinifDurum }) {
  if (durum.state === "hidden") return null;
  if (durum.state === "loading") return <div className="skeleton h-[168px] w-full rounded-xl2" />;
  const { siniflar } = durum;
  if (siniflar.length === 0) {
    return (
      <OzetKart icon={School} color={TILE.sinifim.color} title="Sınıfım" href="/app/sinifim/" cta="Sınıfa katıl">
        <p className="text-[13.5px] leading-relaxed text-muted">
          Henüz bir sınıfa katılmadınız. Eğitim kurumunuzun verdiği katılım koduyla sınıfa katılın; duyuruları buradan takip edin.
        </p>
      </OzetKart>
    );
  }
  const son = sonDuyuru(siniflar);
  return (
    <OzetKart icon={School} color={TILE.sinifim.color} title="Sınıfım" href="/app/sinifim/" cta="Sınıfıma git">
      <div className="text-[13px] text-muted">
        <span className="num text-[20px] font-extrabold text-navy">{siniflar.length}</span> sınıfa katıldınız
      </div>
      {son ? (
        <div className="mt-2.5 rounded-xl bg-paper px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-muted">
            <Megaphone size={13} className="shrink-0 text-brand-blue" />
            <span className="min-w-0 truncate">
              Son duyuru · {son.sinif} · <span className="num">{fmtDate(son.created_at)}</span>
            </span>
          </div>
          <div className="mt-1 line-clamp-2 break-words text-[13.5px] font-semibold text-ink">{ilkSatir(son.metin)}</div>
        </div>
      ) : (
        <div className="mt-2.5 rounded-xl bg-paper px-3 py-2.5 text-[12.5px] text-muted">Henüz duyuru yok.</div>
      )}
    </OzetKart>
  );
}

function EgitimKart() {
  const e = useEgitimOzet();
  return (
    <OzetKart icon={Presentation} color={TILE.egitim.color} title="Eğitimler" href="/app/egitim/" cta={e.sertifika ? "Sertifikayı görüntüle" : e.ders ? "Eğitime devam et" : "Eğitime başla"}>
      <div className="text-[13.5px] font-bold text-navy">Temel İş Sağlığı ve Güvenliği Eğitimi</div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={e.ders ? "blue" : "gray"} className="num">
          {e.ders} ders tamamlandı
        </Badge>
        {e.sertifika ? (
          <Badge tone="green">
            <Award size={12} strokeWidth={2.6} /> Sertifika alındı
          </Badge>
        ) : e.puan != null ? (
          <Badge tone="warn" className="num">
            Son sınav %{e.puan}
          </Badge>
        ) : (
          <Badge tone="gray">Sertifika yok</Badge>
        )}
      </div>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
        {e.sertifika
          ? `Sertifikanız ${fmtDate(e.kayit?.basarili_at)} tarihinde düzenlendi${e.kayit?.sertifika_no ? ` (No: ${e.kayit.sertifika_no})` : ""}.`
          : "Dersleri tamamlayın, bitirme sınavını geçin ve sertifikanızı alın."}
      </p>
    </OzetKart>
  );
}

function pctCls(p: number): string {
  if (p >= GECME_NOTU) return "text-success";
  if (p >= 50) return "text-warn";
  return "text-danger";
}

export function OgrenciDashboard() {
  const sonuclar = useStore((s) => s.sinavSonuclari);
  const { dersler, toplam, loading } = useQuestionBank();
  const profil = useProfil();
  const hello = useHello();
  const egitim = useEgitimOzet();
  const sinif = useSiniflarim();

  const best = useMemo(() => bestByDers(sonuclar), [sonuclar]);
  const recent = useMemo(() => [...sonuclar].sort((a, b) => b.id - a.id), [sonuclar]);
  const last5 = recent.slice(0, 5);
  const avg = last5.length ? Math.round(last5.reduce((a, r) => a + sonucPct(r), 0) / last5.length) : null;
  const studied = dersler.filter((d) => best[d.sira] != null).length;
  const passed = dersler.filter((d) => (best[d.sira] ?? -1) >= GECME_NOTU).length;
  const nextDers = dersler.find((d) => (best[d.sira] ?? -1) < GECME_NOTU);
  const adlar = useMemo(() => new Map(dersler.map((d) => [d.sira, d.ad])), [dersler]);
  const zayif = useMemo(
    () =>
      dersler
        .filter((d) => best[d.sira] != null)
        .sort((a, b) => best[a.sira] - best[b.sira] || a.sira - b.sira)
        .slice(0, 4),
    [dersler, best],
  );

  const hedef = hedefText(profil.hedef_sinav);
  const sinifSayi = sinif.state === "ok" ? sinif.siniflar.length : null;

  const quick: QuickItem[] = [
    { label: "25 soruluk deneme", href: "/app/sinav/deneme/?n=25", icon: Zap },
    { label: "Derse devam", href: nextDers ? `/app/sinav/ders/?d=${nextDers.sira}` : "/app/sinav/", icon: CirclePlay },
    { label: "Mevzuat", href: "/app/mevzuat/", icon: BookOpen },
    { label: "Asistana sor", href: "/app/asistan/", icon: Sparkles },
  ];

  const tiles: TileItem[] = [
    { m: "sinav", sub: loading ? "Soru bankası" : `${toplam} soru · ${dersler.length} ders` },
    { m: "sinifim", sub: sinifSayi ? `${sinifSayi} sınıf · duyurular` : sinifSayi === 0 ? "Katılım koduyla katıl" : "Sınıf duyuruları" },
    egitimTile(egitim.sub),
    { m: "mevzuat", sub: "6331 saha rehberi" },
    { m: "hesap", sub: "Uzman süresi · KSH" },
    { m: "asistan", sub: "Sorularını yapay zekâya sor" },
  ];

  return (
    <div>
      <Greeting rol="ogrenci" hello={hello} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Hero>
            <HeroKicker>
              SINAV HAZIRLIK{hedef ? ` · Hedef: ${hedef}` : ""}
            </HeroKicker>
            <div className="mt-1 flex flex-wrap items-end gap-x-2.5">
              <div className="num text-[34px] font-extrabold leading-tight md:text-[42px]">{avg != null ? `%${avg}` : "—"}</div>
              <div className="mb-1.5 text-[13.5px] font-semibold text-white/85">
                {avg != null ? `son ${last5.length} deneme ortalaması` : "henüz deneme çözülmedi"}
              </div>
            </div>
            <ProgressBar value={dersler.length ? (passed * 100) / dersler.length : 0} tone="white" track="bg-white/20" className="mt-3 max-w-md" />
            <div className="num mt-1.5 text-[12px] text-white/85">
              {loading ? "Soru bankası yükleniyor…" : `${passed}/${dersler.length} ders geçildi · geçme notu %${GECME_NOTU}`}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <HeroCell icon={Trophy} label="Çözülen deneme" value={sonuclar.length} />
              <HeroCell icon={BookOpen} label="Çalışılan ders" value={loading ? "…" : `${studied}/${dersler.length}`} />
              <HeroCell icon={Award} label="Temel İSG eğitimi" value={egitim.sertifika ? "Sertifikalı" : `${egitim.ders} ders`} />
            </div>
          </Hero>

          <AiBanner />

          {sonuclar.length === 0 ? (
            <Welcome
              icon={GraduationCap}
              title="İlk denemeni çöz"
              text="25 soruluk karışık deneme ile seviyeni ölç; sonuçların, ortalaman ve zayıf derslerin burada görünür."
            >
              <ButtonLink href="/app/sinav/deneme/?n=25" icon={Zap}>
                25 soruluk deneme
              </ButtonLink>
              {dersler[0] ? (
                <ButtonLink href={`/app/sinav/ders/?d=${dersler[0].sira}`} kind="secondary" icon={CirclePlay}>
                  1. dersten başla
                </ButtonLink>
              ) : null}
            </Welcome>
          ) : null}

          <div className={cx("grid grid-cols-1 gap-4", sinif.state !== "hidden" && "sm:grid-cols-2")}>
            <SinifimKart durum={sinif} />
            <EgitimKart />
          </div>

          <QuickActions items={quick} />
          <ModuleGrid items={tiles} />
        </div>

        <div className="space-y-5 lg:col-span-4">
          <Section label="Son denemeler" className="!mt-0" right={<SeeAll href="/app/sinav/" />}>
            <Card padded={false}>
              {last5.length === 0 ? <EmptyRow text="Henüz deneme çözmediniz." href="/app/sinav/deneme/?n=25" cta="İlk denemeyi başlat" /> : null}
              {last5.map((r, i) => {
                const p = sonucPct(r);
                const ders = r.ders_sira != null ? adlar.get(r.ders_sira) : undefined;
                return (
                  <Link key={r.id} href={r.ders_sira != null ? `/app/sinav/ders/?d=${r.ders_sira}` : "/app/sinav/"} className={rowCls(i)}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-navy">
                        {r.ders_sira != null ? `${r.ders_sira}. ${ders ?? "Ders"}` : TUR_LABEL[r.tur]}
                      </span>
                      <span className="num block truncate text-[12px] text-muted">
                        {r.ders_sira != null ? `${TUR_LABEL[r.tur]} · ` : ""}
                        {r.dogru}/{r.toplam} doğru · {fmtDate(r.created_at)}
                      </span>
                    </span>
                    <span className={cx("num shrink-0 text-[16px] font-extrabold", pctCls(p))}>%{p}</span>
                  </Link>
                );
              })}
            </Card>
          </Section>

          <Section label="Zayıf dersler" right={<SeeAll href="/app/sinav/" label="Dersler" />}>
            <Card padded={false}>
              {zayif.length === 0 ? (
                <EmptyRow
                  text="Ders çalıştıkça en düşük puanlı dersleriniz burada listelenir."
                  href={dersler[0] ? `/app/sinav/ders/?d=${dersler[0].sira}` : "/app/sinav/"}
                  cta="1. derse başla"
                />
              ) : null}
              {zayif.map((d, i) => {
                const p = best[d.sira] ?? 0;
                return (
                  <Link key={d.sira} href={`/app/sinav/ders/?d=${d.sira}`} className={rowCls(i)}>
                    <span
                      className={cx(
                        "num flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold",
                        p >= GECME_NOTU ? "bg-soft-green text-success" : "bg-soft-danger text-danger",
                      )}
                    >
                      {d.sira}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-navy">{d.ad}</span>
                      <ProgressBar value={p} tone={p >= GECME_NOTU ? "brand" : "danger"} className="mt-1.5 h-1.5" />
                    </span>
                    <span className={cx("num shrink-0 text-[13.5px] font-extrabold", pctCls(p))}>%{p}</span>
                  </Link>
                );
              })}
            </Card>
          </Section>

          <Section label="Günün sorusu">
            {loading || !hello.iso ? (
              <div className="skeleton h-[260px] w-full rounded-xl2" />
            ) : (
              <GununSorusu key={`${hello.iso}-${toplam}`} dersler={dersler} iso={hello.iso} />
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function dayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Tarihe göre deterministik soru: aynı gün herkes aynı soruyu görür, ertesi gün değişir. */
function GununSorusu({ dersler, iso }: { dersler: Ders[]; iso: string }) {
  const [picked, setPicked] = useState<number | null>(null);
  const item = useMemo((): { q: Soru; ders: Ders } | null => {
    const pool: { q: Soru; ders: Ders }[] = [];
    for (const d of dersler) for (const q of [...d.on, ...d.son]) pool.push({ q, ders: d });
    if (!pool.length) return null;
    // Asal çarpanla atlayarak ardışık günlerin aynı dersten gelmesini önle
    const n = pool.length;
    const idx = (((dayIndex(iso) * 7919) % n) + n) % n;
    return pool[idx];
  }, [dersler, iso]);

  if (!item) {
    return (
      <Card>
        <div className="text-[13.5px] text-muted">Soru bankasında soru bulunamadı.</div>
      </Card>
    );
  }
  const { q, ders } = item;
  const answered = picked !== null;
  const correct = picked === q.d;

  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-soft-warn text-warn">
          <Lightbulb size={18} />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-extrabold text-navy">Günün sorusu</div>
          <div className="truncate text-[11.5px] text-muted">
            {ders.sira}. ders · {ders.ad}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[14px] font-semibold leading-relaxed text-ink">{q.s}</p>
      <div className="mt-3 space-y-2">
        {q.c.map((c, i) => {
          const isRight = answered && i === q.d;
          const isWrong = answered && i === picked && !correct;
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setPicked(i)}
              className={cx(
                "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[13.5px] leading-snug transition disabled:cursor-default",
                isRight
                  ? "border-success bg-soft-green font-bold text-success"
                  : isWrong
                    ? "border-danger bg-soft-danger font-bold text-danger"
                    : answered
                      ? "border-line bg-white text-muted"
                      : "border-line bg-white text-text hover:border-brand-blue/50 hover:bg-soft-blue/40",
              )}
            >
              <span
                className={cx(
                  "num flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold",
                  isRight ? "bg-success text-white" : isWrong ? "bg-danger text-white" : "bg-paper text-navy",
                )}
              >
                {LETTERS[i] ?? i + 1}
              </span>
              <span className="min-w-0 flex-1">{c}</span>
              {isRight ? <CircleCheck size={18} className="shrink-0" /> : isWrong ? <CircleX size={18} className="shrink-0" /> : null}
            </button>
          );
        })}
      </div>
      {answered ? (
        <div className={cx("mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2.5 text-[13px] font-bold", correct ? "bg-soft-green text-success" : "bg-soft-danger text-danger")}>
          <span className="inline-flex items-center gap-1.5">
            {correct ? <Target size={15} /> : <CircleX size={15} />}
            {correct ? "Doğru! Yarın yeni soru var." : `Yanlış — doğru cevap ${LETTERS[q.d] ?? q.d + 1}.`}
          </span>
          <Link href={`/app/sinav/ders/?d=${ders.sira}`} className="ml-auto text-brand-blue hover:underline">
            Bu dersi çalış →
          </Link>
        </div>
      ) : (
        <div className="mt-3 text-[12px] text-muted">Bir şık seçin; cevabınız kaydedilmez.</div>
      )}
    </Card>
  );
}
