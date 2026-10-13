"use client";

import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { kvDel, kvGet, kvSet } from "./sync";
import { DERSLER, type Ders, type Soru } from "@/data/sorular";
import type { SinavSonuc, SinavTur } from "./types";

export type { Ders, Soru };
export type KarisikSoru = Soru & { ders?: number };

/** İçe aktarılan soru bankası sunucuda (yerel modda IndexedDB'de) bu anahtarla tutulur (mobil projedeki sorular.json ile aynı şema). */
export const BANK_KEY = "isgora-soru-bankasi";
export const GECME_NOTU = 70;
export const LETTERS = ["A", "B", "C", "D", "E", "F"];

export const TUR_LABEL: Record<SinavTur, string> = {
  on: "Ön test",
  son: "Son test",
  hepsi: "Tüm sorular",
  karisik: "Karışık deneme",
};

export type BankSource = "builtin" | "imported";

interface BankState {
  imported: Ders[] | null;
  loaded: boolean;
}

const useBank = create<BankState>(() => ({ imported: null, loaded: false }));
let loadPromise: Promise<void> | null = null;

function ensureLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = kvGet<unknown>("bank", BANK_KEY)
      .then((raw) => {
        const r = raw ? validateBank(raw) : null;
        useBank.setState({ imported: r && r.dersler.length ? r.dersler : null, loaded: true });
      })
      .catch(() => useBank.setState({ imported: null, loaded: true }));
  }
  return loadPromise;
}

export function countQuestions(dersler: Ders[]): number {
  return dersler.reduce((a, d) => a + d.on.length + d.son.length, 0);
}

/** Etkin soru bankası: kullanıcı kendi bankasını içe aktardıysa o, yoksa yerleşik banka. */
export function useQuestionBank(): { dersler: Ders[]; toplam: number; source: BankSource; loading: boolean } {
  const imported = useBank((s) => s.imported);
  const loaded = useBank((s) => s.loaded);
  useEffect(() => {
    void ensureLoaded();
  }, []);
  const dersler = imported ?? DERSLER;
  const toplam = useMemo(() => countQuestions(dersler), [dersler]);
  return { dersler, toplam, source: imported ? "imported" : "builtin", loading: !loaded };
}

// ---------------------------------------------------------------- doğrulama / içe aktarma

function validSoru(q: unknown): Soru | null {
  if (!q || typeof q !== "object") return null;
  const o = q as Record<string, unknown>;
  const s = typeof o.s === "string" ? o.s.trim() : "";
  if (!s || !Array.isArray(o.c)) return null;
  const c = o.c.map((x) => (typeof x === "string" ? x : typeof x === "number" ? String(x) : null));
  if (c.length < 2 || c.length > 6 || c.some((x) => x === null || !x.trim())) return null;
  const d = typeof o.d === "number" ? o.d : typeof o.d === "string" && /^\d+$/.test(o.d) ? Number(o.d) : NaN;
  if (!Number.isInteger(d) || d < 0 || d >= c.length) return null;
  return { s, c: c as string[], d };
}

/** sorular.json şemasını doğrular; geçersiz sorular atlanır. Hiç geçerli ders yoksa hata fırlatır. */
export function validateBank(raw: unknown): { dersler: Ders[]; skipped: number } {
  let arr: unknown = raw;
  if (arr && !Array.isArray(arr) && typeof arr === "object") {
    const o = arr as Record<string, unknown>;
    arr = o.dersler ?? o.DERSLER ?? o.data;
  }
  if (!Array.isArray(arr)) throw new Error("Dosya bir ders listesi (JSON dizi) içermiyor.");
  let skipped = 0;
  const out: Ders[] = [];
  arr.forEach((item, i) => {
    if (!item || typeof item !== "object") return;
    const o = item as Record<string, unknown>;
    const sira = typeof o.sira === "number" ? o.sira : Number(o.sira) || i + 1;
    const ad = typeof o.ad === "string" && o.ad.trim() ? o.ad.trim() : `Ders ${sira}`;
    const pick = (v: unknown): Soru[] => {
      if (!Array.isArray(v)) return [];
      const qs: Soru[] = [];
      for (const q of v) {
        const ok = validSoru(q);
        if (ok) qs.push(ok);
        else skipped += 1;
      }
      return qs;
    };
    const on = pick(o.on);
    const son = pick(o.son);
    if (on.length + son.length > 0) out.push({ sira, ad, on, son });
  });
  if (!out.length) throw new Error("Geçerli soru bulunamadı. Beklenen şema: [{ sira, ad, on: [{ s, c, d }], son: [...] }]");
  out.sort((a, b) => a.sira - b.sira);
  return { dersler: out, skipped };
}

export async function importBankFile(file: File): Promise<{ dersler: number; soru: number; skipped: number }> {
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text.replace(/^﻿/, ""));
  } catch {
    throw new Error("Dosya okunamadı: geçerli bir JSON değil.");
  }
  const r = validateBank(raw);
  try {
    await kvSet("bank", BANK_KEY, r.dersler);
  } catch {
    throw new Error("Soru bankası kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.");
  }
  loadPromise = Promise.resolve();
  useBank.setState({ imported: r.dersler, loaded: true });
  return { dersler: r.dersler.length, soru: countQuestions(r.dersler), skipped: r.skipped };
}

export async function resetBank(): Promise<void> {
  try {
    await kvDel("bank", BANK_KEY);
  } catch {
    /* yok say */
  }
  loadPromise = Promise.resolve();
  useBank.setState({ imported: null, loaded: true });
}

// ---------------------------------------------------------------- soru seçimi

function fisherYates<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deterministik olmayan karışık deneme: tüm derslerden (veya seçilenlerden) rastgele n soru. */
export function karisikSorular(dersler: Ders[], n: number, filtre?: number[]): (Soru & { ders: number })[] {
  const pool: (Soru & { ders: number })[] = [];
  for (const d of dersler) {
    if (filtre && filtre.length && !filtre.includes(d.sira)) continue;
    for (const q of [...d.on, ...d.son]) pool.push({ ...q, ders: d.sira });
  }
  fisherYates(pool);
  return pool.slice(0, Math.min(n, pool.length));
}

/** Şıkları karıştırır, doğru indeksini günceller. Şıkların hepsi sayıysa sıra korunur. */
export function shuffleOptions(q: Soru): Soru {
  const numeric = q.c.every((x) => /^[0-9]+([.,][0-9]+)?$/.test(x.trim()));
  if (numeric) return q;
  const idx = fisherYates(q.c.map((_, i) => i));
  return { s: q.s, c: idx.map((i) => q.c[i]), d: idx.indexOf(q.d) };
}

// ---------------------------------------------------------------- sonuç yardımcıları

export function sonucPct(r: Pick<SinavSonuc, "dogru" | "toplam">): number {
  return r.toplam ? Math.round((r.dogru * 100) / r.toplam) : 0;
}

/** Ders sırasına göre en iyi yüzde (ders_sira null olan karışık denemeler hariç). */
export function bestByDers(list: SinavSonuc[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const r of list) {
    if (r.ders_sira == null || !r.toplam) continue;
    const p = sonucPct(r);
    if (out[r.ders_sira] == null || p > out[r.ders_sira]) out[r.ders_sira] = p;
  }
  return out;
}

export function fmtSure(sn: number): string {
  const s = Math.max(0, Math.floor(sn || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
