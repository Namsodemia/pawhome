"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Award, BookOpen, CircleCheck, GraduationCap, Info, Lock, Printer, UserRound } from "lucide-react";
import { Button, ButtonLink, Card, Empty, Loading, PageHeader } from "@/components/ui";
import { useProfil } from "@/lib/roles";
import { useSync } from "@/lib/sync";
import { kursBul, type Kurs } from "@/data/egitim";
import type { EgitimKayit } from "@/lib/types";
import { KursYok, sinavHref, useKayit } from "../shared";

/**
 * Yazdırırken yalnızca belge görünsün: belgeyi içermeyen her öğe gizlenir, belgeye giden kabuk
 * öğelerinin boşlukları sıfırlanır. (:has desteklemeyen eski tarayıcılarda kabuğun kendi
 * .no-print kuralları ve bu sayfadaki .no-print sınıfları yine menüleri gizler.)
 */
const PRINT_CSS = `
@media print {
  @page { size: A4 portrait; margin: 10mm; }
  html, body { background: #fff !important; }
}
@media print {
  body *:not(:has(#egitim-belge)):not(#egitim-belge):not(#egitim-belge *) { display: none !important; }
}
@media print {
  body *:has(#egitim-belge) {
    margin: 0 !important; padding: 0 !important; max-width: none !important; min-height: 0 !important;
    background: none !important; box-shadow: none !important; border: 0 !important;
    animation: none !important; transform: none !important; position: static !important;
  }
}
@media print {
  #egitim-belge {
    margin: 0 auto !important; width: 100% !important; max-width: none !important; box-shadow: none !important;
    break-inside: avoid; page-break-inside: avoid;
  }
  #egitim-belge, #egitim-belge * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

const NOT =
  "Bu belge İsgora çevrim içi eğitim modülünün tamamlandığını gösterir; resmî temel İSG eğitimi yerine geçmez, işverenin yaptıracağı eğitime destek amaçlıdır.";

function trTarih(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function SertifikaPageView() {
  const sp = useSearchParams();
  const kurs = kursBul(sp.get("k"));
  const yeni = sp.get("yeni") === "1";
  const kayit = useKayit(kurs?.id);
  const profil = useProfil();
  const syncAd = useSync((s) => s.ad);
  const syncUser = useSync((s) => s.user);
  // Eski hesaplarda ad soyad boş olabilir: giriş adına düş
  const ad = (profil.ad_soyad || syncAd || syncUser || "").trim();
  const kurum = (profil.kurum || "").trim();

  if (!kurs) return <KursYok />;

  if (!kayit?.basarili_at) {
    return (
      <div>
        <PageHeader title="Katılım belgesi" subtitle={kurs.baslik} back="/app/egitim" />
        <Empty
          icon={Lock}
          title="Belge henüz hazır değil"
          text={`Eğitim katılım belgesi, bitirme sınavından en az ${kurs.gecme_notu} puan aldığınızda oluşturulur.${
            kayit?.sinav_puan != null ? ` Son kayıtlı puanınız: %${kayit.sinav_puan}.` : ""
          }`}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href={sinavHref(kurs.id)} small icon={GraduationCap}>
                Bitirme sınavına git
              </ButtonLink>
              <ButtonLink href="/app/egitim" kind="ghost" small icon={BookOpen}>
                Derslere dön
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="no-print">
        <PageHeader
          title="Katılım belgesi"
          subtitle={kurs.baslik}
          back="/app/egitim"
          actions={
            <Button icon={Printer} onClick={() => window.print()}>
              Yazdır / PDF olarak kaydet
            </Button>
          }
        />

        {yeni ? (
          <Card className="mb-4 border-success/30 bg-soft-green/60">
            <div className="flex items-start gap-3">
              <CircleCheck size={22} className="mt-0.5 shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-extrabold text-navy">Tebrikler! Eğitimi başarıyla tamamladınız.</div>
                <div className="mt-0.5 text-[13px] leading-relaxed text-text">
                  Belgenizi yazdırabilir ya da yazdırma penceresinde hedef olarak “PDF olarak kaydet”i seçerek dosya hâline getirebilirsiniz.
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {!ad ? (
          <Card className="mb-4 border-[#F3DFA8] bg-soft-warn">
            <div className="flex items-start gap-3">
              <UserRound size={20} className="mt-0.5 shrink-0 text-warn" />
              <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-text">
                Belgede adınız görünmüyor. Ad soyadınızı{" "}
                <Link href="/app/ayarlar" className="font-bold text-brand-blue hover:underline">
                  Ayarlar › Profil ve Rol
                </Link>{" "}
                bölümünden ekleyebilirsiniz; o zamana kadar ad alanı elle doldurulmak üzere boş bırakılır.
              </div>
            </div>
          </Card>
        ) : null}
      </div>

      <Belge kurs={kurs} kayit={kayit} ad={ad} kurum={kurum} />

      <div className="no-print mx-auto mt-4 flex max-w-[820px] items-start gap-2 px-1 text-[12px] leading-relaxed text-muted">
        <Info size={14} className="mt-0.5 shrink-0 text-brand-blue" />
        <span>Yazdırırken yalnızca belge basılır; menüler ve uygulama kabuğu gizlenir. En iyi sonuç için A4 dikey sayfa düzenini seçin.</span>
      </div>
    </div>
  );
}

function Belge({ kurs, kayit, ad, kurum }: { kurs: Kurs; kayit: EgitimKayit; ad: string; kurum: string }) {
  const tarih = trTarih(kayit.basarili_at ?? "");
  const puan = kayit.sinav_puan;
  const no = kayit.sertifika_no || "—";

  return (
    <div id="egitim-belge" className="mx-auto w-full max-w-[820px] overflow-hidden rounded-xl2 border border-line/70 bg-white shadow-card print:rounded-none print:border-0 print:shadow-none">
      <div className="h-2 bg-brand" aria-hidden />
      <div className="relative px-5 py-7 sm:px-10 sm:py-9">
        <div className="pointer-events-none absolute inset-2.5 rounded-[18px] border border-[#D7E7EE] sm:inset-4" aria-hidden />

        <div className="relative">
          {/* Üst satır */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-horizontal.png" alt="İsgora" className="h-9 w-auto sm:h-11" draggable={false} />
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Belge no</div>
              <div className="num text-[12.5px] font-bold text-navy">{no}</div>
            </div>
          </div>

          {/* Başlık */}
          <div className="mt-7 text-center sm:mt-8">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-teal">Çevrim içi eğitim</div>
            <h2 className="mt-2 text-[21px] font-extrabold uppercase leading-tight tracking-[0.04em] text-navy sm:text-[30px]">Eğitim Katılım Belgesi</h2>
            <div className="mx-auto mt-3 h-[3px] w-16 rounded-full bg-brand" aria-hidden />

            <div className="mt-7 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Katılımcı</div>
            {ad ? (
              <div className="mt-1 break-words text-[25px] font-extrabold leading-tight text-navy sm:text-[33px]">{ad}</div>
            ) : (
              <div className="mx-auto mt-6 h-px w-64 max-w-full border-b border-dashed border-navy/40" aria-label="Ad soyad (boş)" />
            )}
            {kurum ? <div className="mt-1.5 break-words text-[14px] font-semibold text-muted">{kurum}</div> : null}

            <p className="mx-auto mt-5 max-w-[580px] text-[14.5px] leading-relaxed text-text sm:text-[15.5px]">
              <b className="text-navy">“{kurs.baslik}”</b> çevrim içi eğitim modülünü tamamlamış ve bitirme sınavından 100 üzerinden{" "}
              <b className="num text-navy">{puan ?? "—"}</b> puan alarak başarılı olmuştur.
            </p>
          </div>

          {/* Bilgiler */}
          <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { l: "Eğitim süresi", v: `${kurs.sure_saat} saat` },
              { l: "Tamamlanma tarihi", v: tarih },
              { l: "Sınav puanı", v: puan != null ? `${puan} / 100` : "—" },
              { l: "Geçme notu", v: String(kurs.gecme_notu) },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl border border-line bg-paper/60 px-3 py-2.5 text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{x.l}</div>
                <div className="num mt-0.5 text-[13.5px] font-extrabold text-navy">{x.v}</div>
              </div>
            ))}
          </div>

          {/* Konular */}
          <div className="mt-6">
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-navy">
              <span className="inline-block h-[3px] w-4 rounded-full bg-brand" aria-hidden />
              Eğitim konuları
            </div>
            <ol className="mt-2.5 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
              {kurs.dersler.map((d, i) => (
                <li key={d.id} className="flex items-start gap-2 text-[12.5px] leading-snug text-text">
                  <span className="num mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-soft-green text-[10px] font-bold text-success">{i + 1}</span>
                  <span className="min-w-0 flex-1">{d.baslik}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Not */}
          <div className="mt-6 rounded-xl bg-paper px-3.5 py-2.5 text-[11.5px] italic leading-relaxed text-muted">{NOT}</div>

          {/* Alt satır */}
          <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4 text-[11.5px] text-muted">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-orange" />
              <span>
                Düzenleyen: <b className="text-navy">İsgora</b> çevrim içi eğitim modülü
              </span>
            </div>
            <div className="num">{tarih}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EgitimSertifikaPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SertifikaPageView />
    </Suspense>
  );
}
