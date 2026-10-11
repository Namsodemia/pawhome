"use client";

/**
 * Risk analizi üretim yürütücüsü — modül düzeyinde çalışır, böylece kullanıcı başka sayfalara geçse de
 * üretim sürer ve liste sayfası canlı ilerlemeyi gösterebilir. Maddeler bölüm bölüm kaydedilir;
 * hata/durdurma hâlinde o ana kadar üretilenler korunur ve "Kaldığı yerden devam" ile tamamlanır.
 */
import { create } from "zustand";
import type { Analysis, RiskRow } from "@/lib/types";
import { useStore } from "@/lib/store";
import { describeError } from "./client";
import { plan, section, sektorUygulama, type BizInput, type HazardChoice } from "./risk";

export interface RiskJob {
  running: boolean;
  step: string;
  done: number;
  total: number;
  error: string | null;
  /** Kullanıcı "Durdur" dediyse true (hata kartı yerine bilgi kartı gösterilir) */
  stopped: boolean;
  /** Bu çalıştırmada kaydedilen madde sayısı */
  added: number;
}

export const useRiskRunner = create<{ jobs: Record<number, RiskJob> }>(() => ({ jobs: {} }));

/** Bir analizin canlı üretim durumu (yoksa undefined). */
export function useRiskJob(id: number): RiskJob | undefined {
  return useRiskRunner((s) => s.jobs[id]);
}

const controllers = new Map<number, AbortController>();

export function isGenerating(id: number): boolean {
  return controllers.has(id);
}

function patchJob(id: number, patch: Partial<RiskJob>) {
  useRiskRunner.setState((s) => {
    const prev: RiskJob = s.jobs[id] ?? { running: false, step: "", done: 0, total: 1, error: null, stopped: false, added: 0 };
    return { jobs: { ...s.jobs, [id]: { ...prev, ...patch } } };
  });
}

/** Hata / durdurma bilgisini temizler. */
export function clearJob(id: number) {
  if (controllers.has(id)) return;
  useRiskRunner.setState((s) => {
    if (!(id in s.jobs)) return s;
    const jobs = { ...s.jobs };
    delete jobs[id];
    return { jobs };
  });
}

// ---------------------------------------------------------------- sekme kapatma uyarısı

function onBeforeUnload(e: BeforeUnloadEvent) {
  e.preventDefault();
  // Eski tarayıcılar için
  e.returnValue = "";
}
let guardOn = false;
function syncUnloadGuard() {
  if (typeof window === "undefined") return;
  const need = controllers.size > 0;
  if (need && !guardOn) {
    window.addEventListener("beforeunload", onBeforeUnload);
    guardOn = true;
  } else if (!need && guardOn) {
    window.removeEventListener("beforeunload", onBeforeUnload);
    guardOn = false;
  }
}

// ---------------------------------------------------------------- yardımcılar

class Gone extends Error {}

function getAnalysis(id: number): Analysis {
  const a = useStore.getState().analyses.find((x) => x.id === id);
  if (!a) throw new Gone("Analiz bulunamadı.");
  return a;
}

function rowsOf(id: number): RiskRow[] {
  return useStore
    .getState()
    .riskRows.filter((r) => r.analysis_id === id)
    .sort((a, b) => a.sort_no - b.sort_no || a.id - b.id);
}

function bizOf(a: Analysis): BizInput {
  return { description: a.description ?? "", nace_code: a.nace_code ?? "", sector_name: a.sector_name ?? "" };
}

function checkAbort(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Durduruldu", "AbortError");
}

type Body = (ctx: { signal: AbortSignal; progress: (p: Partial<RiskJob>) => void }) => Promise<void>;

async function run(id: number, body: Body): Promise<void> {
  if (controllers.has(id)) return;
  const ctl = new AbortController();
  controllers.set(id, ctl);
  useRiskRunner.setState((s) => ({
    jobs: { ...s.jobs, [id]: { running: true, step: "Hazırlanıyor…", done: 0, total: 1, error: null, stopped: false, added: 0 } },
  }));
  syncUnloadGuard();
  try {
    await body({ signal: ctl.signal, progress: (p) => patchJob(id, p) });
    // Başarılı: iş kaydını kaldır (detay sayfası analiz durumuna göre çizilir)
    controllers.delete(id);
    clearJob(id);
  } catch (e) {
    controllers.delete(id);
    if (e instanceof Gone) {
      clearJob(id);
      return;
    }
    const exists = useStore.getState().analyses.some((x) => x.id === id);
    if (!exists) {
      clearJob(id);
      return;
    }
    // Üretilen maddeler korunur; analiz "yarım kaldı" olarak işaretlenir.
    useStore.getState().updateAnalysis(id, { status: "uretiliyor" });
    if (ctl.signal.aborted) patchJob(id, { running: false, stopped: true, error: null, step: "Üretim durduruldu." });
    else patchJob(id, { running: false, stopped: false, error: describeError(e) });
  } finally {
    controllers.delete(id);
    syncUnloadGuard();
  }
}

// ---------------------------------------------------------------- dış API

/** Baştan tam üretim: plan → meta → mevcut maddeleri sil → bölüm bölüm maddeler → sektöre özel uygulama. */
export function startGeneration(id: number): Promise<void> {
  return run(id, async ({ signal, progress }) => {
    const a = getAnalysis(id);
    const inp = bizOf(a);
    const hazard: HazardChoice = a.hazard_auto ? "OTOMATİK" : a.hazard_class;
    progress({ step: "İşletme planlanıyor…", done: 0, total: 1 });
    const p = await plan({ ...inp, item_count: a.item_count, hazard_class: hazard }, signal);
    checkAbort(signal);
    getAnalysis(id);
    const st = useStore.getState();
    st.updateAnalysis(id, { ...p.meta, status: "uretiliyor" });
    st.clearRows(id);

    const total = p.sections.length + 1;
    let done = 0;
    let added = 0;
    for (const s of p.sections) {
      progress({ step: `${s.bolum} bölümü üretiliyor (${s.count} madde)…`, done, total });
      const rows = await section(inp, s.bolum, s.count, signal);
      checkAbort(signal);
      getAnalysis(id);
      useStore.getState().appendRows(id, rows);
      done += 1;
      added += rows.length;
      progress({ done, added });
    }
    progress({ step: "Sektöre özel uygulama metni yazılıyor…", done, total });
    const su = await sektorUygulama(inp, signal);
    checkAbort(signal);
    getAnalysis(id);
    useStore.getState().updateAnalysis(id, { sektor_uygulama: su, status: "hazir" });
    progress({ done: total });
  });
}

/**
 * Yarım kalan üretimi tamamlar: yalnızca eksik madde sayısı kadar planlar ve zaten var olan bölümleri atlar
 * (atlanan bölümlerin payı kalan yeni bölümlere dağıtılır). Sektöre özel uygulama metni eksikse onu da yazar.
 */
export function resumeGeneration(id: number): Promise<void> {
  return run(id, async ({ signal, progress }) => {
    const a = getAnalysis(id);
    const rows = rowsOf(id);
    const missing = a.item_count - rows.length;
    const needSektor = !a.sektor_uygulama;
    const inp = bizOf(a);

    if (missing <= 0 && !needSektor) {
      useStore.getState().updateAnalysis(id, { status: "hazir" });
      return;
    }

    let added = 0;
    let done = 0;
    if (missing > 0) {
      // Plan adımı hiç tamamlanmadıysa (meta boş) ve kullanıcı "Otomatik belirle" demişse sınıfı yine AI belirlesin.
      const metaMissing = !a.activity_desc && !a.personnel && !a.employer_label;
      const hazard: HazardChoice = a.hazard_auto && metaMissing ? "OTOMATİK" : a.hazard_class;
      progress({ step: "Eksik maddeler planlanıyor…", done: 0, total: 1 });
      const p = await plan({ ...inp, item_count: missing, hazard_class: hazard }, signal);
      checkAbort(signal);
      getAnalysis(id);
      if (metaMissing) useStore.getState().updateAnalysis(id, { ...p.meta });

      const have = new Set(rows.map((r) => r.bolum.trim().toLocaleLowerCase("tr")));
      const fresh = p.sections.filter((s) => !have.has(s.bolum.trim().toLocaleLowerCase("tr")));
      let list = fresh.length ? fresh.map((s) => ({ ...s })) : p.sections;
      if (fresh.length && fresh.length < p.sections.length) {
        // Atlanan bölümlerin madde payını kalan bölümlere dağıt ki toplam yine eksik sayıya eşit olsun.
        let rest = missing - list.reduce((t, s) => t + s.count, 0);
        let i = 0;
        while (rest > 0) {
          list[i % list.length].count += 1;
          rest -= 1;
          i += 1;
        }
      }
      list = list.filter((s) => s.count > 0);

      const total = list.length + (needSektor ? 1 : 0);
      for (const s of list) {
        progress({ step: `${s.bolum} bölümü üretiliyor (${s.count} madde)…`, done, total });
        const out = await section(inp, s.bolum, s.count, signal);
        checkAbort(signal);
        getAnalysis(id);
        useStore.getState().appendRows(id, out);
        done += 1;
        added += out.length;
        progress({ done, added });
      }
    }

    if (needSektor) {
      progress({ step: "Sektöre özel uygulama metni yazılıyor…", done, total: done + 1 });
      const su = await sektorUygulama(inp, signal);
      checkAbort(signal);
      getAnalysis(id);
      if (su) useStore.getState().updateAnalysis(id, { sektor_uygulama: su });
      done += 1;
    }
    useStore.getState().updateAnalysis(id, { status: "hazir" });
    progress({ done, total: done });
  });
}

/** Çalışan üretimi durdurur (kaydedilmiş maddeler korunur). */
export function stopGeneration(id: number): void {
  controllers.get(id)?.abort();
}
