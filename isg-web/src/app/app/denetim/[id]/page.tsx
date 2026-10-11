"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Check, CheckCheck, ClipboardX, FileText, Minus, Save, Trash2, X, type LucideIcon } from "lucide-react";
import type { Cevap, Denetim } from "@/lib/types";
import { SABLONLAR, sablonById } from "@/data/denetim";
import { denetimPuan, useStore } from "@/lib/store";
import { cx, today } from "@/lib/format";
import { Button, ButtonLink, Card, Chips, Empty, Field, Input, Loading, PageHeader, Textarea } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { printDenetim, puanTone, sayim } from "../shared";

export default function DenetimEditorPage() {
  return (
    <Suspense fallback={<Loading />}>
      <EditorGate />
    </Suspense>
  );
}

function EditorGate() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const idParam = String(params?.id ?? "yeni");
  const isNew = idParam === "yeni";
  const numId = isNew ? null : Number(idParam);
  const existing = useStore((s) => (numId ? s.denetimler.find((d) => d.id === numId) : undefined));
  const [gone, setGone] = useState(false);

  if (gone) return <Loading />;
  if (!isNew && !existing) {
    return (
      <div>
        <PageHeader title="Denetim bulunamadı" back="/app/denetim" />
        <Empty
          icon={ClipboardX}
          title="Denetim bulunamadı"
          text="Bu denetim silinmiş olabilir."
          action={
            <ButtonLink href="/app/denetim" kind="secondary">
              Denetimlere dön
            </ButtonLink>
          }
        />
      </div>
    );
  }
  return <DenetimEditor key={existing?.id ?? "yeni"} initial={existing} initialSablon={search.get("sablon")} onDeleted={() => setGone(true)} />;
}

const OPTIONS: { v: Cevap; label: string; icon: LucideIcon; active: string }[] = [
  { v: "uygun", label: "Uygun", icon: Check, active: "border-success bg-success text-white" },
  { v: "uygunsuz", label: "Uygunsuz", icon: X, active: "border-danger bg-danger text-white" },
  { v: "na", label: "Kapsam dışı", icon: Minus, active: "border-muted bg-muted text-white" },
];

function DenetimEditor({ initial, initialSablon, onDeleted }: { initial?: Denetim; initialSablon: string | null; onDeleted: () => void }) {
  const router = useRouter();
  const saveDenetim = useStore((s) => s.saveDenetim);
  const deleteDenetim = useStore((s) => s.deleteDenetim);
  const firma = useStore((s) => s.settings.firma);
  const denetimler = useStore((s) => s.denetimler);
  const olaylar = useStore((s) => s.olaylar);

  const [isyeri, setIsyeri] = useState(initial?.isyeri ?? "");
  const [tarih, setTarih] = useState(initial?.tarih ?? today());
  const [sablonId, setSablonId] = useState(initial?.sablon ?? (SABLONLAR.some((s) => s.id === initialSablon) ? (initialSablon as string) : SABLONLAR[0].id));
  const [cevaplar, setCevaplar] = useState<Record<number, Cevap>>(() => ({ ...(initial?.cevaplar ?? {}) }));
  const [notlar, setNotlar] = useState(initial?.notlar ?? "");
  const [dirty, setDirty] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const sablon = sablonById(sablonId);
  const c = sayim(cevaplar, sablon.maddeler.length);
  const puan = denetimPuan(cevaplar);
  const tone = puanTone(puan);
  const answeredPct = sablon.maddeler.length ? Math.round(((sablon.maddeler.length - c.cevapsiz) * 100) / sablon.maddeler.length) : 0;

  const isyerleri = useMemo(() => {
    const s = new Set<string>();
    for (const d of denetimler) if (d.isyeri) s.add(d.isyeri);
    for (const o of olaylar) if (o.isyeri) s.add(o.isyeri);
    return [...s].sort((a, b) => a.localeCompare(b, "tr"));
  }, [denetimler, olaylar]);

  // Kaydedilmemiş değişiklik varken sekmeyi kapatmaya karşı uyarı
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  function answer(i: number, v: Cevap) {
    setCevaplar((p) => {
      const n = { ...p };
      if (n[i] === v) delete n[i];
      else n[i] = v;
      return n;
    });
    setDirty(true);
  }

  function markAllUygun() {
    setCevaplar((p) => {
      const n = { ...p };
      sablon.maddeler.forEach((_, i) => {
        if (!n[i]) n[i] = "uygun";
      });
      return n;
    });
    setDirty(true);
  }

  async function changeSablon(id: string) {
    if (id === sablonId) return;
    if (Object.keys(cevaplar).length) {
      const ok = await confirmDialog({ title: "Şablon değiştirilsin mi?", text: "Bu denetimdeki tüm cevaplar sıfırlanacak.", okLabel: "Değiştir", danger: true });
      if (!ok) return;
    }
    setSablonId(id);
    setCevaplar({});
    setDirty(true);
  }

  function current() {
    return { isyeri: isyeri.trim(), tarih: tarih || today(), sablon: sablonId, cevaplar, notlar: notlar.trim(), puan };
  }

  async function save() {
    if (!isyeri.trim()) {
      setErr("İşyeri adı girin.");
      toast("İşyeri adı girin.", "error");
      return;
    }
    if (c.cevapsiz) {
      const ok = await confirmDialog({
        title: `${c.cevapsiz} madde cevapsız`,
        text: "Cevapsız maddeler uygunluk puanına dahil edilmez. Yine de kaydedilsin mi?",
        okLabel: "Kaydet",
      });
      if (!ok) return;
    }
    const id = saveDenetim(current(), initial?.id ?? null);
    setDirty(false);
    toast(initial ? "Denetim güncellendi." : "Denetim kaydedildi.");
    if (!initial) router.replace(`/app/denetim/${id}`);
  }

  function pdf() {
    if (!isyeri.trim()) {
      setErr("İşyeri adı girin.");
      toast("PDF için işyeri adı girin.", "error");
      return;
    }
    printDenetim(current(), firma);
  }

  async function remove() {
    if (!initial) return router.push("/app/denetim");
    const ok = await confirmDialog({ title: "Denetimi sil", text: "Bu denetim silinecek.", okLabel: "Sil", danger: true });
    if (!ok) return;
    setDirty(false);
    onDeleted();
    deleteDenetim(initial.id);
    toast("Denetim silindi.");
    router.replace("/app/denetim");
  }

  const ring = 2 * Math.PI * 34;

  return (
    <div>
      <PageHeader
        title={initial ? initial.isyeri || "Denetim" : "Yeni Denetim"}
        subtitle={`${sablon.ad} · ${sablon.maddeler.length} madde${dirty ? " · kaydedilmemiş değişiklik" : ""}`}
        back="/app/denetim"
        actions={
          <>
            <Button kind="ghost" small icon={FileText} onClick={pdf}>
              PDF
            </Button>
            <Button small icon={Save} onClick={save}>
              Kaydet
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr] lg:gap-5 lg:[grid-template-areas:'main_fields'_'main_side']">
        {/* Başlık alanları */}
        <Card className="lg:[grid-area:fields]">
          <div className="space-y-3.5">
            <Field label="İşyeri *" error={err}>
              <Input
                value={isyeri}
                onChange={(e) => {
                  setIsyeri(e.target.value);
                  setDirty(true);
                  if (err) setErr(null);
                }}
                list="denetim-isyerleri"
                autoComplete="off"
                placeholder="Ör. Demirel Otomotiv"
              />
              <datalist id="denetim-isyerleri">
                {isyerleri.map((x) => (
                  <option key={x} value={x} />
                ))}
              </datalist>
            </Field>
            <Field label="Tarih">
              <Input
                type="date"
                value={tarih}
                onChange={(e) => {
                  setTarih(e.target.value);
                  setDirty(true);
                }}
              />
            </Field>
            <div role="group" aria-label="Şablon">
              <div className="mb-1.5 text-[12.5px] font-bold text-navy">Şablon</div>
              <Chips options={SABLONLAR.map((s) => ({ value: s.id, label: s.ad }))} value={sablonId} onChange={changeSablon} />
            </div>
          </div>
        </Card>

        {/* Kontrol listesi */}
        <div className="min-w-0 lg:[grid-area:main]">
          <div className="sticky top-16 z-20 -mx-1 mb-3 px-1 pt-1">
            <div className="rounded-2xl border border-line/70 bg-white/95 p-3 shadow-bar backdrop-blur">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className={cx("num rounded-xl px-2.5 py-1 text-[15px] font-extrabold", tone.bg, tone.text)}>Uygunluk %{puan}</span>
                <span className="num min-w-0 flex-1 text-[12.5px] font-semibold text-muted">
                  <span className="text-success">{c.uygun} uygun</span> · <span className="text-danger">{c.uygunsuz} uygunsuz</span> · {c.na} kapsam dışı ·{" "}
                  <span className={c.cevapsiz ? "text-navy" : ""}>{c.cevapsiz} cevapsız</span>
                </span>
                <Button kind="secondary" small icon={CheckCheck} onClick={markAllUygun} disabled={!c.cevapsiz} title="Cevaplanmamış maddeleri 'Uygun' olarak işaretler">
                  Tümünü uygun işaretle
                </Button>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-paper">
                <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${answeredPct}%` }} />
              </div>
            </div>
          </div>

          <ol className="space-y-2.5">
            {sablon.maddeler.map((m, i) => {
              const v = cevaplar[i];
              return (
                <li
                  key={`${sablon.id}-${i}`}
                  className={cx(
                    "rounded-2xl border bg-white p-3.5 shadow-card transition md:flex md:items-center md:gap-4",
                    v === "uygunsuz" ? "border-danger/40 bg-[#FFF8F9]" : v === "uygun" ? "border-success/30" : v === "na" ? "border-line opacity-80" : "border-line/70",
                  )}
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    <span
                      className={cx(
                        "num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold",
                        v === "uygun" ? "bg-soft-green text-success" : v === "uygunsuz" ? "bg-soft-danger text-danger" : "bg-paper text-muted",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="pt-0.5 text-[14px] font-semibold leading-snug text-ink">{m}</span>
                  </div>
                  <div className="mt-3 grid shrink-0 grid-cols-3 gap-1.5 md:mt-0 md:w-[300px]" role="group" aria-label={`${i + 1}. madde sonucu`}>
                    {OPTIONS.map((o) => {
                      const Icon = o.icon;
                      const on = v === o.v;
                      return (
                        <button
                          key={o.v}
                          type="button"
                          aria-pressed={on}
                          onClick={() => answer(i, o.v)}
                          className={cx(
                            "inline-flex items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-[12.5px] font-bold transition",
                            on ? o.active : "border-line bg-white text-text hover:border-navy/30 hover:bg-paper",
                          )}
                        >
                          <Icon size={14} strokeWidth={2.6} />
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Notlar + özet + işlemler */}
        <div className="lg:sticky lg:top-24 lg:self-start lg:[grid-area:side]">
          <Card>
            <div className="hidden items-center gap-4 lg:flex">
              <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0 -rotate-90">
                <circle cx="42" cy="42" r="34" fill="none" stroke="#EEF2F5" strokeWidth="9" />
                <circle
                  cx="42"
                  cy="42"
                  r="34"
                  fill="none"
                  stroke={tone.hex}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={ring}
                  strokeDashoffset={ring * (1 - puan / 100)}
                  style={{ transition: "stroke-dashoffset .4s ease" }}
                />
              </svg>
              <div>
                <div className={cx("num text-[28px] font-extrabold leading-none", tone.text)}>%{puan}</div>
                <div className="mt-1 text-[12.5px] text-muted">
                  {sablon.maddeler.length - c.cevapsiz}/{sablon.maddeler.length} cevaplandı · {c.uygun} uygun
                </div>
              </div>
            </div>
            <div className="lg:mt-4">
              <Field label="Notlar / tespitler">
                <Textarea
                  value={notlar}
                  onChange={(e) => {
                    setNotlar(e.target.value);
                    setDirty(true);
                  }}
                  placeholder="Tespit edilen uygunsuzluklar, verilen süreler, öneriler…"
                />
              </Field>
            </div>
            <div className="mt-4 space-y-2">
              <Button block icon={Save} onClick={save}>
                Kaydet
              </Button>
              <div className="flex gap-2">
                <Button kind="secondary" small icon={FileText} onClick={pdf} className="flex-1">
                  PDF
                </Button>
                {initial ? (
                  <Button kind="danger" small icon={Trash2} onClick={remove}>
                    Sil
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
