"use client";

/**
 * Basit tablo Excel'i (dışa aktarım) ve .xlsx / .csv okuma (içe aktarım) yardımcıları.
 * exceljs yalnızca gerektiğinde dinamik olarak yüklenir (ilk sayfa yükünü büyütmez).
 */
import type { Worksheet } from "exceljs";
import { downloadBlob } from "./print";

type ExcelJSModule = typeof import("exceljs");

export async function loadExcelJS(): Promise<ExcelJSModule> {
  const mod = (await import("exceljs")) as unknown as ExcelJSModule & { default?: ExcelJSModule };
  return mod.default && typeof mod.default.Workbook === "function" ? mod.default : mod;
}

const NAVY = "FF1E3145";
const BLUE = "FF107398";
const ZEBRA = "FFF4F7F9";
const SOFT = "FFE4F1F8";
const LINE = "FFCBD5DE";
export const MONEY_FMT = '#,##0.00 "₺";[Red]-#,##0.00 "₺"';
const DATE_FMT = "dd.mm.yyyy";

export type XKind = "text" | "money" | "date" | "int";
export type XValue = string | number | null | undefined;

export interface XCol<T> {
  header: string;
  width?: number;
  kind?: XKind;
  value: (row: T) => XValue;
}

/** "YYYY-MM-DD" → UTC Date (Excel'de saat dilimi kayması olmasın) */
function isoToDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function setCell(ws: Worksheet, r: number, c: number, v: XValue, kind: XKind = "text") {
  const cell = ws.getCell(r, c);
  if (v === null || v === undefined || v === "") {
    cell.value = null;
    return cell;
  }
  if (kind === "money" || kind === "int") {
    const n = typeof v === "number" ? v : Number(v);
    cell.value = Number.isFinite(n) ? n : String(v);
    cell.numFmt = kind === "money" ? MONEY_FMT : "0";
    cell.alignment = { horizontal: "right", vertical: "top" };
  } else if (kind === "date") {
    const d = typeof v === "string" ? isoToDate(v) : null;
    cell.value = d ?? String(v);
    if (d) cell.numFmt = DATE_FMT;
    cell.alignment = { horizontal: "center", vertical: "top" };
  } else {
    cell.value = String(v);
    cell.alignment = { vertical: "top", wrapText: true };
  }
  return cell;
}

/**
 * Başlıklı, marka renkli tek sayfalık tablo Excel'i üretip indirir.
 * Satır 1 başlık, 2 alt başlık, 4 sütun başlıkları; altta isteğe bağlı toplam satırı.
 */
export async function exportTableXlsx<T>(opts: {
  filename: string;
  sheet: string;
  title?: string;
  subtitle?: string;
  columns: XCol<T>[];
  rows: T[];
  totals?: XValue[];
}): Promise<void> {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = "İsgora";
  wb.created = new Date();
  const ws = wb.addWorksheet(opts.sheet.slice(0, 31) || "Sayfa1", { views: [{ state: "frozen", ySplit: opts.title ? 4 : 1 }] });
  const cols = opts.columns;
  ws.columns = cols.map((c) => ({ width: c.width ?? Math.max(10, c.header.length + 4) }));

  let r = 1;
  if (opts.title) {
    ws.mergeCells(1, 1, 1, cols.length);
    const t = ws.getCell(1, 1);
    t.value = opts.title;
    t.font = { bold: true, size: 14, color: { argb: NAVY } };
    ws.getRow(1).height = 22;
    ws.mergeCells(2, 1, 2, cols.length);
    const s = ws.getCell(2, 1);
    s.value = opts.subtitle || `Oluşturma: ${new Date().toLocaleString("tr-TR")}`;
    s.font = { size: 10, color: { argb: "FF6E7C8C" } };
    r = 4;
  }

  const headerRow = r;
  cols.forEach((c, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10.5 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    cell.alignment = { vertical: "middle", horizontal: c.kind === "money" || c.kind === "int" ? "right" : "left", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: BLUE } } };
  });
  ws.getRow(headerRow).height = 22;

  opts.rows.forEach((row, ri) => {
    const rr = headerRow + 1 + ri;
    cols.forEach((c, ci) => {
      const cell = setCell(ws, rr, ci + 1, c.value(row), c.kind);
      cell.border = { bottom: { style: "thin", color: { argb: LINE } } };
      if (ri % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
    });
  });

  const lastData = headerRow + opts.rows.length;
  if (opts.rows.length) {
    ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: lastData, column: cols.length } };
  }

  if (opts.totals) {
    const tr = lastData + 1;
    cols.forEach((c, ci) => {
      const v = opts.totals?.[ci];
      const cell = setCell(ws, tr, ci + 1, v, typeof v === "number" ? c.kind ?? "money" : "text");
      cell.font = { bold: true, color: { argb: NAVY } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SOFT } };
      cell.border = { top: { style: "medium", color: { argb: NAVY } } };
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  downloadBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), opts.filename);
}

// ---------------------------------------------------------------- okuma

/**
 * Hücre değerini metne çevirir. Ondalıklı sayılar virgülle yazılır ki parseNum("1,5") ile
 * binlik ayracı karışıklığı olmasın; tarihler YYYY-MM-DD olur.
 */
function cellToText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(v).replace(".", ",");
  if (typeof v === "boolean") return v ? "Evet" : "Hayır";
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "";
    const p = (n: number) => String(n).padStart(2, "0");
    return `${v.getUTCFullYear()}-${p(v.getUTCMonth() + 1)}-${p(v.getUTCDate())}`;
  }
  if (typeof v === "object") {
    const o = v as { richText?: { text: string }[]; text?: unknown; result?: unknown; hyperlink?: string; error?: string };
    if (Array.isArray(o.richText)) return o.richText.map((x) => x.text).join("");
    if (o.result !== undefined) return cellToText(o.result);
    if (o.text !== undefined) return cellToText(o.text);
    if (o.error) return "";
  }
  return String(v);
}

/** ; , veya sekme ayraçlı CSV — tırnaklı alanları ve "" kaçışını destekler. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] || "";
  const count = (ch: string) => firstLine.split(ch).length - 1;
  const delim = [";", ",", "\t"].map((d) => [d, count(d)] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += ch;
      continue;
    }
    if (ch === '"' && cur === "") q = true;
    else if (ch === delim) {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else cur += ch;
  }
  if (cur !== "" || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""));
}

/** .xlsx veya .csv dosyasını satır/sütun metin tablosuna çevirir (ilk dolu sayfa). */
export async function readTableFile(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xls") && !name.endsWith(".xlsx")) {
    throw new Error("Eski .xls biçimi desteklenmiyor. Dosyayı Excel'de .xlsx veya .csv olarak kaydedip tekrar deneyin.");
  }
  if (name.endsWith(".csv") || name.endsWith(".txt") || file.type === "text/csv") {
    const buf = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buf);
    // Türkçe Excel CSV'leri çoğunlukla Windows-1254 kaydeder
    if (text.includes("�")) {
      try {
        text = new TextDecoder("windows-1254").decode(buf);
      } catch {
        /* utf-8 ile devam */
      }
    }
    return parseCsv(text);
  }
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error("Dosya okunamadı. Geçerli bir .xlsx veya .csv dosyası seçin.");
  }
  const ws = wb.worksheets.find((w) => w.actualRowCount > 0) ?? wb.worksheets[0];
  if (!ws) return [];
  const out: string[][] = [];
  const nCols = ws.columnCount;
  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let c = 1; c <= nCols; c++) cells.push(cellToText(row.getCell(c).value).trim());
    if (cells.some((x) => x !== "")) out.push(cells);
  });
  return out;
}
