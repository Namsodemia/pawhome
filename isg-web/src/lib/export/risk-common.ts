import type { Analysis, RiskRow } from "@/lib/types";
import { HAZARD_VALIDITY_YEARS, RISK_META, type Level } from "@/lib/risk";
import { addYears } from "@/lib/format";

/** İSG Risk Değerlendirme tablosunun 12 kolonu (Excel + PDF) */
export const RISK_HEADERS = [
  "SIRA NO",
  "BÖLÜM",
  "FAALİYET",
  "TEHLİKE",
  "RİSK",
  "OLASILIK",
  "ŞİDDET",
  "RİSK SKORU",
  "RİSK DERECESİ",
  "ALINACAK ÖNLEM",
  "SORUMLU",
  "TERMİN",
];

/** "KABUL EDİLEBİLİR RİSK", "DİKKATE DEĞER RİSK", "YÜKSEK RİSK", "KABUL EDİLEMEZ RİSK" (çift "RİSK" yazılmaz) */
export function gradeLabel(lv: Level): string {
  const l = RISK_META[lv].label;
  return /RİSK$/.test(l) ? l : `${l} RİSK`;
}

export function validityYears(a: Pick<Analysis, "hazard_class">): number {
  return HAZARD_VALIDITY_YEARS[a.hazard_class] ?? 4;
}

/** Geçerlilik tarihi = değerlendirme tarihi + tehlike sınıfına göre yıl (YYYY-MM-DD) */
export function validUntil(a: Pick<Analysis, "hazard_class" | "analysis_date">): string {
  return addYears(a.analysis_date, validityYears(a));
}

/** Analizin maddeleri, sıra numarasına göre. */
export function sortedRows(rows: RiskRow[], analysisId: number): RiskRow[] {
  return rows.filter((r) => r.analysis_id === analysisId).sort((a, b) => a.sort_no - b.sort_no || a.id - b.id);
}

/** "1) … . 2) … ." biçimindeki tek satırlık metni maddelere ayırır. */
export function sektorItems(text: string): string[] {
  const s = (text || "").trim();
  if (!s) return [];
  const parts = s
    .split(/\s+(?=\d{1,2}\)\s)/)
    .map((p) =>
      p
        .replace(/^\d{1,2}\)\s*/, "")
        .replace(/\s*\.\s*$/, "")
        .trim(),
    )
    .filter(Boolean);
  return parts.length ? parts : [s];
}
