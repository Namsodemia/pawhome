"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
  Flag,
  KeyRound,
  Keyboard,
  RotateCcw,
  Shuffle,
  X,
} from "lucide-react";
import { Badge, Button, Card, ProgressBar, Segment } from "@/components/ui";
import { confirmDialog } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/format";
import { GECME_NOTU, LETTERS, shuffleOptions, type KarisikSoru } from "@/lib/sinav";
import type { SinavTur } from "@/lib/types";

type QuizSoru = KarisikSoru;

function build(src: QuizSoru[]): QuizSoru[] {
  return src.map((q) => ({ ...shuffleOptions(q), ders: q.ders }));
}

function mmss(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export interface QuizProps {
  questions: QuizSoru[];
  dersSira: number | null;
  tur: SinavTur;
  /** Soru üstündeki "Ders N" etiketinde ders adını göstermek için (karışık deneme) */
  dersAdlari?: Record<number, string>;
  onExit: () => void;
  exitLabel?: string;
  /** Verilirse sonuç ekranında "Yeni sorular" butonu çıkar (karışık deneme). */
  onNewSet?: () => void;
  /** Test bitince true, "Tekrar çöz" ile yeniden başlayınca false bildirir. */
  onFinishedChange?: (finished: boolean) => void;
}

export default function Quiz({ questions, dersSira, tur, dersAdlari, onExit, exitLabel = "Kapat", onNewSet, onFinishedChange }: QuizProps) {
  const saveSonuc = useStore((s) => s.saveSonuc);
  const [qs, setQs] = useState<QuizSoru[]>(() => build(questions));
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [finished, setFinished] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [keyFilter, setKeyFilter] = useState<"hepsi" | "hata">("hepsi");
  const [sec, setSec] = useState(0);
  const start = useRef(0);
  const doneRef = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  // zamanlayıcı
  useEffect(() => {
    if (finished) return;
    if (!start.current) start.current = Date.now();
    const t = setInterval(() => setSec(Math.floor((Date.now() - start.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [finished]);

  const n = qs.length;
  const correct = answers.filter((a, k) => a === qs[k]?.d).length;
  const answered = answers.filter((a) => a != null).length;
  const blank = n - answered;

  const choose = useCallback(
    (j: number) =>
      setAnswers((p) => {
        const next = [...p];
        next[i] = j;
        return next;
      }),
    [i],
  );

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    const sure = Math.floor((Date.now() - (start.current || Date.now())) / 1000);
    const dogru = answers.filter((a, k) => a === qs[k]?.d).length;
    setSec(sure);
    setFinished(true);
    saveSonuc({ ders_sira: dersSira, tur, dogru, toplam: qs.length, sure_sn: sure });
    onFinishedChange?.(true);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [answers, qs, dersSira, tur, saveSonuc, onFinishedChange]);

  const requestFinish = useCallback(async () => {
    if (doneRef.current) return;
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
  }, [answers, finish]);

  const go = useCallback((k: number) => setI(Math.max(0, Math.min(n - 1, k))), [n]);

  // klavye kısayolları
  useEffect(() => {
    if (finished || !n) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[role="alertdialog"],[role="dialog"]')) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      const isOpt = !!el?.closest?.("[data-quiz-opt]");
      if (tag === "BUTTON" && !isOpt && (e.key === "Enter" || e.key === " ")) return;
      const q = qs[i];
      const letter = ["a", "b", "c", "d", "e", "f"].indexOf(e.key.toLowerCase());
      const digit = /^[1-6]$/.test(e.key) ? Number(e.key) - 1 : -1;
      const idx = letter >= 0 ? letter : digit;
      if (idx >= 0 && q && idx < q.c.length) {
        e.preventDefault();
        choose(idx);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(i - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(i + 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (i < n - 1) go(i + 1);
        else void requestFinish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, n, qs, i, choose, go, requestFinish]);

  function restart() {
    setQs(build(questions));
    setAnswers(questions.map(() => null));
    setI(0);
    setShowKey(false);
    setKeyFilter("hepsi");
    setSec(0);
    start.current = Date.now();
    doneRef.current = false;
    setFinished(false);
    onFinishedChange?.(false);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  if (!n) {
    return (
      <Card className="text-center">
        <div className="text-[14px] text-muted">Bu test için soru yok.</div>
        <Button kind="ghost" small className="mt-3" onClick={onExit}>
          Geri
        </Button>
      </Card>
    );
  }

  // ---------------------------------------------------------------- sonuç
  if (finished) {
    const pct = Math.round((correct * 100) / n);
    const pass = pct >= GECME_NOTU;
    const wrong = answered - correct;
    const keyList = qs.map((q, k) => ({ q, k })).filter(({ q, k }) => keyFilter === "hepsi" || answers[k] !== q.d);
    return (
      <div ref={topRef} className="mx-auto max-w-3xl scroll-mt-24">
        <div
          className={cx("relative overflow-hidden rounded-xl3 p-6 text-center text-white shadow-fab md:p-8", pass ? "bg-[linear-gradient(135deg,#3AA466_0%,#0B6F7B_100%)]" : "bg-[linear-gradient(135deg,#F4772E_0%,#C0561A_100%)]")}
        >
          <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/85">Sonuç</div>
          <div className="num mt-1 text-[56px] font-extrabold leading-none tracking-tight md:text-[68px]">%{pct}</div>
          <div className="mt-2 text-[15px] font-semibold">
            {correct} / {n} doğru · {Math.floor(sec / 60)} dk {sec % 60} sn
          </div>
          <div className="mt-1 text-[14px] font-bold text-white/95">{pass ? `Başarılı — geçme notu ${GECME_NOTU}` : `Geçme notu ${GECME_NOTU}; tekrar deneyin`}</div>
          <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2">
            {[
              { l: "Doğru", v: correct },
              { l: "Yanlış", v: wrong },
              { l: "Boş", v: blank },
            ].map((x) => (
              <div key={x.l} className="rounded-2xl bg-white/15 px-2 py-2.5 backdrop-blur-sm">
                <div className="num text-[20px] font-extrabold leading-none">{x.v}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-white/85">{x.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button kind="secondary" small icon={KeyRound} onClick={() => setShowKey((v) => !v)}>
            {showKey ? "Cevapları gizle" : "Cevap anahtarı"}
          </Button>
          <Button kind="primary" small icon={RotateCcw} onClick={restart}>
            Tekrar çöz
          </Button>
          {onNewSet ? (
            <Button kind="dark" small icon={Shuffle} onClick={onNewSet}>
              Yeni sorular
            </Button>
          ) : null}
          <Button kind="ghost" small icon={X} onClick={onExit} className="ml-auto">
            {exitLabel}
          </Button>
        </div>

        {showKey ? (
          <div className="mt-4">
            <Segment
              value={keyFilter}
              onChange={setKeyFilter}
              options={[
                { value: "hepsi", label: `Tümü (${n})` },
                { value: "hata", label: `Yanlış ve boş (${n - correct})` },
              ]}
              className="max-w-md"
            />
            <div className="mt-3 space-y-3">
              {keyList.length === 0 ? (
                <Card className="text-center text-[14px] font-semibold text-success">Tüm soruları doğru cevapladınız. Tebrikler!</Card>
              ) : null}
              {keyList.map(({ q, k }) => {
                const a = answers[k];
                const ok = a === q.d;
                return (
                  <Card key={k} className={cx("border-l-4", ok ? "border-l-success" : a == null ? "border-l-[#C9D2DB]" : "border-l-danger")}>
                    <div className="flex items-start gap-2">
                      <span className="num mt-0.5 shrink-0 text-[13px] font-bold text-muted">{k + 1}.</span>
                      <div className="min-w-0 flex-1">
                        {q.ders ? <div className="mb-1 text-[11px] font-bold text-muted">Ders {q.ders}</div> : null}
                        <div className="text-[14.5px] font-bold leading-snug text-navy">{q.s}</div>
                        <div className="mt-2 space-y-1">
                          {q.c.map((c, j) => {
                            const isRight = j === q.d;
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

  // ---------------------------------------------------------------- soru ekranı
  const q = qs[i];
  const chosen = answers[i];
  const last = i === n - 1;

  return (
    <div ref={topRef} className="grid grid-cols-1 scroll-mt-24 gap-5 lg:grid-cols-[minmax(0,1fr)_288px]">
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
            {q.ders ? (
              <div className="mb-2">
                <Badge tone="violet">
                  Ders {q.ders}
                  {dersAdlari?.[q.ders] ? <span className="hidden max-w-[260px] truncate font-semibold sm:inline">· {dersAdlari[q.ders]}</span> : null}
                </Badge>
              </div>
            ) : null}
            <div className="text-[16.5px] font-bold leading-relaxed text-navy md:text-[18px]">{q.s}</div>
            <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="Şıklar">
              {q.c.map((c, j) => {
                const on = chosen === j;
                return (
                  <button
                    key={j}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    data-quiz-opt
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
            <Button kind="secondary" small onClick={() => void requestFinish()}>
              Bitir
            </Button>
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
        <div className="mt-3 hidden items-center gap-2 text-[12px] text-muted md:flex">
          <Keyboard size={14} /> Kısayollar: <b className="text-navy">A–E</b> veya <b className="text-navy">1–5</b> şık seçer · <b className="text-navy">← →</b> sorular arasında gezer ·{" "}
          <b className="text-navy">Enter</b> sonraki soru
        </div>
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
          <div className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-6">
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
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-muted">
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-brand-teal" /> Cevaplandı
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded bg-paper ring-1 ring-line" /> Boş
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded ring-2 ring-orange" /> Şu an
            </span>
          </div>
        </Card>
        <Card className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="num text-[17px] font-extrabold text-navy">{mmss(sec)}</div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Süre</div>
          </div>
          <div>
            <div className="num text-[17px] font-extrabold text-brand-teal">{answered}</div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Cevap</div>
          </div>
          <div>
            <div className={cx("num text-[17px] font-extrabold", blank ? "text-orange" : "text-success")}>{blank}</div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted">Boş</div>
          </div>
        </Card>
        <Button kind="dark" block small icon={Flag} onClick={() => void requestFinish()}>
          Sınavı bitir
        </Button>
        <div className="text-center text-[11.5px] text-muted">Geçme notu {GECME_NOTU} · şıklar her denemede karıştırılır</div>
      </aside>
    </div>
  );
}
