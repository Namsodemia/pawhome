"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Clock3, KeyRound, Layers, ListChecks, Sparkles } from "lucide-react";
import { Button, Card, Chips, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { aiMode, subscribeAiConfig, type AiMode } from "@/lib/ai/client";
import { startGeneration } from "@/lib/ai/riskRunner";
import type { HazardChoice } from "@/lib/ai/risk";
import { HAZARD_CLASSES, ITEM_COUNTS, LEVELS, RISK_META } from "@/lib/risk";

const HAZARD_OPTIONS: { value: HazardChoice; label: string }[] = [
  { value: "OTOMATİK", label: "Otomatik belirle" },
  ...HAZARD_CLASSES.map((h) => ({ value: h, label: h })),
];

const RANGES = { low: "1-7", mid: "8-14", high: "15-19", crit: "20-25" } as const;

export default function NewRiskPage() {
  const router = useRouter();
  const createAnalysis = useStore((s) => s.createAnalysis);
  const [title, setTitle] = useState("");
  const [nace, setNace] = useState("");
  const [sector, setSector] = useState("");
  const [hazard, setHazard] = useState<HazardChoice>("OTOMATİK");
  const [count, setCount] = useState(40);
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);
  const [mode, setMode] = useState<AiMode | null>(null);

  useEffect(() => {
    let alive = true;
    const check = () => {
      void aiMode().then((m) => {
        if (alive) setMode(m);
      });
    };
    check();
    const unsub = subscribeAiConfig(check);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const noAi = mode === "none";
  const req = (v: string) => (tried && !v.trim() ? "Bu alan zorunludur." : null);

  async function save(e?: FormEvent) {
    e?.preventDefault();
    setTried(true);
    if (!title.trim() || !sector.trim() || !desc.trim()) {
      toast("İşyeri adı, sektör ve işletme tanımı zorunludur.", "error");
      return;
    }
    setBusy(true);
    try {
      const id = createAnalysis({
        title,
        nace_code: nace,
        sector_name: sector,
        hazard_class: hazard === "OTOMATİK" ? "TEHLİKELİ" : hazard,
        hazard_auto: hazard === "OTOMATİK",
        description: desc,
        item_count: count,
      });
      const m = mode ?? (await aiMode());
      if (m === "none") {
        toast("Analiz taslak olarak kaydedildi. Yapay zekâ ayarlandığında üretimi başlatabilirsiniz.", "info");
      } else {
        void startGeneration(id);
      }
      router.replace(`/app/risk/${id}`);
    } catch (err) {
      setBusy(false);
      toast(err instanceof Error ? err.message : String(err), "error");
    }
  }

  return (
    <div>
      <PageHeader title="İşletme Bilgileri" subtitle="İşletmeyi ne kadar ayrıntılı anlatırsanız maddeler o kadar isabetli olur." back="/app/risk" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={save} noValidate>
          {noAi ? (
            <div className="mb-4 flex items-start gap-3 rounded-xl2 border border-[#F3DFA8] bg-soft-warn p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-warn">
                <KeyRound size={18} />
              </span>
              <div className="text-[13.5px] leading-relaxed text-[#7A5312]">
                <div className="font-bold">Yapay zekâ için API anahtarı girilmemiş.</div>
                <div>
                  Üretim için{" "}
                  <Link href="/app/ayarlar" className="font-bold text-brand-blue underline underline-offset-2">
                    Ayarlar
                  </Link>
                  &apos;dan anahtarınızı ekleyin. Analizi şimdi taslak olarak kaydedip üretimi sonra başlatabilirsiniz.
                </div>
              </div>
            </div>
          ) : null}

          <Card>
            <div className="grid gap-4">
              <Field label="İşyeri unvanı" error={req(title)}>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn. Demirel Otomotiv San. Tic. Ltd. Şti." autoFocus />
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
                <Field label="NACE kodu">
                  <Input value={nace} onChange={(e) => setNace(e.target.value)} placeholder="Örn. 45.20.01" mono />
                </Field>
                <Field label="Sektör / faaliyet" error={req(sector)}>
                  <Input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Örn. Motorlu kara taşıtları bakım onarımı" />
                </Field>
              </div>
              <Group label="Tehlike sınıfı">
                <Chips options={HAZARD_OPTIONS} value={hazard} onChange={setHazard} />
              </Group>
              <Group label="Madde sayısı">
                <Chips options={ITEM_COUNTS.map((c) => ({ value: c, label: <span className="num">{c}</span> }))} value={count} onChange={setCount} />
              </Group>
              <Field
                label="İşletme tanımı"
                error={req(desc)}
                hint={<span className="num">{desc.trim().length} karakter</span>}
              >
                <Textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Bölümler, makineler, kimyasallar, kat sayısı, personel tipleri, vardiya düzeni, dış alanlar, araçlar..."
                  className="min-h-[180px]"
                />
              </Field>
              <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted">
                <Clock3 size={15} className="mt-0.5 shrink-0" />
                Üretim madde sayısına göre 1-6 dakika sürer. Bölüm bölüm ilerler; yarıda kalırsa kaldığı yerden devam edebilirsiniz.
              </p>
              <Button type="submit" kind="orange" icon={Sparkles} loading={busy} block>
                {noAi ? "Taslak Olarak Kaydet" : "Risk Analizini Üret"}
              </Button>
            </div>
          </Card>
        </form>

        <aside className="space-y-4">
          <Card>
            <div className="section-label">Nasıl çalışır?</div>
            <ol className="mt-4 space-y-4">
              <Step icon={Building2} n={1} title="Planlama">
                İşletme bölümlere ayrılır; tehlike sınıfı, faaliyet tanımı ve çalışanlar belirlenir.
              </Step>
              <Step icon={Layers} n={2} title="Bölüm bölüm maddeler">
                Her bölüm için tehlike, risk, olasılık × şiddet, önlem ve sorumlu yazılır; her bölüm bitince kaydedilir.
              </Step>
              <Step icon={ListChecks} n={3} title="Sektöre özel uygulama">
                NACE koduna özgü prosedür metni eklenir; Excel ve PDF rapor hazır olur.
              </Step>
            </ol>
            <div className="mt-4 rounded-2xl bg-brandSoft p-3 text-[12.5px] leading-relaxed text-brand-teal">
              Üretim arka planda sürer — bu sekme açık kaldığı sürece başka sayfalara geçebilirsiniz.
            </div>
          </Card>

          <Card>
            <div className="section-label">5x5 L tipi matris</div>
            <div className="mt-3 space-y-2">
              {LEVELS.map((k) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="num flex h-8 w-14 shrink-0 items-center justify-center rounded-xl text-[12px] font-extrabold" style={{ background: RISK_META[k].color, color: RISK_META[k].text }}>
                    {RANGES[k]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-bold text-navy">{RISK_META[k].label}</div>
                    <div className="text-[11.5px] text-muted">Termin: {RISK_META[k].termin}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/** Çip grupları için etiket (Field bir <label> olduğundan içindeki ilk butonu tetiklerdi) */
function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label}>
      <div className="mb-1.5 text-[12.5px] font-bold text-navy">{label}</div>
      {children}
    </div>
  );
}

function Step({ icon: Icon, n, title, children }: { icon: typeof Building2; n: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-fab">
        <Icon size={18} />
        <span className="num absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10.5px] font-extrabold text-brand-blue shadow-card">{n}</span>
      </span>
      <div className="min-w-0">
        <div className="text-[13.5px] font-bold text-navy">{title}</div>
        <div className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}
