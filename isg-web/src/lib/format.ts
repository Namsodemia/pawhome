export function money(n: number | null | undefined): string {
  const v = Number(n || 0);
  return v.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}

export function moneyShort(n: number | null | undefined): string {
  const v = Number(n || 0);
  return v.toLocaleString("tr-TR", { maximumFractionDigits: 0 }) + " ₺";
}

/** Yerel saate göre bugünün tarihi (YYYY-MM-DD). */
export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function thisMonth(): string {
  return today().slice(0, 7);
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return "-";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

/** "1.234,56" / "1234.56" / "1234" / "1.500 TL" → sayı */
export function parseNum(s: string | number | null | undefined): number {
  if (typeof s === "number") return Number.isFinite(s) ? s : 0;
  const t = (s || "").trim().replace(/\s/g, "").replace(/₺|TL/gi, "");
  if (!t) return 0;
  if (t.includes(",") && t.includes(".")) return Number(t.replace(/\./g, "").replace(",", ".")) || 0;
  if (t.includes(",")) return Number(t.replace(",", ".")) || 0;
  // "1.500" gibi binlik ayraçlı tam sayı
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, "")) || 0;
  return Number(t) || 0;
}

/** Türkçe-güvenli normalize (arama ve eşleştirme için). */
export function norm(s: string | null | undefined): string {
  return (s || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

export function upperTR(s: string): string {
  return (s || "").toLocaleUpperCase("tr-TR");
}

export function addYears(iso: string, years: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${y + years}-${p(m)}-${p(d)}`;
}

export function initials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const a = parts[0][0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return upperTR(a + b);
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

export function longDateTR(d = new Date()): string {
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });
}

export function safeFileName(s: string): string {
  return (
    norm(s)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60) || "isgo"
  );
}

export function cx(...a: (string | false | null | undefined)[]): string {
  return a.filter(Boolean).join(" ");
}

export function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part * 100) / total);
}
