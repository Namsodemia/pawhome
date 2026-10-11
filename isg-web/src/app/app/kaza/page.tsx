"use client";

import { Suspense, useEffect, useMemo, useState, type ComponentProps } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Check,
  CircleAlert,
  Clock3,
  Hourglass,
  MapPin,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  Siren,
  Stethoscope,
  Trash2,
  TriangleAlert,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Olay, OlayInput, OlayTur } from "@/lib/types";
import { olayStats, useStore } from "@/lib/store";
import { cx, fmtDate, norm, today } from "@/lib/format";
import { esc, printHtml } from "@/lib/print";
import { Badge, Button, Chips, Empty, Fab, Field, Input, PageHeader, Segment, Sheet, Stat, Textarea } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";

type Tone = NonNullable<ComponentProps<typeof Badge>["tone"]>;

const OLAY_TURLERI: { v: OlayTur; label: string; tone: Tone; color: string; icon: LucideIcon }[] = [
  { v: "kaza", label: "İş Kazası", tone: "red", color: "#D6334C", icon: Siren },
  { v: "ramak_kala", label: "Ramak Kala", tone: "orange", color: "#F4772E", icon: TriangleAlert },
  { v: "tehlikeli_durum", label: "Tehlikeli Durum", tone: "blue", color: "#1B8ECF", icon: CircleAlert },
  { v: "meslek_hastaligi", label: "Meslek Hastalığı Şüphesi", tone: "violet", color: "#6C5CE7", icon: Stethoscope },
];
const turMeta = (t: OlayTur) => OLAY_TURLERI.find((x) => x.v === t) ?? OLAY_TURLERI[0];

// ---------------------------------------------------------------- SGK bildirim süresi (3 iş günü)

function parseLocal(iso: string): Date | null {
  const [y, m, d] = (iso || "").slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function isoOf(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const isBusinessDay = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6;

interface SgkSure {
  deadline: string; // YYYY-MM-DD
  left: number; // kalan iş günü (bugün hariç, son gün dahil)
  overdue: boolean;
  lastDay: boolean;
}

/** Kazadan sonraki 3 iş günü (cumartesi/pazar atlanır; resmî tatiller hesaba katılmaz). */
function sgkSure(tarih: string, now: string = today()): SgkSure | null {
  const start = parseLocal(tarih);
  const t = parseLocal(now);
  if (!start || !t) return null;
  const dl = new Date(start);
  let added = 0;
  while (added < 3) {
    dl.setDate(dl.getDate() + 1);
    if (isBusinessDay(dl)) added += 1;
  }
  const deadline = isoOf(dl);
  if (now > deadline) return { deadline, left: 0, overdue: true, lastDay: false };
  if (now === deadline) return { deadline, left: 0, overdue: false, lastDay: true };
  let left = 0;
  const c = new Date(t);
  while (isoOf(c) < deadline) {
    c.setDate(c.getDate() + 1);
    if (isBusinessDay(c)) left += 1;
  }
  return { deadline, left, overdue: false, lastDay: false };
}

function sureText(s: SgkSure): string {
  if (s.overdue) return `Son gün: ${fmtDate(s.deadline)} · Süre geçti`;
  if (s.lastDay) return `Son gün: ${fmtDate(s.deadline)} · Bugün son gün`;
  return `Son gün: ${fmtDate(s.deadline)} · ${s.left} iş günü kaldı`;
}

// ---------------------------------------------------------------- Rapor (olay tutanağı)

function printOlay(o: Olay, firma: string) {
  const m = turMeta(o.tur);
  const sure = o.tur === "kaza" && !o.sgk_bildirildi ? sgkSure(o.tarih) : null;
  const rows: [string, string][] = [
    ["Olay türü", m.label],
    ["Tarih / saat", `${fmtDate(o.tarih)}${o.saat ? ` ${o.saat}` : ""}`],
    ["İşyeri", o.isyeri],
    ["Olay yeri / bölüm", o.yer],
    ["Etkilenen kişi(ler)", o.kisi],
    ["Olayın açıklaması", o.aciklama],
    ["Yaralanma / hasar", o.yaralanma],
    ["Kök neden", o.kok_neden],
    ["Düzeltici / önleyici faaliyet", o.onlem],
  ];
  if (o.tur === "kaza") {
    rows.push(["Kayıp iş günü", String(o.kayip_gun || 0)]);
    rows.push(["SGK bildirimi", o.sgk_bildirildi ? "Bildirildi" : `Bildirilmedi${sure ? ` (${sureText(sure)})` : ""}`]);
  }
  const title = `${m.label} Tutanağı`;
  const body = `
    <h1>${esc(title)}</h1>
    <div class="meta">${firma ? `${esc(firma)} · ` : ""}${o.id ? `Kayıt no: ${o.id} · ` : ""}Düzenlenme: ${new Date().toLocaleDateString("tr-TR")}</div>
    <table><tbody>
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="width:30%;font-weight:700;background:#F4F7F9">${esc(k)}</td><td style="white-space:pre-wrap">${v ? esc(v) : "&nbsp;"}</td></tr>`,
        )
        .join("")}
    </tbody></table>
    <p class="footer">Bu tutanak 6331 sayılı İş Sağlığı ve Güvenliği Kanunu m.14 kapsamında olayın kayıt altına alınması amacıyla düzenlenmiştir. İş kazaları kazadan sonraki 3 iş günü içinde SGK'ya bildirilmelidir.</p>
    <div class="sign"><div>Düzenleyen (İSG Uzmanı)</div><div>Kazalı / Etkilenen</div><div>Tanık</div><div>İşveren / Vekili</div></div>`;
  printHtml(`${title} — ${o.isyeri || fmtDate(o.tarih)}`, body);
}

// ---------------------------------------------------------------- Sayfa

export default function KazaPageWrapper() {
  return (
    <Suspense fallback={null}>
      <KazaPage />
    </Suspense>
  );
}

type FilterVal = "hepsi" | OlayTur | "sgk";

function KazaPage() {
  const router = useRouter();
  const params = useSearchParams();
  const olaylar = useStore((s) => s.olaylar);
  const firma = useStore((s) => s.settings.firma);
  const [filter, setFilter] = useState<FilterVal>("hepsi");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Olay> | null>(null);

  useEffect(() => {
    if (params.get("yeni") === "1") {
      setEditing({});
      router.replace("/app/kaza");
    }
  }, [params, router]);

  const stats = useMemo(() => olayStats(olaylar), [olaylar]);
  const sorted = useMemo(
    () => [...olaylar].sort((a, b) => (a.tarih === b.tarih ? b.id - a.id : a.tarih < b.tarih ? 1 : -1)),
    [olaylar],
  );
  const pendingKaza = useMemo(() => sorted.filter((o) => o.tur === "kaza" && !o.sgk_bildirildi), [sorted]);
  const nearest = useMemo(() => {
    const list = pendingKaza.map((o) => sgkSure(o.tarih)).filter((x): x is SgkSure => !!x);
    return list.sort((a, b) => (a.deadline < b.deadline ? -1 : 1))[0] ?? null;
  }, [pendingKaza]);

  const nq = norm(q);
  const list = sorted.filter((o) => {
    if (filter === "sgk" ? !(o.tur === "kaza" && !o.sgk_bildirildi) : filter !== "hepsi" && o.tur !== filter) return false;
    if (!nq) return true;
    return norm(`${o.aciklama} ${o.isyeri} ${o.yer} ${o.kisi} ${o.yaralanma} ${o.kok_neden} ${o.onlem}`).includes(nq);
  });

  const count = (t: OlayTur) => olaylar.filter((o) => o.tur === t).length;
  const chipOpts: { value: FilterVal; label: string }[] = [
    { value: "hepsi", label: `Tümü (${olaylar.length})` },
    ...OLAY_TURLERI.map((t) => ({ value: t.v as FilterVal, label: `${t.label} (${count(t.v)})` })),
    ...(pendingKaza.length ? [{ value: "sgk" as FilterVal, label: `SGK bekliyor (${pendingKaza.length})` }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Kaza / Ramak Kala"
        subtitle="İş kazası, ramak kala, tehlikeli durum ve meslek hastalığı kayıtları"
        actions={
          <Button icon={Plus} onClick={() => setEditing({})} className="hidden lg:inline-flex">
            Olay Kaydet
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Kaza" value={stats.kaza} tone="red" />
        <Stat label="Ramak kala" value={stats.ramak} tone="orange" />
        <Stat label="Kayıp gün" value={stats.kayip_gun} tone="navy" />
        <Stat label="SGK bildirilmemiş" value={stats.bildirilmemis} tone={stats.bildirilmemis ? "red" : "green"} />
      </div>

      {stats.bildirilmemis ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-[#F7C6CF] bg-soft-danger px-4 py-3 text-[13.5px] font-bold text-danger">
          <span>⚠ İş kazaları 3 iş günü içinde SGK&apos;ya bildirilmelidir.</span>
          {nearest ? <span className="num text-[12.5px] font-semibold text-danger/85">En yakın {sureText(nearest)}</span> : null}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <Chips options={chipOpts} value={filter} onChange={setFilter} scroll className="min-w-0 flex-1" />
        <div className="relative md:w-64">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kayıtlarda ara…" className="field h-10 py-2 pl-10 text-[14px]" aria-label="Olaylarda ara" />
        </div>
      </div>

      <div className="mt-4">
        {olaylar.length === 0 ? (
          <Empty
            icon={Siren}
            title="Kayıtlı olay yok"
            text="Kayıtlı olay yok. Kaza, ramak kala ve tehlikeli durumları buradan kayıt altına alın."
            action={
              <Button icon={Plus} onClick={() => setEditing({})}>
                Olay Kaydet
              </Button>
            }
          />
        ) : list.length === 0 ? (
          <Empty icon={Search} title="Eşleşen kayıt yok" text="Filtreyi veya arama ifadesini değiştirin." />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {list.map((o) => (
              <OlayRow key={o.id} o={o} onOpen={() => setEditing(o)} onPrint={() => printOlay(o, firma)} />
            ))}
          </div>
        )}
      </div>

      <Fab label="Olay Kaydet" icon={Plus} onClick={() => setEditing({})} />

      {editing ? <OlayForm key={editing.id ?? "yeni"} initial={editing} firma={firma} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function OlayRow({ o, onOpen, onPrint }: { o: Olay; onOpen: () => void; onPrint: () => void }) {
  const m = turMeta(o.tur);
  const Icon = m.icon;
  const sure = o.tur === "kaza" && !o.sgk_bildirildi ? sgkSure(o.tarih) : null;
  const meta = [o.isyeri, o.yer, o.kisi].filter(Boolean);
  return (
    <div className="group relative flex overflow-hidden rounded-xl2 border border-line/70 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-bar">
      <span className="w-1.5 shrink-0" style={{ background: m.color }} aria-hidden />
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-3 p-4 text-left">
        <span className="mt-0.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:flex" style={{ background: `${m.color}1A`, color: m.color }}>
          <Icon size={19} strokeWidth={2.3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <Badge tone={m.tone}>{m.label}</Badge>
            <span className="num text-[12px] font-semibold text-muted">
              {fmtDate(o.tarih)}
              {o.saat ? ` ${o.saat}` : ""}
            </span>
            {o.tur === "kaza" ? <Badge tone={o.sgk_bildirildi ? "green" : "red"}>{o.sgk_bildirildi ? "SGK ✓" : "SGK bekliyor"}</Badge> : null}
            {o.kayip_gun > 0 ? <Badge tone="gray">{o.kayip_gun} gün kayıp</Badge> : null}
          </span>
          <span className="mt-1.5 line-clamp-2 block text-[14.5px] font-bold leading-snug text-ink">{o.aciklama}</span>
          {meta.length ? (
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-muted">
              {o.isyeri ? (
                <span className="inline-flex items-center gap-1">
                  <Building2 size={13} /> {o.isyeri}
                </span>
              ) : null}
              {o.yer ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} /> {o.yer}
                </span>
              ) : null}
              {o.kisi ? (
                <span className="inline-flex items-center gap-1">
                  <UserRound size={13} /> {o.kisi}
                </span>
              ) : null}
            </span>
          ) : null}
          {sure ? (
            <span
              className={cx(
                "num mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-bold",
                sure.overdue || sure.lastDay ? "bg-soft-danger text-danger" : "bg-soft-warn text-warn",
              )}
            >
              <Hourglass size={13} /> {sureText(sure)}
            </span>
          ) : null}
        </span>
      </button>
      <div className="flex shrink-0 flex-col justify-start p-2">
        <button
          type="button"
          onClick={onPrint}
          title="Rapor yazdır"
          aria-label="Rapor yazdır"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-paper hover:text-brand-blue"
        >
          <Printer size={17} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Form

interface FormState {
  tur: OlayTur;
  tarih: string;
  saat: string;
  isyeri: string;
  yer: string;
  kisi: string;
  aciklama: string;
  yaralanma: string;
  kok_neden: string;
  onlem: string;
  sgk: boolean;
  kayip_gun: string;
}

function OlayForm({ initial, firma, onClose }: { initial: Partial<Olay>; firma: string; onClose: () => void }) {
  const saveOlay = useStore((s) => s.saveOlay);
  const deleteOlay = useStore((s) => s.deleteOlay);
  const olaylar = useStore((s) => s.olaylar);
  const denetimler = useStore((s) => s.denetimler);
  const [f, setF] = useState<FormState>(() => ({
    tur: initial.tur ?? "kaza",
    tarih: initial.tarih ?? today(),
    saat: initial.saat ?? "",
    isyeri: initial.isyeri ?? "",
    yer: initial.yer ?? "",
    kisi: initial.kisi ?? "",
    aciklama: initial.aciklama ?? "",
    yaralanma: initial.yaralanma ?? "",
    kok_neden: initial.kok_neden ?? "",
    onlem: initial.onlem ?? "",
    sgk: !!initial.sgk_bildirildi,
    kayip_gun: String(initial.kayip_gun ?? 0),
  }));
  const [err, setErr] = useState<string | null>(null);
  const set =
    <K extends keyof FormState>(k: K) =>
    (v: FormState[K]) =>
      setF((p) => ({ ...p, [k]: v }));

  const isyerleri = useMemo(() => {
    const s = new Set<string>();
    for (const o of olaylar) if (o.isyeri) s.add(o.isyeri);
    for (const d of denetimler) if (d.isyeri) s.add(d.isyeri);
    return [...s].sort((a, b) => a.localeCompare(b, "tr"));
  }, [olaylar, denetimler]);

  const sure = f.tur === "kaza" && !f.sgk ? sgkSure(f.tarih) : null;

  function payload(): OlayInput {
    const kaza = f.tur === "kaza";
    return {
      tur: f.tur,
      tarih: f.tarih || today(),
      saat: f.saat.trim(),
      isyeri: f.isyeri.trim(),
      yer: f.yer.trim(),
      kisi: f.kisi.trim(),
      aciklama: f.aciklama.trim(),
      yaralanma: f.yaralanma.trim(),
      kok_neden: f.kok_neden.trim(),
      onlem: f.onlem.trim(),
      sgk_bildirildi: kaza ? f.sgk : false,
      kayip_gun: kaza ? Math.max(0, Math.round(Number(f.kayip_gun) || 0)) : 0,
    };
  }

  function save() {
    if (!f.aciklama.trim()) {
      setErr("Olayı kısaca anlatın.");
      toast("Olayı kısaca anlatın.", "error");
      return;
    }
    saveOlay(payload(), initial.id ?? null);
    toast(initial.id ? "Olay kaydı güncellendi." : "Olay kaydedildi.");
    onClose();
  }

  async function remove() {
    if (!initial.id) return onClose();
    const ok = await confirmDialog({ title: "Kaydı sil", text: "Bu olay kaydı silinecek.", okLabel: "Sil", danger: true });
    if (!ok) return;
    deleteOlay(initial.id);
    toast("Olay kaydı silindi.");
    onClose();
  }

  function print() {
    if (!f.aciklama.trim()) {
      setErr("Olayı kısaca anlatın.");
      return;
    }
    printOlay({ ...payload(), id: initial.id ?? 0, created_at: initial.created_at ?? "" }, firma);
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={initial.id ? "Olay kaydı" : "Yeni olay kaydı"}
      wide
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {initial.id ? (
            <Button kind="danger" small icon={Trash2} onClick={remove}>
              Sil
            </Button>
          ) : null}
          <Button kind="ghost" small icon={Printer} onClick={print}>
            Rapor yazdır
          </Button>
          <Button icon={Check} onClick={save} className="ml-auto">
            Olay Kaydet
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div role="group" aria-label="Olay türü">
          <div className="mb-1.5 text-[12.5px] font-bold text-navy">Olay türü</div>
          <Chips options={OLAY_TURLERI.map((t) => ({ value: t.v, label: t.label }))} value={f.tur} onChange={set("tur")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tarih">
            <Input type="date" value={f.tarih} max={today()} onChange={(e) => set("tarih")(e.target.value)} />
          </Field>
          <Field label="Saat">
            <Input type="time" value={f.saat} onChange={(e) => set("saat")(e.target.value)} placeholder="14:30" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="İşyeri">
            <Input value={f.isyeri} onChange={(e) => set("isyeri")(e.target.value)} list="olay-isyerleri" autoComplete="off" />
            <datalist id="olay-isyerleri">
              {isyerleri.map((x) => (
                <option key={x} value={x} />
              ))}
            </datalist>
          </Field>
          <Field label="Olay yeri / bölüm">
            <Input value={f.yer} onChange={(e) => set("yer")(e.target.value)} />
          </Field>
        </div>
        <Field label="Etkilenen kişi(ler)">
          <Input value={f.kisi} onChange={(e) => set("kisi")(e.target.value)} />
        </Field>
        <Field label="Olayın açıklaması *" error={err}>
          <Textarea
            value={f.aciklama}
            onChange={(e) => {
              set("aciklama")(e.target.value);
              if (err) setErr(null);
            }}
            placeholder="Ne oldu, nasıl oldu?"
            className="min-h-[96px]"
          />
        </Field>
        <Field label="Yaralanma / hasar">
          <Input value={f.yaralanma} onChange={(e) => set("yaralanma")(e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kök neden">
            <Textarea value={f.kok_neden} onChange={(e) => set("kok_neden")(e.target.value)} placeholder="5 Neden analizi sonucu" className="min-h-[88px]" />
          </Field>
          <Field label="Düzeltici / önleyici faaliyet">
            <Textarea value={f.onlem} onChange={(e) => set("onlem")(e.target.value)} className="min-h-[88px]" />
          </Field>
        </div>
        {f.tur === "kaza" ? (
          <div className="rounded-2xl border border-line bg-paper/60 p-3.5">
            <div className="grid gap-3 sm:grid-cols-[160px_1fr] sm:items-end">
              <Field label="Kayıp iş günü">
                <Input type="number" inputMode="numeric" min={0} value={f.kayip_gun} onChange={(e) => set("kayip_gun")(e.target.value)} mono />
              </Field>
              <Segment
                value={f.sgk ? "evet" : "hayir"}
                options={[
                  { value: "hayir", label: "SGK bildirilmedi" },
                  { value: "evet", label: "SGK bildirildi" },
                ]}
                onChange={(v) => set("sgk")(v === "evet")}
                className="bg-white"
              />
            </div>
            {sure ? (
              <div className={cx("num mt-2.5 flex items-center gap-1.5 text-[12.5px] font-bold", sure.overdue || sure.lastDay ? "text-danger" : "text-warn")}>
                {sure.overdue ? <ShieldAlert size={14} /> : <Clock3 size={14} />} {sureText(sure)}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
