import { useSync } from "./sync";

/** Kayıtta seçilen kullanıcı rolü — menüler, ana sayfa ve asistan buna göre şekillenir. */
export type Rol = "osgb" | "uzman" | "hekim" | "dsp" | "ogrenci";

/** /app/<modül> */
export type Modul =
  | "risk"
  | "kasa"
  | "musteri"
  | "siniflar"
  | "sinav"
  | "asistan"
  | "mevzuat"
  | "kaza"
  | "denetim"
  | "hesap"
  | "muayene"
  | "egitim"
  | "sinifim";

export const ROLLER: { id: Rol; ad: string; kisa: string; aciklama: string; renk: string }[] = [
  {
    id: "osgb",
    ad: "OSGB / Eğitim Kurumu",
    kisa: "OSGB",
    aciklama: "Firma (müşteri) takibi, İGU / İH / DSP çalışan hesapları, risk analizi, kasa/cari, sınıflar ve tüm İSG araçları",
    renk: "#107398",
  },
  {
    id: "uzman",
    ad: "İş Sağlığı ve Güvenliği Uzmanı (İGU)",
    kisa: "İş Sağlığı ve Güvenliği Uzmanı",
    aciklama: "Risk analizi, saha denetimi, kaza / ramak kala kayıtları, eğitimler, mevzuat ve hesaplayıcı",
    renk: "#5CBD7D",
  },
  {
    id: "hekim",
    ad: "İşyeri Hekimi (İH)",
    kisa: "İşyeri Hekimi",
    aciklama: "Periyodik muayene takibi, meslek hastalığı ve kaza kayıtları, eğitimler, mevzuat",
    renk: "#D6334C",
  },
  {
    id: "dsp",
    ad: "Diğer Sağlık Personeli (DSP)",
    kisa: "Diğer Sağlık Personeli",
    aciklama: "Sağlık gözetimi ve muayene takibi, ilk yardım, kaza kayıtları, eğitimler ve mevzuat",
    renk: "#B5467B",
  },
  {
    id: "ogrenci",
    ad: "Öğrenci / Uzman Adayı",
    kisa: "Öğrenci",
    aciklama: "İSG sınav hazırlık, deneme sınavları, sınıf grubu, eğitimler, mevzuat ve yapay zekâ asistanı",
    renk: "#6C5CE7",
  },
];

export const MODULLER: Record<Rol, Modul[]> = {
  osgb: ["risk", "kasa", "musteri", "siniflar", "sinav", "egitim", "asistan", "mevzuat", "kaza", "denetim", "hesap", "muayene"],
  uzman: ["risk", "denetim", "kaza", "egitim", "asistan", "mevzuat", "hesap"],
  hekim: ["muayene", "kaza", "risk", "egitim", "asistan", "mevzuat", "hesap"],
  dsp: ["muayene", "kaza", "risk", "egitim", "asistan", "mevzuat", "hesap"],
  ogrenci: ["sinav", "sinifim", "egitim", "asistan", "mevzuat", "hesap"],
};

/** Mobil alt sekme çubuğu (Ana Sayfa + en çok kullanılan modüller) */
export const SEKMELER: Record<Rol, Modul[]> = {
  osgb: ["risk", "kasa", "musteri", "sinav", "asistan"],
  uzman: ["risk", "denetim", "kaza", "egitim", "asistan"],
  hekim: ["muayene", "kaza", "risk", "egitim", "asistan"],
  dsp: ["muayene", "kaza", "egitim", "mevzuat", "asistan"],
  ogrenci: ["sinav", "sinifim", "egitim", "asistan"],
};

export function isRol(v: unknown): v is Rol {
  return v === "osgb" || v === "uzman" || v === "hekim" || v === "dsp" || v === "ogrenci";
}

export function rolBilgi(rol: Rol) {
  return ROLLER.find((r) => r.id === rol) ?? ROLLER[0];
}

/** Etkin rol. Sunucu yoksa (yerel mod) tüm modüller açık: osgb. */
export function useRol(): Rol {
  const rol = useSync((s) => s.rol);
  return isRol(rol) ? rol : "osgb";
}

export function currentRol(): Rol {
  const rol = useSync.getState().rol;
  return isRol(rol) ? rol : "osgb";
}

/** "/app/risk/detay/" → "risk"; ana sayfa ve ayarlar için null */
export function modulOf(pathname: string): Modul | null {
  const m = pathname.match(/^\/app\/([^/]+)/);
  if (!m) return null;
  const seg = m[1];
  if (seg === "ayarlar") return null;
  return seg as Modul;
}

export function izinli(rol: Rol, modul: Modul | null): boolean {
  return modul === null || MODULLER[rol].includes(modul);
}

/** Kayıt sırasında girilen role özel bilgiler (sunucuda clean_profile ile aynı beyaz liste) */
export interface Profil {
  ad_soyad?: string;
  telefon?: string;
  /** OSGB adı / çalıştığı firma / hastane / eğitim aldığı kurum */
  kurum?: string;
  il?: string;
  ilce?: string;
  /** İGU */
  uzmanlik_sinifi?: "A" | "B" | "C" | "";
  /** İGU / İH / DSP belge (sertifika) numarası */
  belge_no?: string;
  /** Mesleki deneyim (yıl aralığı) */
  deneyim?: string;
  /** İH: uzmanlık alanı */
  uzmanlik_alani?: string;
  /** DSP: meslek (hemşire, sağlık memuru …) */
  meslek?: string;
  /** Öğrenci: hazırlandığı sınav */
  hedef_sinav?: string;
  /** Öğrenci: okuduğu / mezun olduğu bölüm */
  bolum?: string;
  /** OSGB */
  yetki_belge_no?: string;
  vergi_no?: string;
  adres?: string;
}

export function useProfil(): Profil {
  return (useSync((s) => s.profil) as Profil | null) ?? {};
}
