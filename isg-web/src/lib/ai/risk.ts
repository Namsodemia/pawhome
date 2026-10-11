/**
 * İSG risk maddesi üretimi — mobil İsgora uygulamasındaki src/ai/risk.ts'in (o da önceki web sistemindeki
 * ai.py'den port edildi) web karşılığı.
 * Akış: plan (bölümler + meta) → her bölüm için satırlar → sektöre özel uygulama metni.
 * Çıktılar yapılandırılmış JSON (json_schema) ile alınır; prompt metinleri birebir korunmuştur.
 */
import { callJson } from "./client";
import type { HazardClass, RiskRowInput } from "@/lib/types";
import { HAZARD_CLASSES, isHazardClass } from "@/lib/risk";
import { norm, upperTR } from "@/lib/format";

export const SYSTEM =
  "Sen Türkiye'de çalışan; 6331 sayılı İş Sağlığı ve Güvenliği Kanunu ile İş Yerlerinde Risk " +
  "Değerlendirmesi Yönetmeliğine ve 5x5 risk matris yöntemine hâkim, deneyimli bir İSG uzmanısın. " +
  "Sana bir işletme tanımı verilir; sen o işletmeye ÖZEL, gerçekçi risk değerlendirme maddeleri üretirsin.\n\n" +
  "MEVZUATA GÖRE TANIMLAR (bunlara harfiyen uy):\n" +
  "- TEHLİKE: İşyerinde var olan ya da dışarıdan gelebilecek, çalışanı veya işyerini etkileyebilecek " +
  "zarar veya hasar verme potansiyeli. Yani zararın KAYNAĞI ya da tehlikeli DURUM.\n" +
  "- RİSK: Tehlikeden kaynaklanacak kayıp, yaralanma ya da başka zararlı SONUÇ meydana gelme ihtimali. " +
  "Yani ortaya çıkabilecek ZARAR/SONUÇ.\n\n" +
  "KURALLAR:\n" +
  "1) Bütün metinler Türkçe ve TDK imlasına uygun olacak; imla hatası, devrik/düşük cümle olmayacak.\n" +
  "2) Her madde birbirinden farklı, somut ve işletmeye özgü olacak; genel/tekrarlı ifadeler yok.\n" +
  "3) Olasılık (o) ve şiddet (s) 1-5 arası gerçekçi tam sayı; ölümcül/ağır tehlikelerde şiddet yüksek.\n" +
  "4) 'tehlike' alanı: tehlikenin KAYNAĞINI/durumunu NET ve KISA yaz (genelde 3-10 kelime, uzun cümle KURMA). " +
  "Tehlike alanına 'risk', 'riski' veya 'tehlikesi' gibi SONUÇ bildiren sözcükler YAZMA — tehlike yalnızca " +
  "kaynak/durumdur, sonucu risk alanına bırak. Örnek: 'Kızartmada sıçrayan kızgın yağ ve sıcak yüzeyler', " +
  "'Islak ve kaygan zemin', 'Enerjisi kesilmeden elektrik panosuna müdahale'.\n" +
  "5) 'risk' alanı: tehlikeden doğabilecek olası ZARARI/SONUCU NET ve KISA yaz (genelde 2-8 kelime). " +
  "Örnek: 'Yanık ve haşlanma', 'Kayarak düşme, kırık ve incinme', 'Elektrik çarpması'. " +
  "ÖNEMLİ: tehlike ile risk AYNI ŞEY DEĞİL — tehlike kaynağı/durumu, risk ise onun sonucudur; ikisini karıştırma.\n" +
  "6) 'onlem' alanı: alınacak somut ve uygulanabilir önlemi net yaz (kısa ama eksiksiz).\n" +
  "7) 'faaliyet', 'tehlike' ve 'risk' birbiriyle TUTARLI olacak; faaliyet başlığındaki asıl tehlikeyi ele al " +
  "(ör. 'yüksekte çalışma' başlıklı maddede öncelikli tehlike düşmeyle ilgili olmalı). 'faaliyet' işi tanımlayan " +
  "3-8 kelimelik kısa bir başlıktır.\n" +
  "8) Yabancı/Latince tıbbi terimler yerine Türkçe karşılıklarını kullan: 'asfiksi' değil 'boğulma / havasız kalma', " +
  "'irritasyon' değil 'tahriş', 'dermatit' değil 'cilt iltihabı'; 'hipotermi' doğru yazılır ('hipotermia' yanlıştır). " +
  "Bileşik sözcükleri TDK'ya göre ayrı yaz ('demir çelik' gibi).\n" +
  "9) 'sorumlu' alanı BÜYÜK HARF rol adı olacak (İŞVEREN, İSG UZMANI, USTA BAŞI, TEKNİK SORUMLU vb.).\n" +
  "10) 'bolum' alanı işletmenin gerçek alanlarına göre olacak (ör. otelde Mutfak, Kat Hizmetleri, " +
  "Havuz, Teknik Alan; şantiyede Kazı, Betonarme, İskele...).\n" +
  "11) Yalnızca geçerli JSON döndür; JSON dışında hiçbir metin yazma.";

const PLAN_SYSTEM =
  SYSTEM + "\n\nBu adımda madde ÜRETME; yalnızca işletmenin meta bilgilerini ve bölüm başına madde paylaşımını planla.";

// ---------------------------------------------------------------- JSON şemaları (structured outputs)

const SCORE = { type: "integer", enum: [1, 2, 3, 4, 5] };

const ROW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["bolum", "faaliyet", "tehlike", "risk", "o", "s", "onlem", "sorumlu"],
  properties: {
    bolum: { type: "string" },
    faaliyet: { type: "string" },
    tehlike: { type: "string" },
    risk: { type: "string" },
    o: SCORE,
    s: SCORE,
    onlem: { type: "string" },
    sorumlu: { type: "string" },
  },
};

const ROWS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["rows"],
  properties: { rows: { type: "array", items: ROW_SCHEMA } },
};

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["hazard_class", "activity_desc", "personnel", "employer_label", "sections"],
  properties: {
    hazard_class: { type: "string", enum: [...HAZARD_CLASSES] },
    activity_desc: { type: "string" },
    personnel: { type: "string" },
    employer_label: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["bolum", "count"],
        properties: { bolum: { type: "string" }, count: { type: "integer" } },
      },
    },
  },
};

const SEKTOR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["metin"],
  properties: { metin: { type: "string" } },
};

const IMPROVE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["row"],
  properties: { row: ROW_SCHEMA },
};

// ---------------------------------------------------------------- tipler

/** Formdaki "Otomatik belirle" seçeneği → 'OTOMATİK' */
export type HazardChoice = HazardClass | "OTOMATİK";

export interface Plan {
  meta: {
    hazard_class: HazardClass;
    activity_desc: string;
    personnel: string;
    employer_label: string;
  };
  sections: { bolum: string; count: number }[];
}

interface PlanJson {
  hazard_class?: string;
  activity_desc?: string;
  personnel?: string;
  employer_label?: string;
  sections?: { bolum?: string; count?: number }[];
}

export interface RiskInput {
  description: string;
  nace_code: string;
  sector_name: string;
  item_count: number;
  hazard_class: HazardChoice;
}
export type BizInput = Pick<RiskInput, "description" | "nace_code" | "sector_name">;

// ---------------------------------------------------------------- normalizasyon

function clamp(v: unknown, lo = 1, hi = 5, def = 3): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return def;
  return Math.max(lo, Math.min(hi, n));
}

/** Tehlike alanından sonuç bildiren " riski / tehlikesi / tehlikeleri" eklerini atar. */
export function cleanHazard(t: string): string {
  return t
    .replace(/\s+(riski|tehlikesi|tehlikeleri)(?=$|[\s,;.:!?)])/giu, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,;]+|[\s,;]+$/g, "");
}

export function normalizeRows(raw: unknown): RiskRowInput[] {
  const out: RiskRowInput[] = [];
  if (!Array.isArray(raw)) return out;
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const x = r as Record<string, unknown>;
    const faaliyet = String(x.faaliyet ?? "").trim();
    const tehlike = cleanHazard(String(x.tehlike ?? "").trim());
    if (!faaliyet && !tehlike) continue;
    out.push({
      bolum: String(x.bolum ?? "").trim(),
      faaliyet,
      tehlike,
      risk: String(x.risk ?? "").trim(),
      o: clamp(x.o),
      s: clamp(x.s),
      onlem: String(x.onlem ?? "").trim(),
      sorumlu: upperTR(String(x.sorumlu ?? "İŞVEREN").trim()) || "İŞVEREN",
    });
  }
  return out;
}

function isAbort(e: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  return e instanceof Error && (e.name === "AbortError" || e.name === "APIUserAbortError");
}

// ---------------------------------------------------------------- plan

export async function plan(inp: RiskInput, signal?: AbortSignal): Promise<Plan> {
  const itemCount = Math.max(1, Math.min(300, Math.round(inp.item_count) || 1));
  const hazardLine =
    inp.hazard_class && inp.hazard_class !== "OTOMATİK"
      ? `Tehlike sınıfı: ${inp.hazard_class}`
      : "Tehlike sınıfını NACE koduna ve faaliyete göre sen belirle.";
  const prompt =
    `NACE kodu: ${inp.nace_code}\nSektör: ${inp.sector_name}\n${hazardLine}\n` +
    `İstenen toplam madde sayısı: ${itemCount}\n\nİşletme tanımı:\n${inp.description}\n\n` +
    "Şu JSON'u döndür:\n{\n" +
    '  "hazard_class": "AZ TEHLİKELİ | TEHLİKELİ | ÇOK TEHLİKELİ",\n' +
    '  "activity_desc": "faaliyet tanımı, 1-2 cümle",\n' +
    '  "personnel": "çalışan/rol tipleri, kısa",\n' +
    '  "employer_label": "İşveren / <işletme tipi>",\n' +
    '  "sections": [ {"bolum":"", "count": 8} ]\n}\n' +
    `sections içindeki count değerlerinin toplamı TAM OLARAK ${itemCount} olmalı. ` +
    "Bölüm başına 6-14 madde uygundur. Bölümler işletmenin gerçek alanlarına göre olmalı; " +
    "bolum adları KISA olsun (2-5 kelime), başına numara EKLEME.";
  const j = await callJson<PlanJson>({ system: PLAN_SYSTEM, user: prompt, schema: PLAN_SCHEMA, maxTokens: 16000, signal });

  // Aynı adla iki kez gelen bölümleri birleştir (devam etme mantığı bölüm adına göre çalışır).
  let sections: { bolum: string; count: number }[] = [];
  let total = 0;
  const byName = new Map<string, { bolum: string; count: number }>();
  for (const s of j.sections ?? []) {
    const bolum = String(s?.bolum ?? "")
      .trim()
      .replace(/^\d+[.)-]?\s+/, "");
    const count = Math.max(1, Math.round(Number(s?.count ?? 0)) || 0);
    if (!bolum || !count) continue;
    const key = norm(bolum);
    const hit = byName.get(key);
    if (hit) hit.count += count;
    else {
      const sec = { bolum, count };
      byName.set(key, sec);
      sections.push(sec);
    }
    total += count;
  }
  if (!sections.length) {
    sections = [{ bolum: "Genel", count: itemCount }];
    total = itemCount;
  }
  // Toplam tam olarak istenen sayı olsun (model bazen eksik/fazla paylaştırır).
  while (total > itemCount) {
    for (const s of sections) {
      if (total <= itemCount) break;
      if (s.count > 1) {
        s.count -= 1;
        total -= 1;
      }
    }
    if (total > itemCount && sections.every((s) => s.count <= 1)) total -= sections.pop()!.count;
  }
  let i = 0;
  while (total < itemCount) {
    sections[i % sections.length].count += 1;
    total += 1;
    i += 1;
  }

  // Kullanıcının seçtiği tehlike sınıfı her zaman yapay zekânın önerisini ezer.
  let hz = upperTR(String(j.hazard_class ?? "").trim()) as HazardClass;
  if (inp.hazard_class && inp.hazard_class !== "OTOMATİK") hz = inp.hazard_class;
  else if (!isHazardClass(hz)) hz = "TEHLİKELİ";

  return {
    meta: {
      hazard_class: hz,
      activity_desc: String(j.activity_desc ?? "").trim(),
      personnel: String(j.personnel ?? "").trim(),
      employer_label: String(j.employer_label ?? "").trim() || "İşveren / Yetkili",
    },
    sections,
  };
}

// ---------------------------------------------------------------- sektöre özel uygulama

export async function sektorUygulama(inp: BizInput, signal?: AbortSignal): Promise<string> {
  const prompt =
    `İşletme (NACE ${inp.nace_code} - ${inp.sector_name}):\n${inp.description}\n\n` +
    "Bu işletmenin risk değerlendirme prosedüründeki 'SEKTÖRE ÖZEL UYGULAMA' bölümünü yaz. " +
    "Verilen NACE koduna ve işletmeye ÖZGÜ, 5-7 maddelik NUMARALI liste olsun; her madde " +
    "'<o sektörün kritik faaliyeti/tehlikesi>: <alınacak somut önlem ve prosedür>' biçiminde. " +
    "Genel/klişe değil, o sektöre özel; Türkçe ve TDK imlasına uygun.\n" +
    'Şu JSON: {"metin": "1) ... . 2) ... . 3) ... ."}  (maddeler arası ". " ile, TEK satır)';
  try {
    const j = await callJson<{ metin?: string }>({ system: SYSTEM, user: prompt, schema: SEKTOR_SCHEMA, maxTokens: 8000, signal });
    return String(j.metin ?? "")
      .replace(/\s*\n+\s*/g, " ")
      .trim();
  } catch (e) {
    if (isAbort(e, signal)) throw e;
    return "";
  }
}

// ---------------------------------------------------------------- bölüm satırları

export async function section(inp: BizInput, bolum: string, count: number, signal?: AbortSignal): Promise<RiskRowInput[]> {
  const n = Math.max(1, Math.min(40, count));
  const schema = '{"rows":[{"bolum":"","faaliyet":"","tehlike":"","risk":"","o":3,"s":4,"onlem":"","sorumlu":"İŞVEREN"}]}';
  const prompt =
    `İşletme (NACE ${inp.nace_code} - ${inp.sector_name}):\n${inp.description}\n\n` +
    `Bölüm: ${bolum}\nBu bölüm için tam ${n} adet farklı, işletmeye özel risk maddesi üret. ` +
    `Her maddede bolum alanına '${bolum}' yaz.\nŞu JSON: ${schema}`;
  let rows = normalizeRows((await callJson<{ rows?: unknown }>({ system: SYSTEM, user: prompt, schema: ROWS_SCHEMA, maxTokens: 32000, signal })).rows);

  // Eksik gelirse en fazla 2 tamamlama çağrısı; daha önce üretilen faaliyetler listelenir ki tekrar etmesin.
  let attempts = 0;
  while (rows.length < n && attempts < 2) {
    attempts += 1;
    const missing = n - rows.length;
    const done = rows
      .map((r) => r.faaliyet)
      .filter(Boolean)
      .join("; ")
      .slice(0, 1500);
    const topup =
      `İşletme (NACE ${inp.nace_code} - ${inp.sector_name}):\n${inp.description}\n\n` +
      `Bölüm: ${bolum}\nBu bölüm için ${missing} adet DAHA, öncekilerden FARKLI, işletmeye özel risk maddesi üret. ` +
      `Şu faaliyetler ZATEN üretildi, TEKRARLAMA: ${done}\nHer maddede bolum alanına '${bolum}' yaz.\nŞu JSON: ${schema}`;
    try {
      const more = await callJson<{ rows?: unknown }>({ system: SYSTEM, user: topup, schema: ROWS_SCHEMA, maxTokens: 20000, signal });
      rows = rows.concat(normalizeRows(more.rows));
    } catch (e) {
      if (isAbort(e, signal)) throw e;
      break;
    }
  }
  return rows.slice(0, n).map((r) => ({ ...r, bolum }));
}

// ---------------------------------------------------------------- tek madde iyileştirme

/** Tek bir madde için mevzuata göre düzeltme / güçlendirme (satır düzenleme ekranından). */
export async function improveRow(row: RiskRowInput, context: string, signal?: AbortSignal): Promise<RiskRowInput> {
  const prompt =
    `İşletme: ${context}\n\nŞu risk maddesini mevzuata ve kurallara göre düzelt ve güçlendir; alan adlarını koru:\n` +
    JSON.stringify(row) +
    '\nŞu JSON: {"row":{"bolum":"","faaliyet":"","tehlike":"","risk":"","o":3,"s":4,"onlem":"","sorumlu":"İŞVEREN"}}';
  const j = await callJson<{ row?: unknown }>({ system: SYSTEM, user: prompt, schema: IMPROVE_SCHEMA, maxTokens: 8000, signal });
  const rows = normalizeRows([j.row]);
  if (!rows.length) throw new Error("Madde iyileştirilemedi.");
  return { ...rows[0], bolum: row.bolum || rows[0].bolum };
}
