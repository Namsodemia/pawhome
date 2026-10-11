/** Müşteri Takip — hazır program / eğitim listesi (mobil uygulamadaki DEFAULT_GROUPS ile aynı sıra). */
export const DEFAULT_GROUPS: string[] = [
  "A Sınıfı İSG Uzmanlığı",
  "B Sınıfı İSG Uzmanlığı",
  "C Sınıfı İSG Uzmanlığı",
  "İşyeri Hekimliği",
  "DSP (Diğer Sağlık Personeli)",
  "Temel İSG Eğitimi",
  "Temel İlk Yardım",
  "Hijyen Eğitimi",
  "Hijyen Tedarik",
  "Üniversite Onaylı Eğitim",
  "Diğer Satış",
];

/** Kayıtlı programlar + hazır liste (tekrarsız, kayıtlılar önce). */
export function mergeGroups(existing: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const g of [...existing, ...DEFAULT_GROUPS]) {
    const t = (g || "").trim();
    const key = t.toLocaleLowerCase("tr-TR");
    if (!t || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}
