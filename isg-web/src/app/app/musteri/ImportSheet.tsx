"use client";

import { useMemo, useRef, useState, type DragEvent } from "react";
import { Download, FileSpreadsheet, FileUp, RefreshCw, Upload } from "lucide-react";
import { Badge, Button, Chips, Field, Input, Sheet } from "@/components/ui";
import { FieldGroup } from "@/components/FieldGroup";
import { toast } from "@/components/feedback";
import { findKasaByName, useStore } from "@/lib/store";
import { cx, money, norm, parseNum } from "@/lib/format";
import { mergeGroups } from "@/lib/groups";
import { exportTableXlsx, readTableFile } from "@/lib/table-xlsx";
import type { Kasa, Kursiyer, KursiyerInput } from "@/lib/types";

// ---------------------------------------------------------------- sütun eşleştirme

type FieldKey =
  | "full_name"
  | "tc"
  | "phone"
  | "email"
  | "city"
  | "group_name"
  | "list_no"
  | "total"
  | "cash"
  | "bank"
  | "paid"
  | "remaining"
  | "kasa"
  | "date"
  | "plasiyer"
  | "notes";

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: "full_name", label: "Ad soyad *" },
  { key: "tc", label: "TC kimlik no" },
  { key: "phone", label: "Telefon" },
  { key: "email", label: "E-posta" },
  { key: "city", label: "İl / ilçe" },
  { key: "group_name", label: "Program / grup" },
  { key: "list_no", label: "Dönem / liste" },
  { key: "total", label: "Sözleşme tutarı" },
  { key: "cash", label: "Nakit tahsilat" },
  { key: "bank", label: "Banka tahsilat" },
  { key: "paid", label: "Ödenen (toplam)" },
  { key: "remaining", label: "Kalan" },
  { key: "kasa", label: "Kasa" },
  { key: "date", label: "Tahsilat / fatura tarihi" },
  { key: "plasiyer", label: "Plasiyer" },
  { key: "notes", label: "Not" },
];

type Mapping = Record<FieldKey, number>;
const emptyMapping = (): Mapping => Object.fromEntries(FIELDS.map((f) => [f.key, -1])) as Mapping;

function headerKey(h: string): string {
  return norm(h)
    .replace(/[._\-/:()*#|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Türkçe başlık adından alanı tahmin eder (sıra önemli: "tahsilat tarihi" → tarih, "eğitim ücreti" → tutar). */
export function matchHeader(raw: string): FieldKey | null {
  const h = headerKey(raw);
  if (!h) return null;
  const has = (...w: string[]) => w.some((x) => h.includes(x));
  const is = (...w: string[]) => w.includes(h);
  if (has("tarih")) return "date";
  if (has("kasa", "tahsil eden", "parayi alan")) return "kasa";
  if (has("nakit")) return "cash";
  if (has("banka", "eft", "havale")) return "bank";
  if (has("kalan", "borc", "bakiye")) return "remaining";
  if (has("odeme sekli", "odeme araci", "odeme turu", "odeme yontemi", "odeme durumu")) return null;
  if (has("tahsil", "odenen", "odedigi", "odeme")) return "paid";
  if (has("sozlesme", "ucret", "tutar", "fiyat", "bedel") || is("toplam")) return "total";
  if (is("tc", "tckn", "tcno", "t c", "kimlik") || h.startsWith("tc ") || has("kimlik")) return "tc";
  if (has("telefon", "gsm", "cep") || is("tel") || h.startsWith("tel ")) return "phone";
  if (has("posta", "mail")) return "email";
  if (has("plasiyer", "temsilci", "satici", "referans")) return "plasiyer";
  if (is("not", "notlar", "aciklama", "aciklamalar") || h.startsWith("not ")) return "notes";
  if (has("donem", "liste")) return "list_no";
  if (has("program", "grup", "egitim", "brans") || is("kurs", "kurs adi", "sinif")) return "group_name";
  if (is("il", "ilce", "il ilce", "sehir", "adres", "il ve ilce") || has("sehir")) return "city";
  if (
    has("ad soyad", "adi soyadi", "ad soyadi", "adsoyad", "isim", "kursiyer", "musteri", "ogrenci", "katilimci", "unvan") ||
    is("ad", "adi", "ad ve soyad", "adi ve soyadi")
  )
    return "full_name";
  return null;
}

function autoMap(header: string[]): { mapping: Mapping; hits: number } {
  const mapping = emptyMapping();
  let hits = 0;
  header.forEach((h, i) => {
    const k = matchHeader(h);
    if (k && mapping[k] === -1) {
      mapping[k] = i;
      hits += 1;
    }
  });
  return { mapping, hits };
}

/** İlk 10 satır içinde başlık satırını bulur (en az 2 tanınan sütun; ad soyad tercih edilir). */
function detectHeader(rows: string[][]): { headerIdx: number; mapping: Mapping } {
  let best = { headerIdx: -1, mapping: emptyMapping(), score: 0 };
  rows.slice(0, 10).forEach((r, i) => {
    const { mapping, hits } = autoMap(r);
    const score = hits + (mapping.full_name >= 0 ? 2 : 0);
    if (hits >= 2 && score > best.score) best = { headerIdx: i, mapping, score };
  });
  if (best.headerIdx === -1) {
    const m = emptyMapping();
    m.full_name = 0;
    return { headerIdx: -1, mapping: m };
  }
  return { headerIdx: best.headerIdx, mapping: best.mapping };
}

function colLetter(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function toIsoDate(s: string): string {
  const t = (s || "").trim();
  if (!t) return "";
  const p = (x: string | number) => String(x).padStart(2, "0");
  const ok = (y: number, m: number, d: number) => y > 1900 && y < 2200 && m >= 1 && m <= 12 && d >= 1 && d <= 31;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  if (m && ok(+m[1], +m[2], +m[3])) return `${m[1]}-${p(m[2])}-${p(m[3])}`;
  m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/.exec(t);
  if (m) {
    const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    if (ok(y, +m[2], +m[1])) return `${y}-${p(m[2])}-${p(m[1])}`;
  }
  if (/^\d{5}$/.test(t)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Number(t) * 86400000);
    return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
  }
  return "";
}

const phoneKey = (s: string) => s.replace(/\D/g, "").slice(-10);
const SKIP_NAMES = new Set(["toplam", "genel toplam", "total", "ara toplam"]);

// ---------------------------------------------------------------- satır adayları

interface Cand {
  line: number;
  input: KursiyerInput | null;
  kasaName: string;
  kasaMissing: boolean;
  status: "ok" | "dup" | "bad";
  reason: string;
}

function buildCandidates(
  rows: string[][],
  headerIdx: number,
  mapping: Mapping,
  defaults: { group: string; kasaId: number; listNo: string },
  existing: Kursiyer[],
  kasalar: Kasa[],
): Cand[] {
  const get = (r: string[], k: FieldKey) => (mapping[k] >= 0 ? (r[mapping[k]] ?? "").trim() : "");
  const tcSeen = new Set<string>();
  const nameSeen = new Set<string>();
  const keyOf = (name: string, phone: string, group: string) => {
    const pk = phoneKey(phone);
    return pk ? `${norm(name)}|${pk}` : `${norm(name)}||${norm(group)}`;
  };
  for (const k of existing) {
    if (!k.is_active) continue;
    if (k.tc) tcSeen.add(`${k.tc}|${norm(k.group_name)}`);
    nameSeen.add(keyOf(k.full_name, k.phone, k.group_name));
  }
  const noSplit = mapping.cash < 0 && mapping.bank < 0;

  return rows.slice(headerIdx + 1).map((r, i): Cand => {
    const line = i + 1;
    const full_name = get(r, "full_name").replace(/\s+/g, " ");
    const base = { line, input: null, kasaName: "", kasaMissing: false };
    if (!full_name) return { ...base, status: "bad", reason: "Ad soyad yok" };
    if (SKIP_NAMES.has(norm(full_name))) return { ...base, status: "bad", reason: "Toplam satırı" };

    const tcRaw = get(r, "tc").replace(/\D/g, "");
    const tc = tcRaw.length === 11 ? tcRaw : "";
    let total = parseNum(get(r, "total"));
    let cash = parseNum(get(r, "cash"));
    const bank = parseNum(get(r, "bank"));
    if (noSplit) {
      const paid = parseNum(get(r, "paid"));
      const rem = get(r, "remaining");
      if (paid > 0) cash = paid;
      else if (rem && total > 0) cash = Math.max(0, total - parseNum(rem));
    }
    if (total <= 0 && cash + bank > 0) total = cash + bank;
    const group = get(r, "group_name") || defaults.group;
    const kasaName = get(r, "kasa");
    const found = kasaName ? findKasaByName({ kasalar }, kasaName) : null;
    const kasa_id = found?.id ?? (defaults.kasaId || null);
    const phone = get(r, "phone");

    const input: KursiyerInput = {
      full_name,
      tc,
      phone,
      email: get(r, "email"),
      city: get(r, "city"),
      group_name: group,
      list_no: get(r, "list_no") || defaults.listNo,
      total_amount: total,
      cash_amount: cash,
      bank_amount: bank,
      remaining_amount: Math.max(0, Math.round((total - cash - bank) * 100) / 100),
      kasa_id,
      plasiyer: get(r, "plasiyer"),
      notes: get(r, "notes"),
      invoice_issue_date: toIsoDate(get(r, "date")),
    };
    const out = { ...base, input, kasaName: found?.title ?? kasaName, kasaMissing: !!kasaName && !found };
    if (cash + bank > total + 0.005) return { ...out, status: "bad", reason: "Tahsilat > tutar" };

    const tcKey = tc ? `${tc}|${norm(group)}` : "";
    const nk = keyOf(full_name, phone, group);
    if ((tcKey && tcSeen.has(tcKey)) || nameSeen.has(nk)) return { ...out, status: "dup", reason: "Zaten kayıtlı" };
    if (tcKey) tcSeen.add(tcKey);
    nameSeen.add(nk);
    return { ...out, status: "ok", reason: tcRaw && !tc ? "TC 11 hane değil, boş bırakıldı" : "" };
  });
}

// ---------------------------------------------------------------- şablon

const TEMPLATE_HEADERS = [
  "Ad Soyad",
  "TC",
  "Telefon",
  "E-posta",
  "İl / İlçe",
  "Program",
  "Dönem",
  "Sözleşme Tutarı",
  "Nakit",
  "Banka",
  "Kasa",
  "Tarih",
  "Plasiyer",
  "Not",
];

async function downloadTemplate() {
  await exportTableXlsx<string[]>({
    filename: "isgora_kursiyer_sablonu.xlsx",
    sheet: "Kursiyerler",
    columns: TEMPLATE_HEADERS.map((h, i) => ({
      header: h,
      width: [26, 14, 16, 24, 16, 26, 14, 16, 12, 12, 16, 12, 14, 30][i],
      kind: i >= 7 && i <= 9 ? ("money" as const) : ("text" as const),
      value: (r: string[]) => r[i] ?? null,
    })),
    rows: [],
  });
}

// ---------------------------------------------------------------- bileşen

export function ImportSheet({ onClose }: { onClose: () => void }) {
  const kursiyerler = useStore((s) => s.kursiyerler);
  const kasalar = useStore((s) => s.kasalar);
  const activeKasalar = useMemo(() => kasalar.filter((k) => k.is_active), [kasalar]);
  const groups = useMemo(() => mergeGroups(kursiyerler.filter((k) => k.is_active).map((k) => k.group_name)), [kursiyerler]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [headerIdx, setHeaderIdx] = useState(-1);
  const [mapping, setMapping] = useState<Mapping>(emptyMapping);
  const [defGroup, setDefGroup] = useState("");
  const [defKasa, setDefKasa] = useState<number>(activeKasalar.length === 1 ? activeKasalar[0].id : 0);
  const [defList, setDefList] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [showMap, setShowMap] = useState(false);

  async function onFile(file: File | undefined | null) {
    if (!file) return;
    setBusy(true);
    try {
      const data = await readTableFile(file);
      if (!data.length) {
        toast("Dosyada okunabilir satır bulunamadı.", "error");
        return;
      }
      const det = detectHeader(data);
      setRows(data);
      setHeaderIdx(det.headerIdx);
      setMapping(det.mapping);
      setFileName(file.name);
      setShowMap(det.headerIdx === -1);
      if (det.headerIdx === -1) toast("Başlık satırı tanınamadı; sütunları elle eşleştirin.", "info");
    } catch (e) {
      toast((e as Error).message || "Dosya okunamadı.", "error");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const header = useMemo(() => {
    const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
    return Array.from({ length: width }, (_, i) => {
      const h = headerIdx >= 0 ? rows[headerIdx]?.[i] ?? "" : "";
      return `${colLetter(i)}${h ? ` · ${h}` : ""}`;
    });
  }, [rows, headerIdx]);

  const cands = useMemo(
    () => (rows.length ? buildCandidates(rows, headerIdx, mapping, { group: defGroup, kasaId: defKasa, listNo: defList.trim() }, kursiyerler, kasalar) : []),
    [rows, headerIdx, mapping, defGroup, defKasa, defList, kursiyerler, kasalar],
  );
  const okRows = cands.filter((c) => c.status === "ok");
  const dupCount = cands.filter((c) => c.status === "dup").length;
  const badCount = cands.filter((c) => c.status === "bad").length;
  const okTotal = okRows.reduce((a, c) => a + (c.input?.total_amount ?? 0), 0);
  const kasaMissing = cands.filter((c) => c.status === "ok" && c.kasaMissing).length;

  function setMap(k: FieldKey, col: number) {
    setMapping((m) => {
      const next = { ...m };
      // bir sütun tek alana bağlanır
      if (col >= 0) for (const f of FIELDS) if (next[f.key] === col) next[f.key] = -1;
      next[k] = col;
      return next;
    });
  }

  async function runImport() {
    if (!okRows.length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 30));
    try {
      const st = useStore.getState();
      let n = 0;
      for (const c of okRows) {
        if (!c.input) continue;
        st.addKursiyer(c.input);
        n += 1;
      }
      toast(`${n} kayıt içe aktarıldı.${dupCount ? ` ${dupCount} mükerrer atlandı.` : ""}${badCount ? ` ${badCount} satır geçersiz.` : ""}`);
      onClose();
    } catch (e) {
      toast(`İçe aktarma tamamlanamadı: ${(e as Error).message}`, "error");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDrag(false);
    void onFile(e.dataTransfer.files?.[0]);
  }

  const kasaOpts = [{ value: 0, label: "Seçilmedi" }, ...activeKasalar.map((k) => ({ value: k.id, label: k.title }))];

  return (
    <Sheet
      open
      wide
      onClose={onClose}
      title="Excel'den içe aktar"
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-auto text-[12.5px] text-muted">
            {rows.length ? (
              <>
                <span className="font-bold text-success">{okRows.length} yeni</span>
                {dupCount ? <> · {dupCount} mükerrer</> : null}
                {badCount ? <> · {badCount} geçersiz</> : null}
              </>
            ) : (
              "Desteklenen: .xlsx, .csv (; veya , ayraçlı)"
            )}
          </div>
          <Button kind="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button icon={Upload} onClick={runImport} loading={busy && rows.length > 0} disabled={!okRows.length}>
            {okRows.length ? `${okRows.length} kaydı içe aktar` : "İçe aktar"}
          </Button>
        </div>
      }
    >
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      {!rows.length ? (
        <div className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            className={cx(
              "flex flex-col items-center rounded-xl2 border-2 border-dashed px-6 py-10 text-center transition",
              drag ? "border-brand-blue bg-soft-blue" : "border-line bg-paper/50",
            )}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-white shadow-fab">
              <FileSpreadsheet size={26} />
            </span>
            <div className="mt-3 text-[16px] font-extrabold text-navy">Excel veya CSV dosyası seçin</div>
            <div className="mt-1 max-w-md text-[13px] leading-relaxed text-muted">
              Dosyayı buraya sürükleyip bırakabilirsiniz. Sütunlar başlık adlarından otomatik eşleştirilir; önizlemeyi görmeden hiçbir kayıt eklenmez.
            </div>
            <Button className="mt-4" icon={FileUp} onClick={() => fileRef.current?.click()} loading={busy}>
              Dosya seç
            </Button>
          </div>
          <div className="rounded-2xl bg-soft-blue px-4 py-3 text-[12.5px] leading-relaxed text-brand-blue">
            <b>Tanınan başlıklar:</b> Ad Soyad / Adı Soyadı, TC, Telefon, E-posta, İl / İlçe, Program / Grup, Dönem / Liste, Tutar / Sözleşme, Nakit, Banka,
            Ödenen, Kalan, Kasa, Tarih, Plasiyer, Not. Nakit/Banka sütunu yoksa “Ödenen” (ya da Tutar − Kalan) nakit tahsilat sayılır.
          </div>
          <Button kind="secondary" small icon={Download} onClick={() => void downloadTemplate().catch((e) => toast((e as Error).message, "error"))}>
            Boş şablonu indir
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-paper/50 px-3.5 py-2.5">
            <FileSpreadsheet size={18} className="text-brand-blue" />
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-navy">{fileName}</span>
            <span className="num text-[12px] text-muted">{Math.max(0, rows.length - headerIdx - 1)} satır</span>
            <Button kind="ghost" small icon={RefreshCw} onClick={() => fileRef.current?.click()} loading={busy}>
              Değiştir
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Varsayılan program" hint="Satırda program yoksa bu kullanılır.">
              <select value={defGroup} onChange={(e) => setDefGroup(e.target.value)} className="field cursor-pointer !py-2.5 text-[14px]">
                <option value="">(Programsız bırak)</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </FieldGroup>
            <Field label="Varsayılan dönem / liste" hint="Satırda dönem yoksa bu yazılır.">
              <Input value={defList} onChange={(e) => setDefList(e.target.value)} placeholder="Örn. Aralık 2026" className="!py-2.5 text-[14px]" />
            </Field>
            <FieldGroup
              label="Varsayılan kasa (kim tahsil etti?)"
              className="md:col-span-2"
              hint="Satırdaki kasa adı eşleşmezse bu kasa kullanılır. Kasa seçili ve tahsilat varsa kasaya tek gelir kaydı düşer."
            >
              <Chips options={kasaOpts} value={defKasa} onChange={setDefKasa} />
            </FieldGroup>
          </div>

          <div>
            <button type="button" onClick={() => setShowMap((v) => !v)} className="text-[13px] font-bold text-brand-blue hover:underline">
              {showMap ? "Sütun eşleştirmeyi gizle" : "Sütun eşleştirmeyi göster / düzelt"}
            </button>
            {showMap ? (
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {FIELDS.map((f) => (
                  <label key={f.key} className="flex items-center gap-2">
                    <span className="w-[130px] shrink-0 text-[12.5px] font-bold text-navy">{f.label}</span>
                    <select
                      value={mapping[f.key]}
                      onChange={(e) => setMap(f.key, Number(e.target.value))}
                      className={cx("field cursor-pointer !px-3 !py-2 text-[13px]", mapping[f.key] < 0 && "text-muted")}
                    >
                      <option value={-1}>—</option>
                      {header.map((h, i) => (
                        <option key={i} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FIELDS.filter((f) => mapping[f.key] >= 0).map((f) => (
                  <Badge key={f.key} tone="blue">
                    {f.label.replace(" *", "")} ← {colLetter(mapping[f.key])}
                  </Badge>
                ))}
                {mapping.full_name < 0 ? <Badge tone="red">Ad soyad sütunu seçilmedi</Badge> : null}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <SumBox label="Aktarılacak" value={String(okRows.length)} tone="text-success" sub={money(okTotal)} />
            <SumBox label="Mükerrer" value={String(dupCount)} tone="text-warn" sub="atlanacak" />
            <SumBox label="Geçersiz" value={String(badCount)} tone="text-danger" sub="atlanacak" />
          </div>
          {kasaMissing ? (
            <div className="rounded-2xl bg-soft-warn px-4 py-2.5 text-[12.5px] text-warn">
              {kasaMissing} satırdaki kasa adı mevcut kasalarla eşleşmedi; varsayılan kasa kullanılacak. Yeni kasayı Ayarlar &gt; Kasalar&apos;dan ekleyebilirsiniz.
            </div>
          ) : null}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="section-label">Önizleme</div>
              <span className="num text-[11.5px] text-muted">
                ilk {Math.min(20, cands.length)} / {cands.length} satır
              </span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[720px] text-left text-[12.5px]">
                <thead className="bg-navy text-[10.5px] uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-2.5 py-2 font-bold">#</th>
                    <th className="px-2.5 py-2 font-bold">Ad soyad</th>
                    <th className="px-2.5 py-2 font-bold">Program</th>
                    <th className="px-2.5 py-2 font-bold">Telefon</th>
                    <th className="px-2.5 py-2 text-right font-bold">Tutar</th>
                    <th className="px-2.5 py-2 text-right font-bold">Tahsil</th>
                    <th className="px-2.5 py-2 font-bold">Kasa</th>
                    <th className="px-2.5 py-2 font-bold">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {cands.slice(0, 20).map((c) => (
                    <tr key={c.line} className={cx("border-t border-line", c.status !== "ok" && "bg-paper/70 text-muted")}>
                      <td className="num px-2.5 py-2 text-muted">{c.line}</td>
                      <td className="px-2.5 py-2 font-bold text-ink">{c.input?.full_name || "—"}</td>
                      <td className="max-w-[160px] truncate px-2.5 py-2">{c.input?.group_name || "—"}</td>
                      <td className="num px-2.5 py-2">{c.input?.phone || "—"}</td>
                      <td className="num px-2.5 py-2 text-right">{c.input ? money(c.input.total_amount) : "—"}</td>
                      <td className="num px-2.5 py-2 text-right">{c.input ? money(c.input.cash_amount + c.input.bank_amount) : "—"}</td>
                      <td className="px-2.5 py-2">
                        {c.input?.kasa_id ? (kasalar.find((k) => k.id === c.input?.kasa_id)?.title ?? "—") : "—"}
                        {c.kasaMissing ? <span className="ml-1 text-warn" title={`Dosyadaki kasa: ${c.kasaName}`}>?</span> : null}
                      </td>
                      <td className="px-2.5 py-2">
                        {c.status === "ok" ? (
                          <Badge tone="green" className="!py-0.5">
                            Yeni
                          </Badge>
                        ) : c.status === "dup" ? (
                          <Badge tone="warn" className="!py-0.5">
                            Mükerrer
                          </Badge>
                        ) : (
                          <Badge tone="red" className="!py-0.5">
                            {c.reason}
                          </Badge>
                        )}
                        {c.status === "ok" && c.reason ? <div className="mt-0.5 text-[10.5px] text-warn">{c.reason}</div> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[12px] text-muted">
              Mükerrer: aynı programda aynı TC, ya da aynı ad + telefon (telefon yoksa aynı ad + program) ile kayıtlı kişiler atlanır.
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}

function SumBox({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-line/70 bg-white px-3 py-2.5 shadow-card">
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className={cx("num mt-0.5 text-[20px] font-extrabold leading-tight", tone)}>{value}</div>
      <div className="num truncate text-[11px] text-muted">{sub}</div>
    </div>
  );
}
