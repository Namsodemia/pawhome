"use client";

import { apiFetch } from "./sync";
import type { Profil } from "./roles";
import type { HazardClass } from "./types";

/**
 * Kullanıcılar arası paylaşılan işlemler (PHP arka ucu, public/api/index.php):
 *  - OSGB çalışan hesapları (İGU / İH / DSP) ve firmalara atamalar
 *  - Sınıf katılım kodları: öğrenci kodla OSGB'nin sınıf grubuna katılır, duyuruları görür
 * Kişisel kayıtlar bunlardan ayrı olarak store + sync.ts ile tutulur.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call<T>(route: string, init: RequestInit = {}): Promise<T> {
  let r: Response;
  try {
    r = await apiFetch(route, init);
  } catch {
    throw new ApiError("Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.", 0);
  }
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("json")) throw new ApiError("Bu özellik için sunucu (PHP) gerekli.", r.status);
  const j = (await r.json()) as T & { message?: string };
  if (!r.ok) throw new ApiError(j.message || `Sunucu hatası (${r.status})`, r.status);
  return j;
}

const post = <T>(route: string, body: unknown) =>
  call<T>(route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// ---------------------------------------------------------------- OSGB çalışanları

export type CalisanRol = "uzman" | "hekim" | "dsp";

export const CALISAN_ROLLERI: { id: CalisanRol; ad: string; kisa: string }[] = [
  { id: "uzman", ad: "İş Sağlığı ve Güvenliği Uzmanı", kisa: "İGU" },
  { id: "hekim", ad: "İşyeri Hekimi", kisa: "İH" },
  { id: "dsp", ad: "Diğer Sağlık Personeli", kisa: "DSP" },
];

export interface Calisan {
  id: number;
  ad_soyad: string;
  eposta: string;
  rol: CalisanRol;
  telefon: string;
  profil: Profil;
  aktif: boolean;
  olusturma: string;
  son_giris: string | null;
}

export interface CalisanInput {
  ad_soyad: string;
  eposta: string;
  /** Yeni hesapta zorunlu (en az 8 karakter); güncellemede doluysa şifre değişir */
  sifre?: string;
  rol: CalisanRol;
  telefon?: string;
  uzmanlik_sinifi?: "A" | "B" | "C" | "";
  belge_no?: string;
  meslek?: string;
}

export const ekipListe = () => call<{ ekip: Calisan[] }>("ekip").then((j) => j.ekip);
export const ekipEkle = (c: CalisanInput) => post<{ ok: true; calisan: Calisan }>("ekip", c).then((j) => j.calisan);
export const ekipGuncelle = (id: number, c: Partial<CalisanInput> & { aktif?: boolean }) =>
  post<{ ok: true; calisan: Calisan }>("ekip-guncelle", { id, ...c }).then((j) => j.calisan);
export const ekipSil = (id: number) => call<{ ok: true }>(`ekip&id=${id}`, { method: "DELETE" });

/** Çalışan hesabının, bağlı olduğu OSGB'de kendisine atanmış firmaları */
export interface AtananFirma {
  id: number;
  ad: string;
  yetkili: string;
  telefon: string;
  eposta: string;
  il: string;
  adres: string;
  tehlike_sinifi: HazardClass | "";
  calisan_sayisi: number;
  nace_kodu: string;
  gorev: ("igu" | "ih" | "dsp")[];
}
export const atamalarim = () => call<{ osgb: { id: number; ad: string } | null; firmalar: AtananFirma[] }>("atamalarim");

// ---------------------------------------------------------------- sınıf katılımı

export interface SinifOgrenci {
  id: number;
  ad_soyad: string;
  eposta: string;
  telefon: string;
  kurum: string;
  katilma: string;
}

/** OSGB tarafı: sınıfın katılım kodu (yoksa null) */
export const sinifKodGetir = (sinifId: number) => call<{ kod: string | null }>(`sinif-kod&sinif=${sinifId}`).then((j) => j.kod);
/** Kod yoksa üretir; yenile=true eski kodu geçersiz kılıp yenisini verir */
export const sinifKodUret = (sinifId: number, yenile = false) => post<{ kod: string }>("sinif-kod", { sinif: sinifId, yenile }).then((j) => j.kod);
export const sinifOgrencileri = (sinifId: number) => call<{ ogrenciler: SinifOgrenci[] }>(`sinif-ogrenciler&sinif=${sinifId}`).then((j) => j.ogrenciler);
export const sinifOgrenciCikar = (sinifId: number, kullaniciId: number) =>
  call<{ ok: true }>(`sinif-ogrenciler&sinif=${sinifId}&kullanici=${kullaniciId}`, { method: "DELETE" });

/** Öğrenci tarafı */
export interface SinifimItem {
  sahip_id: number;
  sinif_id: number;
  ad: string;
  aciklama: string;
  renk: string;
  /** Sınıfı açan OSGB / kurum adı */
  kurum: string;
  katilma: string;
  /** Uygulamadan katılan öğrenci sayısı */
  uye_sayisi: number;
  /** Kurumun bu sınıfa gönderdiği duyurular (en eski → en yeni, son 100) */
  mesajlar: { id: number; metin: string; created_at: string }[];
}
export const siniflarim = () => call<{ siniflar: SinifimItem[] }>("siniflarim").then((j) => j.siniflar);
export const sinifaKatil = (kod: string) => post<{ ok: true; sinif: SinifimItem }>("sinif-katil", { kod: kod.trim().toUpperCase() }).then((j) => j.sinif);
export const siniftanAyril = (sahipId: number, sinifId: number) => post<{ ok: true }>("sinif-ayril", { sahip_id: sahipId, sinif_id: sinifId });

/** Öğrencinin kayıt bağlantısı: kodu forma hazır yazar */
export function sinifDavetLinki(kod: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/giris.php?kayit=1&rol=ogrenci&sinif=${encodeURIComponent(kod)}`;
}

// ---------------------------------------------------------------- ortak yapay zekâ anahtarı (yönetici)

export const ortakAnahtarDurum = () => call<{ set: boolean; fromConfig: boolean; limit: number }>("ai-ortak-key");
export const ortakAnahtarKaydet = (key: string) => post<{ ok: true }>("ai-ortak-key", { key });
export const ortakAnahtarSil = () => call<{ ok: true }>("ai-ortak-key", { method: "DELETE" });

// ---------------------------------------------------------------- sunucu ayarları (yönetici)

/** Panelden değiştirilebilen sunucu ayarları (gizli alanlar hariç) — public/api/_lib.php ISGORA_SITE_FIELDS ile aynı */
export interface SiteValues {
  kayit_acik: boolean;
  kayit_kodu: string;
  otp_zorunlu: boolean;
  ucretsiz_ai_sorgu: number;
  anthropic_workspace_id: string;
  mail_from: string;
  mail_from_name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: "ssl" | "tls" | "yok";
  smtp_user: string;
}

export interface SiteSettings {
  values: SiteValues;
  /** Değer panelden mi (veritabanı) yoksa config.php'den mi geliyor */
  source: Record<keyof SiteValues | "smtp_pass", "panel" | "config">;
  secrets: { smtp_pass: boolean; anthropic_api_key: { set: boolean; fromConfig: boolean; last4: string } };
  mail_from_effective: string;
}

/** Gizli alanlar: "" → değiştirme, null → sil */
export type SiteSecrets = { anthropic_api_key?: string | null; smtp_pass?: string | null };

export const siteAyarlari = () => call<SiteSettings>("site-ayarlari");
export const siteAyarlariKaydet = (values: Partial<SiteValues> & SiteSecrets) => post<SiteSettings>("site-ayarlari", { values });
export const denemeEpostasi = () => post<{ ok: true; to: string }>("test-eposta", {});
export const aiAnahtarTest = () => post<{ ok: boolean; message: string }>("ai-test", {});

// ---------------------------------------------------------------- kullanıcılar ve yapay zekâ hakları (yönetici)

export interface YonetimKullanici {
  id: number;
  ad_soyad: string;
  eposta: string;
  telefon: string;
  kurum: string;
  rol: "osgb" | "uzman" | "hekim" | "dsp" | "ogrenci";
  yonetici: boolean;
  osgb: { id: number; ad: string } | null;
  aktif: boolean;
  dogrulandi: boolean;
  olusturma: string;
  son_giris: string | null;
  ai: {
    used: number;
    limit: number;
    unlimited: boolean;
    /** Yöneticinin tanıdığı özel hak: "sinirsiz" | "limit" (kişiye özel sayı) | null (varsayılan) */
    ozel: "sinirsiz" | "limit" | null;
    /** Ortak anahtar tanımlı mı */
    aktif: boolean;
  };
}

export type HakIslem = { islem: "ekle" | "belirle"; deger: number } | { islem: "sinirsiz"; deger: boolean } | { islem: "varsayilan" | "sifirla" };

export const kullanicilar = () => call<{ varsayilan: number; kullanicilar: YonetimKullanici[] }>("kullanicilar");
export const kullaniciHak = (id: number, h: HakIslem) => post<{ ok: true; kullanici: YonetimKullanici }>("kullanici-hak", { id, ...h }).then((j) => j.kullanici);
export const kullaniciDurum = (id: number, aktif: boolean) => post<{ ok: true; kullanici: YonetimKullanici }>("kullanici-durum", { id, aktif }).then((j) => j.kullanici);
/** E-posta kodu gelmeyen kullanıcıyı elle doğrula */
export const kullaniciDogrula = (id: number) => post<{ ok: true; kullanici: YonetimKullanici }>("kullanici-durum", { id, dogrula: true }).then((j) => j.kullanici);
