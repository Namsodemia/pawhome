"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ArrowUp,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  HeartPulse,
  ListChecks,
  Presentation,
  Siren,
  Stethoscope,
  ChevronRight,
  Copy,
  KeyRound,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ChatMsg } from "@/lib/types";
import { useStore } from "@/lib/store";
import { aiMode, MODELS, quotaMessage, subscribeAiConfig, type AiMode } from "@/lib/ai/client";
import { cx, fmtTime } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";
import { AiQuotaBadge, AiQuotaWarning, useAiQuota } from "@/components/AiQuota";
import { confirmDialog, toast } from "@/components/feedback";
import { Markdown } from "./Markdown";
import { ActionCard } from "./ActionCard";
import { decide, resetSession, sendMessage, stopStreaming, useAsistan } from "./session";
import { useRol, type Rol } from "@/lib/roles";

type Cap = { icon: LucideIcon; color: string; title: string; text: string };

const ROL_ICERIK: Record<Rol, { chips: string[]; examples: string[]; caps: Cap[]; intro: string; note: string | null }> = {
  osgb: {
    chips: [
      "Bu ay kasa durumu nasıl?",
      "Borçlu firmaları listele",
      "Hizmet bazında özet ver",
      "6331 sayılı kanunda işverenin yükümlülükleri neler?",
      "Risk değerlendirmesi ne sıklıkla yenilenir?",
    ],
    examples: ["Yasin kasasına 1.500 TL kırtasiye gideri gir", "Atlas Metal'den 2.000 TL nakit tahsilat al"],
    caps: [
      { icon: Wallet, color: "#107398", title: "Kasa / Cari", text: "Bakiyeler, aylık gelir-gider; tek veya toplu gelir/gider kaydı." },
      { icon: ReceiptText, color: "#0B6F7B", title: "Tahsilat", text: "Firmadan tek veya toplu tahsilat; kalan borç düşer, kasaya yansır." },
      { icon: UserPlus, color: "#5CBD7D", title: "Firma kaydı", text: "Tek veya liste hâlinde firma ekler; aynı vergi no + hizmet atlanır." },
      { icon: ShieldCheck, color: "#F4772E", title: "Risk ve olaylar", text: "Risk analizleri, kaza / ramak kala ve denetim özetleri." },
      { icon: BookOpen, color: "#1E3145", title: "Mevzuat", text: "6331, RD Yönetmeliği, 5x5 matris ve İSG yükümlülükleri." },
    ],
    intro: 'Kasa, firma ve risk verilerinizi görür; kayıt girer, tahsilat işler, mevzuat sorularını yanıtlar. "Yasin kasasına 1.500 TL kırtasiye gideri gir" diyebilirsiniz.',
    note: "Kayıt işlemleri yalnızca onay kartında “Onayla” dediğinizde uygulanır.",
  },
  uzman: {
    chips: [
      "En yüksek riskli maddelerimi özetle",
      "Son kaza için 5 Neden analizi yap",
      "Yüksekte çalışma için kontrol listesi hazırla",
      "Tehlikeli sınıfta çalışan eğitimi kaç saat?",
      "Acil durum planında neler olmalı?",
    ],
    examples: ["Denetimlerde en sık uygunsuzluk ne?", "SGK'ya bildirilmemiş kazalarım var mı?"],
    caps: [
      { icon: ShieldCheck, color: "#5CBD7D", title: "Risk değerlendirme", text: "Analizlerinizi okur; kritik maddeler ve önlem önerileri." },
      { icon: Siren, color: "#D6334C", title: "Kaza araştırması", text: "Kök neden (5 Neden, balık kılçığı) ve düzeltici faaliyet önerisi." },
      { icon: ClipboardCheck, color: "#3AA466", title: "Denetim", text: "Uygunluk sonuçları ve kontrol listesi hazırlama." },
      { icon: BookOpen, color: "#1E3145", title: "Mevzuat", text: "6331 ve yönetmeliklerdeki süre, sayı ve yükümlülükler." },
    ],
    intro: "Risk analizlerinizi, olay ve denetim kayıtlarınızı görür; kök neden analizi, önlem ve mevzuat sorularında yardım eder.",
    note: null,
  },
  hekim: {
    chips: [
      "Muayenesi geciken çalışanları listele",
      "Gürültülü işte hangi tetkikler yapılmalı?",
      "Meslek hastalığı şüphesinde bildirim süreci nasıl?",
      "Çok tehlikeli işte periyodik muayene sıklığı?",
      "İşe dönüş muayenesinde nelere bakılır?",
    ],
    examples: ["Bu ay muayenesi gelen çalışanlar kimler?", "Kaynakçılar için tetkik planı öner"],
    caps: [
      { icon: Stethoscope, color: "#D6334C", title: "Sağlık gözetimi", text: "Geciken / yaklaşan muayeneler ve tetkik planı." },
      { icon: Siren, color: "#F4772E", title: "Meslek hastalığı", text: "Şüphe, bildirim ve iş kazası sonrası süreç." },
      { icon: ShieldCheck, color: "#5CBD7D", title: "Risk ve maruziyet", text: "Risk analizlerine göre sağlık riskleri." },
      { icon: BookOpen, color: "#1E3145", title: "Mevzuat", text: "İşyeri hekimi görev ve süreleri, periyotlar." },
    ],
    intro: "Muayene kayıtlarınızı ve olayları görür; periyodik muayene, tetkik planı, meslek hastalığı ve mevzuat sorularında yardım eder. Klinik karar sizindir.",
    note: null,
  },
  dsp: {
    chips: [
      "İlk yardım dolabında neler bulunmalı?",
      "Bu ay periyodik muayenesi gelenleri hatırlat",
      "Çalışanlara sağlık eğitimi konuları öner",
      "Kaç ilk yardımcı bulundurmalıyız?",
      "İş kazası sonrası ilk müdahale ve kayıt adımları neler?",
    ],
    examples: ["Muayenesi geciken çalışanları listele", "Kaynak atölyesi için ilk yardım planı öner"],
    caps: [
      { icon: Stethoscope, color: "#D6334C", title: "Muayene takibi", text: "Yaklaşan / geciken periyodik muayeneler ve hatırlatma listesi." },
      { icon: HeartPulse, color: "#B5467B", title: "İlk yardım", text: "İlk yardım dolabı, ilk yardımcı sayısı ve acil müdahale adımları." },
      { icon: Siren, color: "#F4772E", title: "Kaza kayıtları", text: "İş kazası ve ramak kala özetleri, SGK bildirim süreleri." },
      { icon: Presentation, color: "#E0812B", title: "Sağlık eğitimi", text: "Çalışan sağlığı eğitim konuları ve kısa sunum taslakları." },
      { icon: BookOpen, color: "#1E3145", title: "Mevzuat", text: "Diğer sağlık personelinin görevleri, çalışma süreleri ve ilgili yönetmelikler." },
    ],
    intro:
      "Muayene ve olay kayıtlarınızı görür; periyodik muayene takvimi, ilk yardım, iş kazası kayıtları ve çalışan sağlığı eğitimlerinde yardım eder. Tıbbi kararlar işyeri hekimiyle birlikte verilir.",
    note: null,
  },
  ogrenci: {
    chips: [
      "Risk değerlendirmesi konusunu özetle",
      "Bana 5 soruluk mini sınav yap",
      "Tehlike sınıflarına göre süreleri tablo yap",
      "Zayıf olduğum dersleri çalışalım",
      "İSG kurulu kimlerden oluşur?",
    ],
    examples: ["6331'de çalışan temsilcisi sayıları nedir?", "KKD kategorilerini örnekle anlat"],
    caps: [
      { icon: GraduationCap, color: "#6C5CE7", title: "Konu anlatımı", text: "Sade, örnekli anlatım ve özet tablolar." },
      { icon: ListChecks, color: "#107398", title: "Mini sınav", text: "Çoktan seçmeli sorular ve açıklamalı cevaplar." },
      { icon: ShieldCheck, color: "#5CBD7D", title: "Zayıf konular", text: "Deneme sonuçlarınıza göre çalışma önerisi." },
      { icon: BookOpen, color: "#1E3145", title: "Mevzuat", text: "Ezberlenmesi gereken süre ve sayılar." },
    ],
    intro: "Deneme sonuçlarınızı görür; konu anlatır, örnek soru sorar, ezberlenmesi gereken süre ve sayıları tablo hâlinde verir.",
    note: null,
  },
};

const EFFORT_LABEL: Record<string, string> = { low: "düşük", medium: "orta", high: "yüksek" };

export default function AsistanPage() {
  const rol = useRol();
  const { chips: CHIPS, examples: EXAMPLES, caps: CAPABILITIES, note } = ROL_ICERIK[rol];
  const chat = useStore((s) => s.chat);
  const clearChat = useStore((s) => s.clearChat);
  const model = useStore((s) => s.settings.model);
  const effort = useStore((s) => s.settings.effort);
  const busy = useAsistan((s) => s.busy);
  const streamText = useAsistan((s) => s.streamText);
  const pending = useAsistan((s) => s.pending);

  const [mode, setMode] = useState<AiMode | "loading">("loading");
  const quota = useAiQuota();
  const [text, setText] = useState("");
  const [limit, setLimit] = useState(40);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    let alive = true;
    const upd = () => {
      void aiMode().then((m) => {
        if (alive) setMode(m);
      });
    };
    upd();
    const unsub = subscribeAiConfig(upd);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  // Yeni mesaj / onay kartı / akış geldiğinde en alta kaydır
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: mounted.current ? "smooth" : "auto" });
    mounted.current = true;
  }, [chat.length, pending, busy]);
  useEffect(() => {
    if (streamText) endRef.current?.scrollIntoView({ block: "end" });
  }, [streamText]);

  const visible = chat.slice(-limit);
  const hidden = chat.length - visible.length;
  const modelLabel = MODELS.find((m) => m.id === model)?.label ?? model;

  function autoGrow() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }

  async function send(q?: string) {
    const t = (q ?? text).trim();
    if (!t || busy) return;
    if (quota.kind === "bitti") {
      toast(quotaMessage(quota.limit), "error");
      return;
    }
    if (mode === "none") {
      toast("Asistan için Ayarlar'dan API anahtarı girin.", "error");
      return;
    }
    setText("");
    requestAnimationFrame(autoGrow);
    await sendMessage(t);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  async function clear() {
    if (!chat.length && !pending) return;
    const ok = await confirmDialog({ title: "Sohbeti temizle", text: "Tüm mesajlar silinecek.", okLabel: "Temizle", danger: true });
    if (!ok) return;
    resetSession();
    clearChat();
    setLimit(40);
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-6">
      <div className="mx-auto flex min-h-[calc(100dvh-11.5rem)] w-full min-w-0 max-w-3xl flex-col">
        <PageHeader
          title="Asistan"
          subtitle="Canlı verinize dayanarak yanıtlar; kayıtları onayınızla işler."
          actions={quota.kind === "left" ? <AiQuotaBadge left={quota.left} limit={quota.limit} /> : undefined}
        />

        {quota.kind === "bitti" ? (
          <AiQuotaWarning limit={quota.limit} className="mb-4" />
        ) : mode === "none" ? (
          <Link
            href="/app/ayarlar"
            className="mb-4 flex items-center gap-3 rounded-2xl border border-[#F3DFA9] bg-soft-warn px-4 py-3 text-[14px] font-bold text-warn transition hover:brightness-[.98]"
          >
            <KeyRound size={18} className="shrink-0" />
            <span className="flex-1">Asistan için Ayarlar&apos;dan API anahtarı girin.</span>
            <ChevronRight size={18} className="shrink-0" />
          </Link>
        ) : null}

        <div className="flex-1 space-y-3 pb-4">
          {hidden > 0 ? (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setLimit((l) => l + 40)}
                className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-muted hover:text-navy"
              >
                Daha eski mesajları göster ({hidden})
              </button>
            </div>
          ) : null}

          {chat.length === 0 && !busy ? <Welcome onPick={(c) => void send(c)} disabled={busy} /> : null}

          {visible.map((m) => (
            <Bubble key={m.id} m={m} />
          ))}

          {streamText ? (
            <BotRow>
              <div className="relative">
                <Markdown text={streamText} />
                <span className="ml-0.5 inline-block h-4 w-[3px] translate-y-0.5 animate-pulse rounded-full bg-brand-blue align-middle" />
              </div>
            </BotRow>
          ) : busy && !pending ? (
            <BotRow>
              <span className="flex items-center gap-2 py-0.5 text-[13.5px] text-muted">
                <span className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-brand-blue/70" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
                Asistan yazıyor…
              </span>
            </BotRow>
          ) : null}

          {pending ? (
            <div className="space-y-3">
              {pending.tools.map((t) => (
                <ActionCard key={t.id} tool={t} decision={pending.decisions[t.id]} disabled={busy} onDecide={(d) => decide(t.id, d)} />
              ))}
            </div>
          ) : null}

          <div ref={endRef} className="scroll-mb-[190px] lg:scroll-mb-[120px]" />
        </div>

        {/* Mesaj çubuğu */}
        <div className="sticky bottom-[calc(92px+env(safe-area-inset-bottom))] z-20 lg:bottom-5">
          <div className="flex items-end gap-2 rounded-[24px] border border-line bg-white/95 p-2 shadow-bar backdrop-blur">
            <button
              type="button"
              onClick={() => void clear()}
              aria-label="Sohbeti temizle"
              title="Sohbeti temizle"
              disabled={busy}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-muted transition hover:bg-soft-danger hover:text-danger disabled:opacity-40"
            >
              <Trash2 size={19} />
            </button>
            <textarea
              ref={taRef}
              value={text}
              rows={1}
              onChange={(e) => {
                setText(e.target.value);
                autoGrow();
              }}
              onKeyDown={onKeyDown}
              placeholder="Mesaj yazın…"
              aria-label="Mesaj yazın"
              className="max-h-[168px] min-h-[44px] flex-1 resize-none rounded-2xl bg-paper px-4 py-[11px] text-[15px] leading-[22px] text-ink outline-none transition placeholder:text-[#9AA6B2] focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
            />
            {busy && !pending ? (
              <button
                type="button"
                onClick={stopStreaming}
                aria-label="Durdur"
                title="Durdur"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-white shadow-card transition hover:bg-navy-deep"
              >
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void send()}
                disabled={busy || !text.trim()}
                aria-label="Gönder"
                title="Gönder (Enter)"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-fab transition hover:brightness-105 active:scale-95 disabled:opacity-45 disabled:shadow-none"
              >
                <ArrowUp size={20} strokeWidth={2.6} />
              </button>
            )}
          </div>
          <div className="mt-1.5 hidden text-center text-[11px] text-[#9AA6B2] sm:block">
            Enter gönderir · Shift+Enter yeni satır · Kayıt işlemleri onayınız olmadan yapılmaz
          </div>
        </div>
      </div>

      {/* Masaüstü yan panel */}
      <aside className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <Card>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
                <Sparkles size={18} />
              </span>
              <div className="text-[15px] font-extrabold text-navy">Neler yapabilir?</div>
            </div>
            <ul className="mt-3 space-y-3">
              {CAPABILITIES.map((c) => {
                const Icon = c.icon;
                return (
                  <li key={c.title} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${c.color}1A`, color: c.color }}>
                      <Icon size={15} strokeWidth={2.4} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-ink">{c.title}</span>
                      <span className="block text-[12px] leading-snug text-muted">{c.text}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            {note ? <div className="mt-4 rounded-xl bg-soft-green px-3 py-2 text-[12px] font-semibold leading-snug text-brand-teal">{note}</div> : null}
          </Card>

          <Card>
            <div className="section-label">Örnek komutlar</div>
            <div className="mt-3 flex flex-col gap-1.5">
              {[...EXAMPLES, ...CHIPS.slice(0, 3)].map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(c)}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-left text-[12.5px] font-semibold text-brand-teal transition hover:border-brand-blue/40 hover:bg-paper disabled:opacity-50"
                >
                  {c}
                </button>
              ))}
            </div>
          </Card>

          <div className="px-1 text-[12px] text-muted">
            Model: <span className="font-bold text-navy">{modelLabel}</span> · çaba {EFFORT_LABEL[effort] ?? effort}
            <br />
            <Link href="/app/ayarlar" className="font-bold text-brand-blue hover:underline">
              Yapay zekâ ayarları
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Welcome({ onPick, disabled }: { onPick: (c: string) => void; disabled?: boolean }) {
  const rol = useRol();
  const { chips: CHIPS, intro } = ROL_ICERIK[rol];
  return (
    <div className="flex flex-col items-center px-2 py-8 text-center md:py-12">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-fab">
        <Sparkles size={28} />
      </span>
      <div className="mt-3 text-[21px] font-extrabold text-navy">İsgora Asistan</div>
      <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-muted">{intro}</p>
      <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => onPick(c)}
            className="rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-bold text-brand-teal shadow-card transition hover:-translate-y-0.5 hover:border-brand-blue/40 disabled:opacity-50"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function BotRow({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex items-end gap-2">
      <span className="mb-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <Sparkles size={15} />
      </span>
      <div className="min-w-0 max-w-[88%]">
        <div className="rounded-[20px] rounded-bl-md border border-line bg-white px-4 py-2.5 text-[14.5px] leading-[1.6] text-text shadow-card">{children}</div>
        <div className="mt-1 flex h-4 items-center gap-2 pl-1 text-[11px] text-[#9AA6B2]">{footer}</div>
      </div>
    </div>
  );
}

function Bubble({ m }: { m: ChatMsg }) {
  if (m.role === "user") {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] rounded-br-md bg-[linear-gradient(135deg,#0B6F7B,#107398)] px-4 py-2.5 text-[14.5px] leading-[1.55] text-white shadow-card">
          {m.content}
        </div>
        <div className="num mt-1 pr-1 text-[11px] text-[#9AA6B2]">{fmtTime(m.created_at)}</div>
      </div>
    );
  }
  if (m.role === "system") {
    const ok = m.content.startsWith("✅");
    const warn = m.content.startsWith("⚠️");
    return (
      <div className="flex justify-center">
        <div
          className={cx(
            "max-w-[92%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-center text-[13px] font-semibold leading-relaxed",
            ok ? "bg-soft-green text-success" : warn ? "bg-soft-warn text-warn" : "bg-paper text-muted",
          )}
        >
          {m.content}
        </div>
      </div>
    );
  }
  return <AssistantBubble m={m} />;
}

function AssistantBubble({ m }: { m: ChatMsg }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(m.content);
      toast("Yanıt kopyalandı.", "info");
    } catch {
      toast("Kopyalanamadı.", "error");
    }
  }
  return (
    <div className="group">
      <BotRow
        footer={
          <>
            <span className="num">{fmtTime(m.created_at)}</span>
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex items-center gap-1 rounded-md font-semibold opacity-0 transition hover:text-navy focus:opacity-100 group-hover:opacity-100"
            >
              <Copy size={12} /> Kopyala
            </button>
          </>
        }
      >
        <Markdown text={m.content} />
      </BotRow>
    </div>
  );
}
