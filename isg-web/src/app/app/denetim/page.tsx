"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChevronRight, ClipboardCheck, ClipboardList, HardHat, Plus, Printer, Store, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SABLONLAR, sablonAdi, sablonById } from "@/data/denetim";
import { useStore } from "@/lib/store";
import { cx, fmtDate } from "@/lib/format";
import { ButtonLink, Empty, Fab, Hero, HeroKicker, PageHeader, Section } from "@/components/ui";
import { printDenetim, puanTone, sayim } from "./shared";

const SABLON_ICON: Record<string, LucideIcon> = { genel: Building2, santiye: HardHat, mutfak: Utensils, ofis: Store };
const SABLON_COLOR: Record<string, string> = { genel: "#3AA466", santiye: "#F4772E", mutfak: "#D6334C", ofis: "#107398" };

export default function DenetimPageWrapper() {
  return (
    <Suspense fallback={null}>
      <DenetimPage />
    </Suspense>
  );
}

function DenetimPage() {
  const router = useRouter();
  const params = useSearchParams();
  const denetimler = useStore((s) => s.denetimler);
  const firma = useStore((s) => s.settings.firma);

  useEffect(() => {
    if (params.get("yeni") === "1") router.replace("/app/denetim/yeni");
  }, [params, router]);

  const list = useMemo(() => [...denetimler].sort((a, b) => b.id - a.id), [denetimler]);
  const ozet = useMemo(() => {
    if (!list.length) return null;
    const ort = Math.round(list.reduce((a, d) => a + d.puan, 0) / list.length);
    const uygunsuz = list.reduce((a, d) => a + Object.values(d.cevaplar).filter((v) => v === "uygunsuz").length, 0);
    const isyeri = new Set(list.map((d) => d.isyeri.trim().toLocaleLowerCase("tr-TR"))).size;
    return { ort, uygunsuz, isyeri, son: [...list].sort((a, b) => (a.tarih < b.tarih ? 1 : -1))[0] };
  }, [list]);

  return (
    <div>
      <PageHeader
        title="Saha Denetimi"
        subtitle="Şablon seçip kontrol listesini doldurun, PDF olarak paylaşın."
        actions={
          <ButtonLink href="/app/denetim/yeni" icon={Plus} className="hidden lg:inline-flex">
            Yeni Denetim
          </ButtonLink>
        }
      />

      {ozet ? (
        <Hero>
          <HeroKicker>Ortalama uygunluk</HeroKicker>
          <div className="num mt-1 text-[40px] font-extrabold leading-none md:text-[48px]">%{ozet.ort}</div>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              ["Denetim", String(list.length)],
              ["İşyeri", String(ozet.isyeri)],
              ["Uygunsuzluk", String(ozet.uygunsuz)],
              ["Son denetim", fmtDate(ozet.son.tarih)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-white/15 px-3 py-2.5 backdrop-blur-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">{k}</div>
                <div className="num mt-0.5 text-[17px] font-extrabold">{v}</div>
              </div>
            ))}
          </div>
        </Hero>
      ) : null}

      <Section label="Şablonlar">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {SABLONLAR.map((s) => {
            const Icon = SABLON_ICON[s.id] ?? ClipboardList;
            return (
              <Link
                key={s.id}
                href={`/app/denetim/yeni?sablon=${s.id}`}
                className="group flex flex-col rounded-xl2 border border-line/70 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: SABLON_COLOR[s.id] ?? "#3AA466" }}>
                  <Icon size={19} strokeWidth={2.3} />
                </span>
                <span className="mt-3 text-[14.5px] font-extrabold leading-tight text-navy">{s.ad}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
                  {s.maddeler.length} madde
                  <ChevronRight size={14} className="ml-auto text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-blue" />
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section label="Geçmiş denetimler" right={list.length ? <span className="text-[12.5px] font-semibold text-muted">{list.length} kayıt</span> : null}>
        {list.length === 0 ? (
          <Empty
            icon={ClipboardCheck}
            title="Saha denetimi yok"
            text="Saha denetimi yok. Şablon seçip kontrol listesini doldurun, PDF olarak paylaşın."
            action={
              <ButtonLink href="/app/denetim/yeni" icon={Plus}>
                Yeni Denetim
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {list.map((d) => {
              const tone = puanTone(d.puan);
              const c = sayim(d.cevaplar, sablonById(d.sablon).maddeler.length);
              return (
                <div
                  key={d.id}
                  className="flex items-center gap-1 rounded-xl2 border border-line/70 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-bar"
                >
                  <Link href={`/app/denetim/${d.id}`} className="flex min-w-0 flex-1 items-center gap-3.5 p-4">
                    <span className={cx("num flex h-12 w-14 shrink-0 items-center justify-center rounded-xl text-[17px] font-extrabold", tone.bg, tone.text)}>
                      %{d.puan}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-extrabold text-ink">{d.isyeri}</span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                        {sablonAdi(d.sablon)} · <span className="num">{fmtDate(d.tarih)}</span>
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        <span
                          className={cx(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-bold",
                            c.uygunsuz ? "bg-soft-danger text-danger" : "bg-soft-green text-success",
                          )}
                        >
                          {c.uygunsuz ? `${c.uygunsuz} uygunsuz` : "Uygunsuzluk yok"}
                        </span>
                        {c.cevapsiz ? (
                          <span className="inline-flex items-center rounded-full bg-paper px-2 py-0.5 text-[11.5px] font-bold text-muted">{c.cevapsiz} cevapsız</span>
                        ) : null}
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-muted" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => printDenetim(d, firma)}
                    title="PDF"
                    aria-label="PDF raporu"
                    className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-paper hover:text-brand-blue"
                  >
                    <Printer size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Fab label="Yeni Denetim" icon={Plus} href="/app/denetim/yeni" />
    </div>
  );
}
