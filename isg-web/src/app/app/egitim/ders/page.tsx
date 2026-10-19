"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, BookOpen, CheckCheck, ChevronLeft, ChevronRight, CircleCheck, CircleX, Clock, GraduationCap, Lightbulb, ListChecks } from "lucide-react";
import { Badge, Button, ButtonLink, Card, Empty, Loading, PageHeader, ProgressBar } from "@/components/ui";
import { toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/format";
import { LETTERS } from "@/lib/sinav";
import { kursBul, type Ders, type Soru } from "@/data/egitim";
import { KursYok, dakikaMetni, dersHref, ilerleme, sikKaristir, sinavHref, useKayit } from "../shared";

function DersPageView() {
  const sp = useSearchParams();
  const kurs = kursBul(sp.get("k"));
  const dersId = sp.get("d") ?? "";
  const kayit = useKayit(kurs?.id);
  const tamamla = useStore((s) => s.egitimDersTamam);
  const router = useRouter();

  // Ders değişince sayfanın başına dön
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [dersId]);

  if (!kurs) return <KursYok />;

  const idx = kurs.dersler.findIndex((d) => d.id === dersId);
  const ders = idx >= 0 ? kurs.dersler[idx] : undefined;
  if (!ders) {
    return (
      <div>
        <PageHeader title="Ders bulunamadı" back="/app/egitim" />
        <Empty
          icon={BookOpen}
          title="Ders bulunamadı"
          text="Bu bağlantıya ait bir ders yok."
          action={
            <ButtonLink href="/app/egitim" small>
              Derslere dön
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const prev = idx > 0 ? kurs.dersler[idx - 1] : undefined;
  const next = idx < kurs.dersler.length - 1 ? kurs.dersler[idx + 1] : undefined;
  const il = ilerleme(kurs, kayit);
  const done = il.bitti(ders.id);
  const nextHref = next ? dersHref(kurs.id, next.id) : sinavHref(kurs.id);

  function complete() {
    if (!kurs || !ders) return;
    if (!done) {
      tamamla(kurs.id, ders.id);
      toast(next ? "Ders tamamlandı. Sıradaki derse geçiliyor." : "Tüm dersler tamamlandı. Bitirme sınavına geçebilirsiniz.");
    }
    router.push(nextHref);
  }

  return (
    <div>
      <PageHeader
        title={`Ders ${idx + 1}`}
        subtitle={kurs.baslik}
        back="/app/egitim"
        actions={
          done ? (
            <Badge tone="green">
              <CircleCheck size={13} /> Tamamlandı
            </Badge>
          ) : (
            <Badge tone="gray">
              <span className="num">
                {idx + 1}/{kurs.dersler.length}
              </span>
            </Badge>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0">
          <DersIcerik key={ders.id} ders={ders} sira={idx + 1} />

          {/* Tamamlama */}
          <Card className="mt-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold text-navy">{done ? "Bu dersi tamamladınız" : "Dersi bitirdiniz mi?"}</div>
                <div className="mt-0.5 text-[13px] leading-relaxed text-muted">
                  {done
                    ? next
                      ? `Sıradaki ders: ${next.baslik}`
                      : "Tüm dersleri bitirdiyseniz bitirme sınavına geçebilirsiniz."
                    : next
                      ? "Dersi tamamlandı olarak işaretleyip sıradaki derse geçin."
                      : "Bu son ders. Tamamladıktan sonra bitirme sınavına geçebilirsiniz."}
                </div>
              </div>
              <Button icon={done ? ArrowRight : CheckCheck} onClick={complete} className="w-full sm:w-auto">
                {done ? (next ? "Sonraki derse geç" : "Bitirme sınavına geç") : next ? "Dersi tamamla ve sonrakine geç" : "Dersi tamamla ve sınava geç"}
              </Button>
            </div>
          </Card>

          {/* Önceki / sonraki */}
          <div className="mt-4 flex items-center justify-between gap-2">
            {prev ? (
              <Link
                href={dersHref(kurs.id, prev.id)}
                className="inline-flex min-w-0 max-w-[45%] items-center gap-1 text-[13px] font-bold text-muted hover:text-brand-blue"
                title={prev.baslik}
              >
                <ChevronLeft size={16} className="shrink-0" />
                <span className="truncate">Ders {idx}</span>
              </Link>
            ) : (
              <span />
            )}
            <ButtonLink href="/app/egitim" kind="ghost" small>
              Tüm dersler
            </ButtonLink>
            {next ? (
              <Link
                href={dersHref(kurs.id, next.id)}
                className="inline-flex min-w-0 max-w-[45%] items-center justify-end gap-1 text-[13px] font-bold text-muted hover:text-brand-blue"
                title={next.baslik}
              >
                <span className="truncate">Ders {idx + 2}</span>
                <ChevronRight size={16} className="shrink-0" />
              </Link>
            ) : (
              <Link href={sinavHref(kurs.id)} className="inline-flex items-center gap-1 text-[13px] font-bold text-muted hover:text-brand-blue">
                <span className="truncate">Sınav</span>
                <ChevronRight size={16} className="shrink-0" />
              </Link>
            )}
          </div>
        </div>

        {/* Kenar: ilerleme ve ders listesi (masaüstü) */}
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <Card>
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-extrabold text-navy">İlerleme</div>
              <span className="num text-[12px] font-bold text-muted">
                {il.tamam}/{il.toplam}
              </span>
            </div>
            <ProgressBar value={il.pct} className="mt-2" />
            <nav className="-mx-2 mt-3 space-y-0.5">
              {kurs.dersler.map((d, i) => {
                const cur = d.id === ders.id;
                const ok = il.bitti(d.id);
                return (
                  <Link
                    key={d.id}
                    href={dersHref(kurs.id, d.id)}
                    aria-current={cur ? "page" : undefined}
                    className={cx(
                      "flex items-start gap-2 rounded-xl px-2 py-1.5 text-[12.5px] leading-snug transition",
                      cur ? "bg-soft-blue font-bold text-brand-blue" : "text-text hover:bg-paper",
                    )}
                  >
                    <span className={cx("num mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold", ok ? "bg-soft-green text-success" : "bg-paper text-muted")}>
                      {ok ? <CircleCheck size={13} /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">{d.baslik}</span>
                  </Link>
                );
              })}
            </nav>
          </Card>
          <ButtonLink href={sinavHref(kurs.id)} kind="dark" small block icon={GraduationCap} className="mt-3">
            Bitirme sınavı
          </ButtonLink>
        </aside>
      </div>
    </div>
  );
}

function DersIcerik({ ders, sira }: { ders: Ders; sira: number }) {
  return (
    <article>
      <Card padded={false} className="overflow-hidden">
        <header className="bg-brandSoft px-5 py-5 md:px-8 md:py-6">
          <div className="flex items-start gap-3">
            <span className="num flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[16px] font-extrabold text-[#C0661A] shadow-card">
              {String(sira).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h2 className="text-[19px] font-extrabold leading-snug text-navy md:text-[23px]">{ders.baslik}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-semibold text-muted">
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} /> {dakikaMetni(ders.sure_dk)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ListChecks size={13} /> {ders.sorular.length} pekiştirme sorusu
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-5 py-6 md:px-8 md:py-8">
          <p className="border-l-[3px] border-brand-green pl-3.5 text-[15.5px] font-semibold leading-relaxed text-navy md:text-[16.5px]">{ders.ozet}</p>

          {ders.bolumler.map((b, i) => (
            <section key={i} className="mt-8">
              <h3 className="text-[17px] font-extrabold leading-snug text-navy md:text-[19px]">{b.baslik}</h3>
              {b.metin.map((p, j) => (
                <p key={j} className="mt-3 text-[15px] leading-[1.75] text-text md:text-[16px]">
                  {p}
                </p>
              ))}
              {b.maddeler?.length ? (
                <ul className="mt-3 space-y-2.5">
                  {b.maddeler.map((m, j) => (
                    <li key={j} className="flex gap-3 text-[15px] leading-[1.7] text-text md:text-[16px]">
                      <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <MaddeMetni text={m} />
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          {ders.onemli?.length ? (
            <aside className="mt-8 rounded-2xl border border-[#F3DFA8] bg-soft-warn p-4 md:p-5" aria-label="Önemli">
              <div className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.12em] text-warn">
                <Lightbulb size={17} /> Önemli
              </div>
              <ul className="mt-3 space-y-2">
                {ders.onemli.map((n, j) => (
                  <li key={j} className="flex gap-2.5 text-[14.5px] font-semibold leading-relaxed text-navy md:text-[15px]">
                    <CircleCheck size={17} className="mt-[3px] shrink-0 text-warn" />
                    <span className="min-w-0 flex-1">{n}</span>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </Card>

      {ders.sorular.length ? <Pekistirme sorular={ders.sorular} /> : null}
    </article>
  );
}

/** "Başlık: açıklama" biçimindeki maddelerde başlığı kalın gösterir. */
function MaddeMetni({ text }: { text: string }) {
  const m = text.match(/^([^:]{2,60}):\s(.+)$/);
  if (!m) return <>{text}</>;
  return (
    <>
      <b className="font-bold text-navy">{m[1]}:</b> {m[2]}
    </>
  );
}

// ---------------------------------------------------------------- pekiştirme soruları

function Pekistirme({ sorular }: { sorular: Soru[] }) {
  const [qs] = useState(() => sorular.map(sikKaristir));
  const [cevap, setCevap] = useState<(number | null)[]>(() => sorular.map(() => null));
  const cevaplanan = cevap.filter((c) => c != null).length;
  const dogru = cevap.filter((c, i) => c === qs[i].dogru).length;

  const sec = (i: number, j: number) =>
    setCevap((p) => {
      if (p[i] != null) return p;
      const n = [...p];
      n[i] = j;
      return n;
    });

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="section-label">Pekiştirme soruları</div>
        {cevaplanan ? (
          <span className="num text-[12px] font-bold text-muted">
            {dogru}/{qs.length} doğru
          </span>
        ) : null}
      </div>
      <div className="space-y-3">
        {qs.map((q, i) => {
          const c = cevap[i];
          const answered = c != null;
          const ok = c === q.dogru;
          return (
            <Card key={i}>
              <div className="flex items-start gap-2">
                <span className="num mt-0.5 shrink-0 text-[13px] font-bold text-muted">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold leading-snug text-navy md:text-[15.5px]">{q.soru}</div>
                  <div className="mt-3 space-y-2" role="radiogroup" aria-label={`Soru ${i + 1} şıkları`}>
                    {q.secenekler.map((s, j) => {
                      const isRight = answered && j === q.dogru;
                      const isWrongPick = answered && j === c && !ok;
                      return (
                        <button
                          key={j}
                          type="button"
                          role="radio"
                          aria-checked={c === j}
                          disabled={answered}
                          onClick={() => sec(i, j)}
                          className={cx(
                            "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition disabled:cursor-default",
                            isRight
                              ? "border-success/40 bg-soft-green text-success"
                              : isWrongPick
                                ? "border-danger/30 bg-soft-danger text-danger"
                                : answered
                                  ? "border-line bg-white text-muted"
                                  : "border-line bg-white text-text hover:border-brand-teal/40 hover:bg-[#F3FAF9]",
                          )}
                        >
                          <span
                            className={cx(
                              "num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold",
                              isRight ? "bg-success text-white" : isWrongPick ? "bg-danger text-white" : "bg-[#E1F2F3] text-brand-teal",
                            )}
                          >
                            {LETTERS[j]}
                          </span>
                          <span className={cx("flex-1 text-[14.5px] leading-snug", (isRight || isWrongPick) && "font-bold")}>{s}</span>
                          {isRight ? <CircleCheck size={18} className="shrink-0" /> : isWrongPick ? <CircleX size={18} className="shrink-0" /> : null}
                        </button>
                      );
                    })}
                  </div>
                  {answered ? (
                    <div className={cx("mt-3 rounded-xl px-3.5 py-3 text-[13.5px] leading-relaxed", ok ? "bg-soft-green/70" : "bg-soft-danger/70")}>
                      <div className={cx("flex items-center gap-1.5 font-extrabold", ok ? "text-success" : "text-danger")}>
                        {ok ? <CircleCheck size={16} /> : <CircleX size={16} />}
                        {ok ? "Doğru!" : `Yanlış. Doğru cevap: ${LETTERS[q.dogru]}`}
                      </div>
                      <div className="mt-1 text-text">{q.aciklama}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default function EgitimDersPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DersPageView />
    </Suspense>
  );
}
