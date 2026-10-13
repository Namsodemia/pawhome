"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlarmClock,
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
  KeyRound,
  Lightbulb,
  MessagesSquare,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Target,
  Timer,
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
import { analysisSummary, olayStats, useStore } from "@/lib/store";
import { useSync } from "@/lib/sync";
import { rolBilgi, useProfil, type Modul, type Rol } from "@/lib/roles";
import { aiMode, subscribeAiConfig, type AiMode } from "@/lib/ai/client";
import { bestByDers, GECME_NOTU, LETTERS, sonucPct, TUR_LABEL, useQuestionBank, type Ders, type Soru } from "@/lib/sinav";
import { DURUM_META, PERIYOT_SATIRLARI, durum, durumText, gunKaldi, muayeneStats, siraliSonraki, sonKayitlar } from "@/lib/muayene";
import { RISK_META, level } from "@/lib/risk";
import { cx, fmtDate, greeting, initials, longDateTR, today } from "@/lib/format";
import type { OlayTur } from "@/lib/types";

// =====================================================================================
// Ortak parçalar
// =====================================================================================

const ROL_TONE: Record<Rol, "blue" | "green" | "red" | "violet"> = { osgb: "blue", uzman: "green", hekim: "red", ogrenci: "violet" };
const ROL_ICON: Record<Rol, LucideIcon> = { osgb: Building2, uzman: HardHat, hekim: Stethoscope, ogrenci: GraduationCap };

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
};

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
        <Badge tone={ROL_TONE[rol]}>
          <Icon size={12} strokeWidth={2.6} /> {info.kisa}
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

/** Yapay zekâ yapılandırılmamışsa ayarlara yönlendiren bant */
function AiBanner() {
  const [mode, setMode] = useState<AiMode | null>(null);
  useEffect(() => {
    const refresh = () => void aiMode().then(setMode);
    refresh();
    const unsub = subscribeAiConfig(refresh);
    return () => {
      unsub();
    };
  }, []);
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
      <div className={cx("grid grid-cols-2 gap-3", items.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3")}>
        {items.map(({ m, sub, alert }) => {
          const t = TILE[m];
          const Icon = t.icon;
          return (
            <Link
              key={m}
              href={t.href}
              className="group relative rounded-xl2 border border-line/70 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar"
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

// =====================================================================================
// İş güvenliği uzmanı
// =====================================================================================

export function UzmanDashboard() {
  const analyses = useStore((s) => s.analyses);
  const riskRows = useStore((s) => s.riskRows);
  const denetimler = useStore((s) => s.denetimler);
  const olaylar = useStore((s) => s.olaylar);
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
              title="İSG uzmanı paneline hoş geldiniz"
              text="İlk risk analizinizi yapay zekâ ile birkaç dakikada oluşturun ya da örnek verilerle modülleri keşfedin."
            >
              <ButtonLink href="/app/risk/yeni/" icon={WandSparkles}>
                Risk analizi oluştur
              </ButtonLink>
              <DemoButton />
            </Welcome>
          ) : null}

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
// İşyeri hekimi
// =====================================================================================

export function HekimDashboard() {
  const muayeneler = useStore((s) => s.muayeneler);
  const olaylar = useStore((s) => s.olaylar);
  const analyses = useStore((s) => s.analyses);
  const hello = useHello();

  const now = today();
  const ms = useMemo(() => muayeneStats(muayeneler, now), [muayeneler, now]);
  const os = useMemo(() => olayStats(olaylar), [olaylar]);
  const meslek = useMemo(() => olaylar.filter((o) => o.tur === "meslek_hastaligi").length, [olaylar]);
  const yaklasanlar = useMemo(() => siraliSonraki(sonKayitlar(muayeneler)).slice(0, 6), [muayeneler]);
  const isEmpty = !muayeneler.length && !olaylar.length;

  const quick: QuickItem[] = [
    { label: "Muayene ekle", href: "/app/muayene/?yeni=1", icon: UserPlus },
    { label: "Olay kaydı", href: "/app/kaza/?yeni=1", icon: Siren },
    { label: "Mevzuat", href: "/app/mevzuat/", icon: BookOpen },
    { label: "Asistan", href: "/app/asistan/", icon: Sparkles },
  ];

  const tiles: TileItem[] = [
    {
      m: "muayene",
      sub: ms.calisan ? `${ms.calisan} çalışan · ${ms.yaklasan} yaklaşan` : "Sağlık gözetimi takibi",
      alert: ms.gecikmis ? `${ms.gecikmis} gecikmiş` : undefined,
    },
    { m: "kaza", sub: `${meslek} meslek hast. · ${os.kaza} kaza` },
    { m: "risk", sub: analyses.length ? `${analyses.length} risk analizi` : "Risk değerlendirmesi" },
    { m: "mevzuat", sub: "6331 saha rehberi" },
    { m: "hesap", sub: "Hekim süresi · KSH" },
    { m: "asistan", sub: "Yapay zekâ İSG asistanı" },
  ];

  return (
    <div>
      <Greeting rol="hekim" hello={hello} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Hero>
            <HeroKicker>SAĞLIK GÖZETİMİ</HeroKicker>
            <div className="mt-1 flex flex-wrap items-end gap-x-2.5">
              <div className="num text-[34px] font-extrabold leading-tight md:text-[42px]">{ms.calisan}</div>
              <div className="mb-1.5 text-[13.5px] font-semibold text-white/85">
                çalışan{ms.isyeri ? ` · ${ms.isyeri} işyeri` : ""}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <HeroCell icon={AlarmClock} label="Gecikmiş" value={ms.gecikmis} />
              <HeroCell icon={CalendarClock} label="30 gün içinde" value={ms.yaklasan} />
              <HeroCell icon={Stethoscope} label="Meslek hast. şüphesi" value={meslek} />
            </div>
          </Hero>

          <AiBanner />
          {ms.gecikmis > 0 ? (
            <Banner href="/app/muayene/" icon={AlarmClock} tone="red">
              {ms.gecikmis} çalışanın periyodik muayenesi gecikti.
            </Banner>
          ) : null}

          {isEmpty ? (
            <Welcome
              icon={Stethoscope}
              title="İşyeri hekimi paneline hoş geldiniz"
              text="Çalışanların işe giriş ve periyodik muayenelerini kaydedin; bir sonraki muayene tarihi tehlike sınıfına göre otomatik hesaplanır."
            >
              <ButtonLink href="/app/muayene/?yeni=1" icon={UserPlus}>
                İlk muayeneyi ekle
              </ButtonLink>
              <DemoButton />
            </Welcome>
          ) : null}

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

// =====================================================================================
// Öğrenci / uzman adayı
// =====================================================================================

/** "B" → "B Sınıfı"; diğer değerler olduğu gibi */
function hedefText(h?: string): string {
  const t = (h || "").trim();
  if (!t) return "";
  if (/^[abc]$/i.test(t)) return `${t.toUpperCase()} Sınıfı`;
  return t;
}

/** "2026-11-15" veya "15.11.2026" → ISO */
function parseTarih(s?: string): string | null {
  const t = (s || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(t);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
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
  const sinavIso = parseTarih(profil.sinav_tarihi);
  const kalan = sinavIso && hello.iso ? gunKaldi(sinavIso, hello.iso) : null;
  const kalanText = kalan == null || kalan < 0 ? "-" : kalan === 0 ? "Bugün" : `${kalan} gün kaldı`;

  const quick: QuickItem[] = [
    { label: "25 soruluk deneme", href: "/app/sinav/deneme/?n=25", icon: Zap },
    { label: "Derse devam", href: nextDers ? `/app/sinav/ders/?d=${nextDers.sira}` : "/app/sinav/", icon: CirclePlay },
    { label: "Mevzuat", href: "/app/mevzuat/", icon: BookOpen },
    { label: "Asistana sor", href: "/app/asistan/", icon: Sparkles },
  ];

  const tiles: TileItem[] = [
    { m: "sinav", sub: loading ? "Soru bankası" : `${toplam} soru · ${dersler.length} ders` },
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
              <HeroCell icon={CalendarClock} label="Sınav tarihi" value={kalanText} />
            </div>
          </Hero>

          <AiBanner />
          {kalan != null && kalan >= 0 && kalan <= 30 ? (
            <Banner href="/app/sinav/deneme/?n=50" icon={Timer} tone="orange">
              {kalan === 0 ? "Sınav bugün — başarılar!" : `Sınava ${kalan} gün kaldı.`} 50 soruluk deneme ile kendinizi ölçün.
            </Banner>
          ) : null}

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
