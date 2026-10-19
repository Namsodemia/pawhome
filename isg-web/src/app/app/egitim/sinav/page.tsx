"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CirclePlay,
  CircleX,
  Clock,
  Flag,
  GraduationCap,
  RotateCcw,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button, ButtonLink, Card, Loading, PageHeader, ProgressBar, Segment } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/format";
import { LETTERS } from "@/lib/sinav";
import { kursBul, type Kurs, type Soru } from "@/data/egitim";
import { KursYok, dersHref, ilerleme, karistir, sertifikaHref, sikKaristir, useKayit } from "../shared";

function mmss(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function SinavPageView() {
  const sp = useSearchParams();
  const kurs = kursBul(sp.get("k"));
  const [run, setRun] = useState(0);

  if (!kurs) return <KursYok />;
  if (run === 0) return <Giris kurs={kurs} onStart={() => setRun(1)} />;
  return <Sinav key={run} kurs={kurs} onRetry={() => setRun((r) => r + 1)} onExit={() => setRun(0)} />;
}

// ---------------------------------------------------------------- giriş ekranı

function Giris({ kurs, onStart }: { kurs: Kurs; onStart: () => void }) {
  const kayit = useKayit(kurs.id);
  const il = ilerleme(kurs, kayit);
  const eksik = il.toplam - il.tamam;
  const basarili = !!kayit?.basarili_at;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div>
      <PageHeader title="Bitirme sınavı" subtitle={kurs.baslik} back="/app/egitim" />

      <div className="mx-auto max-w-3xl">
        {basarili ? (
          <Card className="mb-4 border-success/30 bg-soft-green/60">
            <div className="flex items-start gap-3">
              <CircleCheck size={22} className="mt-0.5 shrink-0 text-success" />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-extrabold text-navy">Bu eğitimi tamamladınız{kayit?.sinav_puan != null ? ` (%${kayit.sinav_puan})` : ""}</div>
                <div className="mt-0.5 text-[13px] leading-relaxed text-text">
                  Sınavı yeniden çözebilirsiniz. Belgenizdeki puan yalnızca daha yüksek bir puan alırsanız güncellenir.
                </div>
                <ButtonLink href={sertifikaHref(kurs.id)} kind="secondary" small icon={Award} className="mt-3">
                  Belgeyi görüntüle
                </ButtonLink>
              </div>
            </div>
          </Card>
        ) : eksik > 0 ? (
          <Card className="mb-4 border-[#F3DFA8] bg-soft-warn">
            <div className="flex items-start gap-3">
              <TriangleAlert size={22} className="mt-0.5 shrink-0 text-warn" />
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-extrabold text-navy">
                  {il.tamam === 0 ? "Henüz hiçbir dersi tamamlamadınız" : `${eksik} ders henüz tamamlanmadı`}
                </div>
                <div className="mt-0.5 text-[13px] leading-relaxed text-text">
                  Sınava şimdi de girebilirsiniz; ancak önce dersleri bitirmeniz başarı şansınızı artırır. Sorular {il.toplam} dersin tamamından gelir.
                </div>
                {il.siradaki ? (
                  <ButtonLink href={dersHref(kurs.id, il.siradaki.id)} kind="secondary" small icon={BookOpen} className="mt-3">
                    Sıradaki derse git
                  </ButtonLink>
                ) : null}
              </div>
            </div>
          </Card>
        ) : null}

        <Card padded={false} className="overflow-hidden">
          <div className="bg-brandSoft px-5 py-5 md:px-7">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-violet shadow-card">
                <GraduationCap size={24} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[18px] font-extrabold leading-snug text-navy md:text-[20px]">Bitirme sınavı</h2>
                <div className="text-[13px] text-muted">{kurs.baslik}</div>
              </div>
            </div>
          </div>
          <div className="px-5 py-5 md:px-7">
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "Soru", v: kurs.sinav.length },
                { l: "Geçme notu", v: kurs.gecme_notu },
                { l: "Süre sınırı", v: "Yok" },
              ].map((x) => (
                <div key={x.l} className="rounded-2xl border border-line/70 bg-paper/60 px-2 py-3 text-center">
                  <div className="num text-[19px] font-extrabold leading-none text-navy">{x.v}</div>
                  <div className="mt-1 text-[10.5px] font-bold uppercase tracking-wider text-muted">{x.l}</div>
                </div>
              ))}
            </div>
            <ul className="mt-5 space-y-2 text-[14px] leading-relaxed text-text">
              {[
                "Sorular ve şıklar her denemede karıştırılır.",
                "Sorular arasında serbestçe gezinebilirsiniz; boş bırakılan sorular yanlış sayılır.",
                `${kurs.gecme_notu} ve üzeri puan aldığınızda katılım belgeniz oluşturulur.`,
                "Kalırsanız yanlışlarınızı açıklamalarıyla görür, istediğiniz kadar yeniden deneyebilirsiniz.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <CircleCheck size={17} className="mt-[3px] shrink-0 text-brand-teal" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <Button icon={CirclePlay} onClick={onStart} className="mt-6 w-full sm:w-auto">
              Sınavı başlat
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- sınav

function hazirla(src: Soru[]): Soru[] {
  return karistir(src).map(sikKaristir);
}

function Sinav({ kurs, onRetry, onExit }: { kurs: Kurs; onRetry: () => void; onExit: () => void }) {
  const kaydet = useStore((s) => s.egitimSinav);
  const [qs] = useState<Soru[]>(() => hazirla(kurs.sinav));
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => kurs.sinav.map(() => null));
  const [sonuc, setSonuc] = useState<{ puan: number; dogru: number; gecti: boolean; kaydedildi: boolean; belgePuani: number | null } | null>(null);
  const [sec, setSec] = useState(0);
  const start = useRef(Date.now());
  const topRef = useRef<HTMLDivElement>(null);

  const n = qs.length;
  const answered = answers.filter((a) => a != null).length;

  useEffect(() => {
    if (sonuc) return;
    const t = setInterval(() => setSec(Math.floor((Date.now() - start.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [sonuc]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start" });
  }, [sonuc]);

  const go = useCallback((k: number) => setI(Math.max(0, Math.min(n - 1, k))), [n]);
  const choose = (j: number) =>
    setAnswers((p) => {
      const next = [...p];
      next[i] = j;
      return next;
    });

  function finish() {
    const dogru = answers.filter((a, k) => a === qs[k].dogru).length;
    const puan = Math.round((dogru * 100) / n);
    const gecti = puan >= kurs.gecme_notu;
    // Bir kez geçildiyse belgedeki puan yalnızca daha yüksek bir sonuçla güncellenir.
    const onceki = useStore.getState().egitimler.find((e) => e.kurs_id === kurs.id);
    const kaydedildi = !onceki?.basarili_at || puan >= (onceki.sinav_puan ?? 0);
    if (kaydedildi) kaydet(kurs.id, puan, gecti);
    setSec(Math.floor((Date.now() - start.current) / 1000));
    setSonuc({ puan, dogru, gecti, kaydedildi, belgePuani: kaydedildi ? null : (onceki?.sinav_puan ?? null) });
    if (gecti) toast(`Tebrikler! Bitirme sınavını %${puan} ile geçtiniz.`);
  }

  async function requestFinish() {
    const bos = answers.filter((a) => a == null).length;
    if (bos > 0) {
      const ok = await confirmDialog({
        title: "Sınavı bitir",
        text: `${bos} soru henüz cevaplanmadı. Boş sorular yanlış sayılır. Yine de bitirilsin mi?`,
        okLabel: "Bitir",
        cancelLabel: "Devam et",
      });
      if (!ok) return;
    }
    finish();
  }

  async function askExit() {
    if (!sonuc && answered > 0) {
      const ok = await confirmDialog({ title: "Sınavdan çık", text: "Yarım kalan sınav kaydedilmez. Çıkmak istiyor musunuz?", okLabel: "Çık", cancelLabel: "Devam et" });
      if (!ok) return;
    }
    onExit();
  }

  // ---------------------------------------------------------------- sonuç
  if (sonuc) {
    return (
      <div ref={topRef} className="scroll-mt-24">
        <PageHeader title="Sınav sonucu" subtitle={kurs.baslik} back="/app/egitim" />
        <Sonuc kurs={kurs} qs={qs} answers={answers} sonuc={sonuc} sec={sec} onRetry={onRetry} />
      </div>
    );
  }

  // ---------------------------------------------------------------- soru ekranı
  const q = qs[i];
  const chosen = answers[i];
  const last = i === n - 1;

  return (
    <div ref={topRef} className="scroll-mt-24">
      <PageHeader
        title="Bitirme sınavı"
        subtitle={kurs.baslik}
        actions={
          <Button kind="ghost" small icon={X} onClick={() => void askExit()}>
            Sınavdan çık
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_288px]">
        <div className="min-w-0">
          <Card padded={false} className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 pb-2.5 pt-4 text-[12.5px] font-bold text-muted md:px-6">
              <span className="text-navy">
                Soru <span className="num">{i + 1}</span> / <span className="num">{n}</span>
              </span>
              <span>
                <span className="num">{answered}</span> cevaplandı
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={13} />
                <span className="num">{mmss(sec)}</span>
              </span>
            </div>
            <div className="h-1 w-full bg-line">
              <div className="h-full bg-orange transition-all duration-300" style={{ width: `${Math.round(((i + 1) / n) * 100)}%` }} />
            </div>

            <div className="px-4 py-5 md:px-6 md:py-6">
              <div className="text-[16.5px] font-bold leading-relaxed text-navy md:text-[18px]">{q.soru}</div>
              <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="Şıklar">
                {q.secenekler.map((c, j) => {
                  const on = chosen === j;
                  return (
                    <button
                      key={j}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => choose(j)}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition",
                        on ? "border-brand-teal bg-brand-teal text-white shadow-fab" : "border-line bg-white text-text hover:border-brand-teal/40 hover:bg-[#F3FAF9]",
                      )}
                    >
                      <span
                        className={cx(
                          "num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold",
                          on ? "bg-white text-brand-teal" : "bg-[#E1F2F3] text-brand-teal",
                        )}
                      >
                        {LETTERS[j]}
                      </span>
                      <span className="flex-1 text-[14.5px] leading-snug">{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-line bg-paper/60 px-4 py-3 md:px-6">
              <Button kind="ghost" small icon={ChevronLeft} onClick={() => go(i - 1)} disabled={i === 0}>
                Önceki
              </Button>
              <div className="flex-1" />
              {!last ? (
                <Button small onClick={() => go(i + 1)}>
                  Sonraki <ChevronRight size={16} strokeWidth={2.4} />
                </Button>
              ) : (
                <Button kind="orange" small icon={CheckCheck} onClick={() => void requestFinish()}>
                  Bitir
                </Button>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-extrabold text-navy">Soru haritası</div>
              <span className="num text-[12px] font-bold text-muted">
                {answered}/{n}
              </span>
            </div>
            <ProgressBar value={(answered * 100) / n} className="mt-2" />
            <div className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-5">
              {qs.map((_, k) => {
                const cur = k === i;
                const done = answers[k] != null;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => go(k)}
                    aria-label={`Soru ${k + 1}${done ? " (cevaplandı)" : ""}`}
                    className={cx(
                      "num flex aspect-square items-center justify-center rounded-lg text-[12px] font-bold transition",
                      done ? "bg-brand-teal text-white" : "bg-paper text-muted hover:bg-soft-blue hover:text-brand-blue",
                      cur && "ring-2 ring-orange ring-offset-1",
                    )}
                  >
                    {k + 1}
                  </button>
                );
              })}
            </div>
          </Card>
          <Button kind="dark" block small icon={Flag} onClick={() => void requestFinish()}>
            Sınavı bitir
          </Button>
          <div className="text-center text-[11.5px] text-muted">Geçme notu {kurs.gecme_notu} · boş sorular yanlış sayılır</div>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- sonuç ekranı

const YONLENDIRME_SN = 6;

function Sonuc({
  kurs,
  qs,
  answers,
  sonuc,
  sec,
  onRetry,
}: {
  kurs: Kurs;
  qs: Soru[];
  answers: (number | null)[];
  sonuc: { puan: number; dogru: number; gecti: boolean; kaydedildi: boolean; belgePuani: number | null };
  sec: number;
  onRetry: () => void;
}) {
  const router = useRouter();
  const n = qs.length;
  const bos = answers.filter((a) => a == null).length;
  const yanlis = n - sonuc.dogru - bos;
  const belgeUrl = `${sertifikaHref(kurs.id)}&yeni=1`;

  // Geçince katılım belgesine yönlendir (iptal edilebilir geri sayım)
  const [kalan, setKalan] = useState<number | null>(sonuc.gecti ? YONLENDIRME_SN : null);
  useEffect(() => {
    if (kalan == null) return;
    if (kalan <= 0) {
      router.push(belgeUrl);
      return;
    }
    const t = setTimeout(() => setKalan((k) => (k == null ? null : k - 1)), 1000);
    return () => clearTimeout(t);
  }, [kalan, router, belgeUrl]);

  // Geçemeyince yanlışlar varsayılan olarak açık; geçince "incele" ile açılır
  const [incele, setIncele] = useState(!sonuc.gecti);
  const [filtre, setFiltre] = useState<"hata" | "hepsi">("hata");
  const dersAd = (id?: string) => kurs.dersler.find((d) => d.id === id);
  const liste = qs.map((q, k) => ({ q, k })).filter(({ q, k }) => filtre === "hepsi" || answers[k] !== q.dogru);

  return (
    <div className="mx-auto max-w-3xl">
      <div
        className={cx(
          "relative overflow-hidden rounded-xl3 p-6 text-center text-white shadow-fab md:p-8",
          sonuc.gecti ? "bg-[linear-gradient(135deg,#3AA466_0%,#0B6F7B_100%)]" : "bg-[linear-gradient(135deg,#F4772E_0%,#C0561A_100%)]",
        )}
      >
        <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/85">Bitirme sınavı sonucu</div>
        <div className="num mt-1 text-[56px] font-extrabold leading-none tracking-tight md:text-[68px]">%{sonuc.puan}</div>
        <div className="mt-2 text-[15px] font-semibold">
          {sonuc.dogru} / {n} doğru · {Math.floor(sec / 60)} dk {sec % 60} sn
        </div>
        <div className="mt-1 text-[14px] font-bold text-white/95">
          {sonuc.gecti ? `Başarılı — geçme notu ${kurs.gecme_notu}` : `Geçme notu ${kurs.gecme_notu}; yanlışlarınızı inceleyip tekrar deneyin`}
        </div>
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2">
          {[
            { l: "Doğru", v: sonuc.dogru },
            { l: "Yanlış", v: yanlis },
            { l: "Boş", v: bos },
          ].map((x) => (
            <div key={x.l} className="rounded-2xl bg-white/15 px-2 py-2.5 backdrop-blur-sm">
              <div className="num text-[20px] font-extrabold leading-none">{x.v}</div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-white/85">{x.l}</div>
            </div>
          ))}
        </div>
      </div>

      {!sonuc.kaydedildi && sonuc.belgePuani != null ? (
        <div className="mt-3 rounded-2xl bg-paper px-4 py-2.5 text-center text-[12.5px] text-muted">
          Daha önce %{sonuc.belgePuani} ile geçtiğiniz için belgenizdeki puan korunur.
        </div>
      ) : null}

      {sonuc.gecti ? (
        <Card className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-extrabold text-navy">Katılım belgeniz hazır</div>
              <div className="mt-0.5 text-[13px] text-muted">
                {kalan != null ? (
                  <>
                    Belgenize yönlendiriliyorsunuz… <span className="num font-bold text-navy">{kalan}</span>
                  </>
                ) : (
                  "Belgenizi istediğiniz zaman Eğitimler sayfasından açabilirsiniz."
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={belgeUrl} small icon={Award}>
                Belgeyi görüntüle
              </ButtonLink>
              {kalan != null || !incele ? (
                <Button
                  kind="ghost"
                  small
                  onClick={() => {
                    setKalan(null);
                    setIncele(true);
                  }}
                >
                  Cevapları incele
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button kind={sonuc.gecti ? "secondary" : "primary"} small icon={RotateCcw} onClick={onRetry}>
          {sonuc.gecti ? "Sınavı yeniden çöz" : "Tekrar dene"}
        </Button>
        <ButtonLink href="/app/egitim" kind="ghost" small icon={BookOpen}>
          Derslere dön
        </ButtonLink>
      </div>

      {incele ? (
        <div className="mt-6">
          <Segment
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: "hata", label: `Yanlış ve boş (${n - sonuc.dogru})` },
              { value: "hepsi", label: `Tümü (${n})` },
            ]}
            className="max-w-md"
          />
          <div className="mt-3 space-y-3">
            {liste.length === 0 ? <Card className="text-center text-[14px] font-semibold text-success">Tüm soruları doğru cevapladınız. Tebrikler!</Card> : null}
            {liste.map(({ q, k }) => {
              const a = answers[k];
              const ok = a === q.dogru;
              const d = dersAd(q.ders);
              return (
                <Card key={k} className={cx("border-l-4", ok ? "border-l-success" : a == null ? "border-l-[#C9D2DB]" : "border-l-danger")}>
                  <div className="flex items-start gap-2">
                    <span className="num mt-0.5 shrink-0 text-[13px] font-bold text-muted">{k + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14.5px] font-bold leading-snug text-navy">{q.soru}</div>
                      <div className="mt-2 space-y-1">
                        {q.secenekler.map((c, j) => {
                          const isRight = j === q.dogru;
                          const isWrongPick = j === a && !isRight;
                          return (
                            <div
                              key={j}
                              className={cx(
                                "flex items-start gap-2 rounded-xl px-2.5 py-1.5 text-[13.5px]",
                                isRight ? "bg-soft-green font-bold text-success" : isWrongPick ? "bg-soft-danger text-danger line-through" : "text-text",
                              )}
                            >
                              <span className="num w-4 shrink-0 font-bold">{LETTERS[j]})</span>
                              <span className="flex-1">{c}</span>
                              {isRight ? <CircleCheck size={16} className="mt-0.5 shrink-0" /> : isWrongPick ? <CircleX size={16} className="mt-0.5 shrink-0" /> : null}
                            </div>
                          );
                        })}
                      </div>
                      {a == null ? <div className="mt-2 text-[12.5px] font-semibold text-muted">Boş bırakıldı</div> : null}
                      <div className="mt-2.5 rounded-xl bg-paper px-3 py-2.5 text-[13px] leading-relaxed text-text">
                        <span className="font-bold text-navy">Açıklama: </span>
                        {q.aciklama}
                      </div>
                      {d && !ok ? (
                        <Link href={dersHref(kurs.id, d.id)} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-bold text-brand-blue hover:underline">
                          <BookOpen size={13} /> İlgili ders: {d.baslik}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function EgitimSinavPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SinavPageView />
    </Suspense>
  );
}
