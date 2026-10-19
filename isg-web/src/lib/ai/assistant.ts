"use client";

/**
 * İsgora Asistan — KasaCari'deki AI asistan deseninin web sürümü.
 * Model canlı veri özetini görür; araç çağırınca uygulama ONAY kartı gösterir, onaylanınca işlem yapılır.
 *
 * İstek tasarımı (preserved thinking uyumlu):
 *  - `system` sabit metin + ephemeral önbellek; değişken veri asla system'e konmaz.
 *  - Önceki turlar yalnızca düz metin (thinking blokları yeniden gönderilmez).
 *  - Güncel veri özeti, o turun kullanıcı mesajının ilk text bloğudur.
 *  - Bir tur içinde araç döngüsü yalnızca ekleme yapar: yanıt içeriği (thinking dahil) değiştirilmeden geri gönderilir.
 */

import type {
  BetaContentBlockParam,
  BetaMessage,
  BetaMessageParam,
  BetaTool,
  BetaToolUseBlock,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { ChatMsg, Effort, ModelId } from "@/lib/types";
import { client, fallbackParams, newQueryId, queryHeaders } from "./client";
import {
  analysisSummary,
  findCategoryByName,
  findKasaByName,
  findKursiyerByName,
  kasaBalances,
  kursiyerTotals,
  monthSummary,
  olayStats,
  useStore,
} from "@/lib/store";
import { money, thisMonth, today } from "@/lib/format";
import { currentRol, type Rol } from "@/lib/roles";
import { useSync } from "@/lib/sync";
import { DERSLER } from "@/data/sorular";

// ---------------------------------------------------------------- Sistem istemi (sabit — önbelleğe alınır)

export const SYSTEM_PROMPT =
  "Sen İsgora uygulamasının asistanısın. Kullanıcı bir OSGB / İSG eğitim firması sahibidir. " +
  "Görevlerin: kasa-cari muhasebe, kursiyer (müşteri) takibi ve risk analizi konularında soruları CANLI VERİYE dayanarak yanıtlamak " +
  've kullanıcı kayıt girmek istediğinde uygun aracı çağırmak. Uydurma yapma; veride yoksa "veride yok" de. ' +
  "Kısa, net, Türkçe ve TDK imlasına uygun yaz. Para tutarlarını ₺ ile ve binlik ayraçla yaz. " +
  "Eksik bilgi varsa (tutar, kişi adı gibi) tahmin etme, SOR. Araç çağırdığında işlem hemen yapılmaz; uygulama kullanıcıdan onay ister. " +
  "Birden fazla kayıt verildiyse toplu araçları kullan. İSG mevzuatı (6331, risk değerlendirme yönetmeliği, 5x5 matris) hakkında da uzman yardımı ver.";

const ORTAK_KURAL =
  'Uydurma yapma; veride yoksa "veride yok" de. Kısa, net, Türkçe ve TDK imlasına uygun yaz. ' +
  "Mevzuattaki süre, sayı ve oranları (6331 sayılı Kanun ve yönetmelikler) doğru ver; emin olmadığın yerde güncel Resmî Gazete metnine bakılmasını öner.";

/** Role göre sabit sistem istemi (her rol için ayrı önbelleğe alınır). OSGB, mobil uygulamadaki istemin aynısıdır. */
export function systemPromptFor(rol: Rol): string {
  switch (rol) {
    case "uzman":
      return (
        "Sen İsgora uygulamasının asistanısın. Kullanıcı bir iş güvenliği uzmanıdır. " +
        "Görevlerin: risk değerlendirmesi (5x5 L tipi matris, Fine-Kinney karşılaştırması), saha denetimi, iş kazası / ramak kala araştırması " +
        "(kök neden, 5 Neden, balık kılçığı), düzeltici-önleyici faaliyetler, eğitim planlaması ve İSG mevzuatı konularında uzman desteği vermek; " +
        "soruları CANLI VERİYE (risk analizleri, olaylar, denetimler) dayanarak yanıtlamak. " +
        ORTAK_KURAL
      );
    case "hekim":
      return (
        "Sen İsgora uygulamasının asistanısın. Kullanıcı bir işyeri hekimidir. " +
        "Görevlerin: sağlık gözetimi, işe giriş ve periyodik muayeneler (tehlike sınıfına göre periyotlar), meslek hastalıkları ve bildirimi, " +
        "iş kazası sonrası süreçler, ilk yardım, işe dönüş değerlendirmesi, tetkik planlaması (odyometri, SFT, akciğer grafisi vb.) ve İSG mevzuatı " +
        "konularında destek vermek; soruları CANLI VERİYE (muayene kayıtları, olaylar) dayanarak yanıtlamak. " +
        "Bireysel hasta için kesin tanı koyma; klinik kararın hekime ait olduğunu hatırlat. " +
        ORTAK_KURAL
      );
    case "dsp":
      return (
        "Sen İsgora uygulamasının asistanısın. Kullanıcı işyerinde görevli diğer sağlık personelidir (DSP: hemşire, sağlık memuru, " +
        "acil tıp teknisyeni vb.). Görevlerin: işyeri hekimiyle birlikte yürütülen sağlık gözetimi, periyodik muayene takvimi ve hatırlatmaları, " +
        "ilk yardım ve acil durum hazırlığı, iş kazası sonrası ilk müdahale kayıtları, sağlık eğitimleri, hijyen ve meslek hastalıklarından korunma " +
        "konularında destek vermek; soruları CANLI VERİYE (muayene kayıtları, olaylar) dayanarak yanıtlamak. " +
        "Tanı ve tedavi kararının işyeri hekimine ait olduğunu hatırlat. " +
        ORTAK_KURAL
      );
    case "ogrenci":
      return (
        "Sen İsgora uygulamasının asistanısın. Kullanıcı İSG uzmanlığı / işyeri hekimliği sınavına hazırlanan bir öğrencidir. " +
        "Bir öğretmen gibi davran: konuları sade ve örnekli anlat, maddeler hâlinde özetle, ezberlenmesi gereken süre ve sayıları tablo hâlinde ver, " +
        "istenirse çoktan seçmeli örnek sorular sor ve cevabı açıklamalı düzelt. CANLI VERİDEKİ deneme sonuçlarına göre zayıf konulara odaklan. " +
        ORTAK_KURAL
      );
    default:
      return SYSTEM_PROMPT;
  }
}

/** Kayıt giren araçlar yalnızca OSGB rolünde (kasa / kursiyer) açıktır. */
export function toolsFor(rol: Rol): BetaTool[] {
  return rol === "osgb" ? TOOLS : [];
}

// ---------------------------------------------------------------- Araçlar (strict JSON şema)

export const TOOLS: BetaTool[] = [
  {
    name: "kasa_hareketi_ekle",
    description: "TEK bir gelir/gider hareketi ekler. Birden fazla kayıt varsa kasa_toplu_ekle kullan.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        tip: { type: "string", enum: ["gelir", "gider"] },
        tutar: { type: "number", description: "Tutar (TL)" },
        aciklama: { type: "string" },
        kasa: { type: "string", description: "Kasa adı. Belirtilmediyse boş bırak." },
        kategori: { type: "string", description: "Kategori adı. Bilinmiyorsa boş bırak." },
        tarih: { type: "string", description: "YYYY-AA-GG. Belirtilmediyse bugün." },
        yontem: { type: "string", enum: ["nakit", "banka"] },
      },
      required: ["tip", "tutar", "aciklama"],
      additionalProperties: false,
    },
  },
  {
    name: "kasa_toplu_ekle",
    description: "BİRDEN FAZLA kasa hareketini tek seferde ekler. Liste/tablo verildiyse MUTLAKA bunu kullan.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        kasa: { type: "string", description: "Hepsi için ortak kasa (ops.)" },
        kayitlar: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tip: { type: "string", enum: ["gelir", "gider"] },
              tutar: { type: "number" },
              aciklama: { type: "string" },
              kategori: { type: "string" },
              tarih: { type: "string" },
              kasa: { type: "string" },
            },
            required: ["tip", "tutar", "aciklama"],
            additionalProperties: false,
          },
        },
      },
      required: ["kayitlar"],
      additionalProperties: false,
    },
  },
  {
    name: "kursiyer_tahsilat",
    description: "Müşteri Takip'teki TEK bir firmadan (müşteriden) tahsilat girer (kalan borcu düşer, kasaya yansıtır). ad_soyad = firma adı.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        ad_soyad: { type: "string" },
        tutar: { type: "number", description: "Boş/0 ise kalan borcun tamamı" },
        yontem: { type: "string", enum: ["nakit", "banka"] },
        kasa: { type: "string" },
      },
      required: ["ad_soyad"],
      additionalProperties: false,
    },
  },
  {
    name: "kursiyer_toplu_tahsilat",
    description: "BİRDEN FAZLA firmadan (müşteriden) tahsilat girer. Liste hâlinde ödeme verildiyse bunu kullan. ad_soyad = firma adı.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        kasa: { type: "string" },
        yontem: { type: "string", enum: ["nakit", "banka"] },
        kayitlar: {
          type: "array",
          items: {
            type: "object",
            properties: { ad_soyad: { type: "string" }, tutar: { type: "number" } },
            required: ["ad_soyad"],
            additionalProperties: false,
          },
        },
      },
      required: ["kayitlar"],
      additionalProperties: false,
    },
  },
  {
    name: "kursiyer_ekle",
    description: "Müşteri Takip'e TEK bir firma (müşteri) kaydı ekler; ad_soyad = firma adı / unvanı, program = verilen hizmet. Birden fazla varsa kursiyer_toplu_ekle kullan.",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        ad_soyad: { type: "string" },
        program: { type: "string", description: "Hizmet / program adı (ör. İSG Hizmeti, Eğitim, Risk Analizi)" },
        tutar: { type: "number", description: "Sözleşme tutarı (TL)" },
        telefon: { type: "string" },
        tc: { type: "string" },
        not: { type: "string" },
      },
      required: ["ad_soyad", "program"],
      additionalProperties: false,
    },
  },
  {
    name: "kursiyer_toplu_ekle",
    description: "BİRDEN FAZLA firmayı (müşteriyi) tek seferde ekler; ad_soyad = firma adı, tc = vergi / TC kimlik no (aynı numara + aynı hizmet varsa atlanır).",
    strict: true,
    input_schema: {
      type: "object",
      properties: {
        program: { type: "string" },
        kayitlar: {
          type: "array",
          items: {
            type: "object",
            properties: {
              ad_soyad: { type: "string" },
              tc: { type: "string" },
              dogum_tarihi: { type: "string" },
              telefon: { type: "string" },
              tutar: { type: "number" },
            },
            required: ["ad_soyad"],
            additionalProperties: false,
          },
        },
      },
      required: ["program", "kayitlar"],
      additionalProperties: false,
    },
  },
];

/** Onay kartı ve yan panel için okunur adlar */
export const TOOL_LABELS: Record<string, string> = {
  kasa_hareketi_ekle: "Kasa hareketi ekle",
  kasa_toplu_ekle: "Toplu kasa hareketi",
  kursiyer_tahsilat: "Firma tahsilatı",
  kursiyer_toplu_tahsilat: "Toplu tahsilat",
  kursiyer_ekle: "Firma ekle",
  kursiyer_toplu_ekle: "Toplu firma ekle",
};

export const FIELD_LABELS: Record<string, string> = {
  tip: "Tür",
  tutar: "Tutar",
  aciklama: "Açıklama",
  kasa: "Kasa",
  kategori: "Kategori",
  tarih: "Tarih",
  yontem: "Yöntem",
  kayitlar: "Kayıtlar",
  ad_soyad: "Firma / müşteri",
  program: "Hizmet / program",
  telefon: "Telefon",
  tc: "Vergi / TC no",
  not: "Not",
  dogum_tarihi: "Doğum tarihi",
};

// ---------------------------------------------------------------- Canlı veri özeti

/** Her istekte yeniden üretilen canlı özet — role göre ilgili veriler. */
export function snapshot(rol: Rol = currentRol()): string {
  if (rol === "uzman") return snapshotUzman();
  if (rol === "hekim" || rol === "dsp") return snapshotHekim();
  if (rol === "ogrenci") return snapshotOgrenci();
  return snapshotOsgb();
}

function riskLine(): string {
  const s = useStore.getState();
  const analyses = [...s.analyses].sort((a, b) => b.id - a.id);
  return (
    `Risk analizleri: ${analyses.length} adet` +
    (analyses.length
      ? " — " +
        analyses
          .slice(0, 8)
          .map((a) => {
            const sum = analysisSummary(s.riskRows, a.id);
            return `${a.title} (${a.hazard_class}, ${sum.rows} madde, en yüksek skor ${sum.rows ? sum.max : "-"})`;
          })
          .join("; ")
      : "")
  );
}

function olayLines(): string[] {
  const s = useStore.getState();
  const os = olayStats(s.olaylar);
  const out = [
    `İSG olay kayıtları: ${s.olaylar.length} adet (iş kazası ${os.kaza}, ramak kala ${os.ramak}, meslek hastalığı şüphesi ${
      s.olaylar.filter((o) => o.tur === "meslek_hastaligi").length
    }, kayıp iş günü ${os.kayip_gun}, SGK'ya bildirilmemiş kaza ${os.bildirilmemis})`,
  ];
  const son = [...s.olaylar].sort((a, b) => (b.tarih + b.id).localeCompare(a.tarih + a.id)).slice(0, 5);
  if (son.length) out.push("Son olaylar: " + son.map((o) => `${o.tarih} ${o.tur} ${o.isyeri || ""}: ${o.aciklama.slice(0, 90)}`).join(" | "));
  return out;
}

function profilLine(): string | null {
  const p = (useSync.getState().profil ?? {}) as Record<string, string>;
  const parts = [
    p.ad_soyad,
    p.kurum,
    p.il,
    p.uzmanlik_sinifi ? `${p.uzmanlik_sinifi} sınıfı` : "",
    p.meslek ? `meslek: ${p.meslek}` : "",
    p.uzmanlik_alani ? `uzmanlık: ${p.uzmanlik_alani}` : "",
    p.hedef_sinav ? `hedef: ${p.hedef_sinav}` : "",
    p.bolum ? `bölüm: ${p.bolum}` : "",
  ].filter(Boolean);
  return parts.length ? `Kullanıcı: ${parts.join(", ")}` : null;
}

function snapshotUzman(): string {
  const s = useStore.getState();
  const lines = [`Bugün: ${today()}`];
  const pl = profilLine();
  if (pl) lines.push(pl);
  lines.push(riskLine());
  const kritik = s.riskRows.filter((r) => r.o * r.s >= 20).length;
  const yuksek = s.riskRows.filter((r) => r.o * r.s >= 15 && r.o * r.s < 20).length;
  lines.push(`Risk maddeleri: toplam ${s.riskRows.length}, kabul edilemez ${kritik}, yüksek ${yuksek}`);
  lines.push(...olayLines());
  if (s.denetimler.length) {
    const ort = Math.round(s.denetimler.reduce((a, d) => a + d.puan, 0) / s.denetimler.length);
    const son = [...s.denetimler].sort((a, b) => b.id - a.id).slice(0, 3);
    lines.push(`Saha denetimleri: ${s.denetimler.length} adet, ortalama uygunluk %${ort}; son: ${son.map((d) => `${d.isyeri} ${d.tarih} %${d.puan}`).join("; ")}`);
  } else lines.push("Saha denetimi kaydı yok");
  return lines.join("\n");
}

function snapshotHekim(): string {
  const s = useStore.getState();
  const t = today();
  const lines = [`Bugün: ${t}`];
  const pl = profilLine();
  if (pl) lines.push(pl);
  const m = s.muayeneler;
  const geciken = m.filter((x) => x.sonraki && x.sonraki < t).sort((a, b) => a.sonraki.localeCompare(b.sonraki));
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const sinir = in30.toISOString().slice(0, 10);
  const yaklasan = m.filter((x) => x.sonraki && x.sonraki >= t && x.sonraki <= sinir);
  lines.push(`Muayene kayıtları: ${m.length} çalışan; gecikmiş ${geciken.length}, 30 gün içinde ${yaklasan.length}, kısıtlı/çalışamaz ${m.filter((x) => x.sonuc !== "calisabilir").length}`);
  if (geciken.length) lines.push("Gecikenler: " + geciken.slice(0, 12).map((x) => `${x.calisan} (${x.isyeri}, ${x.sonraki})`).join("; "));
  if (yaklasan.length) lines.push("Yaklaşanlar: " + yaklasan.slice(0, 12).map((x) => `${x.calisan} (${x.isyeri}, ${x.sonraki})`).join("; "));
  lines.push(...olayLines());
  lines.push(riskLine());
  return lines.join("\n");
}

function snapshotOgrenci(): string {
  const s = useStore.getState();
  const lines = [`Bugün: ${today()}`];
  const pl = profilLine();
  if (pl) lines.push(pl);
  const res = [...s.sinavSonuclari].sort((a, b) => b.id - a.id);
  const pct = (r: { dogru: number; toplam: number }) => (r.toplam ? Math.round((r.dogru * 100) / r.toplam) : 0);
  if (!res.length) lines.push("Henüz deneme / test sonucu yok");
  else {
    const son5 = res.slice(0, 5);
    lines.push(`Deneme / test sonuçları: ${res.length} adet; son 5 ortalama %${Math.round(son5.reduce((a, r) => a + pct(r), 0) / son5.length)}`);
    const best = new Map<number, number>();
    for (const r of res) if (r.ders_sira != null) best.set(r.ders_sira, Math.max(best.get(r.ders_sira) ?? 0, pct(r)));
    const ad = (n: number) => DERSLER.find((d) => d.sira === n)?.ad ?? `Ders ${n}`;
    const zayif = [...best.entries()].sort((a, b) => a[1] - b[1]).slice(0, 5);
    if (zayif.length) lines.push("En zayıf dersler (en iyi puan): " + zayif.map(([n, p]) => `${ad(n)} %${p}`).join("; "));
  }
  return lines.join("\n");
}

function snapshotOsgb(): string {
  const s = useStore.getState();
  const bal = kasaBalances(s);
  const kasalar = s.kasalar.filter((k) => k.is_active);
  const ym = monthSummary(s.transactions, thisMonth());
  const tot = kursiyerTotals(s.kursiyerler);
  const active = s.kursiyerler.filter((k) => k.is_active);

  const groups = new Map<string, { n: number; remaining: number }>();
  for (const k of active) {
    const g = k.group_name.trim() || "(Hizmet belirtilmemiş)";
    const cur = groups.get(g) ?? { n: 0, remaining: 0 };
    cur.n += 1;
    cur.remaining += k.remaining_amount;
    groups.set(g, cur);
  }
  const groupList = [...groups.entries()].sort((a, b) => b[1].remaining - a[1].remaining);

  const debtors = active
    .filter((k) => k.remaining_amount > 0)
    .sort((a, b) => b.remaining_amount - a.remaining_amount || a.full_name.localeCompare(b.full_name, "tr"))
    .slice(0, 15);

  const kasaTitle = new Map(s.kasalar.map((k) => [k.id, k.title]));
  const recent = [...s.transactions].sort((a, b) => b.id - a.id).slice(0, 10);
  const analyses = [...s.analyses].sort((a, b) => b.id - a.id);
  const os = olayStats(s.olaylar);

  const lines: string[] = [];
  lines.push(`Bugün: ${today()}`);
  lines.push(`Kasalar (ad → bakiye): ${bal.map((b) => `${b.title} → ${money(b.bakiye)}`).join(" | ") || "yok"}`);
  lines.push(`Tanımlı kasa adları: ${kasalar.map((k) => k.title).join(", ") || "yok"}`);
  lines.push(`Bu ay gelir ${money(ym.gelir)}, gider ${money(ym.gider)}`);
  lines.push(`Müşteri Takip (firmalar): ${tot.n} firma, sözleşme ${money(tot.total)}, tahsil ${money(tot.collected)}, kalan ${money(tot.remaining)}`);
  if (groupList.length) lines.push("Hizmet bazında: " + groupList.map(([g, v]) => `${g}: ${v.n} firma, kalan ${money(v.remaining)}`).join(" | "));
  if (debtors.length) lines.push("En borçlu firmalar: " + debtors.map((d) => `${d.full_name} ${money(d.remaining_amount)}`).join("; "));
  if (recent.length)
    lines.push(
      "Son hareketler: " +
        recent.map((r) => `${r.trx_date} ${r.type} ${money(r.amount)} ${r.description || ""} [${(r.kasa_id && kasaTitle.get(r.kasa_id)) || "-"}]`).join(" | "),
    );
  lines.push(
    `Risk analizleri: ${analyses.length} adet` +
      (analyses.length
        ? " — " +
          analyses
            .slice(0, 8)
            .map((a) => {
              const sum = analysisSummary(s.riskRows, a.id);
              return `${a.title} (${sum.rows} madde, en yüksek skor ${sum.rows ? sum.max : "-"})`;
            })
            .join("; ")
        : ""),
  );
  lines.push(
    `İSG olay kayıtları: ${s.olaylar.length} adet (iş kazası ${os.kaza}, ramak kala ${os.ramak}, kayıp iş günü ${os.kayip_gun}, SGK'ya bildirilmemiş kaza ${os.bildirilmemis})`,
  );
  if (s.denetimler.length) {
    const son = [...s.denetimler].sort((a, b) => b.id - a.id)[0];
    lines.push(`Saha denetimleri: ${s.denetimler.length} adet; son: ${son.isyeri} ${son.tarih} uygunluk %${son.puan}`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------- Mesaj dizisi

const HISTORY_LIMIT = 12;

/** İşlem sonucu bildirimleri (✅/⚠️) sohbet geçmişine bağlam olarak eklenir; hata/ret bildirimleri eklenmez. */
function isActionNotice(text: string): boolean {
  return text.startsWith("✅") || text.startsWith("⚠️");
}

/**
 * Kalıcı sohbetten son 12 kullanıcı/asistan mesajını düz metin olarak hazırlar ve güncel turu ekler.
 * Dizi kullanıcı turuyla başlar ve sırayla değişir; güncel tur = [veri özeti, soru].
 */
export function buildConversation(persisted: ChatMsg[], question: string): BetaMessageParam[] {
  let start = 0;
  let count = 0;
  for (let i = persisted.length - 1; i >= 0; i--) {
    if (persisted[i].role === "system") continue;
    count += 1;
    if (count === HISTORY_LIMIT) {
      start = i;
      break;
    }
  }
  const turns: { role: "user" | "assistant"; text: string }[] = [];
  for (const m of persisted.slice(start)) {
    const text = m.content.trim();
    if (!text) continue;
    let role: "user" | "assistant";
    let t = text;
    if (m.role === "system") {
      if (!isActionNotice(text)) continue;
      role = "user";
      t = `[Uygulama bildirimi] ${text}`;
    } else role = m.role;
    const last = turns[turns.length - 1];
    if (last && last.role === role) last.text += `\n\n${t}`;
    else turns.push({ role, text: t });
  }
  while (turns.length && turns[0].role !== "user") turns.shift();

  const current: BetaContentBlockParam[] = [
    { type: "text", text: "GÜNCEL VERİ ÖZETİ:\n" + snapshot() },
    { type: "text", text: question },
  ];
  const last = turns[turns.length - 1];
  if (last && last.role === "user") {
    turns.pop();
    current.unshift({ type: "text", text: last.text });
  }
  return [...turns.map((t): BetaMessageParam => ({ role: t.role, content: t.text })), { role: "user", content: current }];
}

// ---------------------------------------------------------------- API çağrısı

export interface CallOpts {
  model: ModelId;
  effort: Effort;
  signal?: AbortSignal;
  /** Akış sırasında biriken yanıt metni */
  onText?: (text: string) => void;
  /** Kullanıcının sorusu başına tek kimlik (araç turları aynı sorgu sayılır) — bkz. newQueryId */
  queryId?: string;
}

/** Tek bir Messages API çağrısı (akışlı). Aynı tur içinde system/tools/model sabit kalmalıdır. */
export async function callAssistant(messages: BetaMessageParam[], opts: CallOpts): Promise<BetaMessage> {
  const c = await client();
  const rol = currentRol();
  const stream = c.beta.messages.stream(
    {
      model: opts.model,
      max_tokens: 16000,
      system: [{ type: "text", text: systemPromptFor(rol), cache_control: { type: "ephemeral" } }],
      ...(toolsFor(rol).length ? { tools: toolsFor(rol) } : {}),
      messages,
      output_config: { effort: opts.effort },
      ...fallbackParams(opts.model),
    },
    { signal: opts.signal, headers: queryHeaders(opts.queryId ?? newQueryId()) },
  );
  let acc = "";
  stream.on("text", (delta) => {
    acc += delta;
    opts.onText?.(acc);
  });
  return stream.finalMessage();
}

export function toolUses(res: BetaMessage): BetaToolUseBlock[] {
  return res.content.filter((b): b is BetaToolUseBlock => b.type === "tool_use");
}

/** Yanıttaki text bloklarını birleştirir. */
export function replyText(res: BetaMessage): string {
  return res.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();
}

// ---------------------------------------------------------------- Onay sonrası doğrulama + uygulama

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}
function rows(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v.slice(0, 200).filter((x) => x && typeof x === "object") as Record<string, unknown>[]) : [];
}

/** Onaylanan aracı doğrular ve uygular (KasaCari ai_run_action karşılığı). Hata olursa Error fırlatır. */
export function runAction(name: string, input: Record<string, unknown>): string {
  const inp = input || {};
  switch (name) {
    case "kasa_hareketi_ekle":
      return addOne({
        tip: str(inp.tip),
        tutar: num(inp.tutar),
        aciklama: str(inp.aciklama),
        kasa: str(inp.kasa),
        kategori: str(inp.kategori),
        tarih: str(inp.tarih),
        yontem: str(inp.yontem),
      });
    case "kasa_toplu_ekle": {
      let ok = 0;
      const errs: string[] = [];
      for (const k of rows(inp.kayitlar)) {
        try {
          addOne({
            tip: str(k.tip),
            tutar: num(k.tutar),
            aciklama: str(k.aciklama),
            kasa: str(k.kasa) || str(inp.kasa),
            kategori: str(k.kategori),
            tarih: str(k.tarih),
            yontem: "",
          });
          ok += 1;
        } catch (e) {
          errs.push(`${str(k.aciklama)}: ${(e as Error).message}`);
        }
      }
      return `${ok} hareket eklendi.` + (errs.length ? ` Atlanan: ${errs.join("; ")}` : "");
    }
    case "kursiyer_tahsilat":
      return payOne(str(inp.ad_soyad), num(inp.tutar), str(inp.yontem), str(inp.kasa));
    case "kursiyer_toplu_tahsilat": {
      const out: string[] = [];
      for (const k of rows(inp.kayitlar)) {
        try {
          out.push(payOne(str(k.ad_soyad), num(k.tutar), str(inp.yontem), str(inp.kasa)));
        } catch (e) {
          out.push(`${str(k.ad_soyad)}: ${(e as Error).message}`);
        }
      }
      return out.join("\n") || "İşlenecek kayıt yok.";
    }
    case "kursiyer_ekle": {
      const ad = str(inp.ad_soyad);
      if (!ad) throw new Error("Firma adı boş olamaz.");
      const tutar = Math.max(0, num(inp.tutar));
      const program = str(inp.program);
      const id = useStore.getState().addKursiyer({
        full_name: ad,
        tc: str(inp.tc),
        phone: str(inp.telefon),
        email: "",
        city: "",
        group_name: program,
        list_no: "",
        total_amount: tutar,
        cash_amount: 0,
        bank_amount: 0,
        remaining_amount: tutar,
        kasa_id: null,
        plasiyer: "",
        notes: str(inp.not),
        invoice_issue_date: "",
      });
      return `Firma eklendi (#${id}): ${ad}${program ? ` — ${program}` : ""}, ${money(tutar)}`;
    }
    case "kursiyer_toplu_ekle": {
      const program = str(inp.program);
      const st = useStore.getState();
      const tcs = new Set(st.kursiyerler.filter((k) => k.is_active && k.group_name === program && k.tc).map((k) => k.tc));
      let ok = 0;
      let skip = 0;
      for (const k of rows(inp.kayitlar)) {
        const ad = str(k.ad_soyad);
        if (!ad) continue;
        const tc = str(k.tc);
        if (tc && tcs.has(tc)) {
          skip += 1;
          continue;
        }
        const tutar = Math.max(0, num(k.tutar));
        const notes = str(k.dogum_tarihi) ? `Doğum: ${str(k.dogum_tarihi)}` : "";
        useStore.getState().addKursiyer({
          full_name: ad,
          tc,
          phone: str(k.telefon),
          email: "",
          city: "",
          group_name: program,
          list_no: "",
          total_amount: tutar,
          cash_amount: 0,
          bank_amount: 0,
          remaining_amount: tutar,
          kasa_id: null,
          plasiyer: "",
          notes,
          invoice_issue_date: "",
        });
        if (tc) tcs.add(tc);
        ok += 1;
      }
      return `${ok} firma eklendi${program ? ` (${program})` : ""}.` + (skip ? ` ${skip} kayıt zaten vardı, atlandı.` : "");
    }
    default:
      throw new Error(`Bilinmeyen araç: ${name}`);
  }
}

function addOne(x: { tip: string; tutar: number; aciklama: string; kasa: string; kategori: string; tarih: string; yontem: string }): string {
  const tip = x.tip === "gider" ? "gider" : "gelir";
  if (x.tutar <= 0) throw new Error("Tutar sıfırdan büyük olmalı.");
  const st = useStore.getState();
  const kasa = x.kasa ? findKasaByName(st, x.kasa) : null;
  if (x.kasa && !kasa) throw new Error(`'${x.kasa}' adlı kasa bulunamadı.`);
  const cat = findCategoryByName(st, tip, x.kategori);
  st.addTrx({
    trx_date: /^\d{4}-\d{2}-\d{2}$/.test(x.tarih) ? x.tarih : today(),
    type: tip,
    kasa_id: kasa?.id ?? null,
    category_id: cat?.id ?? null,
    payment_method: x.yontem === "banka" ? "banka" : "nakit",
    description: x.aciklama,
    amount: x.tutar,
  });
  return `${tip === "gelir" ? "Gelir" : "Gider"} eklendi: ${money(x.tutar)} — ${x.aciklama}${kasa ? ` [${kasa.title}]` : ""}`;
}

function payOne(name: string, amount: number, yontem: string, kasaName: string): string {
  if (!name) throw new Error("Firma adı boş olamaz.");
  const st = useStore.getState();
  const found = findKursiyerByName(st, name);
  if (!found.length) throw new Error(`'${name}' bulunamadı.`);
  if (found.length > 1) throw new Error(`'${name}' için ${found.length} eşleşme var; tam ad yazın.`);
  const k = found[0];
  const kasa = kasaName ? findKasaByName(st, kasaName) : null;
  const amt = amount > 0 ? amount : k.remaining_amount;
  st.addPayment(k.id, amt, yontem === "banka" ? "banka" : "nakit", kasa?.id ?? k.kasa_id ?? null);
  return `${k.full_name}: ${money(amt)} tahsil edildi (kalan ${money(Math.max(0, k.remaining_amount - amt))}).`;
}
