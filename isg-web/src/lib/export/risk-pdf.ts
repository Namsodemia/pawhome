"use client";

/**
 * Risk analizi PDF raporu — A4 yatay yazdırılabilir sayfa (tarayıcının "PDF olarak kaydet" seçeneğiyle).
 * Mobil uygulamadaki buildHtml ile aynı başlık, meta satırı, 12 kolon ve alt bilgi; üstüne
 * sektöre özel uygulama ve RD Ekibi imza tablosu.
 */
import type { Analysis, RiskRow } from "@/lib/types";
import { LEVELS, RISK_META, level, type Level } from "@/lib/risk";
import { fmtDate } from "@/lib/format";
import { esc, printHtml } from "@/lib/print";
import { useStore } from "@/lib/store";
import { RISK_HEADERS, gradeLabel, sektorItems, validUntil } from "./risk-common";

const WIDTHS = [7, 18, 28, 36, 28, 9, 8, 10, 22, 60, 16, 10];

const CSS = `
  h1{font-size:16px;color:#1E3145;margin:0 0 4px}
  h2{font-size:12px;color:#1E3145;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.06em}
  .rk-meta{display:flex;flex-wrap:wrap;gap:3px 16px;margin:6px 0 8px;font-size:9.5px;color:#2A3A4C}
  .rk-meta b{color:#1E3145}
  .rk-sum{display:flex;gap:6px;margin:0 0 10px}
  .rk-sum span{display:inline-flex;align-items:center;gap:5px;border-radius:6px;padding:3px 8px;font-size:9px;font-weight:700}
  table.rk{table-layout:fixed;font-size:8.5px}
  table.rk th{font-size:7.5px;padding:4px 3px;border-color:#142236;text-align:center;vertical-align:middle}
  table.rk td{padding:3px 4px;line-height:1.3;word-wrap:break-word}
  table.rk td.c{text-align:center;vertical-align:middle}
  table.rk thead{display:table-header-group}
  table.rk tr{page-break-inside:avoid;break-inside:avoid}
  .foot{margin-top:8px;font-size:8.5px;color:#6E7C8C}
  ol.su{margin:0;padding-left:18px;font-size:9.5px;line-height:1.45}
  ol.su li{margin:0 0 3px}
  .team{page-break-inside:avoid;break-inside:avoid;margin-top:6px}
  table.ekip{width:70%;font-size:10px}
  table.ekip td{height:34px;vertical-align:middle}
  table.ekip td:first-child{font-weight:700;background:#E4F1F8;width:38%}
`;

function counts(rows: RiskRow[]): Record<Level, number> {
  const c: Record<Level, number> = { low: 0, mid: 0, high: 0, crit: 0 };
  for (const r of rows) c[level(r.o * r.s)] += 1;
  return c;
}

export function buildRiskPdfHtml(a: Analysis, rows: RiskRow[], firma = ""): string {
  const total = WIDTHS.reduce((x, y) => x + y, 0);
  const cols = WIDTHS.map((w) => `<col style="width:${((w * 100) / total).toFixed(2)}%">`).join("");
  const tr = rows
    .map((r, i) => {
      const sc = r.o * r.s;
      const lv = level(sc);
      const m = RISK_META[lv];
      return `<tr>
        <td class="c">${i + 1}</td><td>${esc(r.bolum)}</td><td><b>${esc(r.faaliyet)}</b></td><td>${esc(r.tehlike)}</td><td>${esc(r.risk)}</td>
        <td class="c">${r.o}</td><td class="c">${r.s}</td>
        <td class="c" style="background:${m.color};color:${m.text};font-weight:800;font-size:10px">${sc}</td>
        <td class="c" style="background:${m.color};color:${m.text};font-size:7.5px;font-weight:700">${esc(gradeLabel(lv))}</td>
        <td>${esc(r.onlem)}</td><td class="c">${esc(r.sorumlu)}</td><td class="c">${esc(m.termin)}</td></tr>`;
    })
    .join("");
  const c = counts(rows);
  const sum = LEVELS.map(
    (k) => `<span style="background:${RISK_META[k].color};color:${RISK_META[k].text}">${esc(RISK_META[k].label)}: ${c[k]}</span>`,
  ).join("");
  const su = sektorItems(a.sektor_uygulama);

  return `
  <h1>${esc(a.title)} — İSG Risk Değerlendirme Raporu</h1>
  <div class="rk-meta">
    <span><b>NACE:</b> ${esc(a.nace_code)}</span><span><b>Sektör:</b> ${esc(a.sector_name)}</span>
    <span><b>Tehlike sınıfı:</b> ${esc(a.hazard_class)}</span><span><b>Tarih:</b> ${fmtDate(a.analysis_date)}</span>
    <span><b>Geçerlilik:</b> ${fmtDate(validUntil(a))}</span><span><b>Madde:</b> ${rows.length}</span>
    ${firma ? `<span><b>Hazırlayan:</b> ${esc(firma)}</span>` : ""}
  </div>
  ${a.activity_desc ? `<div class="rk-meta"><span><b>Faaliyet:</b> ${esc(a.activity_desc)}</span></div>` : ""}
  ${
    a.personnel || a.employer_label
      ? `<div class="rk-meta">${a.personnel ? `<span><b>Çalışanlar:</b> ${esc(a.personnel)}</span>` : ""}${
          a.employer_label ? `<span><b>İşveren / Yetkili:</b> ${esc(a.employer_label)}</span>` : ""
        }</div>`
      : ""
  }
  ${rows.length ? `<div class="rk-sum">${sum}</div>` : ""}
  <table class="rk"><colgroup>${cols}</colgroup>
    <thead><tr>${RISK_HEADERS.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${tr || `<tr><td colspan="12" class="c">Henüz madde yok.</td></tr>`}</tbody>
  </table>
  <div class="foot">5x5 L Tipi Matris · 1-7 Kabul Edilebilir · 8-14 Dikkate Değer · 15-19 Yüksek · 20-25 Kabul Edilemez · İsgora ile üretildi</div>
  ${
    su.length
      ? `<h2>Sektöre Özel Uygulama</h2><ol class="su">${su.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`
      : ""
  }
  <div class="team">
    <h2>Risk Değerlendirme Ekibi</h2>
    <table class="ekip">
      <thead><tr><th>Görevi</th><th>Adı Soyadı</th><th>İmza</th></tr></thead>
      <tbody>${["İşveren / İşveren Vekili", "İş Güvenliği Uzmanı", "İşyeri Hekimi", "Çalışan Temsilcisi", "Destek Elemanı"]
        .map((g) => `<tr><td>${esc(g)}</td><td></td><td></td></tr>`)
        .join("")}</tbody>
    </table>
  </div>`;
}

/** Yazdırma penceresini açar (kullanıcı "PDF olarak kaydet" ile kaydeder). */
export function printRiskPdf(a: Analysis, rows: RiskRow[]): void {
  const firma = useStore.getState().settings.firma?.trim() || "";
  printHtml(`${a.title} — İSG Risk Değerlendirme Raporu`, buildRiskPdfHtml(a, rows, firma), { landscape: true, extraCss: CSS });
}
