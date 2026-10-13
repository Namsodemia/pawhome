import { useSync } from "./sync";

/** Kayıtta seçilen kullanıcı rolü — menüler, ana sayfa ve asistan buna göre şekillenir. */
export type Rol = "osgb" | "uzman" | "hekim" | "ogrenci";

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
  | "muayene";

export const ROLLER: { id: Rol; ad: string; kisa: string; aciklama: string; renk: string }[] = [
  {
    id: "osgb",
    ad: "OSGB / Eğitim Kurumu",
    kisa: "OSGB",
    aciklama: "Risk analizi, kasa/cari, kursiyer takibi, sınıflar ve tüm İSG araçları",
    renk: "#107398",
  },
  {
    id: "uzman",
    ad: "İş Güvenliği Uzmanı",
    kisa: "İSG Uzmanı",
    aciklama: "Risk analizi, saha denetimi, kaza / ramak kala kayıtları, mevzuat ve hesaplayıcı",
    renk: "#5CBD7D",
  },
  {
    id: "hekim",
    ad: "İşyeri Hekimi / Doktor",
    kisa: "İşyeri Hekimi",
    aciklama: "Periyodik muayene takibi, meslek hastalığı ve kaza kayıtları, mevzuat",
    renk: "#D6334C",
  },
  {
    id: "ogrenci",
    ad: "Öğrenci / Uzman Adayı",
    kisa: "Öğrenci",
    aciklama: "İSG uzmanlığı sınav hazırlık, deneme sınavları, mevzuat ve yapay zekâ asistanı",
    renk: "#6C5CE7",
  },
];

export const MODULLER: Record<Rol, Modul[]> = {
  osgb: ["risk", "kasa", "musteri", "siniflar", "sinav", "asistan", "mevzuat", "kaza", "denetim", "hesap", "muayene"],
  uzman: ["risk", "denetim", "kaza", "asistan", "mevzuat", "hesap"],
  hekim: ["muayene", "kaza", "risk", "asistan", "mevzuat", "hesap"],
  ogrenci: ["sinav", "asistan", "mevzuat", "hesap"],
};

/** Mobil alt sekme çubuğu (Ana Sayfa + en çok kullanılan modüller) */
export const SEKMELER: Record<Rol, Modul[]> = {
  osgb: ["risk", "kasa", "musteri", "sinav", "asistan"],
  uzman: ["risk", "denetim", "kaza", "mevzuat", "asistan"],
  hekim: ["muayene", "kaza", "risk", "mevzuat", "asistan"],
  ogrenci: ["sinav", "mevzuat", "hesap", "asistan"],
};

export function isRol(v: unknown): v is Rol {
  return v === "osgb" || v === "uzman" || v === "hekim" || v === "ogrenci";
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

/** Kayıt sırasında girilen role özel bilgiler */
export interface Profil {
  ad_soyad?: string;
  kurum?: string; // OSGB / firma / hastane / okul
  il?: string;
  uzmanlik_sinifi?: "A" | "B" | "C" | "";
  hedef_sinav?: string; // A / B / C / İşyeri Hekimliği / DSP
  sinav_tarihi?: string;
}

export function useProfil(): Profil {
  return (useSync((s) => s.profil) as Profil | null) ?? {};
}
