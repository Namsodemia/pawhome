"use client";

import type { Muayene, MuayeneInput } from "@/lib/types";
import { Badge } from "@/components/ui";
import { cx, fmtDate, initials } from "@/lib/format";
import { esc, printHtml } from "@/lib/print";
import { DURUM_META, MUAYENE_TUR_LABEL, MUAYENE_TUR_TONE, PERIYOT_TEXT, SONUC_LABEL, SONUC_TONE, durum, durumText } from "@/lib/muayene";

// ---------------------------------------------------------------- küçük görsel parçalar

const AVATAR_CLS = {
  gecikmis: "bg-soft-danger text-danger",
  yaklasan: "bg-soft-warn text-warn",
  guncel: "bg-soft-green text-success",
} as const;

export function MAvatar({ m, now, size = 42 }: { m: Pick<Muayene, "calisan" | "sonraki">; now: string; size?: number }) {
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center rounded-[14px] font-extrabold", AVATAR_CLS[durum(m, now)])}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden
    >
      {initials(m.calisan)}
    </span>
  );
}

/** "12 gün gecikti" (kırmızı) / "8 gün kaldı" (amber) / "Güncel" (yeşil) */
export function DurumBadge({ m, now, className }: { m: Pick<Muayene, "sonraki">; now: string; className?: string }) {
  const d = durum(m, now);
  return (
    <Badge tone={DURUM_META[d].tone} className={cx("num", className)}>
      {durumText(m, now)}
    </Badge>
  );
}

export function TurBadge({ m }: { m: Pick<Muayene, "tur"> }) {
  return <Badge tone={MUAYENE_TUR_TONE[m.tur]}>{MUAYENE_TUR_LABEL[m.tur]}</Badge>;
}

export function SonucBadge({ m }: { m: Pick<Muayene, "sonuc"> }) {
  return <Badge tone={SONUC_TONE[m.sonuc]}>{SONUC_LABEL[m.sonuc]}</Badge>;
}

// ---------------------------------------------------------------- Yazdır: Periyodik Muayene Formu

const SONUC_PRINT: Record<Muayene["sonuc"], { bg: string; color: string }> = {
  calisabilir: { bg: "#DCFCE7", color: "#15803D" },
  kisitli: { bg: "#FFF4D6", color: "#8A5A00" },
  calisamaz: { bg: "#FEE2E8", color: "#BE123C" },
};

export function printMuayene(m: MuayeneInput & { id?: number }, opts: { firma: string; hekim: string }) {
  const sp = SONUC_PRINT[m.sonuc];
  const rows: [string, string][] = [
    ["Çalışanın adı soyadı", m.calisan],
    ["T.C. kimlik no", m.tc],
    ["İşyeri", m.isyeri],
    ["Görevi", m.gorev],
    ["Tehlike sınıfı", `${m.hazard_class} · periyodik muayene ${PERIYOT_TEXT[m.hazard_class]}`],
    ["Muayene türü", MUAYENE_TUR_LABEL[m.tur]],
    ["Muayene tarihi", fmtDate(m.tarih)],
    ["Yapılan tetkikler", m.tetkikler.join(", ")],
  ];
  const tail: [string, string][] = [
    ["Bir sonraki periyodik muayene", fmtDate(m.sonraki)],
    ["Notlar / kısıtlamalar", m.notlar],
  ];
  const tr = ([k, v]: [string, string]) =>
    `<tr><td style="width:32%;font-weight:700;background:#F4F7F9">${esc(k)}</td><td style="white-space:pre-wrap">${v ? esc(v) : "&nbsp;"}</td></tr>`;
  const body = `
    <h1>Periyodik Muayene Formu</h1>
    <div class="meta">${opts.firma ? `${esc(opts.firma)} · ` : ""}${m.id ? `Kayıt no: ${m.id} · ` : ""}Düzenlenme: ${new Date().toLocaleDateString("tr-TR")}</div>
    <table><tbody>
      ${rows.map(tr).join("")}
      <tr><td style="width:32%;font-weight:700;background:#F4F7F9">Sonuç</td><td style="background:${sp.bg};color:${sp.color};font-weight:800;font-size:12px">${esc(
        SONUC_LABEL[m.sonuc].toLocaleUpperCase("tr-TR"),
      )}</td></tr>
      ${tail.map(tr).join("")}
    </tbody></table>
    <p class="footer">Bu form 6331 sayılı İş Sağlığı ve Güvenliği Kanunu'nun 15. maddesi (sağlık gözetimi) kapsamında düzenlenmiştir. Periyodik muayeneler işyerinin tehlike sınıfına göre çok tehlikeli sınıfta yılda bir, tehlikeli sınıfta 3 yılda bir, az tehlikeli sınıfta 5 yılda bir tekrarlanır; çalışanın sağlık durumu gerektirdiğinde işyeri hekimi daha kısa aralık belirleyebilir.</p>
    <div class="sign">
      <div>Çalışan<br><span style="font-weight:400">${esc(m.calisan)}</span></div>
      <div>İşyeri Hekimi<br><span style="font-weight:400">${opts.hekim ? esc(opts.hekim) : "Ad Soyad · İmza · Kaşe"}</span></div>
    </div>`;
  printHtml(`Periyodik Muayene Formu — ${m.calisan || fmtDate(m.tarih)}`, body);
}
