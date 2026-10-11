"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Sparkles, Trash2 } from "lucide-react";
import { Button, Field, Input, Sheet, Textarea } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { describeError } from "@/lib/ai/client";
import { improveRow } from "@/lib/ai/risk";
import { OLASILIK_LABELS, SIDDET_LABELS, meta } from "@/lib/risk";
import { cx, upperTR } from "@/lib/format";
import { gradeLabel } from "@/lib/export/risk-common";
import type { Analysis, RiskRow, RiskRowInput } from "@/lib/types";

const EMPTY: RiskRowInput = { bolum: "", faaliyet: "", tehlike: "", risk: "", o: 3, s: 3, onlem: "", sorumlu: "İŞVEREN" };

function pick(r: RiskRow): RiskRowInput {
  return { bolum: r.bolum, faaliyet: r.faaliyet, tehlike: r.tehlike, risk: r.risk, o: r.o, s: r.s, onlem: r.onlem, sorumlu: r.sorumlu };
}

/**
 * Risk maddesi düzenleyici (mobil uygulamadaki risk/row ekranı) — hem düzenleme hem "Madde ekle" için.
 * Her açılışta yeniden bağlanır (üst bileşen key ile), bu yüzden form durumu props'tan başlatılır.
 */
export function RowEditor({
  analysis,
  row,
  defaultBolum = "",
  sections,
  onClose,
}: {
  analysis: Analysis;
  row: RiskRow | null;
  defaultBolum?: string;
  sections: string[];
  onClose: () => void;
}) {
  const [f, setF] = useState<RiskRowInput>(() => (row ? pick(row) : { ...EMPTY, bolum: defaultBolum }));
  const [ai, setAi] = useState(false);
  const [tried, setTried] = useState(false);
  const ctl = useRef<AbortController | null>(null);

  // Pencere kapanırsa süren AI isteğini iptal et
  useEffect(() => () => ctl.current?.abort(), []);

  const set = <K extends keyof RiskRowInput>(k: K, v: RiskRowInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const m = meta(f.o, f.s);

  function save() {
    setTried(true);
    if (!f.tehlike.trim() || !f.risk.trim()) {
      toast("Tehlike ve risk alanları zorunludur.", "error");
      return;
    }
    const clean: RiskRowInput = {
      bolum: f.bolum.trim(),
      faaliyet: f.faaliyet.trim(),
      tehlike: f.tehlike.trim(),
      risk: f.risk.trim(),
      o: f.o,
      s: f.s,
      onlem: f.onlem.trim(),
      sorumlu: upperTR((f.sorumlu || "").trim()) || "İŞVEREN",
    };
    const st = useStore.getState();
    if (row) {
      st.updateRow(row.id, clean);
      toast("Madde kaydedildi.");
    } else {
      st.appendRows(analysis.id, [clean]);
      toast("Madde eklendi.");
    }
    onClose();
  }

  async function improve() {
    ctl.current?.abort();
    const c = new AbortController();
    ctl.current = c;
    setAi(true);
    try {
      const ctx = `${analysis.title} — NACE ${analysis.nace_code} — ${analysis.sector_name}: ${analysis.description ?? ""}`.slice(0, 1500);
      const better = await improveRow(f, ctx, c.signal);
      if (c.signal.aborted) return;
      setF(better);
      toast("Madde yapay zekâ ile güçlendirildi. Kaydetmeyi unutmayın.", "info");
    } catch (e) {
      if (!c.signal.aborted) toast(`İyileştirilemedi: ${describeError(e)}`, "error");
    } finally {
      if (ctl.current === c) {
        ctl.current = null;
        setAi(false);
      }
    }
  }

  async function remove() {
    if (!row) return;
    const ok = await confirmDialog({ title: "Maddeyi sil", text: "Bu risk maddesi silinecek.", okLabel: "Sil", danger: true });
    if (!ok) return;
    useStore.getState().deleteRow(row.id);
    toast("Madde silindi.");
    onClose();
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={row ? "Maddeyi Düzenle" : "Madde Ekle"}
      wide
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {row ? (
            <Button kind="danger" icon={Trash2} onClick={remove} disabled={ai} className="max-sm:order-3 max-sm:w-full">
              Maddeyi sil
            </Button>
          ) : null}
          <div className="ml-auto flex w-full gap-2 sm:w-auto">
            <Button kind="secondary" icon={Sparkles} loading={ai} onClick={improve} className="flex-1 sm:flex-none">
              AI ile güçlendir
            </Button>
            <Button icon={Check} onClick={save} disabled={ai} className="flex-1 sm:flex-none">
              Kaydet
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-4 rounded-xl2 p-4 transition-colors" style={{ background: m.color, color: m.text }}>
        <span className="num text-[42px] font-extrabold leading-none">{m.score}</span>
        <div className="min-w-0">
          <div className="text-[15px] font-extrabold">{gradeLabel(m.level)}</div>
          <div className="text-[12.5px] font-semibold opacity-80">
            Olasılık <span className="num">{f.o}</span> × Şiddet <span className="num">{f.s}</span> · Termin {m.termin}
          </div>
        </div>
      </div>

      <div className={cx("mt-4 grid gap-4", ai && "pointer-events-none opacity-60")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Bölüm">
            <Input value={f.bolum} onChange={(e) => set("bolum", e.target.value)} placeholder="Örn. Mutfak" list="risk-bolum-list" />
            <datalist id="risk-bolum-list">
              {sections.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="Faaliyet">
            <Input value={f.faaliyet} onChange={(e) => set("faaliyet", e.target.value)} placeholder="Örn. Sıcak yağda kızartma" />
          </Field>
        </div>
        <Field label="Tehlike (kaynak / durum) *" error={tried && !f.tehlike.trim() ? "Tehlike alanı zorunludur." : null}>
          <Textarea
            value={f.tehlike}
            onChange={(e) => set("tehlike", e.target.value)}
            placeholder="Örn. Kızartmada sıçrayan kızgın yağ ve sıcak yüzeyler"
            className="!min-h-[76px]"
          />
        </Field>
        <Field label="Risk (olası sonuç) *" error={tried && !f.risk.trim() ? "Risk alanı zorunludur." : null}>
          <Input value={f.risk} onChange={(e) => set("risk", e.target.value)} placeholder="Örn. Yanık ve haşlanma" />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Scale label="Olasılık" value={f.o} labels={OLASILIK_LABELS} onChange={(v) => set("o", v)} />
          <Scale label="Şiddet" value={f.s} labels={SIDDET_LABELS} onChange={(v) => set("s", v)} />
        </div>
        <Field label="Alınacak önlem">
          <Textarea value={f.onlem} onChange={(e) => set("onlem", e.target.value)} placeholder="Somut ve uygulanabilir önlem…" />
        </Field>
        <Field label="Sorumlu">
          <Input value={f.sorumlu} onChange={(e) => set("sorumlu", upperTR(e.target.value))} placeholder="İŞVEREN" autoCapitalize="characters" />
        </Field>
      </div>
    </Sheet>
  );
}

function Scale({ label, value, labels, onChange }: { label: string; value: number; labels: string[]; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-[12.5px] font-bold text-navy">
        {label} — <span className="text-brand-blue">{labels[value - 1]}</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              title={labels[n - 1]}
              onClick={() => onChange(n)}
              className={cx(
                "flex flex-col items-center justify-center rounded-2xl border py-2.5 transition",
                active ? "border-transparent bg-brand text-white shadow-fab" : "border-line bg-white text-text hover:border-brand-blue/40 hover:text-brand-blue",
              )}
            >
              <span className="num text-[16px] font-extrabold leading-none">{n}</span>
              <span className={cx("mt-1 hidden text-[9.5px] font-semibold leading-tight sm:block", active ? "text-white/85" : "text-muted")}>{labels[n - 1]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
