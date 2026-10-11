// Telefon numarası yardımcıları — mobil uygulamadaki src/db/sinif.ts ile birebir aynı mantık.

/** Telefonu normalize eder: 5xx… → 905xx…, +90 → 90, boşluk/ayraç temizler. Geçersizse null. */
export function normPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0090")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length === 10 && d.startsWith("5")) d = "90" + d;
  if (d.length === 12 && d.startsWith("905")) return d;
  if (d.length >= 10 && d.length <= 15) return d; // yabancı numara
  return null;
}

/** 905321234567 → "0532 123 45 67"; yabancı numaralar "+…" olarak gösterilir. */
export function prettyPhone(p: string | null | undefined): string {
  if (!p) return "-";
  if (p.length === 12 && p.startsWith("90")) return `0${p.slice(2, 5)} ${p.slice(5, 8)} ${p.slice(8, 10)} ${p.slice(10)}`;
  return "+" + p;
}

/**
 * Yapıştırılan liste metnini ayrıştırır. Her satır: "Ad Soyad 05xx xxx xx xx" / "Ad;Telefon" / "Ad<TAB>Telefon" / "Telefon Ad".
 * Telefon bulunamazsa ad yalnız kaydedilir.
 */
export function parseList(text: string): { ad: string; telefon: string | null }[] {
  const out: { ad: string; telefon: string | null }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/(\+?\d[\d\s().-]{8,}\d)/);
    const telefon = m ? normPhone(m[1]) : null;
    let ad = (m ? line.replace(m[0], " ") : line)
      .replace(/[;,\t|]+/g, " ")
      .replace(/^\s*\d+[.)-]?\s*/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (!ad && telefon) ad = prettyPhone(telefon);
    if (!ad) continue;
    out.push({ ad, telefon });
  }
  return out;
}
