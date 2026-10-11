"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import {
  Building2,
  Check,
  CircleCheck,
  Database,
  Download,
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  Pencil,
  PlugZap,
  Plus,
  Sparkles,
  Tags,
  Trash2,
  Upload,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Chips, Field, Input, PageHeader, Segment } from "@/components/ui";
import { FieldGroup } from "@/components/FieldGroup";
import { confirmDialog, toast } from "@/components/feedback";
import { kasaBalances, useStore, type Data } from "@/lib/store";
import { cx, money, norm, nowIso, today } from "@/lib/format";
import { downloadBlob } from "@/lib/print";
import {
  AiError,
  MODELS,
  aiMode,
  client,
  currentModel,
  describeError,
  getAccessCode,
  getApiKey,
  serverStatus,
  setAccessCode,
  setApiKey,
  subscribeAiConfig,
  textOf,
  type AiMode,
  type ServerStatus,
} from "@/lib/ai/client";
import type { Effort, TrxType } from "@/lib/types";

const EFFORTS: { value: Effort; label: string; note: string }[] = [
  { value: "low", label: "Hızlı", note: "En kısa sürede yanıt; basit sorular ve kısa metinler için." },
  { value: "medium", label: "Dengeli", note: "Önerilen. Çoğu iş için hız ve kaliteyi dengeler." },
  { value: "high", label: "Derin", note: "Daha uzun düşünür; kapsamlı risk analizi gibi işler için." },
];

const ARRAY_KEYS = [
  "kasalar",
  "categories",
  "transactions",
  "kursiyerler",
  "analyses",
  "riskRows",
  "sinavSonuclari",
  "olaylar",
  "denetimler",
  "siniflar",
  "uyeler",
  "mesajlar",
  "chat",
] as const;

/** Yedek dosyası İsgora verisine benziyor mu? (şekil kontrolü) */
function looksLikeData(x: unknown): x is Partial<Data> {
  if (!x || typeof x !== "object" || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  for (const k of ARRAY_KEYS) if (k in o && !Array.isArray(o[k])) return false;
  if ("settings" in o && (typeof o.settings !== "object" || o.settings === null)) return false;
  if (typeof o.seq !== "number") return false;
  return ARRAY_KEYS.filter((k) => Array.isArray(o[k])).length >= 3;
}

/** Yedekteki seq en büyük id'den küçükse düzelt (yeni kayıtlar çakışmasın). */
function fixSeq(d: Partial<Data>): Partial<Data> {
  let max = typeof d.seq === "number" ? d.seq : 0;
  for (const k of ARRAY_KEYS) {
    const arr = d[k] as Array<{ id?: unknown }> | undefined;
    if (!arr) continue;
    for (const r of arr) if (r && typeof r.id === "number" && r.id > max) max = r.id;
  }
  return { ...d, seq: max };
}

export default function AyarlarPage() {
  const firma = useStore((s) => s.settings.firma);
  return (
    <div>
      <PageHeader title="Ayarlar" subtitle="Yapay zekâ, firma, kasalar, kategoriler ve yedekleme" />
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <AiCard />
          <FirmaCard key={firma} />
        </div>
        <div className="space-y-5">
          <KasalarCard />
          <KategorilerCard />
        </div>
        <DataCard />
      </div>
      <div className="mt-10 text-center text-[12px] text-muted">İsgora · İş Sağlığı ve Güvenliği Süper Uygulaması · v1.0</div>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, sub, children, className }: { icon: LucideIcon; title: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-xl2 border border-line/70 bg-white p-4 shadow-card md:p-5", className)}>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand text-white shadow-fab">
          <Icon size={19} strokeWidth={2.3} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[16.5px] font-extrabold text-navy">{title}</h2>
          {sub ? <div className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{sub}</div> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- Yapay Zekâ

const MODE_TEXT: Record<AiMode, { text: string; tone: string; dot: string }> = {
  key: { text: "Etkin mod: kendi API anahtarınız (istekler tarayıcıdan doğrudan Anthropic'e gider).", tone: "text-success", dot: "bg-success" },
  server: { text: "Etkin mod: sunucu anahtarı (istekler uygulama sunucusu üzerinden gider).", tone: "text-brand-blue", dot: "bg-brand-blue" },
  none: { text: "Yapay zekâ kapalı: API anahtarı girilmemiş.", tone: "text-danger", dot: "bg-danger" },
};

function AiCard() {
  const savedKey = useSyncExternalStore(subscribeAiConfig, getApiKey, () => "");
  const savedCode = useSyncExternalStore(subscribeAiConfig, getAccessCode, () => "");
  const settings = useStore((s) => s.settings);
  const [keyInput, setKeyInput] = useState("");
  const [show, setShow] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [srv, setSrv] = useState<ServerStatus | null>(null);
  const [mode, setMode] = useState<AiMode | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let alive = true;
    void serverStatus().then((s) => alive && setSrv(s));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void aiMode().then((m) => alive && setMode(m));
    return () => {
      alive = false;
    };
  }, [savedKey, savedCode]);

  function saveKey(e?: FormEvent) {
    e?.preventDefault();
    const k = keyInput.trim();
    if (!k) {
      toast("Anahtarı yapıştırın.", "error");
      return;
    }
    if (!k.startsWith("sk-ant-")) {
      toast("Anthropic API anahtarı “sk-ant-” ile başlar. Anahtarı kontrol edin.", "error");
      return;
    }
    setApiKey(k);
    setKeyInput("");
    setShow(false);
    toast("API anahtarı bu tarayıcıda saklandı.");
  }

  async function removeKey() {
    const ok = await confirmDialog({ title: "Anahtarı sil", text: "Kayıtlı API anahtarı bu tarayıcıdan silinecek.", okLabel: "Sil", danger: true });
    if (!ok) return;
    setApiKey("");
    toast("API anahtarı silindi.");
  }

  function saveCode(e?: FormEvent) {
    e?.preventDefault();
    setAccessCode(codeInput);
    setCodeInput("");
    toast(codeInput.trim() ? "Erişim kodu kaydedildi." : "Erişim kodu silindi.");
  }

  async function testConnection() {
    setTesting(true);
    try {
      const c = await client();
      const model = currentModel();
      const res = await c.messages.create({
        model,
        max_tokens: 1024,
        messages: [{ role: "user", content: "Sadece 'Tamam' yaz." }],
        output_config: { effort: "low" },
      });
      if (res.stop_reason === "refusal") throw new AiError("Model bu isteği reddetti.");
      const txt = textOf(res).trim();
      const label = MODELS.find((m) => m.id === model)?.label ?? model;
      toast(`Bağlantı başarılı · ${label}${txt ? ` · “${txt.slice(0, 40)}”` : ""}`);
    } catch (e) {
      toast(describeError(e), "error");
    } finally {
      setTesting(false);
    }
  }

  const modeInfo = mode ? MODE_TEXT[mode] : null;

  return (
    <SettingsCard icon={Sparkles} title="Yapay Zekâ" sub="Anahtar yalnızca bu tarayıcıda saklanır.">
      {srv?.serverKey ? (
        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-soft-green px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-success">
          <CircleCheck size={16} className="mt-0.5 shrink-0" />
          Sunucu anahtarı tanımlı — kendi anahtarınızı girmeden de kullanabilirsiniz.
        </div>
      ) : null}

      {savedKey ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5">
          <KeyRound size={16} className="text-brand-blue" />
          <span className="text-[12.5px] font-bold text-navy">Kayıtlı anahtar</span>
          <span className="num rounded-lg bg-white px-2 py-0.5 text-[12.5px] text-text">••••••••{savedKey.slice(-6)}</span>
          <Button kind="danger" small icon={Trash2} onClick={removeKey} className="ml-auto">
            Anahtarı sil
          </Button>
        </div>
      ) : null}

      <form onSubmit={saveKey} className="space-y-2.5">
        <Field
          label={savedKey ? "Yeni Anthropic API anahtarı" : "Anthropic API anahtarı"}
          hint={
            <>
              Anahtarı{" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="font-bold text-brand-blue hover:underline">
                console.anthropic.com
              </a>{" "}
              adresinden alabilirsiniz. Risk analizi ve asistan bu anahtarla çalışır.
            </>
          }
        >
          <div className="relative">
            <Input
              mono
              type={show ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-ant-…"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="!pr-11 text-[14px]"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Gizle" : "Göster"}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-muted hover:bg-paper hover:text-navy"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <Button type="submit" icon={KeyRound} disabled={!keyInput.trim()}>
          Anahtarı kaydet
        </Button>
      </form>

      {srv?.accessCodeRequired && !savedKey ? (
        <form onSubmit={saveCode} className="mt-4 space-y-2.5 rounded-2xl border border-line p-3.5">
          <Field label="Erişim kodu" hint={savedCode ? "Erişim kodu kayıtlı. Değiştirmek için yenisini yazın." : "Sunucu anahtarını kullanmak için yöneticinizden aldığınız kodu girin."}>
            <Input type="password" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder={savedCode ? "••••••" : "Erişim kodu"} autoComplete="off" />
          </Field>
          <Button type="submit" kind="secondary" small icon={Check} disabled={!codeInput.trim() && !savedCode}>
            {codeInput.trim() || !savedCode ? "Kodu kaydet" : "Kodu sil"}
          </Button>
        </form>
      ) : null}

      <div className={cx("mt-4 flex items-start gap-2 text-[12.5px] font-semibold leading-relaxed", modeInfo?.tone ?? "text-muted")}>
        <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", modeInfo?.dot ?? "bg-line")} />
        {modeInfo?.text ?? "Durum kontrol ediliyor…"}
      </div>

      <div className="mt-5 h-px bg-line" />

      <FieldGroup label="Model" className="mt-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {MODELS.map((m) => {
            const on = settings.model === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => useStore.getState().setSettings({ model: m.id })}
                aria-pressed={on}
                className={cx(
                  "rounded-2xl border px-3.5 py-3 text-left transition",
                  on ? "border-transparent bg-brand text-white shadow-fab" : "border-line bg-white hover:border-brand-blue/40",
                )}
              >
                <div className={cx("text-[13.5px] font-extrabold", on ? "text-white" : "text-navy")}>{m.label}</div>
                <div className={cx("mt-0.5 text-[11.5px] leading-snug", on ? "text-white/85" : "text-muted")}>{m.note}</div>
              </button>
            );
          })}
        </div>
      </FieldGroup>

      <FieldGroup label="Düşünme düzeyi" className="mt-4" hint={EFFORTS.find((e) => e.value === settings.effort)?.note}>
        <Chips options={EFFORTS.map((e) => ({ value: e.value, label: e.label }))} value={settings.effort} onChange={(v) => useStore.getState().setSettings({ effort: v })} />
      </FieldGroup>

      <Button kind="secondary" icon={PlugZap} onClick={testConnection} loading={testing} disabled={mode === "none"} className="mt-5">
        Bağlantıyı test et
      </Button>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------- Firma

function FirmaCard() {
  const firma = useStore((s) => s.settings.firma);
  const [val, setVal] = useState(firma);
  const dirty = val.trim() !== (firma || "").trim();

  function save(e?: FormEvent) {
    e?.preventDefault();
    useStore.getState().setSettings({ firma: val.trim() });
    toast(val.trim() ? "Firma adı kaydedildi." : "Firma adı temizlendi.");
  }

  return (
    <SettingsCard icon={Building2} title="Firma" sub="Raporlarda ve Excel çıktılarında görünen firma / OSGB adı.">
      <form onSubmit={save} className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
        <Field label="Firma / OSGB adı" className="flex-1">
          <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Örn. Güven OSGB Ltd. Şti." maxLength={120} />
        </Field>
        <Button type="submit" icon={Check} disabled={!dirty}>
          Kaydet
        </Button>
      </form>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------- Kasalar

function KasalarCard() {
  const kasalar = useStore((s) => s.kasalar);
  const transactions = useStore((s) => s.transactions);
  const balances = useMemo(() => kasaBalances({ kasalar, transactions }), [kasalar, transactions]);
  const [editing, setEditing] = useState<{ id: number; title: string } | null>(null);
  const [newKasa, setNewKasa] = useState("");

  const exists = (title: string, exceptId?: number) => kasalar.some((k) => k.is_active && k.id !== exceptId && norm(k.title) === norm(title));

  function add(e?: FormEvent) {
    e?.preventDefault();
    const t = newKasa.trim();
    if (!t) return;
    if (exists(t)) {
      toast("Bu adda bir kasa zaten var.", "error");
      return;
    }
    useStore.getState().addKasa(t);
    setNewKasa("");
    toast(`“${t}” kasası eklendi.`);
  }

  function commitRename(e?: FormEvent) {
    e?.preventDefault();
    if (!editing) return;
    const t = editing.title.trim();
    if (!t) {
      toast("Kasa adı boş olamaz.", "error");
      return;
    }
    if (exists(t, editing.id)) {
      toast("Bu adda bir kasa zaten var.", "error");
      return;
    }
    useStore.getState().renameKasa(editing.id, t);
    setEditing(null);
  }

  async function remove(id: number, title: string) {
    const ok = await confirmDialog({ title: "Kasayı kaldır", text: `${title} listeden kaldırılacak (hareketler silinmez).`, okLabel: "Kaldır", danger: true });
    if (!ok) return;
    useStore.getState().deactivateKasa(id);
    toast(`“${title}” kaldırıldı.`);
  }

  return (
    <SettingsCard icon={Wallet} title="Kasalar" sub="Kursiyer tahsilatları ve hareketler hangi kasaya işlensin?">
      {balances.length ? (
        <div className="divide-y divide-line/70 rounded-2xl border border-line/70">
          {balances.map((b) =>
            editing?.id === b.id ? (
              <form key={b.id} onSubmit={commitRename} className="flex items-center gap-2 px-3 py-2.5">
                <Input
                  autoFocus
                  value={editing.title}
                  onChange={(e) => setEditing({ id: b.id, title: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      setEditing(null);
                    }
                  }}
                  className="!py-2 text-[14px]"
                  maxLength={60}
                />
                <Button type="submit" small icon={Check}>
                  Tamam
                </Button>
                <button type="button" onClick={() => setEditing(null)} aria-label="Vazgeç" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-paper">
                  <X size={17} />
                </button>
              </form>
            ) : (
              <div key={b.id} className="flex items-center gap-2 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold text-ink">{b.title}</div>
                  <div className={cx("num text-[11.5px]", b.bakiye < 0 ? "text-danger" : "text-muted")}>Bakiye {money(b.bakiye)}</div>
                </div>
                <Button kind="ghost" small icon={Pencil} onClick={() => setEditing({ id: b.id, title: b.title })}>
                  Ad
                </Button>
                <Button kind="danger" small onClick={() => remove(b.id, b.title)}>
                  Kaldır
                </Button>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-paper px-4 py-3 text-[13px] text-muted">Aktif kasa yok. Aşağıdan ekleyin.</div>
      )}
      <form onSubmit={add} className="mt-3 flex gap-2">
        <Input value={newKasa} onChange={(e) => setNewKasa(e.target.value)} placeholder="Yeni kasa (örn. Yasin, Fatih)" className="!py-2.5 text-[14px]" maxLength={60} />
        <Button type="submit" icon={Plus} disabled={!newKasa.trim()}>
          Ekle
        </Button>
      </form>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------- Kategoriler

function KategorilerCard() {
  const categories = useStore((s) => s.categories);
  const transactions = useStore((s) => s.transactions);
  const [type, setType] = useState<TrxType>("gider");
  const [name, setName] = useState("");
  const list = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);

  function add(e?: FormEvent) {
    e?.preventDefault();
    const t = name.trim();
    if (!t) return;
    if (list.some((c) => norm(c.name) === norm(t))) {
      toast("Bu kategori zaten var.", "error");
      return;
    }
    useStore.getState().addCategory(type, t);
    setName("");
  }

  async function remove(id: number, n: string) {
    const used = transactions.filter((t) => t.category_id === id).length;
    const ok = await confirmDialog({
      title: "Kategoriyi sil",
      text: `“${n}” silinecek.${used ? ` Bu kategorideki ${used} hareket kategorisiz kalır.` : ""}`,
      okLabel: "Sil",
      danger: true,
    });
    if (!ok) return;
    useStore.getState().removeCategory(id);
  }

  return (
    <SettingsCard icon={Tags} title="Kategoriler" sub="Gelir ve gider hareketlerinde seçilen kategoriler.">
      <Segment
        value={type}
        onChange={setType}
        options={[
          { value: "gelir", label: "Gelir" },
          { value: "gider", label: "Gider" },
        ]}
      />
      <div className="mt-3.5 flex flex-wrap gap-2">
        {list.length ? (
          list.map((c) => (
            <Badge key={c.id} tone={type === "gelir" ? "green" : "orange"} className="!py-1 !pl-3 !pr-1 text-[12.5px]">
              {c.name}
              <button
                type="button"
                onClick={() => remove(c.id, c.name)}
                aria-label={`${c.name} kategorisini sil`}
                className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full hover:bg-white/80"
              >
                <X size={12} strokeWidth={2.6} />
              </button>
            </Badge>
          ))
        ) : (
          <span className="text-[13px] text-muted">Bu türde kategori yok.</span>
        )}
      </div>
      <form onSubmit={add} className="mt-3.5 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={type === "gelir" ? "Yeni gelir kategorisi" : "Yeni gider kategorisi"} className="!py-2.5 text-[14px]" maxLength={60} />
        <Button type="submit" icon={Plus} disabled={!name.trim()}>
          Ekle
        </Button>
      </form>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------- Veri ve Yedek

function DataCard() {
  const nKursiyer = useStore((s) => s.kursiyerler.length);
  const nTrx = useStore((s) => s.transactions.length);
  const nAnaliz = useStore((s) => s.analyses.length);
  const nSinif = useStore((s) => s.siniflar.length);
  const nOlay = useStore((s) => s.olaylar.length);
  const nDenetim = useStore((s) => s.denetimler.length);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  function backup() {
    const data = useStore.getState().exportData();
    const payload = { _app: "isgora", _version: 1, _exported_at: nowIso(), ...data };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), `isgora_yedek_${today()}.json`);
    toast("Yedek dosyası indirildi.");
  }

  async function restore(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        toast("Dosya okunamadı: geçerli bir JSON yedeği değil.", "error");
        return;
      }
      if (!looksLikeData(parsed)) {
        toast("Bu dosya bir İsgora yedeği gibi görünmüyor.", "error");
        return;
      }
      const d = fixSeq(parsed);
      const count = (k: (typeof ARRAY_KEYS)[number]) => (Array.isArray(d[k]) ? (d[k] as unknown[]).length : 0);
      const ok = await confirmDialog({
        title: "Yedekten geri yükle",
        text: `Mevcut tüm veriler yedekteki İsgora verisiyle değiştirilecek.\n\nYedekte: ${count("kursiyerler")} kursiyer, ${count("transactions")} kasa hareketi, ${count("analyses")} risk analizi, ${count("siniflar")} sınıf.`,
        okLabel: "Geri yükle",
        danger: true,
      });
      if (!ok) return;
      useStore.getState().importData(d);
      toast("Yedek geri yüklendi.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function demo() {
    const ok = await confirmDialog({
      title: "Örnek veri yükle",
      text: "Her modülü deneyebilmeniz için örnek kasa hareketleri, kursiyerler, sınıflar ve analizler mevcut verilerinize eklenecek.",
      okLabel: "Yükle",
    });
    if (!ok) return;
    useStore.getState().loadDemo();
    toast("Örnek veriler yüklendi.");
  }

  async function wipe() {
    const ok = await confirmDialog({
      title: "Tüm verileri sil",
      text: "Kasa hareketleri, kursiyerler, risk analizleri, sınıflar, sınav sonuçları ve tüm diğer kayıtlar bu tarayıcıdan kalıcı olarak silinecek. Bu işlem geri alınamaz; önce yedek almanız önerilir.",
      okLabel: "Hepsini sil",
      danger: true,
    });
    if (!ok) return;
    useStore.getState().resetAll();
    toast("Tüm veriler silindi.");
  }

  const stats: [string, number][] = [
    ["Kursiyer", nKursiyer],
    ["Kasa hareketi", nTrx],
    ["Risk analizi", nAnaliz],
    ["Sınıf", nSinif],
    ["Olay kaydı", nOlay],
    ["Denetim", nDenetim],
  ];

  return (
    <SettingsCard icon={Database} title="Veri ve Yedek" sub="Verileriniz yalnızca bu tarayıcıda tutulur." className="lg:col-span-2">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-[13.5px] leading-relaxed text-text">
            Tüm kayıtlar bu tarayıcının yerel veritabanında (IndexedDB) saklanır ve hiçbir sunucuya gönderilmez. Yalnızca yapay zekâ özelliklerini kullandığınızda
            ilgili istem metni Anthropic&apos;e iletilir. Tarayıcı verilerini temizlerseniz ya da başka bir cihaza geçerseniz kayıtlarınız gelmez — düzenli yedek alın.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {stats.map(([label, n]) => (
              <div key={label} className="rounded-2xl bg-paper px-3 py-2">
                <div className="num text-[17px] font-extrabold text-navy">{n}</div>
                <div className="text-[11px] font-semibold text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <ActionTile icon={Download} title="Yedeği indir (JSON)" text="Tüm verilerin tek dosyalık kopyası." onClick={backup} />
          <ActionTile icon={Upload} title="Yedekten geri yükle" text="JSON yedeğini seçin; mevcut verilerin yerini alır." onClick={() => fileRef.current?.click()} busy={busy} />
          <ActionTile icon={FlaskConical} title="Örnek veri yükle" text="Modülleri denemek için örnek kayıtlar ekler." onClick={demo} />
          <ActionTile icon={Trash2} title="Tüm verileri sil" text="Bu tarayıcıdaki tüm kayıtları kalıcı olarak siler." onClick={wipe} danger />
        </div>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void restore(e.target.files?.[0])} />
    </SettingsCard>
  );
}

function ActionTile({ icon: Icon, title, text, onClick, danger, busy }: { icon: LucideIcon; title: string; text: string; onClick: () => void; danger?: boolean; busy?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cx(
        "flex items-start gap-3 rounded-2xl border p-3.5 text-left transition disabled:opacity-60",
        danger ? "border-soft-danger bg-soft-danger/50 hover:bg-soft-danger" : "border-line bg-white hover:-translate-y-0.5 hover:border-brand-blue/30 hover:shadow-card",
      )}
    >
      <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", danger ? "bg-danger text-white" : "bg-soft-blue text-brand-blue")}>
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className={cx("block text-[13.5px] font-extrabold", danger ? "text-danger" : "text-navy")}>{title}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-muted">{text}</span>
      </span>
    </button>
  );
}
