"use client";

import Link from "next/link";
import { Award, BookOpenCheck, ChevronRight, CircleCheck, CirclePlay, Clock, GraduationCap, Info, Lock, RotateCcw, Users } from "lucide-react";
import { Badge, ButtonLink, Card, Hero, HeroKicker, PageHeader, ProgressBar, Section, Stat } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/format";
import { KURSLAR, type Kurs } from "@/data/egitim";
import type { EgitimKayit } from "@/lib/types";
import { dakikaMetni, dersHref, ilerleme, sertifikaHref, sinavHref, useKayit } from "./shared";

export default function EgitimPage() {
  return (
    <div>
      <PageHeader title="Eğitimler" subtitle="Çevrim içi iş sağlığı ve güvenliği eğitimleri · dersler, bitirme sınavı ve katılım belgesi" />
      {KURSLAR.map((k) => (
        <KursBlok key={k.id} kurs={k} />
      ))}
    </div>
  );
}

function KursBlok({ kurs }: { kurs: Kurs }) {
  const kayit = useKayit(kurs.id);
  const sifirla = useStore((s) => s.egitimSifirla);
  const il = ilerleme(kurs, kayit);
  const basarili = !!kayit?.basarili_at;
  const puan = kayit?.sinav_puan ?? null;

  async function reset() {
    const ok = await confirmDialog({
      title: "İlerlemeyi sıfırla",
      text: "Bu eğitimdeki tamamlanan dersler, sınav puanı ve katılım belgesi silinecek. Bu işlem geri alınamaz.",
      okLabel: "Sıfırla",
      danger: true,
    });
    if (!ok) return;
    sifirla(kurs.id);
    toast("Eğitim ilerlemesi sıfırlandı.");
  }

  return (
    <div className="mb-8">
      <Hero>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <HeroKicker>Hazır eğitim · {kurs.dersler.length} ders</HeroKicker>
              {basarili ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-extrabold">
                  <CircleCheck size={13} /> Tamamlandı
                </span>
              ) : null}
            </div>
            <h2 className="mt-2 text-[21px] font-extrabold leading-tight md:text-[26px]">{kurs.baslik}</h2>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-white/85">{kurs.aciklama}</p>
            <ProgressBar value={il.pct} tone="white" track="bg-white/20" className="mt-4 max-w-md" />
            <div className="num mt-2 text-[12px] text-white/85">
              {il.tamam}/{il.toplam} ders tamamlandı · bitirme sınavı {puan != null ? `%${puan}` : "henüz çözülmedi"}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <AnaEylem kurs={kurs} kayit={kayit} />
              {!basarili && il.tamam < il.toplam ? (
                <ButtonLink href={sinavHref(kurs.id)} kind="dark" small icon={GraduationCap} className="border border-white/25">
                  Bitirme sınavı
                </ButtonLink>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 md:w-[300px]">
            {[
              { l: "Süre", v: `${kurs.sure_saat} sa` },
              { l: "Ders", v: kurs.dersler.length },
              { l: "Puan", v: puan != null ? `%${puan}` : "—" },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-white/15 px-3 py-2.5 text-center backdrop-blur-sm">
                <div className="num text-[20px] font-extrabold leading-none">{x.v}</div>
                <div className="mt-1 text-[10.5px] font-bold uppercase tracking-wider text-white/80">{x.l}</div>
              </div>
            ))}
          </div>
        </div>
      </Hero>

      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Section label="Dersler" right={<span className="num text-[12px] font-bold text-muted">{il.tamam}/{il.toplam}</span>}>
          <div className="space-y-2">
            {kurs.dersler.map((d, i) => {
              const ok = il.bitti(d.id);
              const sirada = !basarili && il.siradaki?.id === d.id;
              return (
                <Link
                  key={d.id}
                  href={dersHref(kurs.id, d.id)}
                  className={cx(
                    "group flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar md:p-3.5",
                    sirada ? "border-brand-blue/40" : "border-line/70",
                  )}
                >
                  <span
                    className={cx(
                      "num flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold",
                      ok ? "bg-soft-green text-success" : "bg-[#FDF0E4] text-[#C0661A]",
                    )}
                  >
                    {ok ? <CircleCheck size={20} strokeWidth={2.4} /> : String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[14px] font-bold leading-snug text-navy group-hover:text-brand-blue">{d.baslik}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {dakikaMetni(d.sure_dk)}
                      </span>
                      <span>· {d.sorular.length} pekiştirme sorusu</span>
                      {ok ? <span className="font-bold text-success">· Tamamlandı</span> : null}
                    </span>
                  </span>
                  {sirada ? (
                    <Badge tone="blue" className="shrink-0">
                      Sıradaki
                    </Badge>
                  ) : (
                    <ChevronRight size={18} className="shrink-0 text-[#B4BFC5]" />
                  )}
                </Link>
              );
            })}

            {/* Bitirme sınavı ve belge */}
            <Link
              href={sinavHref(kurs.id)}
              className="group flex items-center gap-3 rounded-2xl border border-line/70 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar md:p-3.5"
            >
              <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", basarili ? "bg-soft-green text-success" : "bg-soft-violet text-violet")}>
                <GraduationCap size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold leading-snug text-navy group-hover:text-brand-blue">Bitirme sınavı</span>
                <span className="mt-0.5 block text-[12px] text-muted">
                  {kurs.sinav.length} soru · geçme notu {kurs.gecme_notu}
                  {puan != null ? ` · son kayıtlı puan %${puan}` : ""}
                </span>
              </span>
              {puan != null ? (
                <span className={cx("num shrink-0 text-[15px] font-extrabold", puan >= kurs.gecme_notu ? "text-success" : "text-warn")}>%{puan}</span>
              ) : (
                <ChevronRight size={18} className="shrink-0 text-[#B4BFC5]" />
              )}
            </Link>
            {basarili ? (
              <Link
                href={sertifikaHref(kurs.id)}
                className="group flex items-center gap-3 rounded-2xl border border-line/70 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar md:p-3.5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soft-orange text-orange">
                  <Award size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold leading-snug text-navy group-hover:text-brand-blue">Eğitim katılım belgesi</span>
                  <span className="num mt-0.5 block truncate text-[12px] text-muted">{kayit?.sertifika_no || "Belge hazır"}</span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-[#B4BFC5]" />
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-white/60 p-3 md:p-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paper text-muted">
                  <Lock size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold leading-snug text-muted">Eğitim katılım belgesi</span>
                  <span className="mt-0.5 block text-[12px] text-muted">Bitirme sınavından en az {kurs.gecme_notu} puan aldığınızda açılır.</span>
                </span>
              </div>
            )}
          </div>
        </Section>

        <div>
          <Section label="Durum">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Ders" value={`${il.tamam}/${il.toplam}`} tone="navy" />
              <Stat label="Sınav" value={puan != null ? `%${puan}` : "—"} tone={puan == null ? "gray" : puan >= kurs.gecme_notu ? "green" : "warn"} />
              <Stat label="Belge" value={basarili ? "Hazır" : "—"} tone={basarili ? "green" : "gray"} />
            </div>
            {kayit ? (
              <button
                type="button"
                onClick={() => void reset()}
                className="mt-3 inline-flex items-center gap-1.5 px-1 text-[12.5px] font-bold text-muted transition hover:text-danger"
              >
                <RotateCcw size={14} /> İlerlemeyi sıfırla
              </button>
            ) : null}
          </Section>

          <Section label="Eğitim hakkında">
            <Card>
              <ul className="space-y-3 text-[13px]">
                <li className="flex items-start gap-2.5">
                  <Users size={16} className="mt-0.5 shrink-0 text-brand-blue" />
                  <span>
                    <span className="block font-bold text-navy">Kimler için?</span>
                    <span className="text-muted">{kurs.hedef_kitle}</span>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Clock size={16} className="mt-0.5 shrink-0 text-brand-blue" />
                  <span>
                    <span className="block font-bold text-navy">Süre</span>
                    <span className="text-muted">Yaklaşık {kurs.sure_saat} saat; kendi hızınızda, istediğiniz zaman ara verebilirsiniz.</span>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <BookOpenCheck size={16} className="mt-0.5 shrink-0 text-brand-blue" />
                  <span>
                    <span className="block font-bold text-navy">İşleyiş</span>
                    <span className="text-muted">
                      {kurs.dersler.length} ders ve pekiştirme soruları, ardından {kurs.sinav.length} soruluk bitirme sınavı. {kurs.gecme_notu} ve üzeri puanla katılım belgesi oluşturulur.
                    </span>
                  </span>
                </li>
              </ul>
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-paper px-3 py-2.5 text-[12px] leading-relaxed text-muted">
                <Info size={14} className="mt-0.5 shrink-0 text-brand-blue" />
                <span>
                  Konular, Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik&apos;teki başlıkları izler. Bu modül resmî temel eğitimin yerine geçmez; işverenin yaptıracağı eğitime destek amaçlıdır.
                </span>
              </div>
            </Card>
          </Section>
        </div>
      </div>
    </div>
  );
}

function AnaEylem({ kurs, kayit }: { kurs: Kurs; kayit: EgitimKayit | undefined }) {
  const il = ilerleme(kurs, kayit);
  if (kayit?.basarili_at) {
    return (
      <ButtonLink href={sertifikaHref(kurs.id)} kind="white" small icon={Award}>
        Sertifikayı gör
      </ButtonLink>
    );
  }
  if (!il.siradaki) {
    return (
      <ButtonLink href={sinavHref(kurs.id)} kind="white" small icon={GraduationCap}>
        Bitirme sınavına gir
      </ButtonLink>
    );
  }
  return (
    <ButtonLink href={dersHref(kurs.id, il.siradaki.id)} kind="white" small icon={CirclePlay}>
      {il.tamam > 0 ? "Devam et" : "Başla"}
    </ButtonLink>
  );
}

