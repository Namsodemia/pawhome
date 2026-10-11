"use client";

import type { Cevap, Denetim } from "@/lib/types";
import { sablonById } from "@/data/denetim";
import { fmtDate } from "@/lib/format";
import { esc, printHtml } from "@/lib/print";

export interface Sayim {
  uygun: number;
  uygunsuz: number;
  na: number;
  cevapsiz: number;
  applicable: number;
  total: number;
}

/** Şablondaki maddelere göre cevap sayıları. */
export function sayim(cevaplar: Record<number, Cevap>, total: number): Sayim {
  let uygun = 0;
  let uygunsuz = 0;
  let na = 0;
  for (let i = 0; i < total; i++) {
    const c = cevaplar[i];
    if (c === "uygun") uygun += 1;
    else if (c === "uygunsuz") uygunsuz += 1;
    else if (c === "na") na += 1;
  }
  return { uygun, uygunsuz, na, cevapsiz: total - uygun - uygunsuz - na, applicable: uygun + uygunsuz, total };
}

/** Puan rengi: ≥80 yeşil, ≥60 amber, aksi kırmızı */
export function puanTone(p: number): { text: string; bg: string; hex: string } {
  if (p >= 80) return { text: "text-success", bg: "bg-soft-green", hex: "#2E9E5B" };
  if (p >= 60) return { text: "text-warn", bg: "bg-soft-warn", hex: "#B7791F" };
  return { text: "text-danger", bg: "bg-soft-danger", hex: "#D6334C" };
}

export const CEVAP_META: Record<Cevap, { label: string; pdf: string; pdfBg: string }> = {
  uygun: { label: "Uygun", pdf: "Uygun", pdfBg: "#DCFCE7" },
  uygunsuz: { label: "Uygunsuz", pdf: "UYGUNSUZ", pdfBg: "#FEE2E8" },
  na: { label: "Kapsam dışı", pdf: "Kapsam dışı", pdfBg: "#F4F5F7" },
};

/** "Saha Denetim Raporu — {işyeri}" yazdırılabilir rapor (PDF olarak kaydedilebilir). */
export function printDenetim(d: Pick<Denetim, "isyeri" | "tarih" | "sablon" | "cevaplar" | "notlar" | "puan">, firma: string) {
  const sablon = sablonById(d.sablon);
  const c = sayim(d.cevaplar, sablon.maddeler.length);
  const tone = puanTone(d.puan);
  const rows = sablon.maddeler
    .map((m, i) => {
      const v = d.cevaplar[i];
      const meta = v ? CEVAP_META[v] : null;
      return `<tr><td class="c">${i + 1}</td><td>${esc(m)}</td><td class="c" style="background:${meta?.pdfBg ?? "#FFFFFF"};font-weight:700;${
        v === "uygunsuz" ? "color:#BE123C" : v === "uygun" ? "color:#15803D" : "color:#6E7C8C"
      }">${meta?.pdf ?? "-"}</td></tr>`;
    })
    .join("");
  const uygunsuzlar = sablon.maddeler
    .map((m, i) => ({ m, i }))
    .filter(({ i }) => d.cevaplar[i] === "uygunsuz")
    .map(({ m, i }) => `<li><b>${i + 1}.</b> ${esc(m)}</li>`)
    .join("");
  const body = `
    <h1>Saha Denetim Raporu — ${esc(d.isyeri)}</h1>
    <div class="meta">${firma ? `${esc(firma)} · ` : ""}${esc(sablon.ad)} · ${fmtDate(d.tarih)} · ${c.uygun}/${c.applicable} uygun</div>
    <div style="display:flex;align-items:flex-end;gap:18px;margin:6px 0 12px">
      <div style="font-size:26px;font-weight:900;color:${tone.hex}">Uygunluk %${d.puan}</div>
      <div style="color:#6E7C8C;font-size:11px;padding-bottom:5px">${c.uygun} uygun · ${c.uygunsuz} uygunsuz · ${c.na} kapsam dışı${c.cevapsiz ? ` · ${c.cevapsiz} cevapsız` : ""}</div>
    </div>
    <table><thead><tr><th style="width:36px">No</th><th>Kontrol maddesi</th><th style="width:96px">Sonuç</th></tr></thead><tbody>${rows}</tbody></table>
    ${uygunsuzlar ? `<h2>Uygunsuzluklar</h2><ol style="margin:0;padding-left:0;list-style:none;line-height:1.6">${uygunsuzlar}</ol>` : ""}
    ${d.notlar ? `<h2>Notlar / tespitler</h2><p style="white-space:pre-wrap;margin:0">${esc(d.notlar)}</p>` : ""}
    <div class="sign"><div>Denetleyen</div><div>İşveren/Vekili</div></div>`;
  printHtml(`Saha Denetim Raporu — ${d.isyeri || "İşyeri"}`, body, { extraCss: "td.c{text-align:center;white-space:nowrap}" });
}
