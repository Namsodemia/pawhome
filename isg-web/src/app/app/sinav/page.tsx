"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ChevronRight, Database, FileJson, GraduationCap, History, RotateCcw, Search, Timer, Trash2, Trophy, Zap } from "lucide-react";
import { Badge, Button, ButtonLink, Card, Empty, Hero, HeroKicker, PageHeader, ProgressBar, Section, Stat } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx, fmtDateTime, norm } from "@/lib/format";
import { bestByDers, fmtSure, GECME_NOTU, importBankFile, resetBank, sonucPct, TUR_LABEL, useQuestionBank } from "@/lib/sinav";
import type { SinavSonuc } from "@/lib/types";

export default function SinavPage() {
  const { dersler, toplam, source, loading } = useQuestionBank();
  const sonuclar = useStore((s) => s.sinavSonuclari);
  const [q, setQ] = useState("");

  const best = useMemo(() => bestByDers(sonuclar), [sonuclar]);
  const recent = useMemo(() => [...sonuclar].sort((a, b) => b.id - a.id), [sonuclar]);
  const last5 = recent.slice(0, 5);
  const avg = last5.length ? Math.round(last5.reduce((a, r) => a + sonucPct(r), 0) / last5.length) : null;
  const done = dersler.filter((d) => best[d.sira] != null).length;
  const passed = dersler.filter((d) => (best[d.sira] ?? -1) >= GECME_NOTU).length;
  const bestOverall = recent.length ? Math.max(...recent.map(sonucPct)) : null;
  const adlar = useMemo(() => Object.fromEntries(dersler.map((d) => [d.sira, d.ad])), [dersler]);

  const filtered = useMemo(() => {
    const n = norm(q);
    if (!n) return dersler;
    return dersler.filter((d) => norm(`${d.sira} ${d.ad}`).includes(n));
  }, [dersler, q]);

  return (
    <div>
      <PageHeader title="Sınav Hazırlık" subtitle="İSG uzmanlığı (A/B/C) · İSGUZEM ders soruları, ön test / son test ve deneme sınavları" />

      <Hero>
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1">
            <HeroKicker>İSG UZMANLIĞI SINAV HAZIRLIK · İSGUZEM</HeroKicker>
            <div className="mt-2 flex items-end gap-2.5">
              <div className="num text-[40px] font-extrabold leading-none tracking-tight md:text-[46px]">
                {loading ? "…" : avg != null ? `%${avg}` : toplam}
              </div>
              <div className="mb-1 text-[13.5px] font-semibold text-white/85">
                {avg != null ? `son ${last5.length} deneme ortalaması` : `soru · ${dersler.length} ders`}
              </div>
            </div>
            <ProgressBar value={dersler.length ? (done * 100) / dersler.length : 0} tone="white" track="bg-white/20" className="mt-4 max-w-md" />
            <div className="num mt-2 text-[12px] text-white/85">
              {done}/{dersler.length} ders çalışıldı · geçme notu {GECME_NOTU}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href="/app/sinav/deneme?n=25" kind="white" small icon={Zap}>
                25 Soru Deneme
              </ButtonLink>
              <ButtonLink href="/app/sinav/deneme?n=50" kind="dark" small icon={Timer} className="border border-white/25">
                50 Soru
              </ButtonLink>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 md:w-[300px]">
            {[
              { l: "Soru", v: toplam },
              { l: "Ders", v: dersler.length },
              { l: "Deneme", v: sonuclar.length },
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
        {/* Dersler */}
        <Section
          label="Dersler"
          right={
            <div className="relative w-44 sm:w-56">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ders ara…"
                className="h-9 w-full rounded-xl border border-line bg-white pl-8 pr-3 text-[13px] outline-none focus:border-brand-blue"
              />
            </div>
          }
        >
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <div key={k} className="skeleton h-[68px]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Empty icon={Search} title="Ders bulunamadı" text="Aramanızla eşleşen ders yok." />
          ) : (
            <div className="space-y-2">
              {filtered.map((d) => {
                const n = d.on.length + d.son.length;
                const pct = best[d.sira];
                const ok = pct != null && pct >= GECME_NOTU;
                return (
                  <Link
                    key={d.sira}
                    href={`/app/sinav/${d.sira}`}
                    className="group flex items-center gap-3 rounded-2xl border border-line/70 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar md:p-3.5"
                  >
                    <span
                      className={cx(
                        "num flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold",
                        pct == null ? "bg-[#E1F2F3] text-brand-teal" : ok ? "bg-soft-green text-success" : "bg-soft-warn text-warn",
                      )}
                    >
                      {String(d.sira).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-[14px] font-bold leading-snug text-navy group-hover:text-brand-blue">{d.ad}</span>
                      <span className="mt-0.5 block text-[12px] text-muted">
                        {n} soru{d.on.length ? ` · ön ${d.on.length}` : ""} · son {d.son.length}
                      </span>
                    </span>
                    {pct != null ? (
                      <span className={cx("num shrink-0 text-[15px] font-extrabold", ok ? "text-success" : "text-warn")}>%{pct}</span>
                    ) : (
                      <ChevronRight size={18} className="shrink-0 text-[#B4BFC5]" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </Section>

        {/* Sağ sütun */}
        <div>
          <Section label="Durum">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Deneme" value={sonuclar.length} tone="navy" />
              <Stat label="En iyi" value={bestOverall != null ? `%${bestOverall}` : "-"} tone="green" />
              <Stat label="Geçilen" value={`${passed}/${dersler.length}`} tone="violet" sub="ders ≥70" />
            </div>
            {recent.length >= 2 ? <ScoreChart list={recent.slice(0, 10).reverse()} /> : null}
          </Section>

          <Section
            label="Son denemeler"
            right={
              recent.length ? (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirmDialog({
                      title: "Deneme geçmişini temizle",
                      text: "Tüm sınav sonuçları ve ders başarı yüzdeleri silinecek.",
                      okLabel: "Temizle",
                      danger: true,
                    });
                    if (ok) {
                      useStore.setState({ sinavSonuclari: [] });
                      toast("Deneme geçmişi temizlendi.");
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-muted hover:text-danger"
                >
                  <Trash2 size={13} /> Temizle
                </button>
              ) : null
            }
          >
            {recent.length === 0 ? (
              <Card className="text-center">
                <History size={22} className="mx-auto text-muted" />
                <div className="mt-2 text-[13.5px] text-muted">Henüz deneme yok. Bir ders seçin ya da 25 soruluk deneme ile başlayın.</div>
              </Card>
            ) : (
              <Card padded={false} className="divide-y divide-line">
                {recent.slice(0, 8).map((r) => (
                  <ResultRow key={r.id} r={r} ad={r.ders_sira != null ? adlar[r.ders_sira] : undefined} />
                ))}
              </Card>
            )}
          </Section>

          <BankCard source={source} toplam={toplam} dersSayisi={dersler.length} loading={loading} />
        </div>
      </div>
    </div>
  );
}

function ResultRow({ r, ad }: { r: SinavSonuc; ad?: string }) {
  const p = sonucPct(r);
  const ok = p >= GECME_NOTU;
  const inner = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13.5px] font-bold text-navy">{r.ders_sira != null ? `Ders ${r.ders_sira}` : "Karışık deneme"}</span>
          <Badge tone={r.tur === "karisik" ? "violet" : r.tur === "son" ? "blue" : r.tur === "on" ? "teal" : "orange"} className="!px-2 !py-0.5 !text-[10.5px]">
            {TUR_LABEL[r.tur]}
          </Badge>
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] text-muted">
          <span className="num">{fmtDateTime(r.created_at)}</span>
          {ad ? ` · ${ad}` : ""}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className={cx("num block text-[15px] font-extrabold", ok ? "text-success" : "text-warn")}>%{p}</span>
        <span className="num block text-[11px] text-muted">
          {r.dogru}/{r.toplam} · {fmtSure(r.sure_sn)}
        </span>
      </span>
    </>
  );
  const cls = "flex items-center gap-3 px-4 py-3";
  return r.ders_sira != null ? (
    <Link href={`/app/sinav/${r.ders_sira}`} className={cx(cls, "transition hover:bg-paper")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Son 10 denemenin yüzdeleri — basit sütun grafik, 70 çizgisi ile. */
function ScoreChart({ list }: { list: SinavSonuc[] }) {
  return (
    <Card className="mt-2">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[12.5px] font-extrabold text-navy">Son {list.length} deneme</div>
        <div className="flex items-center gap-1 text-[11px] text-muted">
          <span className="inline-block h-0 w-4 border-t-2 border-dashed border-orange" /> geçme notu {GECME_NOTU}
        </div>
      </div>
      <div className="relative h-28">
        <div className="absolute inset-x-0 border-t-2 border-dashed border-orange/70" style={{ bottom: `${GECME_NOTU}%` }} />
        <div className="relative flex h-full items-end gap-1.5">
          {list.map((r) => {
            const p = sonucPct(r);
            return (
              <div key={r.id} className="group relative flex h-full flex-1 items-end" title={`%${p} · ${r.dogru}/${r.toplam} · ${fmtDateTime(r.created_at)}`}>
                <div
                  className={cx("w-full rounded-t-md transition-all", p >= GECME_NOTU ? "bg-brand-greenDeep" : "bg-[#F2B544]")}
                  style={{ height: `${Math.max(3, p)}%` }}
                />
                <span className="num pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 rounded bg-navy px-1.5 py-0.5 text-[10px] font-bold text-white group-hover:block">
                  %{p}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function BankCard({ source, toplam, dersSayisi, loading }: { source: "builtin" | "imported"; toplam: number; dersSayisi: number; loading: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    try {
      const r = await importBankFile(f);
      toast(`Soru bankası içe aktarıldı: ${r.dersler} ders · ${r.soru} soru.${r.skipped ? ` ${r.skipped} geçersiz soru atlandı.` : ""}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Dosya içe aktarılamadı.", "error");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function backToBuiltin() {
    const ok = await confirmDialog({
      title: "Yerleşik bankaya dön",
      text: "İçe aktardığınız soru bankası bu tarayıcıdan kaldırılacak. Deneme sonuçlarınız korunur.",
      okLabel: "Yerleşik bankaya dön",
    });
    if (!ok) return;
    await resetBank();
    toast("Yerleşik soru bankası etkin.");
  }

  return (
    <Section label="Soru bankası">
      <Card>
        <div className="flex items-start gap-3">
          <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", source === "imported" ? "bg-soft-violet text-violet" : "bg-brandSoft text-brand-blue")}>
            {source === "imported" ? <FileJson size={21} /> : <Database size={21} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold text-navy">
              {loading ? "Yükleniyor…" : source === "imported" ? `İçe aktarılan banka · ${toplam} soru` : `Yerleşik banka · ${toplam} soru`}
            </div>
            <div className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
              {source === "imported"
                ? `${dersSayisi} ders. Dosya yalnızca bu tarayıcıda saklanır.`
                : `${dersSayisi} ders, mevzuata göre hazırlanmış örnek sorular. Mobil uygulamadaki İSGUZEM bankasını (sorular.json) içe aktarabilirsiniz.`}
            </div>
          </div>
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
          <Button kind="secondary" small icon={FileJson} loading={busy} onClick={() => fileRef.current?.click()}>
            İçe aktar (JSON)
          </Button>
          {source === "imported" ? (
            <Button kind="ghost" small icon={RotateCcw} onClick={() => void backToBuiltin()}>
              Yerleşik bankaya dön
            </Button>
          ) : null}
        </div>
        <div className="mt-3 rounded-xl bg-paper px-3 py-2 text-[11.5px] leading-relaxed text-muted">
          Beklenen şema: <span className="num text-navy">{'[{ "sira", "ad", "on": [{ "s", "c": [...], "d" }], "son": [...] }]'}</span> — <b>d</b> doğru şıkkın sırasıdır (0&apos;dan başlar).
        </div>
      </Card>
      <div className="mt-3 flex items-center gap-2 px-1 text-[11.5px] text-muted">
        <Trophy size={13} className="text-orange" />
        Başarı yüzdeleri ders sırasına (sira) göre eşleşir; banka değişse de korunur.
      </div>
      <div className="mt-2 flex items-center gap-2 px-1 text-[11.5px] text-muted">
        <GraduationCap size={13} className="text-violet" />
        Son testte geçme notu {GECME_NOTU}; şıklar her denemede karıştırılır.
      </div>
    </Section>
  );
}
