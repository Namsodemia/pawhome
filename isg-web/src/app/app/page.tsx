"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calculator,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  KeyRound,
  MessagesSquare,
  Siren,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  WandSparkles,
  Clock3,
  Banknote,
  type LucideIcon,
} from "lucide-react";
import { Card, Hero, HeroKicker, Section, Stat, Button } from "@/components/ui";
import { toast } from "@/components/feedback";
import dynamic from "next/dynamic";
import { useRol } from "@/lib/roles";
import { HekimDashboard, OgrenciDashboard, UzmanDashboard } from "./RoleDashboards";
import { useStore, kasaBalances, monthSummary, kursiyerTotals, olayStats } from "@/lib/store";
import { aiMode, subscribeAiConfig, type AiMode } from "@/lib/ai/client";
import { useQuestionBank } from "@/lib/sinav";
import { greeting, longDateTR, money, moneyShort, thisMonth, cx } from "@/lib/format";

// Grafik kütüphanesi ilk yüklemeyi büyütmesin diye ayrı parça olarak yüklenir
const DashboardCharts = dynamic(() => import("./DashboardCharts").then((m) => m.DashboardCharts), {
  ssr: false,
  loading: () => <div className="skeleton mt-7 h-[300px] w-full" />,
});

export default function Dashboard() {
  const rol = useRol();
  if (rol === "uzman") return <UzmanDashboard />;
  if (rol === "hekim") return <HekimDashboard />;
  if (rol === "ogrenci") return <OgrenciDashboard />;
  return <OsgbDashboard />;
}

function OsgbDashboard() {
  const transactions = useStore((s) => s.transactions);
  const kasalar = useStore((s) => s.kasalar);
  const kursiyerler = useStore((s) => s.kursiyerler);
  const analyses = useStore((s) => s.analyses);
  const riskRows = useStore((s) => s.riskRows);
  const olaylar = useStore((s) => s.olaylar);
  const siniflar = useStore((s) => s.siniflar);
  const uyeler = useStore((s) => s.uyeler);
  const denetimler = useStore((s) => s.denetimler);
  const loadDemo = useStore((s) => s.loadDemo);
  const bank = useQuestionBank();

  const [hello, setHello] = useState({ g: "Merhaba", d: "" });
  const [mode, setMode] = useState<AiMode | null>(null);

  useEffect(() => {
    setHello({ g: greeting(), d: longDateTR() });
    const refresh = () => void aiMode().then(setMode);
    refresh();
    const unsub = subscribeAiConfig(refresh);
    return () => {
      unsub();
    };
  }, []);

  const isEmpty = transactions.length === 0 && kursiyerler.length === 0 && analyses.length === 0 && olaylar.length === 0 && siniflar.length === 0;

  // Tanıtım sayfasındaki "Örnek verilerle dene" bağlantısı: /app?demo=1
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("demo") === "1") {
      if (isEmpty) {
        loadDemo();
        toast("Örnek veriler yüklendi. Ayarlar'dan istediğiniz zaman silebilirsiniz.");
      }
      window.history.replaceState(null, "", "/app/");
    }
    // yalnızca ilk açılışta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const balances = useMemo(() => kasaBalances({ kasalar, transactions }), [kasalar, transactions]);
  const net = balances.reduce((a, b) => a + b.bakiye, 0);
  const month = useMemo(() => monthSummary(transactions, thisMonth()), [transactions]);
  const kt = useMemo(() => kursiyerTotals(kursiyerler), [kursiyerler]);
  const os = useMemo(() => olayStats(olaylar), [olaylar]);
  const yuksek = useMemo(() => riskRows.filter((r) => r.o * r.s >= 15).length, [riskRows]);

  const quick: { label: string; href: string; icon: LucideIcon }[] = [
    { label: "Risk analizi", href: "/app/risk/yeni", icon: WandSparkles },
    { label: "Gelir / gider", href: "/app/kasa?yeni=1", icon: Banknote },
    { label: "Sınıf mesajı", href: "/app/siniflar", icon: MessagesSquare },
    { label: "Kursiyer", href: "/app/musteri?yeni=1", icon: UserPlus },
  ];

  const modules: { label: string; sub: string; href: string; icon: LucideIcon; color: string }[] = [
    { label: "Risk Analizi", sub: `${analyses.length} analiz · ${riskRows.length} madde`, href: "/app/risk", icon: ShieldCheck, color: "#5CBD7D" },
    { label: "Kasa / Cari", sub: `${balances.length} kasa`, href: "/app/kasa", icon: Wallet, color: "#107398" },
    { label: "Müşteri Takip", sub: `${kt.n} kişi`, href: "/app/musteri", icon: Users, color: "#0B6F7B" },
    { label: "Sınıflar", sub: `${siniflar.length} sınıf · ${uyeler.length} kişi`, href: "/app/siniflar", icon: MessagesSquare, color: "#1B8ECF" },
    {
      label: "Sınav Hazırlık",
      sub: bank.loading ? "Soru bankası" : `${bank.toplam} soru · ${bank.dersler.length} ders`,
      href: "/app/sinav",
      icon: GraduationCap,
      color: "#6C5CE7",
    },
    { label: "Mevzuat", sub: "6331 saha rehberi", href: "/app/mevzuat", icon: BookOpen, color: "#1E3145" },
    { label: "Kaza / Ramak Kala", sub: `${os.kaza} kaza · ${os.ramak} ramak`, href: "/app/kaza", icon: Siren, color: "#D6334C" },
    { label: "Saha Denetimi", sub: denetimler.length ? `${denetimler.length} denetim · PDF` : "Kontrol listesi · PDF", href: "/app/denetim", icon: ClipboardCheck, color: "#3AA466" },
    { label: "Hesaplayıcı", sub: "Uzman süresi · KSH", href: "/app/hesap", icon: Calculator, color: "#F4772E" },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[26px] font-extrabold tracking-tight text-navy md:text-[30px]">
          {hello.g} <span aria-hidden>👋</span>
        </h1>
        <div className="text-[14px] capitalize text-muted">{hello.d}</div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Hero>
            <HeroKicker>Net kasa</HeroKicker>
            <div className={cx("num mt-1 text-[34px] font-extrabold leading-tight md:text-[42px]")}>{money(net)}</div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <HeroCell icon={TrendingUp} label="Bu ay gelir" value={moneyShort(month.gelir)} />
              <HeroCell icon={TrendingDown} label="Bu ay gider" value={moneyShort(month.gider)} />
              <HeroCell icon={Clock3} label="Alacak" value={moneyShort(kt.remaining)} />
            </div>
          </Hero>

          {mode === "none" ? (
            <Banner href="/app/ayarlar" icon={KeyRound} tone="blue">
              Yapay zekâ için API anahtarı girilmemiş. Ayarlar&apos;dan ekleyin.
            </Banner>
          ) : null}
          {os.bildirilmemis > 0 ? (
            <Banner href="/app/kaza" icon={Siren} tone="red">
              {os.bildirilmemis} iş kazası SGK&apos;ya bildirilmedi (3 iş günü).
            </Banner>
          ) : null}

          {isEmpty ? (
            <Card className="border-dashed bg-brandSoft">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-blue shadow-card">
                  <Sparkles size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15.5px] font-extrabold text-navy">İsgora&apos;ya hoş geldiniz</div>
                  <div className="text-[13.5px] text-muted">
                    Verileriniz İsgora sunucusundaki veritabanında saklanır. Modülleri dolu görmek için örnek verileri yükleyebilirsiniz.
                  </div>
                </div>
                <Button
                  onClick={() => {
                    loadDemo();
                    toast("Örnek veriler yüklendi.");
                  }}
                >
                  Örnek veri yükle
                </Button>
              </div>
            </Card>
          ) : null}

          <Section label="Hızlı işlem" className="!mt-6">
            <div className="grid grid-cols-4 gap-2">
              {quick.map((q) => {
                const Icon = q.icon;
                return (
                  <Link key={q.label} href={q.href} className="group flex flex-col items-center gap-2 rounded-2xl py-2 text-center transition hover:bg-white">
                    <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand text-white shadow-fab transition group-hover:-translate-y-0.5">
                      <Icon size={24} />
                    </span>
                    <span className="text-[12.5px] font-bold text-navy">{q.label}</span>
                  </Link>
                );
              })}
            </div>
          </Section>

          <Section label="Modüller">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {modules.map((m) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.label}
                    href={m.href}
                    className="group rounded-xl2 border border-line/70 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: m.color }}>
                      <Icon size={21} />
                    </span>
                    <div className="mt-3 text-[15px] font-extrabold text-navy">{m.label}</div>
                    <div className="mt-0.5 truncate text-[12.5px] text-muted">{m.sub}</div>
                  </Link>
                );
              })}
            </div>
          </Section>
        </div>

        <div className="space-y-5 lg:col-span-4">
          <Section label="Kasalar" className="!mt-0 lg:!mt-0" right={<SeeAll href="/app/kasa" />}>
            <Card padded={false}>
              {balances.length === 0 ? <div className="p-4 text-[13.5px] text-muted">Aktif kasa yok.</div> : null}
              {balances.map((b, i) => (
                <Link
                  key={b.id}
                  href={`/app/kasa?kasa=${b.id}`}
                  className={cx("flex items-center gap-3 px-4 py-3 transition hover:bg-paper", i > 0 && "border-t border-line")}
                >
                  <span className={cx("h-2.5 w-2.5 rounded-full", b.bakiye < 0 ? "bg-danger" : "bg-brand-green")} />
                  <span className="flex-1 truncate text-[14px] font-bold text-navy">{b.title}</span>
                  <span className={cx("num text-[14px] font-bold", b.bakiye < 0 ? "text-danger" : "text-navy")}>{money(b.bakiye)}</span>
                </Link>
              ))}
            </Card>
          </Section>

          <Section label="Müşteri takip" right={<SeeAll href="/app/musteri" />}>
            <div className="grid grid-cols-2 gap-2.5">
              <Stat label="Kişi" value={kt.n} />
              <Stat label="Sözleşme" value={moneyShort(kt.total)} tone="blue" />
              <Stat label="Tahsil" value={moneyShort(kt.collected)} tone="green" />
              <Stat label="Kalan" value={moneyShort(kt.remaining)} tone={kt.remaining > 0 ? "red" : "green"} />
            </div>
          </Section>

          <Section label="Risk analizi" right={<SeeAll href="/app/risk" />}>
            <div className="grid grid-cols-3 gap-2.5">
              <Stat label="Analiz" value={analyses.length} />
              <Stat label="Madde" value={riskRows.length} tone="blue" />
              <Stat label="Yüksek+" value={yuksek} tone={yuksek ? "orange" : "green"} />
            </div>
          </Section>
        </div>
      </div>

      <DashboardCharts transactions={transactions} riskRows={riskRows} />
    </div>
  );
}

function HeroCell({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
      <Icon size={15} className="opacity-90" />
      <div className="mt-1 text-[11.5px] font-semibold text-white/85">{label}</div>
      <div className="num truncate text-[14px] font-extrabold md:text-[15px]">{value}</div>
    </div>
  );
}

function Banner({ href, icon: Icon, tone, children }: { href: string; icon: LucideIcon; tone: "blue" | "red"; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cx(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-[13.5px] font-bold transition hover:brightness-[.98]",
        tone === "blue" ? "bg-soft-blue text-brand-blue" : "bg-soft-danger text-danger",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white">
        <Icon size={16} />
      </span>
      <span className="flex-1">{children}</span>
      <ChevronRight size={18} />
    </Link>
  );
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link href={href} className="text-[12.5px] font-bold text-brand-blue hover:underline">
      Tümü
    </Link>
  );
}
