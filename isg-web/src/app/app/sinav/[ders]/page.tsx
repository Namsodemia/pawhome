"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CirclePlay, GraduationCap, Layers, PlayCircle, X } from "lucide-react";
import Quiz from "@/components/Quiz";
import { Badge, Button, ButtonLink, Card, Empty, Loading, PageHeader, Section } from "@/components/ui";
import { confirmDialog } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx, fmtDateTime } from "@/lib/format";
import { fmtSure, GECME_NOTU, sonucPct, TUR_LABEL, useQuestionBank } from "@/lib/sinav";

type Mode = "on" | "son" | "hepsi";
const MODE_LABEL: Record<Mode, string> = { on: "Ön Test", son: "Son Test", hepsi: "Tüm Sorular" };

export default function DersPage() {
  const params = useParams<{ ders: string }>();
  const sira = Number(params?.ders);
  const { dersler, loading } = useQuestionBank();
  const sonuclar = useStore((s) => s.sinavSonuclari);
  const [mode, setMode] = useState<Mode | null>(null);
  const [run, setRun] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const idx = dersler.findIndex((x) => x.sira === sira);
  const d = idx >= 0 ? dersler[idx] : undefined;
  const prev = idx > 0 ? dersler[idx - 1] : undefined;
  const next = idx >= 0 && idx < dersler.length - 1 ? dersler[idx + 1] : undefined;

  const mine = useMemo(() => sonuclar.filter((r) => r.ders_sira === sira).sort((a, b) => b.id - a.id), [sonuclar, sira]);
  const bestOf = (t: Mode) => {
    const xs = mine.filter((r) => r.tur === t);
    return xs.length ? Math.max(...xs.map(sonucPct)) : null;
  };

  const questions = useMemo(() => {
    if (!d || !mode) return [];
    return mode === "hepsi" ? [...d.on, ...d.son] : d[mode];
  }, [d, mode]);

  const start = (m: Mode) => {
    setMode(m);
    setRun((r) => r + 1);
    setQuizDone(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const exitQuiz = useCallback(() => setMode(null), []);
  const askExit = async () => {
    if (!quizDone) {
      const ok = await confirmDialog({ title: "Testten çık", text: "Yarım kalan test kaydedilmez. Çıkmak istiyor musunuz?", okLabel: "Çık", cancelLabel: "Devam et" });
      if (!ok) return;
    }
    exitQuiz();
  };

  if (loading) return <Loading />;

  if (!d) {
    return (
      <div>
        <PageHeader title="Ders bulunamadı" back="/app/sinav" />
        <Empty
          icon={GraduationCap}
          title="Ders bulunamadı"
          text="Bu sırada bir ders yok. Etkin soru bankası değişmiş olabilir."
          action={
            <ButtonLink href="/app/sinav" small>
              Derslere dön
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const n = d.on.length + d.son.length;

  if (mode) {
    return (
      <div>
        <PageHeader
          title={`Ders ${d.sira} · ${MODE_LABEL[mode]}`}
          subtitle={d.ad}
          actions={
            <Button kind="ghost" small icon={X} onClick={() => void askExit()}>
              {quizDone ? "Derse dön" : "Testten çık"}
            </Button>
          }
        />
        <Quiz key={`${mode}-${run}`} questions={questions} dersSira={d.sira} tur={mode} onExit={exitQuiz} exitLabel="Derse dön" onFinishedChange={setQuizDone} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Ders ${d.sira}`} subtitle={`${n} soru`} back="/app/sinav" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <Card className="overflow-hidden" padded={false}>
            <div className="bg-brandSoft px-5 py-5 md:px-6">
              <div className="flex items-center gap-3">
                <span className="num flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[16px] font-extrabold text-brand-teal shadow-card">
                  {String(d.sira).padStart(2, "0")}
                </span>
                <h2 className="text-[18px] font-extrabold leading-snug text-navy md:text-[20px]">{d.ad}</h2>
              </div>
            </div>
            <div className="px-5 py-5 md:px-6">
              <p className="text-[14px] leading-relaxed text-text">
                İSGUZEM programında her ders ön testle başlar, son testle biter. Son testte geçme notu 70&apos;tir. Şıklar her denemede karıştırılır.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {d.on.length ? (
                  <Button kind="secondary" icon={PlayCircle} onClick={() => start("on")}>
                    Ön Test ({d.on.length} soru)
                  </Button>
                ) : null}
                <Button icon={CirclePlay} onClick={() => start("son")} disabled={!d.son.length}>
                  Son Test ({d.son.length} soru)
                </Button>
                <Button kind="orange" icon={Layers} onClick={() => start("hepsi")}>
                  Tüm soruları çöz
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            {prev ? (
              <Link href={`/app/sinav/${prev.sira}`} className="inline-flex max-w-[48%] items-center gap-1 text-[13px] font-bold text-muted hover:text-brand-blue">
                <ChevronLeft size={16} className="shrink-0" />
                <span className="truncate">Ders {prev.sira}</span>
              </Link>
            ) : (
              <span />
            )}
            <ButtonLink href="/app/sinav" kind="ghost" small>
              Derslere dön
            </ButtonLink>
            {next ? (
              <Link href={`/app/sinav/${next.sira}`} className="inline-flex max-w-[48%] items-center gap-1 text-[13px] font-bold text-muted hover:text-brand-blue">
                <span className="truncate">Ders {next.sira}</span>
                <ChevronRight size={16} className="shrink-0" />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>

        <div className="lg:-mt-7">
          <Section label="Bu dersteki sonuçlar">
            <div className="grid grid-cols-3 gap-2">
              {(["on", "son", "hepsi"] as Mode[]).map((t) => {
                const b = bestOf(t);
                return (
                  <div key={t} className="rounded-2xl border border-line/70 bg-white p-3 text-center shadow-card">
                    <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{TUR_LABEL[t]}</div>
                    <div className={cx("num mt-1 text-[18px] font-extrabold", b == null ? "text-[#B4BFC5]" : b >= GECME_NOTU ? "text-success" : "text-warn")}>
                      {b == null ? "—" : `%${b}`}
                    </div>
                  </div>
                );
              })}
            </div>
            {mine.length ? (
              <Card padded={false} className="mt-3 divide-y divide-line">
                {mine.slice(0, 8).map((r) => {
                  const p = sonucPct(r);
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <Badge tone={r.tur === "son" ? "blue" : r.tur === "on" ? "teal" : "orange"} className="!px-2 !py-0.5 !text-[10.5px]">
                          {TUR_LABEL[r.tur]}
                        </Badge>
                        <div className="num mt-0.5 text-[11.5px] text-muted">{fmtDateTime(r.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className={cx("num text-[14.5px] font-extrabold", p >= GECME_NOTU ? "text-success" : "text-warn")}>%{p}</div>
                        <div className="num text-[11px] text-muted">
                          {r.dogru}/{r.toplam} · {fmtSure(r.sure_sn)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            ) : (
              <Card className="mt-3 text-center text-[13px] text-muted">Bu ders için henüz deneme yok.</Card>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
