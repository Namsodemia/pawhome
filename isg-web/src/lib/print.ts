"use client";

/** HTML metni kaçışlar (rapor şablonlarında kullanıcı verisi için). */
export function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BASE_CSS = `
  *{box-sizing:border-box}
  body{font-family:"Plus Jakarta Sans",-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1E3145;margin:0;padding:24px;font-size:11px}
  h1{font-size:18px;margin:0 0 4px}
  h2{font-size:13px;margin:18px 0 6px}
  .meta{color:#6E7C8C;font-size:11px;margin-bottom:12px}
  .brand{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #107398;padding-bottom:10px;margin-bottom:14px}
  .brand img{height:34px}
  table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #CBD5DE;padding:5px 6px;vertical-align:top;text-align:left}
  th{background:#1E3145;color:#fff;font-size:10px;text-transform:uppercase;letter-spacing:.03em}
  tr:nth-child(even) td{background:#F7F9FB}
  .footer{margin-top:14px;color:#6E7C8C;font-size:10px}
  .sign{display:flex;gap:40px;margin-top:40px}
  .sign div{flex:1;border-top:1px solid #1E3145;padding-top:6px;text-align:center;font-weight:700}
  @media print{body{padding:0}}
`;

/**
 * Yazdırılabilir rapor penceresi açar; kullanıcı tarayıcının yazdır diyaloğundan "PDF olarak kaydet" seçebilir.
 * (Türkçe karakterler tarayıcı yazı tipiyle sorunsuz basılır.)
 */
export function printHtml(title: string, bodyHtml: string, opts: { landscape?: boolean; extraCss?: string } = {}): void {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Açılır pencere engellendi. Tarayıcı ayarlarından bu site için açılır pencerelere izin verin.");
    return;
  }
  const logo = `${window.location.origin}/logo-horizontal.png`;
  w.document.open();
  w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>@page{size:A4 ${opts.landscape ? "landscape" : "portrait"};margin:12mm}${BASE_CSS}${opts.extraCss || ""}</style></head>
<body><div class="brand"><img src="${logo}" alt="İSGO"><div style="text-align:right;color:#6E7C8C;font-size:10px">İş Sağlığı ve Güvenliği App<br>${new Date().toLocaleDateString("tr-TR")}</div></div>
${bodyHtml}
<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},250)}</script>
</body></html>`);
  w.document.close();
}

/** Blob'u dosya olarak indirir. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
