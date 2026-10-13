"use client";

import { useMemo, useState } from "react";
import { Check, CopyPlus, Plus, Printer, RotateCcw, Trash2, X } from "lucide-react";
import type { HazardClass, Muayene, MuayeneInput, MuayeneSonuc, MuayeneTur } from "@/lib/types";
import { useStore } from "@/lib/store";
import { cx, fmtDate, norm, today } from "@/lib/format";
import { HAZARD_CLASSES } from "@/lib/risk";
import {
  MUAYENE_TURLERI,
  MUAYENE_TUR_LABEL,
  PERIYOT_TEXT,
  SONUCLAR,
  SONUC_LABEL,
  TETKIKLER,
  kisiGecmisi,
  sonrakiTarih,
} from "@/lib/muayene";
import { Badge, Button, Chips, Field, Input, Sheet, Textarea } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { DurumBadge, SonucBadge, TurBadge, printMuayene } from "./shared";

interface FormState {
  calisan: string;
  tc: string;
  isyeri: string;
  gorev: string;
  hazard_class: HazardClass;
  tur: MuayeneTur;
  tarih: string;
  sonraki: string;
  sonuc: MuayeneSonuc;
  tetkikler: string[];
  notlar: string;
}

type Errors = Partial<Record<"calisan" | "tc" | "isyeri" | "sonraki", string>>;

function initialState(m: Partial<Muayene>): FormState {
  const hazard = m.hazard_class ?? "TEHLİKELİ";
  const tarih = m.tarih || today();
  return {
    calisan: m.calisan ?? "",
    tc: m.tc ?? "",
    isyeri: m.isyeri ?? "",
    gorev: m.gorev ?? "",
    hazard_class: hazard,
    tur: m.tur ?? "periyodik",
    tarih,
    sonraki: m.sonraki || sonrakiTarih(tarih, hazard),
    sonuc: m.sonuc ?? "calisabilir",
    tetkikler: [...(m.tetkikler ?? [])],
    notlar: m.notlar ?? "",
  };
}

export function MuayeneForm({
  initial,
  firma,
  hekim,
  onClose,
  onOpen,
}: {
  initial: Partial<Muayene>;
  firma: string;
  hekim: string;
  onClose: () => void;
  /** Başka bir kaydı (geçmiş ya da yeni oluşturulan) formda açar */
  onOpen: (m: Partial<Muayene>) => void;
}) {
  const saveMuayene = useStore((s) => s.saveMuayene);
  const deleteMuayene = useStore((s) => s.deleteMuayene);
  const muayeneler = useStore((s) => s.muayeneler);
  const olaylar = useStore((s) => s.olaylar);
  const denetimler = useStore((s) => s.denetimler);
  const analyses = useStore((s) => s.analyses);

  const [start] = useState(() => initialState(initial));
  const [f, setF] = useState<FormState>(start);
  const [err, setErr] = useState<Errors>({});
  const [hazardTouched, setHazardTouched] = useState(!!initial.id);
  const [custom, setCustom] = useState("");

  const now = today();
  const dirty = JSON.stringify(f) !== JSON.stringify(start);

  // ---- öneriler
  const isyerleri = useMemo(() => {
    const s = new Set<string>();
    for (const m of muayeneler) if (m.isyeri.trim()) s.add(m.isyeri.trim());
    for (const o of olaylar) if (o.isyeri.trim()) s.add(o.isyeri.trim());
    for (const d of denetimler) if (d.isyeri.trim()) s.add(d.isyeri.trim());
    return [...s].sort((a, b) => a.localeCompare(b, "tr"));
  }, [muayeneler, olaylar, denetimler]);

  const gorevler = useMemo(() => {
    const s = new Set<string>();
    for (const m of muayeneler) if (m.gorev.trim()) s.add(m.gorev.trim());
    return [...s].sort((a, b) => a.localeCompare(b, "tr"));
  }, [muayeneler]);

  /** İşyeri adı → bilinen tehlike sınıfı (önce muayene kayıtları, yoksa risk analizleri) */
  const isyeriHazard = useMemo(() => {
    const map = new Map<string, HazardClass>();
    for (const a of analyses) if (a.title.trim()) map.set(norm(a.title), a.hazard_class);
    const sorted = [...muayeneler].sort((a, b) => (a.tarih === b.tarih ? a.id - b.id : a.tarih < b.tarih ? -1 : 1));
    for (const m of sorted) if (m.isyeri.trim()) map.set(norm(m.isyeri), m.hazard_class);
    return map;
  }, [muayeneler, analyses]);

  const gecmis = useMemo(
    () => (f.calisan.trim() && f.isyeri.trim() ? kisiGecmisi(muayeneler, f, initial.id ?? null) : []),
    [muayeneler, f, initial.id],
  );
  /** Geçmişteki kayıt bu formdakinden daha yeni mi (o zaman çalışanın güncel kaydıdır) */
  const isNewer = (m: Muayene) => (m.tarih !== f.tarih ? m.tarih > f.tarih : !!initial.id && m.id > initial.id);

  // ---- alan güncelleyiciler
  const set =
    <K extends keyof FormState>(k: K) =>
    (v: FormState[K]) => {
      setF((p) => ({ ...p, [k]: v }));
      if (k in err) setErr((e) => ({ ...e, [k]: undefined }));
    };

  function setTarih(v: string) {
    setF((p) => ({ ...p, tarih: v, sonraki: sonrakiTarih(v, p.hazard_class) || p.sonraki }));
    setErr((e) => ({ ...e, sonraki: undefined }));
  }

  function setHazard(h: HazardClass) {
    setHazardTouched(true);
    setF((p) => ({ ...p, hazard_class: h, sonraki: sonrakiTarih(p.tarih, h) || p.sonraki }));
    setErr((e) => ({ ...e, sonraki: undefined }));
  }

  function setIsyeri(v: string) {
    setErr((e) => ({ ...e, isyeri: undefined }));
    setF((p) => {
      const next = { ...p, isyeri: v };
      // Bilinen işyeri seçildiyse tehlike sınıfını oradan al (kullanıcı elle seçmediyse)
      const known = !hazardTouched ? isyeriHazard.get(norm(v)) : undefined;
      if (known && known !== p.hazard_class) {
        next.hazard_class = known;
        next.sonraki = sonrakiTarih(p.tarih, known) || p.sonraki;
      }
      return next;
    });
  }

  function toggleTetkik(t: string) {
    setF((p) => ({ ...p, tetkikler: p.tetkikler.includes(t) ? p.tetkikler.filter((x) => x !== t) : [...p.tetkikler, t] }));
  }

  function addCustom() {
    const t = custom.trim();
    if (!t) return;
    setF((p) => (p.tetkikler.some((x) => norm(x) === norm(t)) ? p : { ...p, tetkikler: [...p.tetkikler, t] }));
    setCustom("");
  }

  const computed = sonrakiTarih(f.tarih, f.hazard_class);
  const overridden = !!computed && !!f.sonraki && f.sonraki !== computed;
  const tetkikOpts = [...TETKIKLER, ...f.tetkikler.filter((t) => !TETKIKLER.includes(t))];

  // ---- kaydet / sil / yazdır
  function payload(): MuayeneInput {
    return {
      calisan: f.calisan.trim().replace(/\s+/g, " "),
      tc: f.tc.replace(/\D/g, ""),
      isyeri: f.isyeri.trim().replace(/\s+/g, " "),
      gorev: f.gorev.trim(),
      hazard_class: f.hazard_class,
      tur: f.tur,
      tarih: f.tarih || now,
      sonraki: f.sonraki || computed,
      sonuc: f.sonuc,
      tetkikler: f.tetkikler,
      notlar: f.notlar.trim(),
    };
  }

  function validate(): boolean {
    const e: Errors = {};
    if (!f.calisan.trim()) e.calisan = "Çalışanın adını soyadını yazın.";
    if (!f.isyeri.trim()) e.isyeri = "İşyerini yazın.";
    const tc = f.tc.replace(/\D/g, "");
    if (tc && tc.length !== 11) e.tc = "T.C. kimlik no 11 haneli olmalı.";
    const sonraki = f.sonraki || computed;
    if (sonraki && f.tarih && sonraki <= f.tarih) e.sonraki = "Sonraki muayene, muayene tarihinden sonra olmalı.";
    setErr(e);
    const first = Object.values(e)[0];
    if (first) toast(first, "error");
    return !first;
  }

  function save() {
    if (!validate()) return;
    saveMuayene(payload(), initial.id ?? null);
    toast(initial.id ? "Muayene kaydı güncellendi." : "Muayene kaydedildi.");
    onClose();
  }

  async function remove() {
    if (!initial.id) return onClose();
    const ok = await confirmDialog({
      title: "Kaydı sil",
      text: `${initial.calisan || "Bu çalışan"} için ${fmtDate(initial.tarih)} tarihli muayene kaydı silinecek.`,
      okLabel: "Sil",
      danger: true,
    });
    if (!ok) return;
    deleteMuayene(initial.id);
    toast("Muayene kaydı silindi.");
    onClose();
  }

  function print() {
    if (!validate()) return;
    printMuayene({ ...payload(), id: initial.id }, { firma, hekim });
  }

  /** Aynı çalışan için bugünün tarihiyle yeni periyodik muayene kaydı oluşturur; mevcut kayıt geçmişte kalır. */
  async function periyodikYapildi() {
    if (!validate()) return;
    const ok = await confirmDialog({
      title: "Periyodik muayene yapıldı",
      text: `${f.calisan.trim()} için bugünün tarihiyle yeni bir periyodik muayene kaydı oluşturulacak. Bu kayıt muayene geçmişinde kalır.`,
      okLabel: "Yeni kayıt oluştur",
    });
    if (!ok) return;
    const p = payload();
    if (initial.id && dirty) saveMuayene(p, initial.id);
    const t = today();
    const id = saveMuayene(
      {
        calisan: p.calisan,
        tc: p.tc,
        isyeri: p.isyeri,
        gorev: p.gorev,
        hazard_class: p.hazard_class,
        tur: "periyodik",
        tarih: t,
        sonraki: sonrakiTarih(t, p.hazard_class),
        sonuc: "calisabilir",
        tetkikler: [...p.tetkikler],
        notlar: "",
      },
      null,
    );
    toast("Yeni periyodik muayene kaydı oluşturuldu. Sonucu ve tetkikleri kontrol edin.");
    const created = useStore.getState().muayeneler.find((x) => x.id === id);
    if (created) onOpen(created);
    else onClose();
  }

  async function openOther(m: Muayene) {
    if (dirty) {
      const ok = await confirmDialog({ title: "Kaydedilmemiş değişiklikler", text: "Bu formdaki değişiklikler kaydedilmeden diğer kayıt açılacak.", okLabel: "Devam et" });
      if (!ok) return;
    }
    onOpen(m);
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={initial.id ? "Muayene Kaydı" : "Yeni Muayene Kaydı"}
      wide
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {initial.id ? (
            <Button kind="danger" small icon={Trash2} onClick={remove}>
              Sil
            </Button>
          ) : null}
          <Button kind="ghost" small icon={Printer} onClick={print}>
            Yazdır
          </Button>
          {initial.id ? (
            <Button kind="secondary" small icon={CopyPlus} onClick={periyodikYapildi} title="Bugünün tarihiyle yeni periyodik muayene kaydı oluşturur">
              Periyodik muayene yapıldı
            </Button>
          ) : null}
          <Button icon={Check} onClick={save} className="ml-auto">
            Kaydet
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Field label="Çalışan adı soyadı *" error={err.calisan}>
            <Input value={f.calisan} onChange={(e) => set("calisan")(e.target.value)} autoComplete="off" placeholder="Ad Soyad" />
          </Field>
          <Field label="T.C. kimlik no" error={err.tc} hint="İsteğe bağlı · 11 hane">
            <Input
              value={f.tc}
              onChange={(e) => set("tc")(e.target.value.replace(/\D/g, "").slice(0, 11))}
              inputMode="numeric"
              maxLength={11}
              autoComplete="off"
              mono
              placeholder="___________"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="İşyeri *" error={err.isyeri}>
            <Input value={f.isyeri} onChange={(e) => setIsyeri(e.target.value)} list="muayene-isyerleri" autoComplete="off" placeholder="Firma / şantiye" />
            <datalist id="muayene-isyerleri">
              {isyerleri.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </Field>
          <Field label="Görev">
            <Input value={f.gorev} onChange={(e) => set("gorev")(e.target.value)} list="muayene-gorevler" autoComplete="off" placeholder="Ör. kaynakçı, aşçı" />
            <datalist id="muayene-gorevler">
              {gorevler.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </Field>
        </div>

        <div role="group" aria-label="Tehlike sınıfı">
          <div className="mb-1.5 text-[12.5px] font-bold text-navy">Tehlike sınıfı</div>
          <Chips options={HAZARD_CLASSES.map((h) => ({ value: h, label: h }))} value={f.hazard_class} onChange={setHazard} />
        </div>

        <div role="group" aria-label="Muayene türü">
          <div className="mb-1.5 text-[12.5px] font-bold text-navy">Muayene türü</div>
          <Chips options={MUAYENE_TURLERI.map((t) => ({ value: t, label: MUAYENE_TUR_LABEL[t] }))} value={f.tur} onChange={set("tur")} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Muayene tarihi">
            <Input type="date" value={f.tarih} onChange={(e) => setTarih(e.target.value)} />
          </Field>
          <div>
            <Field label="Sonraki muayene" error={err.sonraki}>
              <Input
                type="date"
                value={f.sonraki}
                onChange={(e) => {
                  set("sonraki")(e.target.value);
                  setErr((x) => ({ ...x, sonraki: undefined }));
                }}
              />
            </Field>
            {!err.sonraki ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
                <span>Tehlike sınıfına göre: {PERIYOT_TEXT[f.hazard_class]}</span>
                {overridden ? (
                  <button
                    type="button"
                    onClick={() => set("sonraki")(computed)}
                    className="inline-flex items-center gap-1 font-bold text-brand-blue hover:underline"
                    title={`Hesaplanan tarihe döndür (${fmtDate(computed)})`}
                  >
                    <RotateCcw size={12} /> <span className="num">{fmtDate(computed)}</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div role="group" aria-label="Sonuç">
          <div className="mb-1.5 text-[12.5px] font-bold text-navy">Sonuç</div>
          <Chips options={SONUCLAR.map((s) => ({ value: s, label: SONUC_LABEL[s] }))} value={f.sonuc} onChange={set("sonuc")} />
          {f.sonuc !== "calisabilir" ? (
            <div className="mt-1.5 text-[12px] font-semibold text-warn">
              {f.sonuc === "kisitli" ? "Kısıtlamaları ve kontrol tarihini notlara yazın." : "Çalışamaz kararının gerekçesini ve yeniden değerlendirme tarihini notlara yazın."}
            </div>
          ) : null}
        </div>

        <div role="group" aria-label="Tetkikler">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span className="text-[12.5px] font-bold text-navy">Tetkikler</span>
            {f.tetkikler.length ? <span className="num text-[12px] font-semibold text-muted">{f.tetkikler.length} seçili</span> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {tetkikOpts.map((t) => {
              const on = f.tetkikler.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTetkik(t)}
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-bold transition",
                    on ? "border-brand-blue bg-soft-blue text-brand-blue" : "border-line bg-white text-text hover:border-brand-blue/40 hover:text-brand-blue",
                  )}
                >
                  {on ? <Check size={13} strokeWidth={3} /> : null}
                  {t}
                  {on && !TETKIKLER.includes(t) ? <X size={12} className="opacity-70" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
              placeholder="Diğer tetkik ekle…"
              className="h-10 py-2 text-[13.5px]"
              aria-label="Diğer tetkik"
            />
            <Button kind="secondary" small icon={Plus} onClick={addCustom} disabled={!custom.trim()} className="h-10">
              Ekle
            </Button>
          </div>
        </div>

        <Field label="Notlar">
          <Textarea
            value={f.notlar}
            onChange={(e) => set("notlar")(e.target.value)}
            placeholder="Bulgular, kısıtlamalar, öneriler, kontrol tarihi…"
            className="min-h-[96px]"
          />
        </Field>

        {gecmis.length ? (
          <div className="rounded-2xl border border-line bg-paper/60 p-3.5">
            <div className="mb-2 text-[12.5px] font-bold text-navy">Muayene geçmişi ({gecmis.length})</div>
            <div className="space-y-1.5">
              {gecmis.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => void openOther(m)}
                  className="flex w-full flex-wrap items-center gap-2 rounded-xl bg-white px-3 py-2 text-left shadow-card transition hover:bg-soft-blue/40"
                >
                  <span className="num text-[13px] font-bold text-navy">{fmtDate(m.tarih)}</span>
                  <TurBadge m={m} />
                  <SonucBadge m={m} />
                  <span className="ml-auto">
                    {isNewer(m) ? <DurumBadge m={m} now={now} /> : <Badge tone="gray">Geçmiş kayıt</Badge>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
