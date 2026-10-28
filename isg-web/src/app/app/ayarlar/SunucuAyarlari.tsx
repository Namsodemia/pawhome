"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Braces, CircleCheck, CircleX, Eye, EyeOff, Mail, PlugZap, Save, Server, Sparkles, Trash2, UserPlus, WandSparkles } from "lucide-react";
import { Button, Field, Input, Loading, Segment } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { cx } from "@/lib/format";
import { resetServerStatus } from "@/lib/ai/client";
import { aiAnahtarTest, denemeEpostasi, siteAyarlari, siteAyarlariKaydet, type SiteSecrets, type SiteSettings, type SiteValues } from "@/lib/api";

/**
 * Yönetici: sunucu ayarları (Claude anahtarı, çalışma alanı, ücretsiz soru hakkı, kayıt, e-posta / SMTP).
 * Değerler veritabanında tutulur ve config.php'nin üzerine yazılır — paketi yeniden yüklemek gerekmez.
 * "Kod düzenleyici" görünümü aynı ayarları JSON olarak düzenletir (gizli alanlar hariç).
 */
export function SunucuAyarlari() {
  const [data, setData] = useState<SiteSettings | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"form" | "kod">("form");

  useEffect(() => {
    siteAyarlari()
      .then(setData)
      .catch((e: Error) => setLoadErr(e.message));
  }, []);

  return (
    <section className="rounded-xl2 border border-line/70 bg-white p-4 shadow-card md:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-navy text-white shadow-fab">
          <Server size={19} strokeWidth={2.3} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16.5px] font-extrabold text-navy">Sunucu ayarları</h2>
          <div className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
            Yalnızca yönetici görür. Kaydettiğiniz anda tüm site için geçerli olur; zip yüklemeye gerek yoktur.
          </div>
        </div>
      </div>
      {loadErr ? (
        <div className="rounded-2xl bg-soft-danger px-3.5 py-3 text-[13px] font-semibold text-danger">{loadErr}</div>
      ) : !data ? (
        <Loading text="Ayarlar yükleniyor…" />
      ) : (
        <>
          <Segment
            className="mb-4"
            value={tab}
            onChange={setTab}
            options={[
              { value: "form", label: "Form" },
              { value: "kod", label: "Kod düzenleyici" },
            ]}
          />
          {tab === "form" ? <FormGorunum data={data} onSaved={setData} /> : <KodDuzenleyici data={data} onSaved={setData} />}
        </>
      )}
    </section>
  );
}

async function kaydet(values: Partial<SiteValues> & SiteSecrets, onSaved: (d: SiteSettings) => void): Promise<boolean> {
  try {
    const d = await siteAyarlariKaydet(values);
    onSaved(d);
    resetServerStatus();
    toast("Sunucu ayarları kaydedildi.");
    return true;
  } catch (e) {
    toast((e as Error).message, "error");
    return false;
  }
}

// ---------------------------------------------------------------- form

function FormGorunum({ data, onSaved }: { data: SiteSettings; onSaved: (d: SiteSettings) => void }) {
  const [v, setV] = useState<SiteValues>(data.values);
  const [apiKey, setApiKey] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiTest, setAiTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState<"ai" | "mail" | null>(null);

  useEffect(() => setV(data.values), [data]);

  const set = <K extends keyof SiteValues>(k: K) => (x: SiteValues[K]) => setV((p) => ({ ...p, [k]: x }));
  const dirty = useMemo(() => JSON.stringify(v) !== JSON.stringify(data.values) || !!apiKey.trim() || !!smtpPass, [v, data.values, apiKey, smtpPass]);
  const key = data.secrets.anthropic_api_key;

  async function save(): Promise<boolean> {
    setBusy(true);
    const changed: Partial<SiteValues> & SiteSecrets = {};
    for (const k of Object.keys(v) as (keyof SiteValues)[]) {
      if (v[k] !== data.values[k]) (changed as Record<string, unknown>)[k] = v[k];
    }
    if (apiKey.trim()) changed.anthropic_api_key = apiKey.trim();
    if (smtpPass) changed.smtp_pass = smtpPass;
    const ok = await kaydet(changed, onSaved);
    if (ok) {
      setApiKey("");
      setSmtpPass("");
      setAiTest(null);
    }
    setBusy(false);
    return ok;
  }

  async function removeSecret(which: "anthropic_api_key" | "smtp_pass") {
    const ok = await confirmDialog({
      title: which === "anthropic_api_key" ? "Claude anahtarını kaldır" : "SMTP şifresini kaldır",
      text: which === "anthropic_api_key" ? "Kaldırılırsa kullanıcılar yapay zekâyı kullanamaz." : "SMTP şifresi silinecek.",
      okLabel: "Kaldır",
      danger: true,
    });
    if (ok) await kaydet({ [which]: null }, onSaved);
  }

  async function testAi() {
    // Kaydedilmemiş değişiklik varsa önce kaydet: test her zaman sunucudaki ayarlarla yapılır
    if (dirty && !(await save())) return;
    setTesting("ai");
    try {
      setAiTest(await aiAnahtarTest());
    } catch (e) {
      setAiTest({ ok: false, message: (e as Error).message });
    } finally {
      setTesting(null);
    }
  }

  async function testMail() {
    setTesting("mail");
    try {
      const r = await denemeEpostasi();
      toast(`Deneme e-postası gönderildi: ${r.to}. Gelen kutunuzu (ve spam klasörünü) kontrol edin.`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setTesting(null);
    }
  }

  return (
    <div className="space-y-5">
      <Bolum icon={Sparkles} title="Yapay zekâ (Claude)">
        <Field
          label="Claude API anahtarı (tüm kullanıcılar için ortak)"
          hint={
            key.set ? (
              <span className="inline-flex flex-wrap items-center gap-x-2">
                Kayıtlı: <span className="font-mono">••••{key.last4}</span>
                {key.fromConfig ? <span>(config.php&apos;den)</span> : null}· Değiştirmek için yenisini yazın.
              </span>
            ) : (
              "console.anthropic.com → Settings → API Keys bölümünden alın."
            )
          }
        >
          <Gizli value={apiKey} onChange={setApiKey} placeholder={key.set ? "Yeni anahtar (boş bırakırsanız değişmez)" : "sk-ant-…"} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_160px]">
          <Field label="Çalışma alanı kimliği (workspace ID)" hint="Anahtar bir çalışma alanına bağlı değilse gerekir: Console → Settings → Workspaces (wrkspc_…).">
            <Input mono value={v.anthropic_workspace_id} onChange={(e) => set("anthropic_workspace_id")(e.target.value.trim())} placeholder="wrkspc_…" autoCapitalize="none" spellCheck={false} />
          </Field>
          <Field label="Ücretsiz soru hakkı" hint="Kullanıcı başına; yönetici sınırsız.">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={1000}
              value={String(v.ucretsiz_ai_sorgu)}
              onChange={(e) => set("ucretsiz_ai_sorgu")(Math.max(0, Math.min(1000, Number(e.target.value) || 0)))}
            />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button kind="secondary" small icon={PlugZap} onClick={() => void testAi()} loading={testing === "ai" || (busy && !testing)} disabled={!key.set && !apiKey.trim()}>
            {dirty ? "Kaydet ve test et" : "Anahtarı test et (hak harcamaz)"}
          </Button>
          {key.set && !key.fromConfig ? (
            <Button kind="ghost" small icon={Trash2} onClick={() => void removeSecret("anthropic_api_key")}>
              Anahtarı kaldır
            </Button>
          ) : null}
        </div>
        {aiTest ? (
          <div className={cx("flex items-start gap-2 rounded-2xl px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed", aiTest.ok ? "bg-soft-green text-success" : "bg-soft-danger text-danger")}>
            {aiTest.ok ? <CircleCheck size={16} className="mt-0.5 shrink-0" /> : <CircleX size={16} className="mt-0.5 shrink-0" />}
            <span className="min-w-0 break-words">{aiTest.message}</span>
          </div>
        ) : null}
        <p className="text-[12px] leading-relaxed text-muted">Test, soru hakkı harcamaz; kaydedilmemiş değişiklikler önce kaydedilir.</p>
      </Bolum>

      <Bolum icon={UserPlus} title="Kayıt">
        <Anahtar label="Yeni kayıtlar açık" hint="Kapalıysa yalnızca mevcut hesaplar giriş yapar." value={v.kayit_acik} onChange={set("kayit_acik")} />
        <Anahtar label="E-posta doğrulaması (OTP) zorunlu" hint="Yeni hesaplar e-postaya gelen 6 haneli kodla açılır." value={v.otp_zorunlu} onChange={set("otp_zorunlu")} />
        <Field label="Davet kodu" hint="Doluysa kayıt olurken bu kod sorulur (kapalı grup). Boş: herkes kayıt olabilir.">
          <Input value={v.kayit_kodu} onChange={(e) => set("kayit_kodu")(e.target.value)} placeholder="Boş" autoComplete="off" />
        </Field>
      </Bolum>

      <Bolum icon={Mail} title="E-posta (doğrulama kodları)">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Gönderen adresi" hint={`Boşsa: ${data.mail_from_effective}. cPanel'de bu adla bir e-posta hesabı açın.`}>
            <Input type="email" value={v.mail_from} onChange={(e) => set("mail_from")(e.target.value.trim())} placeholder={data.mail_from_effective} />
          </Field>
          <Field label="Gönderen adı">
            <Input value={v.mail_from_name} onChange={(e) => set("mail_from_name")(e.target.value)} />
          </Field>
        </div>
        <div className="rounded-2xl border border-line bg-paper/50 p-3.5">
          <div className="mb-2.5 text-[12.5px] font-bold text-navy">SMTP (isteğe bağlı — boşsa sunucunun mail() işlevi kullanılır)</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_110px_120px]">
            <Field label="Sunucu">
              <Input mono value={v.smtp_host} onChange={(e) => set("smtp_host")(e.target.value.trim())} placeholder="mail.isgora.com" autoCapitalize="none" />
            </Field>
            <Field label="Port">
              <Input type="number" inputMode="numeric" value={String(v.smtp_port)} onChange={(e) => set("smtp_port")(Math.max(1, Math.min(65535, Number(e.target.value) || 465)))} />
            </Field>
            <Field label="Güvenlik">
              <select className="field" value={v.smtp_secure} onChange={(e) => set("smtp_secure")(e.target.value as SiteValues["smtp_secure"])}>
                <option value="ssl">SSL</option>
                <option value="tls">STARTTLS</option>
                <option value="yok">Yok</option>
              </select>
            </Field>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Kullanıcı adı">
              <Input value={v.smtp_user} onChange={(e) => set("smtp_user")(e.target.value.trim())} placeholder="no-reply@isgora.com" autoCapitalize="none" autoComplete="off" />
            </Field>
            <Field label="Şifre" hint={data.secrets.smtp_pass ? "Kayıtlı. Değiştirmek için yenisini yazın." : undefined}>
              <Gizli value={smtpPass} onChange={setSmtpPass} placeholder={data.secrets.smtp_pass ? "••••••" : ""} />
            </Field>
          </div>
          {data.secrets.smtp_pass ? (
            <Button kind="ghost" small icon={Trash2} onClick={() => void removeSecret("smtp_pass")} className="mt-2">
              SMTP şifresini kaldır
            </Button>
          ) : null}
        </div>
        <Button kind="secondary" small icon={Mail} onClick={() => void testMail()} loading={testing === "mail"}>
          Kendime deneme e-postası gönder
        </Button>
      </Bolum>

      <div className="flex justify-end border-t border-line pt-4">
        <Button icon={Save} onClick={() => void save()} loading={busy} disabled={!dirty}>
          Ayarları kaydet
        </Button>
      </div>
    </div>
  );
}

function Bolum({ icon: Icon, title, children }: { icon: typeof Server; title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[13px] font-extrabold text-navy">
        <Icon size={16} className="text-brand-blue" /> {title}
      </div>
      {children}
    </div>
  );
}

function Anahtar({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)} className="flex w-full items-start gap-3 rounded-2xl border border-line px-3.5 py-3 text-left transition hover:bg-paper/60">
      <span className={cx("mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition", value ? "bg-brand-teal" : "bg-line")}>
        <span className={cx("h-5 w-5 rounded-full bg-white shadow transition", value ? "translate-x-5" : "translate-x-0")} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-bold text-navy">{label}</span>
        {hint ? <span className="mt-0.5 block text-[12px] leading-snug text-muted">{hint}</span> : null}
      </span>
    </button>
  );
}

function Gizli({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
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
        onClick={() => setShow((x) => !x)}
        aria-label={show ? "Gizle" : "Göster"}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-muted hover:bg-paper hover:text-navy"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- kod düzenleyici (JSON)

const KEYS = Object.keys({
  kayit_acik: 0,
  kayit_kodu: 0,
  otp_zorunlu: 0,
  ucretsiz_ai_sorgu: 0,
  anthropic_workspace_id: 0,
  mail_from: 0,
  mail_from_name: 0,
  smtp_host: 0,
  smtp_port: 0,
  smtp_secure: 0,
  smtp_user: 0,
} satisfies Record<keyof SiteValues, 0>) as (keyof SiteValues)[];

function KodDuzenleyici({ data, onSaved }: { data: SiteSettings; onSaved: (d: SiteSettings) => void }) {
  const initial = useMemo(() => JSON.stringify(data.values, null, 2), [data.values]);
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  useEffect(() => setText(initial), [initial]);

  const parsed = useMemo((): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } => {
    try {
      const j = JSON.parse(text) as unknown;
      if (!j || typeof j !== "object" || Array.isArray(j)) return { ok: false, error: "En dışta bir nesne { … } olmalı." };
      const bad = Object.keys(j).filter((k) => !KEYS.includes(k as keyof SiteValues));
      if (bad.length) return { ok: false, error: `Bilinmeyen ayar: ${bad.join(", ")}` };
      return { ok: true, value: j as Record<string, unknown> };
    } catch (e) {
      const m = /position (\d+)/.exec((e as Error).message);
      const line = m ? text.slice(0, Number(m[1])).split("\n").length : null;
      return { ok: false, error: `JSON hatası${line ? ` (satır ${line})` : ""}: ${(e as Error).message}` };
    }
  }, [text]);

  const lines = text.split("\n").length;

  async function save() {
    if (!parsed.ok) return;
    setBusy(true);
    await kaydet(parsed.value as Partial<SiteValues>, onSaved);
    setBusy(false);
  }

  function format() {
    if (parsed.ok) setText(JSON.stringify(parsed.value, null, 2));
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-[#1E2A3A] bg-[#0F1724] shadow-card">
        <div className="flex items-center gap-2 border-b border-white/10 px-3.5 py-2 text-[11.5px] font-semibold text-white/60">
          <Braces size={14} className="text-[#7FD1B9]" />
          <span className="font-mono">site-ayarlari.json</span>
          <span className="ml-auto">{parsed.ok ? <span className="text-[#7FD1B9]">✓ geçerli</span> : <span className="text-[#FF8A8A]">✗ hata</span>}</span>
        </div>
        <div className="flex max-h-[420px] overflow-hidden">
          <div ref={gutterRef} aria-hidden className="select-none overflow-hidden border-r border-white/10 bg-[#0B111C] px-2.5 py-3 text-right font-mono text-[12.5px] leading-[1.6] text-white/30">
            {Array.from({ length: lines }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onScroll={(e) => {
              if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
            }}
            onKeyDown={(e) => {
              // Tab → iki boşluk (odak kaybolmasın); Ctrl/⌘+S → kaydet
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                const el = e.currentTarget;
                const { selectionStart: a, selectionEnd: b } = el;
                const next = text.slice(0, a) + "  " + text.slice(b);
                setText(next);
                requestAnimationFrame(() => el.setSelectionRange(a + 2, a + 2));
              } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                void save();
              }
            }}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            wrap="off"
            aria-label="Sunucu ayarları (JSON)"
            className="min-h-[360px] min-w-0 flex-1 resize-y bg-transparent px-3.5 py-3 font-mono text-[12.5px] leading-[1.6] text-[#E6EDF3] caret-[#7FD1B9] outline-none"
          />
        </div>
      </div>
      {!parsed.ok ? <div className="mt-2 rounded-xl bg-soft-danger px-3 py-2 text-[12.5px] font-semibold text-danger">{parsed.error}</div> : null}
      <p className="mt-2 text-[12px] leading-relaxed text-muted">
        Gizli alanlar (Claude anahtarı, SMTP şifresi) burada görünmez; onları Form sekmesinden girin. Kaydet: Ctrl/⌘ + S.
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button kind="ghost" small onClick={() => setText(initial)} disabled={text === initial}>
          Geri al
        </Button>
        <Button kind="secondary" small icon={WandSparkles} onClick={format} disabled={!parsed.ok}>
          Biçimlendir
        </Button>
        <Button small icon={Save} onClick={() => void save()} loading={busy} disabled={!parsed.ok || text === initial}>
          Kaydet
        </Button>
      </div>
    </div>
  );
}
