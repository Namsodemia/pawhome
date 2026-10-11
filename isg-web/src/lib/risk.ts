import type { HazardClass } from "./types";

// 5x5 L tipi matris — skor = olasılık × şiddet
export type Level = "low" | "mid" | "high" | "crit";

export function score(o: number, s: number): number {
  return o * s;
}

export function level(sc: number): Level {
  if (sc >= 20) return "crit";
  if (sc >= 15) return "high";
  if (sc >= 8) return "mid";
  return "low";
}

export const RISK_META: Record<Level, { label: string; short: string; color: string; text: string; termin: string }> = {
  low: { label: "KABUL EDİLEBİLİR", short: "Düşük", color: "#8BD35C", text: "#1E3145", termin: "1-45 Gün" },
  mid: { label: "DİKKATE DEĞER", short: "Orta", color: "#FFD100", text: "#1E3145", termin: "1-30 Gün" },
  high: { label: "YÜKSEK RİSK", short: "Yüksek", color: "#F4772E", text: "#1E3145", termin: "1-15 Gün" },
  crit: { label: "KABUL EDİLEMEZ", short: "Kritik", color: "#D6334C", text: "#FFFFFF", termin: "Derhal" },
};

/** Excel'deki klasik renkler (Hesaplayıcı ve dışa aktarım için) */
export const EXCEL_COLORS: Record<Level, string> = { crit: "FF0000", high: "FFC000", mid: "FFFF00", low: "92D050" };

export const LEVELS: Level[] = ["low", "mid", "high", "crit"];

export function meta(o: number, s: number) {
  const sc = score(o, s);
  const lv = level(sc);
  return { score: sc, level: lv, ...RISK_META[lv] };
}

export const HAZARD_CLASSES: HazardClass[] = ["AZ TEHLİKELİ", "TEHLİKELİ", "ÇOK TEHLİKELİ"];
export const HAZARD_VALIDITY_YEARS: Record<HazardClass, number> = { "AZ TEHLİKELİ": 6, TEHLİKELİ: 4, "ÇOK TEHLİKELİ": 2 };

export const OLASILIK_LABELS = ["Çok küçük", "Küçük", "Orta", "Yüksek", "Çok yüksek"];
export const SIDDET_LABELS = ["Çok hafif", "Hafif", "Orta", "Ciddi", "Çok ciddi"];

export const ITEM_COUNTS = [20, 30, 40, 60, 80, 100, 150];

export function isHazardClass(v: unknown): v is HazardClass {
  return typeof v === "string" && (HAZARD_CLASSES as string[]).includes(v);
}
