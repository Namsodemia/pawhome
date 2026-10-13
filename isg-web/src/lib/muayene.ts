import type { HazardClass, Muayene, MuayeneSonuc, MuayeneTur } from "./types";
import { addYears, norm, today } from "./format";

// İşyeri hekimi — Periyodik Muayene / Sağlık Gözetimi yardımcıları (6331 sayılı Kanun m.15).

/** Badge bileşeninin kabul ettiği tonların alt kümesi */
export type MuayeneTone = "green" | "blue" | "teal" | "orange" | "red" | "gray" | "violet" | "warn";

// ---------------------------------------------------------------- muayene türü / sonuç

export const MUAYENE_TURLERI: MuayeneTur[] = ["ise_giris", "periyodik", "ise_donus", "gorev_degisikligi"];

export const MUAYENE_TUR_LABEL: Record<MuayeneTur, string> = {
  ise_giris: "İşe giriş",
  periyodik: "Periyodik",
  ise_donus: "İşe dönüş",
  gorev_degisikligi: "Görev değişikliği",
};

export const MUAYENE_TUR_TONE: Record<MuayeneTur, MuayeneTone> = {
  ise_giris: "blue",
  periyodik: "teal",
  ise_donus: "violet",
  gorev_degisikligi: "orange",
};

export const SONUCLAR: MuayeneSonuc[] = ["calisabilir", "kisitli", "calisamaz"];

export const SONUC_LABEL: Record<MuayeneSonuc, string> = {
  calisabilir: "Çalışabilir",
  kisitli: "Kısıtlı çalışabilir",
  calisamaz: "Çalışamaz",
};

export const SONUC_TONE: Record<MuayeneSonuc, MuayeneTone> = {
  calisabilir: "green",
  kisitli: "warn",
  calisamaz: "red",
};

// ---------------------------------------------------------------- periyot

/** Periyodik muayene sıklığı — tehlike sınıfına göre en geç (yıl) */
export const PERIYOT_YIL: Record<HazardClass, number> = {
  "ÇOK TEHLİKELİ": 1,
  TEHLİKELİ: 3,
  "AZ TEHLİKELİ": 5,
};

export const PERIYOT_TEXT: Record<HazardClass, string> = {
  "ÇOK TEHLİKELİ": "yılda bir",
  TEHLİKELİ: "3 yılda bir",
  "AZ TEHLİKELİ": "5 yılda bir",
};

/** Bilgi kartları için: [etiket, periyot] */
export const PERIYOT_SATIRLARI: [string, string][] = [
  ["Çok tehlikeli", PERIYOT_TEXT["ÇOK TEHLİKELİ"]],
  ["Tehlikeli", PERIYOT_TEXT["TEHLİKELİ"]],
  ["Az tehlikeli", PERIYOT_TEXT["AZ TEHLİKELİ"]],
];

const ISO_RE = /^\d{4}-\d{2}-\d{2}/;

/** Muayene tarihi + tehlike sınıfı periyodu → bir sonraki periyodik muayene tarihi (29 Şubat güvenli). */
export function sonrakiTarih(tarih: string, hazardClass: HazardClass): string {
  if (!ISO_RE.test(tarih || "")) return "";
  const out = addYears(tarih, PERIYOT_YIL[hazardClass] ?? 3);
  const [y, m, d] = out.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  if (d <= last) return out;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${y}-${p(m)}-${p(last)}`;
}

// ---------------------------------------------------------------- durum

export type MuayeneDurum = "gecikmis" | "yaklasan" | "guncel";

/** Bu kadar gün (dahil) kalan muayeneler "yaklaşan" sayılır */
export const YAKLASAN_GUN = 30;

export const DURUM_META: Record<MuayeneDurum, { label: string; tone: MuayeneTone; color: string }> = {
  gecikmis: { label: "Gecikmiş", tone: "red", color: "#D6334C" },
  yaklasan: { label: "Yaklaşan", tone: "warn", color: "#B7791F" },
  guncel: { label: "Güncel", tone: "green", color: "#2E9E5B" },
};

function dayNumber(iso: string): number | null {
  if (!ISO_RE.test(iso || "")) return null;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Bugünden hedef tarihe kalan gün (geçmişse negatif). Geçersiz tarihte null. */
export function gunKaldi(sonraki: string, now: string = today()): number | null {
  const a = dayNumber(now);
  const b = dayNumber(sonraki);
  if (a === null || b === null) return null;
  return b - a;
}

export function durum(m: Pick<Muayene, "sonraki">, now: string = today()): MuayeneDurum {
  const g = gunKaldi(m.sonraki, now);
  if (g === null) return "guncel";
  if (g < 0) return "gecikmis";
  if (g <= YAKLASAN_GUN) return "yaklasan";
  return "guncel";
}

/** "12 gün gecikti" / "Bugün" / "8 gün kaldı" / "Güncel" */
export function durumText(m: Pick<Muayene, "sonraki">, now: string = today()): string {
  const g = gunKaldi(m.sonraki, now);
  if (g === null) return "Tarih yok";
  if (g < 0) return `${-g} gün gecikti`;
  if (g === 0) return "Bugün";
  if (g <= YAKLASAN_GUN) return `${g} gün kaldı`;
  return "Güncel";
}

// ---------------------------------------------------------------- tetkikler

export const TETKIKLER: string[] = [
  "Odyometri",
  "SFT (solunum fonksiyon testi)",
  "Akciğer grafisi",
  "Tam kan sayımı",
  "Biyokimya",
  "Göz muayenesi",
  "EKG",
  "Kan kurşun düzeyi",
  "Hepatit markerları",
  "Psikoteknik",
  "Tetanoz aşısı",
];

// ---------------------------------------------------------------- kişi bazında son kayıt

/**
 * Aynı çalışanın kayıtlarını eşleştirmek için anahtar: 11 haneli TC varsa TC,
 * yoksa ad soyad + işyeri (Türkçe-güvenli normalize).
 */
export function kisiKey(m: Pick<Muayene, "tc" | "calisan" | "isyeri">): string {
  const tc = (m.tc || "").replace(/\D/g, "");
  if (tc.length === 11) return `tc:${tc}`;
  return `ad:${norm(m.calisan)}|${norm(m.isyeri)}`;
}

function newer(a: Muayene, b: Muayene): boolean {
  if (a.tarih !== b.tarih) return a.tarih > b.tarih;
  return a.id > b.id;
}

/** Her çalışanın en güncel muayene kaydı (eski kayıtlar geçmiş sayılır, durum hesabına girmez). */
export function sonKayitlar(list: Muayene[]): Muayene[] {
  const map = new Map<string, Muayene>();
  for (const m of list) {
    const k = kisiKey(m);
    const cur = map.get(k);
    if (!cur || newer(m, cur)) map.set(k, m);
  }
  return [...map.values()];
}

/** Bir kaydın sahibinin diğer (geçmiş/sonraki) kayıtları, yeniden eskiye. */
export function kisiGecmisi(list: Muayene[], m: Pick<Muayene, "tc" | "calisan" | "isyeri">, excludeId?: number | null): Muayene[] {
  const k = kisiKey(m);
  return list.filter((x) => x.id !== excludeId && kisiKey(x) === k).sort((a, b) => (newer(a, b) ? -1 : 1));
}

/** Sonraki muayene tarihine göre artan (gecikmişler en üstte); tarihsizler en sonda. */
export function siraliSonraki(list: Muayene[]): Muayene[] {
  return [...list].sort((a, b) => {
    const x = a.sonraki || "9999-12-31";
    const y = b.sonraki || "9999-12-31";
    if (x !== y) return x < y ? -1 : 1;
    return a.calisan.localeCompare(b.calisan, "tr");
  });
}

export interface MuayeneStats {
  calisan: number;
  gecikmis: number;
  yaklasan: number;
  guncel: number;
  /** kısıtlı çalışabilir + çalışamaz */
  kisitli: number;
  isyeri: number;
}

export function muayeneStats(list: Muayene[], now: string = today()): MuayeneStats {
  const son = sonKayitlar(list);
  const s: MuayeneStats = { calisan: son.length, gecikmis: 0, yaklasan: 0, guncel: 0, kisitli: 0, isyeri: 0 };
  const isyerleri = new Set<string>();
  for (const m of son) {
    s[durum(m, now)] += 1;
    if (m.sonuc !== "calisabilir") s.kisitli += 1;
    if (m.isyeri.trim()) isyerleri.add(norm(m.isyeri));
  }
  s.isyeri = isyerleri.size;
  return s;
}
