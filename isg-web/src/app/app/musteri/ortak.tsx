"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { Badge } from "@/components/ui";
import { cx } from "@/lib/format";
import { ekipEkle, ekipGuncelle, ekipListe, ekipSil, type Calisan, type CalisanInput, type CalisanRol } from "@/lib/api";
import { useSync } from "@/lib/sync";
import { useStore } from "@/lib/store";
import type { Firma, FirmaInput, HazardClass } from "@/lib/types";

/**
 * Müşteri Takip (firma bazlı) ortak parçaları:
 *  - hizmet önerileri, tehlike sınıfı etiketleri
 *  - OSGB çalışanları (İGU / İH / DSP) önbelleği ve firmalara atama yardımcıları
 */

// ---------------------------------------------------------------- hizmetler

export const FIRMA_HIZMETLERI = ["İSG Hizmeti", "Eğitim", "Risk Analizi", "Periyodik Muayene"];

/** Kayıtlı hizmet / grup adları + hazır öneriler (tekrarsız, kayıtlılar önce). */
export function hizmetSecenekleri(existing: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const g of [...existing, ...FIRMA_HIZMETLERI]) {
    const t = (g || "").trim();
    const key = t.toLocaleLowerCase("tr-TR");
    if (!t || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

// ---------------------------------------------------------------- tehlike sınıfı

export const TEHLIKE_SINIFLARI: HazardClass[] = ["AZ TEHLİKELİ", "TEHLİKELİ", "ÇOK TEHLİKELİ"];
export const TEHLIKE_ETIKET: Record<HazardClass, string> = {
  "AZ TEHLİKELİ": "Az tehlikeli",
  TEHLİKELİ: "Tehlikeli",
  "ÇOK TEHLİKELİ": "Çok tehlikeli",
};
export const TEHLIKE_TONE: Record<HazardClass, "green" | "warn" | "red"> = {
  "AZ TEHLİKELİ": "green",
  TEHLİKELİ: "warn",
  "ÇOK TEHLİKELİ": "red",
};

export function isTehlike(v: unknown): v is HazardClass {
  return typeof v === "string" && (TEHLIKE_SINIFLARI as string[]).includes(v);
}

export function TehlikeBadge({ h, className }: { h: HazardClass | "" | undefined; className?: string }) {
  if (!isTehlike(h)) return null;
  return (
    <Badge tone={TEHLIKE_TONE[h]} className={cx("!py-0.5", className)}>
      {TEHLIKE_ETIKET[h]}
    </Badge>
  );
}

// ---------------------------------------------------------------- roller ve atamalar

export type AtamaAlan = "igu_id" | "ih_id" | "dsp_id";

export const ATAMALAR: { alan: AtamaAlan; rol: CalisanRol; kisa: string; ad: string }[] = [
  { alan: "igu_id", rol: "uzman", kisa: "İGU", ad: "İş Sağlığı ve Güvenliği Uzmanı" },
  { alan: "ih_id", rol: "hekim", kisa: "İH", ad: "İşyeri Hekimi" },
  { alan: "dsp_id", rol: "dsp", kisa: "DSP", ad: "Diğer Sağlık Personeli" },
];

export const ROL_TONE: Record<CalisanRol, "green" | "red" | "violet"> = { uzman: "green", hekim: "red", dsp: "violet" };
export const ROL_RENK: Record<CalisanRol, string> = { uzman: "#3AA466", hekim: "#D6334C", dsp: "#B5467B" };

export function rolKisa(rol: CalisanRol): string {
  return ATAMALAR.find((a) => a.rol === rol)?.kisa ?? rol;
}
/** "İş Sağlığı ve Güvenliği Uzmanı (İGU)" */
export function rolEtiket(rol: CalisanRol): string {
  const a = ATAMALAR.find((x) => x.rol === rol);
  return a ? `${a.ad} (${a.kisa})` : rol;
}

export const DSP_MESLEKLERI = ["Hemşire", "Sağlık memuru", "Acil tıp teknisyeni", "Çevre sağlığı teknisyeni", "Diğer"];

/** Firmaya atanan kişinin adı; liste henüz gelmediyse "…", hesap silindiyse uyarı */
export function atananAdi(id: number | null | undefined, ekip: Map<number, Calisan>, durum: EkipDurum, sunucu: boolean): string {
  if (!id) return "";
  const c = ekip.get(id);
  if (c) return c.aktif ? c.ad_soyad : `${c.ad_soyad} (pasif)`;
  if (!sunucu) return "Atanmış çalışan";
  return durum === "hazir" ? "Silinmiş hesap" : "…";
}

/** Çalışanın atandığı (aktif) firma sayısı */
export function atananFirmaSayisi(calisanId: number, firmalar: Firma[]): number {
  return firmalar.filter((k) => k.is_active && (k.igu_id === calisanId || k.ih_id === calisanId || k.dsp_id === calisanId)).length;
}

export function firmaInput(k: Firma): FirmaInput {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, is_active, created_at, ...rest } = k;
  return rest;
}

/**
 * Çalışan silinince (yeniRol yok) ya da görevi değişince firmalardaki uyumsuz atamaları kaldırır.
 * Firmalar kişisel veride (store) tutulduğu için temizlik burada yapılır.
 */
export function atamalariTemizle(calisanId: number, yeniRol?: CalisanRol): number {
  const st = useStore.getState();
  let n = 0;
  for (const k of st.kursiyerler) {
    const patch: Partial<Record<AtamaAlan, null>> = {};
    for (const a of ATAMALAR) if (k[a.alan] === calisanId && a.rol !== yeniRol) patch[a.alan] = null;
    if (!Object.keys(patch).length) continue;
    st.updateKursiyer(k.id, { ...firmaInput(k), ...patch });
    n += 1;
  }
  return n;
}

// ---------------------------------------------------------------- çalışan önbelleği

export type EkipDurum = "bos" | "yukleniyor" | "hazir" | "hata";

interface EkipState {
  ekip: Calisan[];
  durum: EkipDurum;
  hata: string | null;
}

const useEkipStore = create<EkipState>(() => ({ ekip: [], durum: "bos", hata: null }));

let inflight: Promise<void> | null = null;

/** Sunucudan çalışan listesini (yeniden) yükler. Arka uç yoksa hiçbir şey yapmaz. */
export function ekipYukle(): Promise<void> {
  if (useSync.getState().backend !== true) return Promise.resolve();
  if (inflight) return inflight;
  useEkipStore.setState((s) => ({ durum: s.durum === "hazir" ? "hazir" : "yukleniyor", hata: null }));
  inflight = ekipListe()
    .then((ekip) => useEkipStore.setState({ ekip, durum: "hazir", hata: null }))
    .catch((e: unknown) => useEkipStore.setState({ durum: "hata", hata: e instanceof Error ? e.message : "Çalışan listesi alınamadı." }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** OSGB çalışanları (önbellekli). `sunucu` false ise hesap işlemleri yapılamaz. */
export function useEkip() {
  const backend = useSync((s) => s.backend);
  const ekip = useEkipStore((s) => s.ekip);
  const durum = useEkipStore((s) => s.durum);
  const hata = useEkipStore((s) => s.hata);
  useEffect(() => {
    if (backend === true && durum === "bos") void ekipYukle();
  }, [backend, durum]);
  return { sunucu: backend === true, ekip, durum, hata };
}

export async function calisanEkle(input: CalisanInput): Promise<Calisan> {
  const c = await ekipEkle(input);
  useEkipStore.setState((s) => ({ ekip: [...s.ekip.filter((x) => x.id !== c.id), c] }));
  return c;
}

export async function calisanGuncelle(id: number, patch: Partial<CalisanInput> & { aktif?: boolean }): Promise<Calisan> {
  const c = await ekipGuncelle(id, patch);
  useEkipStore.setState((s) => ({ ekip: s.ekip.map((x) => (x.id === id ? c : x)) }));
  return c;
}

export async function calisanSil(id: number): Promise<void> {
  await ekipSil(id);
  useEkipStore.setState((s) => ({ ekip: s.ekip.filter((x) => x.id !== id) }));
  atamalariTemizle(id);
}

// ---------------------------------------------------------------- küçük yardımcılar

/** Karışması kolay karakterler (0/O, 1/l/I) olmadan rastgele şifre */
export function rastgeleSifre(uzunluk = 12): string {
  const kume = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789"];
  const hepsi = kume.join("");
  const rnd = (n: number) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  const out = kume.map((k) => k[rnd(k.length)]);
  while (out.length < uzunluk) out.push(hepsi[rnd(hepsi.length)]);
  for (let i = out.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join("");
}

/** Panoya kopyalar; Clipboard API yoksa gizli textarea ile dener. */
export async function panoyaKopyala(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Sözleşme bitişine kalan gün (bitiş yoksa null; geçmişse negatif) */
export function kalanGun(bitis: string | undefined, bugun: string): number | null {
  if (!bitis || !/^\d{4}-\d{2}-\d{2}/.test(bitis)) return null;
  const a = Date.UTC(+bugun.slice(0, 4), +bugun.slice(5, 7) - 1, +bugun.slice(8, 10));
  const b = Date.UTC(+bitis.slice(0, 4), +bitis.slice(5, 7) - 1, +bitis.slice(8, 10));
  return Math.round((b - a) / 86400000);
}
