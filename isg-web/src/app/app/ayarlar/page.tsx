"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import {
  Building2,
  UserRound,
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
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Chips, Field, Input, PageHeader, Segment, Textarea } from "@/components/ui";
import { FieldGroup } from "@/components/FieldGroup";
import { AiQuotaBadge, AiQuotaWarning, useAiQuota } from "@/components/AiQuota";
import { ortakAnahtarDurum, ortakAnahtarKaydet, ortakAnahtarSil } from "@/lib/api";
import { confirmDialog, toast } from "@/components/feedback";
import { kasaBalances, useStore, type Data } from "@/lib/store";
import { cx, money, norm, nowIso, today } from "@/lib/format";
import { downloadBlob } from "@/lib/print";
import { apiFetch, useSync } from "@/lib/sync";
import { ROLLER, rolBilgi, useProfil, useRol, type Profil, type Rol } from "@/lib/roles";
import {
  AiError,
  MODELS,
  aiMode,
  client,
  currentModel,
  describeError,
  getAccessCode,
  getApiKey,
  resetServerStatus,
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
  const rol = useRol();
  const backend = useSync((s) => s.backend);
  return (
    <div>
      <PageHeader title="Ayarlar" subtitle="Profil, yapay zekâ, firma ve yedekleme" actions={<LogoutButton />} />
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          {backend ? <ProfileCard /> : null}
          <AiCard />
        </div>
        <div className="space-y-5">
          <FirmaCard key={firma} />
          {rol === "osgb" ? (
            <>
              <KasalarCard />
              <KategorilerCard />
            </>
          ) : null}
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

type ModeInfo = { text: string; tone: string; dot: string };

function modeInfo(mode: AiMode | null, srv: ServerStatus | null, ctx: { yonetici: boolean; osgb: boolean; bitti: boolean }): ModeInfo | null {
  if (!mode) return null;
  if (mode === "key") return { text: "Etkin mod: bu tarayıcıdaki kendi API anahtarınız (istekler tarayıcıdan doğrudan Anthropic'e gider).", tone: "text-success", dot: "bg-success" };
  if (mode === "none") {
    return ctx.bitti
      ? { text: "Yapay zekâ kapalı: ücretsiz sorgularınız bitti; kendi API anahtarınızı ekleyin.", tone: "text-danger", dot: "bg-danger" }
      : { text: "Yapay zekâ kapalı: API anahtarı girilmemiş.", tone: "text-danger", dot: "bg-danger" };
  }
  const blue = { tone: "text-brand-blue", dot: "bg-brand-blue" };
  if (srv?.ownKey) return { text: "Etkin mod: sunucuda kayıtlı kendi anahtarınız (istekler uygulama sunucusu üzerinden gider).", ...blue };
  if (srv?.free?.unlimited) {
    if (ctx.yonetici) return { text: "Etkin mod: ortak sunucu anahtarı — yönetici olarak sınırsız kullanırsınız.", ...blue };
    if (ctx.osgb) return { text: "Etkin mod: bağlı olduğunuz OSGB'nin anahtarı (sınırsız).", ...blue };
  } else if (srv?.free && srv.sharedKey) {
    return { text: `Etkin mod: ücretsiz deneme — ortak sunucu anahtarı (${srv.free.left} / ${srv.free.limit} sorgu kaldı).`, ...blue };
  }
  return { text: "Etkin mod: sunucu anahtarı (istekler uygulama sunucusu üzerinden gider).", ...blue };
}

/** Göster / gizle düğmeli anahtar alanı */
function SecretInput({ value, onChange, placeholder = "sk-ant-…" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        mono
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
  );
}

function AiCard() {
  const savedKey = useSyncExternalStore(subscribeAiConfig, getApiKey, () => "");
  const savedCode = useSyncExternalStore(subscribeAiConfig, getAccessCode, () => "");
  const settings = useStore((s) => s.settings);
  const backend = useSync((s) => s.backend);
  const yonetici = useSync((s) => s.yonetici);
  const osgb = useSync((s) => s.osgb);
  const quota = useAiQuota();
  const [keyInput, setKeyInput] = useState("");
  const [keyErr, setKeyErr] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [srv, setSrv] = useState<ServerStatus | null>(null);
  const [mode, setMode] = useState<AiMode | null>(null);
  const [testing, setTesting] = useState(false);
  const [busyKey, setBusyKey] = useState(false);

  // Açılışta, anahtar değiştiğinde ve her sorgudan sonra (refreshAiStatus) yeniden okunur
  useEffect(() => {
    let alive = true;
    const load = () => {
      void serverStatus().then((s) => {
        if (alive) setSrv(s);
      });
      void aiMode().then((m) => {
        if (alive) setMode(m);
      });
    };
    load();
    const unsub = subscribeAiConfig(load);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const ownServerKey = !!srv?.ownKey;

  async function saveKey(e?: FormEvent) {
    e?.preventDefault();
    const k = keyInput.trim();
    if (!k) {
      setKeyErr("Anahtarı yapıştırın.");
      return;
    }
    if (!k.startsWith("sk-ant-")) {
      setKeyErr("Anthropic API anahtarı “sk-ant-” ile başlar. Anahtarı kontrol edin.");
      return;
    }
    if (backend) {
      setBusyKey(true);
      try {
        const r = await apiFetch("ai-key", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: k }) });
        if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { message?: string }).message || "Kaydedilemedi.");
        if (savedKey) setApiKey("");
        setKeyInput("");
        resetServerStatus();
        toast("API anahtarınız sunucuda saklandı; tüm cihazlarınızda geçerli.");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Kaydedilemedi.", "error");
      } finally {
        setBusyKey(false);
      }
      return;
    }
    setApiKey(k);
    setKeyInput("");
    toast("API anahtarı bu tarayıcıda saklandı.");
  }

  async function removeServerKey() {
    const ok = await confirmDialog({
      title: "Anahtarınızı silin",
      text: "Sunucudaki kendi API anahtarınız silinecek. Ücretsiz deneme hakkınız varsa ortak anahtarla devam edebilirsiniz; yoksa yeni anahtar girilene kadar yapay zekâ özellikleri çalışmaz.",
      okLabel: "Sil",
      danger: true,
    });
    if (!ok) return;
    try {
      const r = await apiFetch("ai-key", { method: "DELETE" });
      if (!r.ok) throw new Error("Silinemedi.");
      resetServerStatus();
      toast("API anahtarınız silindi.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Silinemedi.", "error");
    }
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

  const info = modeInfo(mode, srv, { yonetici, osgb: !!osgb, bitti: quota.kind === "bitti" });

  return (
    <SettingsCard
      icon={Sparkles}
      title="Yapay Zekâ"
      sub={backend ? "Anahtar sunucudaki veritabanında saklanır; tarayıcıya geri gönderilmez." : "Anahtar yalnızca bu tarayıcıda saklanır."}
    >
      {quota.kind === "left" ? (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <AiQuotaBadge left={quota.left} limit={quota.limit} />
          <span className="text-[12px] leading-snug text-muted">Kendi anahtarınızı eklediğinizde sınır kalkar.</span>
        </div>
      ) : quota.kind === "bitti" ? (
        <AiQuotaWarning limit={quota.limit} link={false} className="mb-4" />
      ) : null}

      {ownServerKey ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-soft-green px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-success">
          <CircleCheck size={16} className="shrink-0" />
          <span className="min-w-0 flex-1">Kendi API anahtarınız sunucuda kayıtlı — tüm cihazlarınızda yapay zekâ çalışır.</span>
          {backend ? (
            <Button kind="danger" small icon={Trash2} onClick={removeServerKey}>
              Sil
            </Button>
          ) : null}
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
          label={savedKey || ownServerKey ? "Yeni Anthropic API anahtarı" : "Kendi Anthropic API anahtarınız"}
          error={keyErr}
          hint={
            <>
              Anahtarı{" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="font-bold text-brand-blue hover:underline">
                console.anthropic.com
              </a>{" "}
              adresinden alabilirsiniz. Risk analizi ve asistan bu anahtarla sınırsız çalışır.
            </>
          }
        >
          <SecretInput
            value={keyInput}
            onChange={(v) => {
              setKeyInput(v);
              setKeyErr(null);
            }}
          />
        </Field>
        <Button type="submit" icon={KeyRound} disabled={!keyInput.trim()} loading={busyKey}>
          {backend ? (ownServerKey ? "Anahtarınızı değiştirin" : "Anahtarı sunucuya kaydet") : "Anahtarı kaydet"}
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

      <div className={cx("mt-4 flex items-start gap-2 text-[12.5px] font-semibold leading-relaxed", info?.tone ?? "text-muted")}>
        <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", info?.dot ?? "bg-line")} />
        {info?.text ?? "Durum kontrol ediliyor…"}
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

      {backend && yonetici ? <OrtakAnahtar /> : null}
    </SettingsCard>
  );
}

/** Yönetici: kendi anahtarı olmayan kullanıcıların ücretsiz sorgularında kullanılan ortak anahtar */
function OrtakAnahtar() {
  const [st, setSt] = useState<{ set: boolean; fromConfig: boolean; limit: number } | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [inputErr, setInputErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    ortakAnahtarDurum()
      .then((s) => {
        if (!alive) return;
        setSt(s);
        setLoadErr(null);
      })
      .catch((e: unknown) => {
        if (alive) setLoadErr(e instanceof Error ? e.message : "Durum okunamadı.");
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  const reload = () => setTick((t) => t + 1);
  const limit = st?.limit ?? 5;

  async function save(e?: FormEvent) {
    e?.preventDefault();
    const k = input.trim();
    if (!k) {
      setInputErr("Anahtarı yapıştırın.");
      return;
    }
    if (!k.startsWith("sk-ant-")) {
      setInputErr("Anthropic API anahtarı “sk-ant-” ile başlamalı.");
      return;
    }
    setBusy(true);
    try {
      await ortakAnahtarKaydet(k);
      setInput("");
      resetServerStatus();
      reload();
      toast("Ortak anahtar kaydedildi; ücretsiz sorgular bu anahtarla yapılır.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Kaydedilemedi.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = await confirmDialog({
      title: "Ortak anahtarı kaldır",
      text: "Kendi anahtarı olmayan kullanıcılar ücretsiz sorgu yapamaz (config.php'de bir anahtar tanımlıysa o kullanılmaya devam eder).",
      okLabel: "Kaldır",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await ortakAnahtarSil();
      resetServerStatus();
      reload();
      toast("Ortak anahtar kaldırıldı.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Kaldırılamadı.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Users size={17} className="shrink-0 text-brand-blue" />
        <h3 className="min-w-0 text-[14.5px] font-extrabold text-navy">Ortak API anahtarı (ücretsiz sorgular)</h3>
        <Badge tone="navy">Yönetici</Badge>
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
        Kendi anahtarı olmayan her kullanıcı bu anahtarla <span className="num font-bold text-navy">{limit}</span> ücretsiz sorgu yapabilir; yönetici sınırsız kullanır.
      </p>

      {loadErr ? (
        <div className="mt-3 rounded-2xl bg-soft-danger px-3.5 py-2.5 text-[12.5px] font-semibold text-danger">{loadErr}</div>
      ) : !st ? (
        <div className="skeleton mt-3 h-11 w-full rounded-2xl" />
      ) : st.set && st.fromConfig ? (
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-soft-blue px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-brand-blue">
          <CircleCheck size={16} className="mt-0.5 shrink-0" />
          <span className="min-w-0">
            Ortak anahtar sunucudaki <span className="font-mono">config.php</span> dosyasından geliyor; değiştirmek ya da kaldırmak için oradaki
            ayarı düzenleyin. Aşağıdan girdiğiniz anahtar config.php&apos;dekinin yerine geçer.
          </span>
        </div>
      ) : st.set ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-soft-green px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-success">
          <CircleCheck size={16} className="shrink-0" />
          <span className="min-w-0 flex-1">Ortak anahtar tanımlı — ücretsiz sorgular açık.</span>
          <Button kind="danger" small icon={Trash2} onClick={remove} disabled={busy}>
            Kaldır
          </Button>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-[#F3DFA9] bg-soft-warn px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-warn">
          Ortak anahtar tanımlı değil — kendi anahtarı olmayan kullanıcılar yapay zekâyı kullanamaz.
        </div>
      )}

      {!loadErr ? (
        <form onSubmit={save} className="mt-3 space-y-2.5">
          <Field label={st?.set ? "Yeni ortak anahtar" : "Ortak anahtar"} error={inputErr}>
            <SecretInput
              value={input}
              onChange={(v) => {
                setInput(v);
                setInputErr(null);
              }}
            />
          </Field>
          <Button type="submit" kind="secondary" icon={KeyRound} disabled={!input.trim()} loading={busy}>
            Ortak anahtarı kaydet
          </Button>
        </form>
      ) : null}
    </div>
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
    <SettingsCard icon={Building2} title="Firma / Kurum" sub="Raporlarda ve Excel çıktılarında görünen firma, OSGB ya da kurum adı.">
      <form onSubmit={save} className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
        <Field label="Firma / OSGB / kurum adı" className="flex-1">
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
      text: "Kasa hareketleri, kursiyerler, risk analizleri, sınıflar, sınav sonuçları ve tüm diğer kayıtlar veritabanından kalıcı olarak silinecek. Bu işlem geri alınamaz; önce yedek almanız önerilir.",
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
    <SettingsCard icon={Database} title="Veri ve Yedek" sub="Verileriniz İsgora sunucusundaki SQLite veritabanında tutulur." className="lg:col-span-2">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-[13.5px] leading-relaxed text-text">
            Tüm kayıtlar kendi hosting&apos;inizdeki SQLite veritabanına kaydedilir ve şifreli girişle korunur; hangi cihazdan giriş yaparsanız aynı veriler gelir.
            Yalnızca yapay zekâ özelliklerini kullandığınızda ilgili istem metni Anthropic&apos;e iletilir. Yine de ara sıra JSON yedeği almanız önerilir.
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
          <ActionTile icon={Trash2} title="Tüm verileri sil" text="Veritabanındaki tüm kayıtları kalıcı olarak siler." onClick={wipe} danger />
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

function LogoutButton() {
  const backend = useSync((s) => s.backend);
  const user = useSync((s) => s.user);
  if (!backend) return null;
  return (
    <a
      href="/giris.php?cikis=1"
      className="inline-flex h-9 items-center gap-2 rounded-2xl border border-line bg-white px-3.5 text-[13px] font-bold text-navy transition hover:bg-soft-danger hover:text-danger"
    >
      Çıkış yap{user ? <span className="font-semibold text-muted">· {user}</span> : null}
    </a>
  );
}

// ---------------------------------------------------------------- Profil ve rol

const HEDEF_SINAVLAR = [
  "C Sınıfı İş Sağlığı ve Güvenliği Uzmanlığı",
  "B Sınıfı İş Sağlığı ve Güvenliği Uzmanlığı",
  "A Sınıfı İş Sağlığı ve Güvenliği Uzmanlığı",
  "İşyeri Hekimliği",
  "Diğer Sağlık Personeli (DSP)",
];
/** Eski kayıtlardaki kısaltmalı değerler → kayıt formundaki (giris.php) güncel ad */
const HEDEF_ESKI: Record<string, string> = {
  "C Sınıfı İSG Uzmanlığı": HEDEF_SINAVLAR[0],
  "B Sınıfı İSG Uzmanlığı": HEDEF_SINAVLAR[1],
  "A Sınıfı İSG Uzmanlığı": HEDEF_SINAVLAR[2],
  "DSP (Diğer Sağlık Personeli)": HEDEF_SINAVLAR[4],
};
/** DSP meslekleri — giris.php ile aynı */
const MESLEKLER = ["Hemşire", "Sağlık memuru", "Acil tıp teknisyeni", "Çevre sağlığı teknisyeni", "Diğer"];
/** giris.php'deki kayıt formuyla aynı seçenekler */
const DENEYIMLER = ["0–1 yıl", "1–3 yıl", "3–5 yıl", "5–10 yıl", "10 yıldan fazla"];

/** Sunucudaki profil beyaz listesiyle aynı alanlar */
const PROFIL_KEYS: (keyof Profil)[] = [
  "ad_soyad",
  "telefon",
  "kurum",
  "il",
  "ilce",
  "uzmanlik_sinifi",
  "belge_no",
  "deneyim",
  "uzmanlik_alani",
  "meslek",
  "hedef_sinav",
  "bolum",
  "yetki_belge_no",
  "vergi_no",
  "adres",
];

type Hatalar = Partial<Record<keyof Profil, string>>;

const KURUM_ETIKET: Record<Rol, { label: string; placeholder: string }> = {
  osgb: { label: "OSGB / kurum adı", placeholder: "Örn. Güven OSGB Ltd. Şti." },
  uzman: { label: "Çalıştığınız firma / OSGB", placeholder: "Örn. Güven OSGB" },
  hekim: { label: "Çalıştığınız kurum / OSGB / hastane", placeholder: "Örn. Güven OSGB" },
  dsp: { label: "Çalıştığınız kurum / OSGB", placeholder: "Örn. Güven OSGB" },
  ogrenci: { label: "Eğitim aldığınız eğitim kurumu", placeholder: "Örn. Güven Eğitim Kurumu" },
};

const ZORUNLU: Record<Rol, (keyof Profil)[]> = {
  osgb: ["kurum"],
  uzman: ["uzmanlik_sinifi", "kurum"],
  hekim: [],
  dsp: ["meslek"],
  ogrenci: ["kurum"],
};

const ZORUNLU_MESAJ: Hatalar = {
  kurum: "Bu alan zorunludur.",
  uzmanlik_sinifi: "Uzmanlık belgesi sınıfını seçin.",
  meslek: "Mesleğinizi seçin.",
};

/** Sunucudaki normalize_phone ile aynı kural: Türkiye numarası, 10 hane, 2–5 ile başlar */
function telefonGecerli(raw: string): boolean {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("90")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d.length === 10 && /^[2-5]/.test(d);
}

/** Kayıtlı değer listede yoksa (eski kayıt) seçenek olarak korunur */
function withValue(list: string[], v?: string): string[] {
  return v && !list.includes(v) ? [...list, v] : list;
}

function SelectInput({ value, onChange, options, placeholder = "Seçin" }: { value?: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select className="field" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {withValue(options, value).map((x) => (
        <option key={x} value={x}>
          {x}
        </option>
      ))}
    </select>
  );
}

function ProfileCard() {
  const rol = useRol();
  const profil = useProfil();
  const user = useSync((s) => s.user);
  const osgb = useSync((s) => s.osgb);
  /** OSGB'nin açtığı çalışan hesabında rol OSGB tarafından belirlenir */
  const rolKilitli = !!osgb && rol !== "osgb";
  const [sel, setSel] = useState<Rol>(rol);
  const [p, setP] = useState<Profil>(() => ({
    ...profil,
    hedef_sinav: profil.hedef_sinav ? (HEDEF_ESKI[profil.hedef_sinav] ?? profil.hedef_sinav) : profil.hedef_sinav,
    kurum: profil.kurum || (osgb && rol !== "osgb" ? osgb.ad : ""),
  }));
  const [hata, setHata] = useState<Hatalar>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof Profil) => (v: string) => {
    setP((x) => ({ ...x, [k]: v }));
    setHata((h) => (h[k] ? { ...h, [k]: undefined } : h));
  };
  const val = (k: keyof Profil) => (p[k] as string | undefined) ?? "";
  const zorunlu = ZORUNLU[sel];
  const req = (k: keyof Profil, label: string) => (zorunlu.includes(k) ? `${label} *` : label);

  function dogrula(): boolean {
    const h: Hatalar = {};
    for (const k of zorunlu) if (!val(k).trim()) h[k] = ZORUNLU_MESAJ[k] ?? "Bu alan zorunludur.";
    if (val("telefon").trim() && !telefonGecerli(val("telefon"))) h.telefon = "Geçerli bir telefon numarası girin (örn. 0532 123 45 67).";
    if (sel === "osgb" && val("vergi_no").trim() && !/^\d{10,11}$/.test(val("vergi_no").replace(/\s/g, ""))) h.vergi_no = "Vergi numarası 10, TC kimlik numarası 11 hanelidir.";
    setHata(h);
    return Object.keys(h).length === 0;
  }

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!dogrula()) {
      toast("Eksik ya da hatalı alanları düzeltin.", "error");
      return;
    }
    if (sel !== rol) {
      const ok = await confirmDialog({
        title: "Rolü değiştir",
        text: `Rolünüz “${rolBilgi(sel).ad}” olacak. Menüler ve ana sayfa buna göre değişir; kayıtlarınız silinmez.`,
        okLabel: "Değiştir",
      });
      if (!ok) return;
    }
    const temiz: Record<string, string> = {};
    for (const k of PROFIL_KEYS) temiz[k] = val(k).trim();
    setBusy(true);
    try {
      const r = await apiFetch("profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rol: sel, profil: temiz }) });
      if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { message?: string }).message || "Kaydedilemedi.");
      const j = (await r.json()) as { rol: string; profil: Record<string, string> };
      useSync.setState({ rol: j.rol, profil: j.profil, ad: j.profil.ad_soyad ?? null });
      setP((x) => ({ ...x, ...(j.profil as Profil) }));
      toast(sel !== rol ? `Rolünüz ${rolBilgi(sel).kisa} olarak değişti.` : "Profil kaydedildi.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Kaydedilemedi.", "error");
    } finally {
      setBusy(false);
    }
  }

  const kurum = KURUM_ETIKET[sel];

  return (
    <SettingsCard icon={UserRound} title="Profil ve Rol" sub={user ? `Hesap: ${user}` : undefined}>
      <form onSubmit={save} className="space-y-3" noValidate>
        {osgb ? (
          <div className="flex items-start gap-2.5 rounded-2xl bg-soft-blue px-3.5 py-2.5 text-[13px] leading-relaxed text-brand-blue">
            <Building2 size={16} className="mt-0.5 shrink-0" />
            <span className="min-w-0">
              Bağlı olduğunuz OSGB: <span className="font-extrabold">{osgb.ad}</span>
              {rolKilitli ? <span className="block text-[12px] font-semibold text-muted">Rolünüz ve firma atamalarınız OSGB tarafından belirlenir.</span> : null}
            </span>
          </div>
        ) : null}

        <FieldGroup label="Rol" hint={rolKilitli ? undefined : "Rolünüzü değiştirdiğinizde menüler ve ana sayfa yeni role göre düzenlenir."}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ROLLER.map((r) => {
              const on = sel === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSel(r.id);
                    setHata({});
                  }}
                  disabled={rolKilitli && !on}
                  aria-pressed={on}
                  className={cx(
                    "min-w-0 rounded-2xl border-2 px-3.5 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45",
                    on ? "border-brand-blue bg-soft-blue" : "border-line bg-white hover:border-brand-blue/40",
                  )}
                >
                  <span className="flex items-start gap-2 text-[13.5px] font-extrabold leading-snug text-navy">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r.renk }} />
                    <span className="min-w-0">{r.ad}</span>
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">{r.aciklama}</span>
                </button>
              );
            })}
          </div>
        </FieldGroup>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Ad soyad">
            <Input value={val("ad_soyad")} onChange={(e) => set("ad_soyad")(e.target.value)} maxLength={80} autoComplete="name" />
          </Field>
          <Field label="Telefon" error={hata.telefon}>
            <Input type="tel" inputMode="tel" value={val("telefon")} onChange={(e) => set("telefon")(e.target.value)} placeholder="05XX XXX XX XX" maxLength={20} autoComplete="tel" />
          </Field>
          <Field label="İl">
            <Input value={val("il")} onChange={(e) => set("il")(e.target.value)} maxLength={40} />
          </Field>
          <Field label="İlçe">
            <Input value={val("ilce")} onChange={(e) => set("ilce")(e.target.value)} maxLength={60} />
          </Field>

          <Field label={req("kurum", kurum.label)} error={hata.kurum} className={sel === "osgb" || sel === "ogrenci" ? "sm:col-span-2" : undefined}>
            <Input value={val("kurum")} onChange={(e) => set("kurum")(e.target.value)} placeholder={kurum.placeholder} maxLength={120} />
          </Field>

          {sel === "osgb" ? (
            <>
              <Field label="Yetki belgesi no">
                <Input value={val("yetki_belge_no")} onChange={(e) => set("yetki_belge_no")(e.target.value)} maxLength={40} />
              </Field>
              <Field label="Vergi no" error={hata.vergi_no}>
                <Input inputMode="numeric" value={val("vergi_no")} onChange={(e) => set("vergi_no")(e.target.value.replace(/[^\d]/g, ""))} maxLength={11} />
              </Field>
              <Field label="Adres" className="sm:col-span-2">
                <Textarea value={val("adres")} onChange={(e) => set("adres")(e.target.value)} maxLength={240} rows={2} className="!min-h-[72px]" />
              </Field>
            </>
          ) : null}

          {sel === "uzman" ? (
            <>
              <FieldGroup label={req("uzmanlik_sinifi", "Uzmanlık belgesi sınıfı")} error={hata.uzmanlik_sinifi}>
                <Chips
                  options={[
                    { value: "A", label: "A" },
                    { value: "B", label: "B" },
                    { value: "C", label: "C" },
                  ]}
                  value={val("uzmanlik_sinifi")}
                  onChange={(v) => set("uzmanlik_sinifi")(v)}
                />
              </FieldGroup>
              <Field label="Belge no">
                <Input value={val("belge_no")} onChange={(e) => set("belge_no")(e.target.value)} maxLength={40} />
              </Field>
              <Field label="Mesleki deneyim">
                <SelectInput value={val("deneyim")} onChange={set("deneyim")} options={DENEYIMLER} />
              </Field>
            </>
          ) : null}

          {sel === "hekim" ? (
            <>
              <Field label="Belge no">
                <Input value={val("belge_no")} onChange={(e) => set("belge_no")(e.target.value)} maxLength={40} />
              </Field>
              <Field label="Uzmanlık alanı">
                <Input value={val("uzmanlik_alani")} onChange={(e) => set("uzmanlik_alani")(e.target.value)} placeholder="Örn. İş ve meslek hastalıkları" maxLength={80} />
              </Field>
            </>
          ) : null}

          {sel === "dsp" ? (
            <>
              <Field label={req("meslek", "Meslek")} error={hata.meslek}>
                <SelectInput value={val("meslek")} onChange={set("meslek")} options={MESLEKLER} />
              </Field>
              <Field label="Belge no">
                <Input value={val("belge_no")} onChange={(e) => set("belge_no")(e.target.value)} maxLength={40} />
              </Field>
            </>
          ) : null}

          {sel === "ogrenci" ? (
            <>
              <Field label="Hazırlandığınız sınav">
                <SelectInput value={val("hedef_sinav")} onChange={set("hedef_sinav")} options={HEDEF_SINAVLAR} />
              </Field>
              <Field label="Bölüm">
                <Input value={val("bolum")} onChange={(e) => set("bolum")(e.target.value)} placeholder="Örn. Makine mühendisliği" maxLength={100} />
              </Field>
            </>
          ) : null}
        </div>
        <div className="text-[12px] text-muted">* ile işaretli alanlar zorunludur.</div>
        <Button type="submit" icon={Check} loading={busy}>
          {sel !== rol ? "Rolü değiştir ve kaydet" : "Profili kaydet"}
        </Button>
      </form>
    </SettingsCard>
  );
}
