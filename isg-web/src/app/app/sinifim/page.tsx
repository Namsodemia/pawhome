"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, CloudOff, Info, KeyRound, LogIn, LogOut, Megaphone, RefreshCw, School, Users } from "lucide-react";
import { Badge, Button, Card, Empty, Loading, PageHeader, Section } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { useSync } from "@/lib/sync";
import { ApiError, siniflarim, sinifaKatil, siniftanAyril, type SinifimItem } from "@/lib/api";
import { cx, fmtDate, fmtTime } from "@/lib/format";
import { SinifInitial, dayLabel } from "../siniflar/_parts/common";

const KOD_LEN = 6;
const REFRESH_MS = 60_000;
const SEEN_KEY = "isgora.sinifim.okunan";
const DEFAULT_RENK = "#1D9BF0";

type Duyuru = SinifimItem["mesajlar"][number];

const keyOf = (s: { sahip_id: number; sinif_id: number }) => `${s.sahip_id}:${s.sinif_id}`;

function errMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.";
}

/** Kodu büyük harfe çevirir, boşluk ve ayraçları atar; yapıştırılan davet bağlantısından kodu çıkarır. */
function cleanKod(raw: string): string {
  let src = raw;
  const m = raw.match(/[?&](?:sinif|kod)=([^&#\s]+)/i);
  if (m) {
    try {
      src = decodeURIComponent(m[1]);
    } catch {
      src = m[1];
    }
  }
  return src
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, KOD_LEN);
}

/** "2026-10-19 08:30:00" (SQLite) → "2026-10-19T08:30:00" — Safari boşluklu tarihi okuyamaz. */
function isoFix(s: string): string {
  return /^\d{4}-\d{2}-\d{2} \d/.test(s) ? s.replace(" ", "T") : s;
}

function lastActivity(s: SinifimItem): string {
  const last = s.mesajlar.length ? s.mesajlar[s.mesajlar.length - 1].created_at || "" : "";
  const k = s.katilma || "";
  return isoFix(last > k ? last : k);
}

// Okunan son duyuru (sınıf başına) — yalnızca bu tarayıcıda tutulan küçük bir kolaylık
function readSeen(): Record<string, number> {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) || "{}") as unknown;
    return v && typeof v === "object" ? (v as Record<string, number>) : {};
  } catch {
    return {};
  }
}
function writeSeen(v: Record<string, number>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(v));
  } catch {
    /* depolama yok */
  }
}

export default function SinifimPage() {
  const backend = useSync((s) => s.backend);

  const [list, setList] = useState<SinifimItem[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [desktop, setDesktop] = useState(false);
  const [kod, setKod] = useState("");
  const [joinErr, setJoinErr] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [seen, setSeen] = useState<Record<string, number>>({});

  const listRef = useRef<SinifimItem[] | null>(null);
  const inflight = useRef(false);
  const lastLoad = useRef(0);
  const joinRef = useRef<HTMLDivElement>(null);
  const kodRef = useRef<HTMLInputElement>(null);

  // masaüstünde solda liste + sağda duyurular; mobilde seçilen sınıf tam ekran açılır
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => setSeen(readSeen()), []);

  // ?kod=XXX (ya da ?sinif=XXX) → katılım alanını doldur
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const raw = sp.get("kod") ?? sp.get("sinif");
    if (!raw) return;
    setKod(cleanKod(raw));
    sp.delete("kod");
    sp.delete("sinif");
    const qs = sp.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    requestAnimationFrame(() => {
      joinRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      kodRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const load = useCallback(async (silent: boolean) => {
    if (inflight.current) return;
    inflight.current = true;
    if (!silent) setRefreshing(true);
    try {
      const l = await siniflarim();
      listRef.current = l;
      setList(l);
      setLoadErr(null);
      lastLoad.current = Date.now();
    } catch (e) {
      if (!silent) {
        if (listRef.current) toast(errMsg(e), "error");
        else setLoadErr(errMsg(e));
      }
    } finally {
      inflight.current = false;
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (backend === true) void load(false);
  }, [backend, load]);

  // Sayfa görünürken 60 sn'de bir sessizce yenile; sekmeye dönüldüğünde süre dolmuşsa hemen yenile
  useEffect(() => {
    if (backend !== true) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      timer = setInterval(() => {
        if (document.visibilityState === "visible") void load(true);
      }, REFRESH_MS);
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        if (Date.now() - lastLoad.current >= REFRESH_MS) void load(true);
        start();
      } else stop();
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [backend, load]);

  const items = useMemo(() => [...(list ?? [])].sort((a, b) => lastActivity(b).localeCompare(lastActivity(a))), [list]);
  const active = items.find((s) => keyOf(s) === sel) ?? (desktop ? items[0] : undefined);
  const activeKey = active ? keyOf(active) : null;
  const activeLast = active && active.mesajlar.length ? Math.max(...active.mesajlar.map((m) => m.id)) : 0;
  const mobileDetail = !!sel && !!active;

  // açık sınıftaki duyuruları okundu say
  useEffect(() => {
    if (!activeKey || !activeLast) return;
    setSeen((cur) => {
      if ((cur[activeKey] ?? 0) >= activeLast) return cur;
      const next = { ...cur, [activeKey]: activeLast };
      writeSeen(next);
      return next;
    });
  }, [activeKey, activeLast]);

  function open(s: SinifimItem) {
    setSel(keyOf(s));
    if (!desktop) window.scrollTo({ top: 0 });
  }

  async function join(e?: FormEvent) {
    e?.preventDefault();
    const k = cleanKod(kod);
    if (k.length !== KOD_LEN) {
      setJoinErr(`Katılım kodu ${KOD_LEN} karakterdir.`);
      kodRef.current?.focus();
      return;
    }
    setJoining(true);
    setJoinErr(null);
    try {
      const s = await sinifaKatil(k);
      const next = [s, ...(listRef.current ?? []).filter((x) => keyOf(x) !== keyOf(s))];
      listRef.current = next;
      setList(next);
      setLoadErr(null);
      setKod("");
      open(s);
      toast(`${s.ad} sınıfına katıldınız.`);
    } catch (err) {
      setJoinErr(errMsg(err));
    } finally {
      setJoining(false);
    }
  }

  async function leave(s: SinifimItem) {
    const ok = await confirmDialog({
      title: "Sınıftan ayrıl",
      text: `${s.ad} sınıfından ayrılacaksınız ve duyurularını artık görmeyeceksiniz. Yeniden katılmak için katılım kodu gerekir.`,
      okLabel: "Ayrıl",
      danger: true,
    });
    if (!ok) return;
    try {
      await siniftanAyril(s.sahip_id, s.sinif_id);
      const next = (listRef.current ?? []).filter((x) => keyOf(x) !== keyOf(s));
      listRef.current = next;
      setList(next);
      setSel(null);
      toast(`${s.ad} sınıfından ayrıldınız.`);
    } catch (e) {
      toast(errMsg(e), "error");
    }
  }

  const header = <PageHeader title="Sınıfım" subtitle="Eğitim kurumunuzun sınıf duyuruları" />;

  if (backend === null) return <Loading />;

  if (backend !== true) {
    return (
      <div>
        {header}
        <Empty icon={CloudOff} title="Sunucu bağlantısı yok" text="Sınıfa katılmak için sunucu bağlantısı gerekir." />
      </div>
    );
  }

  return (
    <div>
      <div className={cx(mobileDetail && "hidden lg:block")}>{header}</div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        {/* ------------------------------------------------ katıl + liste */}
        <div className={cx("min-w-0", mobileDetail && "hidden lg:block")}>
          <div ref={joinRef} className="scroll-mt-24">
            <Card>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-fab">
                  <KeyRound size={19} strokeWidth={2.3} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-extrabold text-navy">Sınıfa katıl</h2>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">Eğitim kurumunuzdan aldığınız {KOD_LEN} karakterlik katılım kodunu girin.</p>
                </div>
              </div>
              <form onSubmit={(e) => void join(e)} className="mt-4">
                <div className="flex gap-2">
                  <input
                    ref={kodRef}
                    value={kod}
                    onChange={(e) => {
                      setKod(cleanKod(e.target.value));
                      if (joinErr) setJoinErr(null);
                    }}
                    placeholder="ABC123"
                    aria-label="Katılım kodu"
                    aria-invalid={!!joinErr}
                    autoCapitalize="characters"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    className={cx(
                      "field min-w-0 flex-1 text-center font-mono text-[22px] font-extrabold uppercase tracking-[0.3em] placeholder:font-semibold placeholder:text-[#C3CCD5]",
                      joinErr && "!border-danger",
                    )}
                  />
                  <Button type="submit" icon={LogIn} loading={joining} disabled={kod.length !== KOD_LEN} className="!h-auto shrink-0">
                    Katıl
                  </Button>
                </div>
                {joinErr ? (
                  <div className="mt-2 text-[12.5px] font-semibold text-danger" role="alert">
                    {joinErr}
                  </div>
                ) : (
                  <div className="mt-2 text-[12px] text-muted">
                    <span className="num">
                      {kod.length}/{KOD_LEN}
                    </span>{" "}
                    karakter · Davet bağlantısını da yapıştırabilirsiniz.
                  </div>
                )}
              </form>
            </Card>
          </div>

          <Section
            label="Sınıflarım"
            right={
              list && list.length ? (
                <button
                  type="button"
                  onClick={() => void load(false)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-bold text-brand-blue transition hover:bg-soft-blue disabled:opacity-50"
                >
                  <RefreshCw size={13} className={refreshing ? "animate-spin" : undefined} /> Yenile
                </button>
              ) : null
            }
          >
            {list === null ? (
              loadErr ? (
                <Empty
                  icon={CloudOff}
                  title="Sınıflar yüklenemedi"
                  text={loadErr}
                  action={
                    <Button small kind="secondary" icon={RefreshCw} loading={refreshing} onClick={() => void load(false)}>
                      Tekrar dene
                    </Button>
                  }
                />
              ) : (
                <Loading />
              )
            ) : items.length === 0 ? (
              <Empty icon={School} title="Henüz bir sınıfa katılmadınız" text="Eğitim kurumunuzdan aldığınız katılım kodunu girin." />
            ) : (
              <div className="space-y-2">
                {items.map((s) => {
                  const k = keyOf(s);
                  const on = activeKey === k;
                  const unseen = on ? 0 : s.mesajlar.filter((m) => m.id > (seen[k] ?? 0)).length;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => open(s)}
                      aria-current={on ? "true" : undefined}
                      className={cx(
                        "group flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-bar",
                        on ? "border-brand-blue/50 ring-2 ring-brand-blue/15" : "border-line/70",
                      )}
                    >
                      <SinifInitial ad={s.ad} renk={s.renk || DEFAULT_RENK} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-navy group-hover:text-brand-blue">{s.ad}</span>
                          {unseen ? (
                            <Badge tone="green" className="num shrink-0 !px-2 !py-0.5 !text-[10.5px]">
                              {unseen} yeni
                            </Badge>
                          ) : null}
                        </span>
                        <span className="block truncate text-[12.5px] text-muted">{s.kurum || "Eğitim kurumu"}</span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted">
                          <span>
                            Katılma: <span className="num">{fmtDate(s.katilma)}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users size={11} />
                            <span className="num">{s.uye_sayisi}</span> öğrenci
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        {/* ------------------------------------------------ duyurular */}
        <div className={cx("min-w-0 lg:sticky lg:top-24", !mobileDetail && "hidden lg:block")}>
          {active ? (
            <Feed key={activeKey} s={active} refreshing={refreshing} onBack={() => setSel(null)} onRefresh={() => void load(false)} onLeave={() => void leave(active)} />
          ) : (
            <HowTo />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- duyuru akışı (salt okunur)

function Feed({
  s,
  refreshing,
  onBack,
  onRefresh,
  onLeave,
}: {
  s: SinifimItem;
  refreshing: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onLeave: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const msgs = useMemo(() => [...s.mesajlar].sort((a, b) => a.id - b.id), [s.mesajlar]);
  const lastId = msgs.length ? msgs[msgs.length - 1].id : 0;
  const renk = s.renk || DEFAULT_RENK;
  const kurum = s.kurum || "Eğitim kurumunuz";

  // açılışta en alta kaydır; yeni duyuru gelince yalnızca okuyucu zaten alttaysa kaydır
  const first = useRef(true);
  const atBottom = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (first.current) el.scrollTop = el.scrollHeight;
    else if (atBottom.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    first.current = false;
  }, [lastId]);

  let lastDay = "";

  return (
    <section className="flex h-[calc(100dvh-196px)] min-h-[440px] flex-col overflow-hidden rounded-xl2 border border-line/70 bg-white shadow-card lg:h-[calc(100dvh-200px)] lg:min-h-[520px]">
      <header className="flex items-center gap-2.5 border-b border-line px-3 py-3 md:px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Sınıflarıma dön"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-paper hover:text-navy lg:hidden"
        >
          <ChevronLeft size={20} />
        </button>
        <SinifInitial ad={s.ad} renk={renk} size={44} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[16px] font-extrabold text-navy md:text-[17px]">{s.ad}</h2>
          <div className="truncate text-[12px] text-muted">
            {s.kurum ? `${s.kurum} · ` : ""}
            <span className="num">{s.uye_sayisi}</span> öğrenci
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Yenile"
            title="Yenile"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2 text-[12.5px] font-bold text-brand-blue transition hover:bg-soft-blue disabled:opacity-50 sm:px-2.5"
          >
            <RefreshCw size={17} className={refreshing ? "animate-spin" : undefined} />
            <span className="hidden sm:inline">Yenile</span>
          </button>
          <button
            type="button"
            onClick={onLeave}
            aria-label="Sınıftan ayrıl"
            title="Sınıftan ayrıl"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2 text-[12.5px] font-bold text-danger transition hover:bg-soft-danger sm:px-2.5"
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">Ayrıl</span>
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 overflow-y-auto bg-paper px-3 py-4 md:px-5"
      >
        {s.aciklama ? (
          <div className="mx-auto mb-3 flex max-w-md items-start gap-2 rounded-2xl bg-white px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted shadow-card">
            <Info size={14} className="mt-0.5 shrink-0 text-brand-blue" />
            <span className="min-w-0 break-words">{s.aciklama}</span>
          </div>
        ) : null}

        {msgs.length === 0 ? (
          <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-brandSoft text-brand-blue">
              <Megaphone size={28} />
            </span>
            <div className="mt-3 text-[17px] font-extrabold text-navy">Henüz duyuru yok</div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{kurum} bu sınıfa duyuru gönderdiğinde burada görünür.</p>
          </div>
        ) : null}

        {msgs.map((m) => {
          const at = isoFix(m.created_at);
          const dk = dayLabel(at);
          const showDay = dk !== lastDay;
          lastDay = dk;
          return (
            <Fragment key={m.id}>
              {showDay ? (
                <div className="my-3 flex justify-center">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-muted shadow-card">{dk}</span>
                </div>
              ) : null}
              <Bubble m={m} at={at} sender={showDay ? kurum : null} color={renk} />
            </Fragment>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5 border-t border-line bg-white px-4 py-3 text-center text-[11.5px] text-muted">
        <Megaphone size={13} className="shrink-0 text-brand-blue" />
        <span>Duyuru kanalı · yalnızca {s.kurum || "eğitim kurumunuz"} mesaj gönderebilir.</span>
      </div>
    </section>
  );
}

function Bubble({ m, at, sender, color }: { m: Duyuru; at: string; sender: string | null; color: string }) {
  return (
    <div className="mb-2 flex justify-start">
      <div className="max-w-[86%] select-text overflow-hidden rounded-[20px] rounded-bl-md bg-white px-3.5 py-2.5 shadow-card md:max-w-[72%]">
        {sender ? (
          <div className="mb-0.5 truncate text-[12px] font-extrabold" style={{ color }}>
            {sender}
          </div>
        ) : null}
        <div className="whitespace-pre-wrap break-words text-[14.5px] leading-[1.45] text-ink">
          <Linkified text={m.metin} />
        </div>
        <div className="mt-1.5 flex items-center justify-end gap-1 text-[10.5px] font-semibold text-muted">
          <Megaphone size={11} />
          <span className="num">{fmtTime(at)}</span>
        </div>
      </div>
    </div>
  );
}

/** Duyurudaki http(s) bağlantılarını tıklanabilir yapar. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<]*[^\s<.,;:!?)\]'"])/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <a key={i} href={p} target="_blank" rel="noreferrer noopener" className="break-all font-semibold text-brand-blue underline underline-offset-2">
            {p}
          </a>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

function HowTo() {
  const steps = [
    "Eğitim kurumunuzdan 6 karakterlik katılım kodunu (ya da davet bağlantısını) alın.",
    "Kodu “Sınıfa katıl” alanına yazıp Katıl’a basın.",
    "Kurumunuzun bu sınıfa gönderdiği duyurular burada, sohbet görünümünde listelenir.",
  ];
  return (
    <Card className="lg:flex lg:min-h-[520px] lg:flex-col lg:justify-center">
      <div className="mx-auto max-w-md text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-brandSoft text-brand-blue">
          <Megaphone size={28} />
        </span>
        <div className="mt-3 text-[17px] font-extrabold text-navy">Sınıf duyuruları</div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">Katıldığınız sınıfın duyurularını buradan takip edersiniz.</p>
      </div>
      <ol className="mx-auto mt-5 max-w-md space-y-2.5">
        {steps.map((t, i) => (
          <li key={i} className="flex items-start gap-3 rounded-2xl bg-paper px-3.5 py-3 text-[13px] leading-relaxed text-text">
            <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-extrabold text-white">{i + 1}</span>
            <span className="min-w-0">{t}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
