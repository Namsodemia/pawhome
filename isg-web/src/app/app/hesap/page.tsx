"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Activity, Building2, Calculator, Grid3x3, History } from "lucide-react";
import type { HazardClass } from "@/lib/types";
import { HAZARD_CLASSES, OLASILIK_LABELS, SIDDET_LABELS } from "@/lib/risk";
import { olayStats, useStore } from "@/lib/store";
import { cx, parseNum } from "@/lib/format";
import { Button, Card, Chips, Field, Input, PageHeader } from "@/components/ui";

// Mobil uygulamadaki isg/hesap ekranıyla aynı katsayılar
const UZMAN_DK: Record<HazardClass, number> = { "AZ TEHLİKELİ": 10, TEHLİKELİ: 20, "ÇOK TEHLİKELİ": 40 };
const HEKIM_DK: Record<HazardClass, number> = { "AZ TEHLİKELİ": 5, TEHLİKELİ: 10, "ÇOK TEHLİKELİ": 15 };
const DSP_DK: Record<HazardClass, number> = { "AZ TEHLİKELİ": 0, TEHLİKELİ: 0, "ÇOK TEHLİKELİ": 10 };
const EGITIM: Record<HazardClass, [number, number]> = { "AZ TEHLİKELİ": [8, 3], TEHLİKELİ: [12, 2], "ÇOK TEHLİKELİ": [16, 1] };
const ILKYARDIM: Record<HazardClass, number> = { "AZ TEHLİKELİ": 20, TEHLİKELİ: 15, "ÇOK TEHLİKELİ": 10 };
const DESTEK: Record<HazardClass, number> = { "AZ TEHLİKELİ": 50, TEHLİKELİ: 40, "ÇOK TEHLİKELİ": 30 };

function fmtSaat(dk: number): string {
  const h = Math.floor(dk / 60);
  const m = dk % 60;
  return `${h} sa ${m} dk`;
}

const fmt2 = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Klasik Excel renkleri (Hesaplayıcı) */
function band(score: number): { bg: string; fg: string; label: string } {
  if (score >= 20) return { bg: "#FF0000", fg: "#FFFFFF", label: "KABUL EDİLEMEZ · Derhal" };
  if (score >= 15) return { bg: "#FFC000", fg: "#1E3145", label: "YÜKSEK · 1-15 gün" };
  if (score >= 8) return { bg: "#FFFF00", fg: "#1E3145", label: "DİKKATE DEĞER · 1-30 gün" };
  return { bg: "#92D050", fg: "#1E3145", label: "KABUL EDİLEBİLİR · 1-45 gün" };
}

function Line({ k, v, sub }: { k: string; v: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex gap-3 border-t border-line py-2.5 text-[13.5px]">
      <div className="w-[42%] shrink-0 font-bold text-ink">{k}</div>
      <div className="min-w-0 flex-1 text-text">
        {v}
        {sub ? <div className="mt-0.5 text-[11.5px] text-muted">{sub}</div> : null}
      </div>
    </div>
  );
}

function CardTitle({ icon: Icon, color, title, sub }: { icon: typeof Calculator; color: string; title: string; sub?: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: color }}>
        <Icon size={19} strokeWidth={2.3} />
      </span>
      <div className="min-w-0">
        <h2 className="text-[16.5px] font-extrabold leading-tight text-navy">{title}</h2>
        {sub ? <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{sub}</p> : null}
      </div>
    </div>
  );
}

export default function HesapPage() {
  const olaylar = useStore((s) => s.olaylar);
  const stats = useMemo(() => olayStats(olaylar), [olaylar]);

  const [hz, setHz] = useState<HazardClass>("TEHLİKELİ");
  const [n, setN] = useState("50");
  const [kaza, setKaza] = useState("");
  const [saat, setSaat] = useState("");
  const [kayip, setKayip] = useState("");
  const [o, setO] = useState(3);
  const [s, setS] = useState(4);

  const cal = Math.max(0, Math.round(parseNum(n)));
  const uzman = cal * UZMAN_DK[hz];
  const hekim = cal * HEKIM_DK[hz];
  const dsp = cal * DSP_DK[hz];
  const [egSaat, egYil] = EGITIM[hz];
  const temsilci = cal <= 1 ? 0 : cal <= 50 ? 1 : cal <= 100 ? 2 : cal <= 500 ? 3 : cal <= 1000 ? 4 : cal <= 2000 ? 5 : 6;

  const k = parseNum(kaza);
  const h = parseNum(saat);
  const kg = parseNum(kayip);
  const siklik = h > 0 ? (k * 1_000_000) / h : 0;
  const agirlik = h > 0 ? (kg * 1000) / h : 0;

  const score = o * s;
  const b = band(score);

  return (
    <div>
      <PageHeader title="İSG Hesaplayıcı" subtitle="Yükümlülük süreleri, kaza istatistikleri ve hızlı 5×5 risk skoru" />

      <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {/* 1) İşyeri Yükümlülük Hesabı */}
        <Card className="lg:row-span-2 xl:row-span-1">
          <CardTitle icon={Building2} color="#107398" title="İşyeri Yükümlülük Hesabı" sub="Tehlike sınıfı ve çalışan sayısına göre asgari yükümlülükler." />
          <div className="space-y-3.5">
            <Field label="Tehlike sınıfı">
              <Chips options={HAZARD_CLASSES.map((x) => ({ value: x, label: x }))} value={hz} onChange={setHz} />
            </Field>
            <Field label="Çalışan sayısı">
              <Input type="number" inputMode="numeric" min={0} value={n} onChange={(e) => setN(e.target.value)} mono />
            </Field>
          </div>
          <div className="mt-4">
            <Line k="İSG uzmanı" v={<span className="num">{`${fmtSaat(uzman)} / ay`}</span>} sub={`${UZMAN_DK[hz]} dk × çalışan`} />
            <Line k="İşyeri hekimi" v={<span className="num">{`${fmtSaat(hekim)} / ay`}</span>} sub={`${HEKIM_DK[hz]} dk × çalışan`} />
            {dsp ? (
              <Line k="Diğer sağlık personeli" v={<span className="num">{`${fmtSaat(dsp)} / ay`}</span>} sub={`${DSP_DK[hz]} dk × çalışan`} />
            ) : (
              <Line k="Diğer sağlık personeli" v="Zorunlu değil (çok tehlikeli sınıf 10+ çalışan)" />
            )}
            <Line k="Çalışan eğitimi" v={`En az ${egSaat} saat, ${egYil} yılda bir`} />
            <Line k="Çalışan temsilcisi" v={`${temsilci} kişi`} />
            <Line k="İlk yardımcı" v={`En az ${Math.max(1, Math.ceil(cal / ILKYARDIM[hz]))} kişi (her ${ILKYARDIM[hz]} çalışana 1)`} />
            <Line k="Acil durum destek elemanı" v={`En az ${Math.max(1, Math.ceil(cal / DESTEK[hz]))} kişi (her ${DESTEK[hz]} çalışana 1)`} />
            <Line k="İSG kurulu" v={cal >= 50 ? "Zorunlu (50+ çalışan, 6 aydan uzun iş)" : "Zorunlu değil"} />
            <Line k="Risk değerlendirmesi" v={`En geç ${hz === "AZ TEHLİKELİ" ? 6 : hz === "TEHLİKELİ" ? 4 : 2} yılda bir yenilenir`} />
          </div>
        </Card>

        {/* 2) Kaza İstatistiği */}
        <Card>
          <CardTitle
            icon={Activity}
            color="#D6334C"
            title="Kaza İstatistiği"
            sub="ILO / OSHA yöntemi. Kaza sıklık hızı 1.000.000 saat, ağırlık hızı 1.000 saat bazlıdır."
          />
          <div className="space-y-3.5">
            <Field label="Kaza sayısı (dönem)">
              <Input type="number" inputMode="numeric" min={0} value={kaza} onChange={(e) => setKaza(e.target.value)} mono />
            </Field>
            <Field label="Toplam çalışma saati (dönem)">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={saat}
                onChange={(e) => setSaat(e.target.value)}
                placeholder="Örn. 50 çalışan × 200 saat = 10000"
                mono
              />
            </Field>
            <Field label="Kayıp iş günü (dönem)">
              <Input type="number" inputMode="numeric" min={0} value={kayip} onChange={(e) => setKayip(e.target.value)} mono />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button kind="ghost" small icon={Calculator} onClick={() => setSaat(String(cal * 200))}>
              Çalışma saatini hesapla ({cal} × 200)
            </Button>
            {olaylar.length ? (
              <Button
                kind="ghost"
                small
                icon={History}
                onClick={() => {
                  setKaza(String(stats.kaza));
                  setKayip(String(stats.kayip_gun));
                }}
                title="Kaza / Ramak Kala kayıtlarındaki kaza sayısı ve kayıp günü getirir"
              >
                Kayıtlardan al
              </Button>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-soft-danger/70 p-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-danger">Kaza sıklık hızı (KSH)</div>
              <div className="num mt-1 text-[24px] font-extrabold leading-none text-navy">{fmt2(siklik)}</div>
              <div className="num mt-1.5 text-[11px] leading-snug text-muted">kaza × 1.000.000 ÷ çalışma saati</div>
            </div>
            <div className="rounded-2xl bg-soft-orange/70 p-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#C0561A]">Kaza ağırlık hızı (KAH)</div>
              <div className="num mt-1 text-[24px] font-extrabold leading-none text-navy">{fmt2(agirlik)}</div>
              <div className="num mt-1.5 text-[11px] leading-snug text-muted">kayıp gün × 1.000 ÷ çalışma saati</div>
            </div>
          </div>
        </Card>

        {/* 3) Hızlı 5x5 Skor */}
        <Card>
          <CardTitle icon={Grid3x3} color="#F4772E" title="Hızlı 5x5 Skor" sub="Olasılık × Şiddet. Matristen bir hücre seçebilirsiniz." />
          <div className="space-y-3.5">
            <Field label={`Olasılık (1-5) · ${OLASILIK_LABELS[o - 1]}`}>
              <Scale value={o} onChange={setO} />
            </Field>
            <Field label={`Şiddet (1-5) · ${SIDDET_LABELS[s - 1]}`}>
              <Scale value={s} onChange={setS} />
            </Field>
          </div>

          <div className="mt-4 rounded-2xl p-4 text-center transition-colors" style={{ background: b.bg, color: b.fg }}>
            <div className="num text-[40px] font-extrabold leading-none">{score}</div>
            <div className="mt-1.5 text-[14px] font-extrabold">{b.label}</div>
            <div className="num mt-1 text-[11.5px] font-semibold opacity-80">
              {o} × {s} = {score}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted">
              <span>Olasılık ↑ · Şiddet →</span>
              <span>5×5 matris</span>
            </div>
            <div className="grid grid-cols-[22px_repeat(5,minmax(0,1fr))] gap-1">
              {[5, 4, 3, 2, 1].map((oo) => (
                <Row5 key={oo} o={oo} selO={o} selS={s} onPick={(a, c) => {
                    setO(a);
                    setS(c);
                  }} />
              ))}
              <span />
              {[1, 2, 3, 4, 5].map((ss) => (
                <span key={ss} className="num text-center text-[11px] font-bold text-muted">
                  {ss}
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Scale({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={v === value}
          className={cx(
            "num h-10 rounded-xl border text-[15px] font-extrabold transition",
            v === value ? "border-transparent bg-brand text-white shadow-fab" : "border-line bg-white text-navy hover:border-brand-blue/40",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function Row5({ o, selO, selS, onPick }: { o: number; selO: number; selS: number; onPick: (o: number, s: number) => void }) {
  return (
    <>
      <span className="num flex items-center justify-center text-[11px] font-bold text-muted">{o}</span>
      {[1, 2, 3, 4, 5].map((s) => {
        const sc = o * s;
        const bb = band(sc);
        const sel = o === selO && s === selS;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(o, s)}
            title={`O${o} × Ş${s} = ${sc} · ${bb.label}`}
            className={cx(
              "num flex aspect-[1.35] items-center justify-center rounded-lg text-[12.5px] font-extrabold transition",
              sel ? "z-10 scale-110 shadow-pop ring-[3px] ring-navy" : "opacity-75 hover:opacity-100",
            )}
            style={{ background: bb.bg, color: bb.fg }}
          >
            {sc}
          </button>
        );
      })}
    </>
  );
}
