"use client";

/**
 * Risk analizini Excel'e aktarır — mobil uygulamadaki 4 sayfalık düzen (Giriş / Prosedür /
 * İSG Risk Değerlendirme / RD Ekibi), aynı başlık, satır, kolon ve genişliklerle; üstüne gerçek biçimlendirme:
 * lacivert başlık satırı, kenarlıklar, metin kaydırma, sabit başlık, otomatik filtre, klasik Excel risk renkleri,
 * A4 yatay sayfa düzeni (genişliğe sığdır).
 * exceljs yalnızca dışa aktarım anında dinamik olarak yüklenir (ilk pakete girmez).
 */
import type { Alignment, Borders, Cell, PageSetup, PaperSize, Row, Worksheet } from "exceljs";
import type { Analysis, RiskRow } from "@/lib/types";
import { EXCEL_COLORS, RISK_META, level } from "@/lib/risk";
import { fmtDate, safeFileName, upperTR } from "@/lib/format";
import { downloadBlob } from "@/lib/print";
import { RISK_HEADERS, gradeLabel, validUntil, validityYears } from "./risk-common";

type ExcelModule = typeof import("exceljs");

async function loadExcel(): Promise<ExcelModule> {
  const mod = (await import("exceljs")) as unknown as ExcelModule & { default?: ExcelModule };
  return mod.default && typeof mod.default.Workbook === "function" ? mod.default : mod;
}

const NAVY = "FF1E3145";
const LABEL_BG = "FFE4F1F8";
const ZEBRA = "FFF7F9FB";
const LINE = "FFCBD5DE";
const FONT = "Calibri";

const BORDER: Partial<Borders> = {
  top: { style: "thin", color: { argb: LINE } },
  left: { style: "thin", color: { argb: LINE } },
  bottom: { style: "thin", color: { argb: LINE } },
  right: { style: "thin", color: { argb: LINE } },
};

const RISK_WIDTHS = [7, 18, 28, 36, 28, 9, 8, 10, 22, 60, 16, 10];

/** exceljs genişliği tam 9 olan kolonu "varsayılan" sayıp dosyaya yazmıyor (Excel'de 8,43 olur) — bu yüzden 9,01. */
function cols(widths: number[]) {
  return widths.map((width) => ({ width: width === 9 ? 9.01 : width }));
}

function page(extra: Partial<PageSetup> = {}): Partial<PageSetup> {
  return {
    paperSize: 9 as PaperSize, // A4
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.55, header: 0.25, footer: 0.25 },
    ...extra,
  };
}

/** Kaydırılan metin için satır yüksekliği tahmini (Excel dışındaki görüntüleyiciler otomatik sığdırmaz). */
function linesFor(text: unknown, width: number): number {
  const s = String(text ?? "");
  if (!s) return 1;
  const per = Math.max(4, width - 1);
  return s.split("\n").reduce((n, part) => n + Math.max(1, Math.ceil(part.length / per)), 0);
}
function fitHeight(row: Row, widths: number[], min = 18, line = 13.2) {
  let lines = 1;
  row.eachCell({ includeEmpty: false }, (c, col) => {
    lines = Math.max(lines, linesFor(c.value, widths[col - 1] ?? 12));
  });
  row.height = Math.max(min, Math.ceil(lines * line + 5));
}

function headerCell(c: Cell, align: Partial<Alignment> = { horizontal: "center" }) {
  c.font = { name: FONT, size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  c.alignment = { vertical: "middle", wrapText: true, ...align };
  c.border = BORDER;
}

function titleRow(ws: Worksheet, text: string, cols: number, widths: number[]) {
  const r = ws.addRow([text]);
  ws.mergeCells(r.number, 1, r.number, cols);
  const c = r.getCell(1);
  c.font = { name: FONT, size: 13, bold: true, color: { argb: "FFFFFFFF" } };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
  c.alignment = { vertical: "middle", horizontal: "left", wrapText: true, indent: 1 };
  const total = widths.slice(0, cols).reduce((a, b) => a + b, 0);
  r.height = Math.max(30, linesFor(text, total) * 17 + 10);
}

/** Etiket / değer satırları (Giriş ve Prosedür sayfaları) */
function labelRows(ws: Worksheet, rows: [string, string | number][], widths: number[]) {
  for (const [k, v] of rows) {
    const r = ws.addRow([k, v]);
    const a = r.getCell(1);
    a.font = { name: FONT, size: 10, bold: true, color: { argb: NAVY } };
    a.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LABEL_BG } };
    a.alignment = { vertical: "top", wrapText: true };
    a.border = BORDER;
    const b = r.getCell(2);
    b.font = { name: FONT, size: 10, color: { argb: "FF2A3A4C" } };
    b.alignment = { vertical: "top", horizontal: "left", wrapText: true };
    b.border = BORDER;
    fitHeight(r, widths, 20);
  }
}

function footer(ws: Worksheet, a: Analysis) {
  ws.headerFooter.oddFooter = `&L&8${a.title.replace(/&/g, "&&")} · 5x5 L Tipi Matris&R&8İsgora · Sayfa &P / &N`;
}

export async function buildRiskWorkbook(a: Analysis, rows: RiskRow[]) {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  wb.creator = "İsgora";
  wb.created = new Date();
  wb.title = `${a.title} — Risk Analizi`;
  const until = validUntil(a);

  // --- Giriş sayfası ---
  const gW = [24, 80];
  const g = wb.addWorksheet("Giriş", { pageSetup: page({ orientation: "portrait" }), views: [{ showGridLines: false }] });
  g.columns = cols(gW);
  titleRow(g, `NACE ${a.nace_code ?? ""} - ${upperTR(a.title || "")} RİSK ANALİZİ`, 2, gW);
  g.addRow([]);
  labelRows(
    g,
    [
      ["İşyeri Unvanı", a.title],
      ["NACE Kodu", a.nace_code ?? ""],
      ["Sektör", a.sector_name ?? ""],
      ["Tehlike Sınıfı", a.hazard_class],
      ["Faaliyet Tanımı", a.activity_desc ?? ""],
      ["Çalışanlar", a.personnel ?? ""],
      ["İşveren / Yetkili", a.employer_label ?? ""],
      ["Değerlendirme Tarihi", fmtDate(a.analysis_date)],
      ["Geçerlilik Tarihi", fmtDate(until)],
      ["Yöntem", "5x5 L Tipi Matris (Olasılık x Şiddet)"],
      ["Madde Sayısı", rows.length],
    ],
    gW,
  );
  // Madde sayısı sola yaslı sayı
  g.getCell(g.rowCount, 2).alignment = { vertical: "top", horizontal: "left" };
  footer(g, a);

  // --- Prosedür sayfası ---
  const pW = [24, 110];
  const p = wb.addWorksheet("Prosedür", { pageSetup: page(), views: [{ showGridLines: false }] });
  p.columns = cols(pW);
  titleRow(p, `${upperTR(a.title || "")} (NACE ${a.nace_code ?? ""}) - RİSK DEĞERLENDİRME PROSEDÜRÜ`, 2, pW);
  p.addRow([]);
  labelRows(
    p,
    [
      [
        "AMAÇ",
        "6331 sayılı İş Sağlığı ve Güvenliği Kanunu ve İş Sağlığı ve Güvenliği Risk Değerlendirmesi Yönetmeliği gereği işyerinde var olan ya da dışarıdan gelebilecek tehlikelerin belirlenmesi, bu tehlikelerin riske dönüşmesine yol açan faktörler ile tehlikelerden kaynaklanan risklerin analiz edilerek derecelendirilmesi ve kontrol tedbirlerinin kararlaştırılmasıdır.",
      ],
      ["KAPSAM", "İşyerinin tüm bölümleri, faaliyetleri, çalışanları, ziyaretçileri ve alt işverenleri kapsar."],
      [
        "YÖNTEM",
        "5x5 L Tipi Matris. Risk Skoru = Olasılık (1-5) x Şiddet (1-5). 1-7 Kabul Edilebilir, 8-14 Dikkate Değer, 15-19 Yüksek, 20-25 Kabul Edilemez.",
      ],
      ["TERMİN", "Kabul Edilemez: Derhal · Yüksek: 1-15 gün · Dikkate Değer: 1-30 gün · Kabul Edilebilir: 1-45 gün."],
      [
        "YENİLEME",
        `Tehlike sınıfı ${a.hazard_class}: en geç ${validityYears(a)} yılda bir; kaza, meslek hastalığı, yeni makine/proses, mevzuat değişikliği hâlinde derhal yenilenir.`,
      ],
      ["SEKTÖRE ÖZEL UYGULAMA", a.sektor_uygulama || "Bu işyerine özel uygulama esasları risk maddelerinde belirtilmiştir."],
    ],
    pW,
  );
  footer(p, a);

  // --- İSG Risk Değerlendirme ---
  const ws = wb.addWorksheet("İSG Risk Değerlendirme", {
    pageSetup: page({ printTitlesRow: "1:1" }),
    views: [{ state: "frozen", xSplit: 0, ySplit: 1, topLeftCell: "A2", activeCell: "A2" }],
  });
  ws.columns = cols(RISK_WIDTHS);
  const head = ws.addRow(RISK_HEADERS);
  head.height = 32;
  head.eachCell((c) => headerCell(c));

  const CENTER = new Set([1, 6, 7, 8, 9, 11, 12]);
  rows.forEach((r, i) => {
    const sc = r.o * r.s;
    const lv = level(sc);
    const row = ws.addRow([i + 1, r.bolum, r.faaliyet, r.tehlike, r.risk, r.o, r.s, sc, gradeLabel(lv), r.onlem, r.sorumlu, RISK_META[lv].termin]);
    const zebra = i % 2 === 1;
    for (let col = 1; col <= RISK_HEADERS.length; col++) {
      const c = row.getCell(col);
      c.border = BORDER;
      c.font = { name: FONT, size: 10, color: { argb: "FF1E3145" } };
      c.alignment = { vertical: CENTER.has(col) ? "middle" : "top", horizontal: CENTER.has(col) ? "center" : "left", wrapText: true };
      if (zebra) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
    }
    for (const col of [8, 9]) {
      const c = row.getCell(col);
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + EXCEL_COLORS[lv] } };
      c.font = { name: FONT, size: col === 8 ? 11 : 9, bold: true, color: { argb: lv === "crit" ? "FFFFFFFF" : "FF000000" } };
    }
    row.getCell(3).font = { name: FONT, size: 10, bold: true, color: { argb: "FF1E3145" } };
    fitHeight(row, RISK_WIDTHS, 20);
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, rows.length + 1), column: RISK_HEADERS.length } };
  footer(ws, a);

  // --- RD Ekibi ---
  const eW = [28, 30, 18];
  const e = wb.addWorksheet("RD Ekibi", { pageSetup: page({ orientation: "portrait" }), views: [{ showGridLines: false }] });
  e.columns = cols(eW);
  titleRow(e, "RİSK DEĞERLENDİRME EKİBİ", 3, eW);
  e.addRow([]);
  const eh = e.addRow(["Görevi", "Adı Soyadı", "İmza"]);
  eh.height = 24;
  eh.eachCell((c) => headerCell(c, { horizontal: "left", indent: 1 }));
  for (const role of ["İşveren / İşveren Vekili", "İş Güvenliği Uzmanı", "İşyeri Hekimi", "Çalışan Temsilcisi", "Destek Elemanı"]) {
    const r = e.addRow([role, "", ""]);
    r.height = 36;
    for (let col = 1; col <= 3; col++) {
      const c = r.getCell(col);
      c.border = BORDER;
      c.alignment = { vertical: "middle", wrapText: true, indent: 1 };
      c.font = { name: FONT, size: 10, bold: col === 1, color: { argb: NAVY } };
    }
    r.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: LABEL_BG } };
  }
  footer(e, a);

  // Açılışta risk tablosu seçili gelsin
  wb.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 2, visibility: "visible" }];
  return wb;
}

/** Excel dosyasını üretip indirir: `{güvenli_ad}_risk_analizi.xlsx` */
export async function exportRiskExcel(a: Analysis, rows: RiskRow[]): Promise<void> {
  const wb = await buildRiskWorkbook(a, rows);
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  downloadBlob(blob, `${safeFileName(a.title)}_risk_analizi.xlsx`);
}
