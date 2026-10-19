"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode, Suspense } from "react";
import {
  ArrowRight,
  Bookmark,
  CheckCheck,
  ChevronLeft,
  ClipboardCopy,
  Copy,
  CornerUpLeft,
  ExternalLink,
  Info,
  MessageCircle,
  MessageSquareText,
  MessagesSquare,
  Monitor,
  Pencil,
  RotateCcw,
  School,
  SendHorizontal,
  Trash2,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { AvatarStack, Button, ButtonLink, Empty, Field, Input, Sheet, Loading } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx, fmtTime } from "@/lib/format";
import type { Mesaj, MesajKanal, Uye } from "@/lib/types";
import { ColorPicker, copyText, dayLabel } from "../_parts/common";
import { MembersPanel, type UyeMode } from "../_parts/Members";
import { useKatilim } from "../_parts/AppJoin";

const WA_GREEN = "#25D366";
const KANAL: { v: MesajKanal; label: string; icon: LucideIcon; color: string }[] = [
  { v: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: WA_GREEN },
  { v: "sms", label: "SMS", icon: MessageSquareText, color: "#1B8ECF" },
  { v: "not", label: "Sadece kaydet", icon: Bookmark, color: "#6E7C8C" },
];

type SmsPlatform = "ios" | "android" | null;

function smsPlatform(): SmsPlatform {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return null;
}

/** Toplu SMS bağlantısı: iOS `sms:/open?addresses=…&body=`, Android ve diğerleri `sms:+90…,+90…?body=`. */
function smsLink(phones: string[], body: string, p: SmsPlatform): string {
  const enc = encodeURIComponent(body);
  if (p === "ios") return `sms:/open?addresses=${phones.map((x) => encodeURIComponent("+" + x)).join(",")}&body=${enc}`;
  return `sms:${phones.map((x) => "+" + x).join(",")}?body=${enc}`;
}

function waUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function isDesktop(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
}

function SinifChatPageView() {
  const params = { id: useSearchParams().get("id") ?? "" };
  const sid = Number(params?.id);
  const router = useRouter();

  const sinif = useStore((s) => s.siniflar.find((x) => x.id === sid));
  const allUyeler = useStore((s) => s.uyeler);
  const allMesajlar = useStore((s) => s.mesajlar);
  const addMesaj = useStore((s) => s.addMesaj);
  const deleteMesaj = useStore((s) => s.deleteMesaj);
  const updateSinif = useStore((s) => s.updateSinif);
  const deleteSinif = useStore((s) => s.deleteSinif);

  const uyeler = useMemo(() => allUyeler.filter((u) => u.sinif_id === sid).sort((a, b) => a.ad.localeCompare(b.ad, "tr")), [allUyeler, sid]);
  const msgs = useMemo(() => allMesajlar.filter((m) => m.sinif_id === sid).sort((a, b) => a.id - b.id), [allMesajlar, sid]);
  const withPhone = useMemo(() => uyeler.filter((u): u is Uye & { telefon: string } => !!u.telefon), [uyeler]);
  const phones = withPhone.map((u) => u.telefon);

  const [text, setText] = useState("");
  const [kanal, setKanal] = useState<MesajKanal>("whatsapp");
  const [wa, setWa] = useState<{ queue: (Uye & { telefon: string })[]; i: number; text: string } | null>(null);
  const [smsPanel, setSmsPanel] = useState<{ text: string; phones: string[] } | null>(null);
  const [mode, setMode] = useState<UyeMode>("liste");
  const [membersOpen, setMembersOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuId, setMenuId] = useState<number | null>(null);
  const deleting = useRef(false);
  const katilim = useKatilim(sinif ? sid : null);
  const appN = katilim.ogrenciler.length;

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // ?uyeler=yapistir → üye yönetimini doğrudan o modda aç
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const m = sp.get("uyeler");
    if (m === "yapistir" || m === "tek" || m === "musteri" || m === "liste" || m === "uygulama") {
      setMode(m);
      if (!isDesktop()) setMembersOpen(true);
      sp.delete("uyeler");
      window.history.replaceState(null, "", `${window.location.pathname}?${sp.toString()}`);
    }
  }, []);

  // yeni mesaj / WhatsApp sırası / SMS kartı değişince en alta kaydır
  const waStep = wa ? wa.i : -1;
  const smsOpen = smsPanel !== null;
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs.length, waStep, smsOpen]);

  // textarea otomatik yükseklik
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 168)}px`;
  }, [text]);

  if (!sinif) {
    if (deleting.current) return null;
    return (
      <Empty
        icon={MessagesSquare}
        title="Sınıf bulunamadı"
        text="Bu sınıf silinmiş olabilir."
        action={
          <ButtonLink href="/app/siniflar" small>
            Sınıflara dön
          </ButtonLink>
        }
      />
    );
  }

  const k = KANAL.find((x) => x.v === kanal)!;

  function openWa(u: Uye & { telefon: string }, t: string) {
    const w = window.open(waUrl(u.telefon, t), "_blank");
    if (w) {
      try {
        w.opener = null;
      } catch {
        /* yok say */
      }
    } else {
      toast("Tarayıcı yeni sekmeyi engelledi. Açılır pencerelere izin verip “Tekrar aç”a basın.", "error");
    }
  }

  function waNext() {
    if (!wa) return;
    const i = wa.i + 1;
    if (i >= wa.queue.length) {
      setWa(null);
      toast(`WhatsApp sırası tamamlandı · ${wa.queue.length} kişi.`);
      return;
    }
    setWa({ ...wa, i });
    openWa(wa.queue[i], wa.text);
  }

  function send() {
    const t = text.trim();
    if (!t || !sinif) return;
    if (kanal === "not") {
      addMesaj(sid, t, "not", 0);
      setText("");
      return;
    }
    if (!phones.length) {
      if (katilim.kod) {
        // Yalnızca uygulamadan katılanlar varsa: kanalı "Sadece kaydet"e al, metin yerinde kalsın
        setKanal("not");
        toast("Sınıfta telefon numarası olan üye yok. Kanal “Sadece kaydet” yapıldı; gönderdiğinizde uygulamadaki öğrenciler görür.", "info");
        return;
      }
      toast("Sınıfta telefon numarası olan üye yok. Üyeler bölümünden numara yükleyin.", "error");
      setMode("yapistir");
      if (!isDesktop()) setMembersOpen(true);
      return;
    }
    if (kanal === "sms") {
      const p = smsPlatform();
      addMesaj(sid, t, "sms", phones.length);
      setText("");
      if (p) {
        window.location.href = smsLink(phones, t, p);
      } else {
        setSmsPanel({ text: t, phones: [...phones] });
      }
      return;
    }
    // WhatsApp: önce kaydet, sonra ilk kişiyi tıklama anında aç (açılır pencere engelleyicileri için)
    const q = [...withPhone];
    addMesaj(sid, t, "whatsapp", q.length);
    setText("");
    setSmsPanel(null);
    setWa({ queue: q, i: 0, text: t });
    openWa(q[0], t);
  }

  async function copyAll() {
    const ok = await copyText(uyeler.map((u) => `${u.ad}\t${u.telefon ? "+" + u.telefon : ""}`).join("\n"));
    if (ok) toast(`${uyeler.length} kişi panoya kopyalandı.`);
    else toast("Panoya kopyalanamadı.", "error");
  }

  async function removeMsg(m: Mesaj) {
    setMenuId(null);
    const ok = await confirmDialog({ title: "Mesajı sil", text: "Geçmişten silinecek (gönderilenler geri alınmaz).", okLabel: "Sil", danger: true });
    if (ok) deleteMesaj(m.id);
  }

  async function removeSinif() {
    if (!sinif) return;
    const ok = await confirmDialog({ title: "Sınıfı sil", text: `${sinif.ad} ve tüm üyeleri/mesajları silinecek.`, okLabel: "Sil", danger: true });
    if (!ok) return;
    deleting.current = true;
    const ad = sinif.ad;
    deleteSinif(sid);
    toast(`${ad} silindi.`);
    router.replace("/app/siniflar");
  }

  const hint =
    kanal === "whatsapp"
      ? `${phones.length} kişiye WhatsApp ile tek tek açılır`
      : kanal === "sms"
        ? `${phones.length} kişiye toplu SMS`
        : katilim.kod
          ? "WhatsApp/SMS gönderilmez; uygulamadaki öğrenciler görür"
          : "Kimseye gönderilmez, geçmişe not düşer";

  const subLine = sinif.aciklama || uyeler.map((u) => u.ad.split(" ")[0]).join(", ") || "Üye eklemek için dokunun";

  const membersPanel = (onDone?: () => void) => (
    <MembersPanel sinif={sinif} uyeler={uyeler} mode={mode} setMode={setMode} onDone={onDone} katilim={katilim} />
  );
  const appLine = appN ? <> · <span className="num">{appN}</span> uygulamada</> : null;

  let lastDay = "";

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* ------------------------------------------------ sohbet */}
      <section className="flex h-[calc(100dvh-196px)] min-h-[480px] flex-col overflow-hidden rounded-xl2 border border-line/70 bg-white shadow-card lg:h-[calc(100dvh-112px)]">
        {/* başlık */}
        <header className="flex items-center gap-2.5 border-b border-line px-3 py-3 md:px-4">
          <Link href="/app/siniflar" aria-label="Sınıflara dön" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-paper hover:text-navy">
            <ChevronLeft size={20} />
          </Link>
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ background: `linear-gradient(135deg, ${sinif.renk} 0%, #1E3145 100%)` }}
          >
            <Users size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[16px] font-extrabold text-navy md:text-[17px]">{sinif.ad}</h1>
            <div className="truncate text-[12px] text-muted">
              <span className="num">{uyeler.length}</span> üye · <span className="num">{phones.length}</span> numaralı
              {appLine}
              {sinif.aciklama ? <span className="hidden lg:inline"> · {sinif.aciklama}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <HeaderBtn icon={Copy} label="Üyeleri kopyala" onClick={() => void copyAll()} disabled={!uyeler.length} />
            <HeaderBtn icon={Pencil} label="Sınıfı düzenle" onClick={() => setEditOpen(true)} />
            <HeaderBtn icon={Trash2} label="Sınıfı sil" tone="danger" onClick={() => void removeSinif()} />
          </div>
        </header>

        {/* mobil: üye çubuğu */}
        <button
          type="button"
          onClick={() => setMembersOpen(true)}
          className="flex items-center gap-3 border-b border-line bg-white px-4 py-2.5 text-left transition hover:bg-paper lg:hidden"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-bold text-navy">
              {uyeler.length} üye · {phones.length} numaralı
              {appLine}
            </div>
            <div className="truncate text-[12px] text-muted">{subLine}</div>
          </div>
          {uyeler.length ? <AvatarStack names={uyeler.map((u) => u.ad)} max={3} color={sinif.renk} /> : <UserPlus size={18} className="text-brand-blue" />}
        </button>

        {/* mesajlar */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-paper px-3 py-4 md:px-5" onClick={() => setMenuId(null)}>
          {msgs.length === 0 ? (
            <div className="mx-auto flex max-w-sm flex-col items-center px-4 py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-brandSoft text-brand-blue">
                <MessagesSquare size={28} />
              </span>
              <div className="mt-3 text-[17px] font-extrabold text-navy">{sinif.ad} sohbeti</div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Buraya yazdığınız duyuru, seçtiğiniz kanalla sınıftaki herkese gider. Gönderdikleriniz burada sohbet geçmişi olarak kalır.
              </p>
              {!uyeler.length ? (
                <Button
                  small
                  kind="secondary"
                  icon={UserPlus}
                  className="mt-4"
                  onClick={() => {
                    setMode("yapistir");
                    if (!isDesktop()) setMembersOpen(true);
                  }}
                >
                  Üye ekle
                </Button>
              ) : null}
            </div>
          ) : null}

          {msgs.map((m) => {
            const dk = dayLabel(m.created_at);
            const showDay = dk !== lastDay;
            lastDay = dk;
            const kk = KANAL.find((x) => x.v === m.kanal) ?? KANAL[2];
            return (
              <Fragment key={m.id}>
                {showDay ? (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-muted shadow-card">{dk}</span>
                  </div>
                ) : null}
                <Bubble
                  m={m}
                  icon={kk.icon}
                  menuOpen={menuId === m.id}
                  onMenu={() => setMenuId(m.id)}
                  onCopy={async () => {
                    setMenuId(null);
                    if (await copyText(m.metin)) toast("Mesaj kopyalandı.");
                  }}
                  onReuse={() => {
                    setMenuId(null);
                    setText(m.metin);
                    taRef.current?.focus();
                  }}
                  onDelete={() => void removeMsg(m)}
                />
              </Fragment>
            );
          })}

          {wa ? (
            <div className="mx-auto mt-3 max-w-md animate-slide-up rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} style={{ color: WA_GREEN }} />
                <div className="text-[14px] font-extrabold text-navy">
                  WhatsApp sırası · <span className="num">{wa.i + 1}/{wa.queue.length}</span>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(((wa.i + 1) / wa.queue.length) * 100)}%`, background: WA_GREEN }} />
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-text">
                Şimdi: <b className="text-navy">{wa.queue[wa.i].ad}</b>. WhatsApp&apos;ta Gönder&apos;e basıp bu sekmeye dönün, ardından Sıradaki&apos;ye dokunun.
              </p>
              <div className="mt-3 flex gap-2">
                <Button small kind="ghost" icon={RotateCcw} onClick={() => openWa(wa.queue[wa.i], wa.text)}>
                  Tekrar aç
                </Button>
                <Button small icon={ArrowRight} className="flex-1" onClick={waNext}>
                  {wa.i + 1 >= wa.queue.length ? "Bitir" : "Sıradaki"}
                </Button>
                <Button small kind="danger" onClick={() => setWa(null)}>
                  İptal
                </Button>
              </div>
            </div>
          ) : null}

          {smsPanel ? (
            <div className="mx-auto mt-3 max-w-md animate-slide-up rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-center gap-2">
                <Monitor size={18} className="text-brand-blueBright" />
                <div className="flex-1 text-[14px] font-extrabold text-navy">Toplu SMS · {smsPanel.phones.length} kişi</div>
                <button type="button" aria-label="Kapat" onClick={() => setSmsPanel(null)} className="rounded-lg p-1 text-muted hover:bg-paper hover:text-navy">
                  <X size={16} />
                </button>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-text">
                Bu cihazda SMS uygulaması yok. Numaraları ve mesajı kopyalayıp telefonunuza veya SMS paneline yapıştırın. Telefonda açınca toplu SMS ekranı doğrudan gelir.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  small
                  kind="secondary"
                  icon={ClipboardCopy}
                  onClick={async () => {
                    if (await copyText(smsPanel.phones.map((p) => "+" + p).join("\n"))) toast(`${smsPanel.phones.length} numara kopyalandı.`);
                  }}
                >
                  Numaraları kopyala
                </Button>
                <Button
                  small
                  kind="secondary"
                  icon={Copy}
                  onClick={async () => {
                    if (await copyText(smsPanel.text)) toast("Mesaj kopyalandı.");
                  }}
                >
                  Mesajı kopyala
                </Button>
                <a
                  href={smsLink(smsPanel.phones, smsPanel.text, "android")}
                  className="inline-flex h-9 items-center gap-1.5 rounded-2xl px-3 text-[12.5px] font-bold text-muted hover:bg-paper hover:text-navy"
                >
                  <ExternalLink size={14} /> SMS uygulamasında aç
                </a>
              </div>
            </div>
          ) : null}
        </div>

        {/* yazma alanı */}
        <div className="border-t border-line bg-white px-3 pb-3 pt-2.5 md:px-4">
          <div className="scroll-x mb-2 flex gap-1.5 overflow-x-auto">
            {KANAL.map((x) => {
              const on = kanal === x.v;
              const Icon = x.icon;
              return (
                <button
                  key={x.v}
                  type="button"
                  onClick={() => setKanal(x.v)}
                  className={cx(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 text-[12.5px] font-semibold transition",
                    on ? "text-white" : "border-line bg-white text-text hover:bg-paper",
                  )}
                  style={on ? { background: x.color, borderColor: x.color } : undefined}
                  aria-pressed={on}
                >
                  <Icon size={14} style={on ? undefined : { color: x.color }} />
                  {x.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={`${sinif.ad} sınıfına yaz…`}
              className="max-h-[168px] min-h-[46px] flex-1 resize-none rounded-[22px] border-[1.5px] border-line bg-[#FAFCFD] px-4 py-3 text-[15px] leading-snug text-ink outline-none transition placeholder:text-[#A2AEBB] focus:border-brand-blue focus:bg-white"
            />
            <button
              type="button"
              onClick={send}
              disabled={!text.trim()}
              aria-label={kanal === "not" ? "Kaydet" : "Gönder"}
              title={kanal === "not" ? "Kaydet" : "Gönder"}
              className={cx(
                "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full text-white shadow-fab transition active:scale-95 disabled:opacity-40",
                kanal === "whatsapp" ? "bg-[linear-gradient(135deg,#25D366,#128C7E)]" : "bg-brand",
              )}
            >
              {kanal === "not" ? <Bookmark size={18} /> : <SendHorizontal size={19} />}
            </button>
          </div>
          <div className="mt-1.5 text-center text-[11px] text-muted">
            {hint} · {k.label}
            <span className="hidden md:inline"> · Enter gönderir, Shift+Enter yeni satır</span>
          </div>
          {katilim.kod ? (
            <div className="mt-1 flex items-center justify-center gap-1 text-center text-[11px] font-semibold text-brand-teal">
              <School size={12} className="shrink-0" />
              {appN
                ? `Uygulamadan katılan ${appN} öğrenci bu mesajları Sınıfım sayfasında duyuru olarak görür.`
                : "Kodla katılan öğrenciler bu mesajları uygulamada duyuru olarak görür."}
            </div>
          ) : null}
          <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-[#9AA6B2]">
            <Info size={12} /> Duyurular tek yönlüdür; yanıtlar WhatsApp/SMS üzerinden gelir.
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ üyeler (masaüstü) */}
      <aside className="hidden h-[calc(100dvh-112px)] min-h-[480px] flex-col overflow-hidden rounded-xl2 border border-line/70 bg-white shadow-card lg:flex">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold text-navy">Üyeler</div>
            <div className="truncate text-[12px] text-muted">
              {uyeler.length} üye · {phones.length} numaralı
              {appLine}
            </div>
          </div>
          {uyeler.length ? <AvatarStack names={uyeler.map((u) => u.ad)} max={3} color={sinif.renk} /> : null}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{membersPanel()}</div>
      </aside>

      {/* mobil üye yönetimi */}
      <Sheet open={membersOpen} onClose={() => setMembersOpen(false)} title={`${sinif.ad} · Üyeler`}>
        {membersPanel(() => setMembersOpen(false))}
      </Sheet>

      <EditSheet
        key={editOpen ? "open" : "closed"}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={{ ad: sinif.ad, aciklama: sinif.aciklama, renk: sinif.renk }}
        onSave={(v) => {
          updateSinif(sid, v.ad, v.aciklama, v.renk);
          setEditOpen(false);
          toast("Sınıf güncellendi.");
        }}
      />
    </div>
  );
}

function HeaderBtn({ icon: Icon, label, onClick, tone, disabled }: { icon: LucideIcon; label: string; onClick: () => void; tone?: "danger"; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx(
        "flex h-9 w-9 items-center justify-center rounded-xl transition disabled:opacity-40",
        tone === "danger" ? "text-danger hover:bg-soft-danger" : "text-brand-blue hover:bg-soft-blue",
      )}
    >
      <Icon size={18} />
    </button>
  );
}

function Bubble({
  m,
  icon: Icon,
  menuOpen,
  onMenu,
  onCopy,
  onReuse,
  onDelete,
}: {
  m: Mesaj;
  icon: LucideIcon;
  menuOpen: boolean;
  onMenu: () => void;
  onCopy: () => void;
  onReuse: () => void;
  onDelete: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  return (
    <div className="group mb-2 flex items-end justify-end gap-1.5">
      <div className={cx("flex items-center gap-0.5 rounded-xl bg-white p-0.5 shadow-card transition", menuOpen ? "opacity-100" : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100")}>
        <MsgAction icon={Copy} label="Kopyala" onClick={onCopy} />
        <MsgAction icon={CornerUpLeft} label="Tekrar kullan" onClick={onReuse} />
        <MsgAction icon={Trash2} label="Sil" onClick={onDelete} danger />
      </div>
      <div
        className="relative max-w-[86%] select-text overflow-hidden rounded-[20px] rounded-br-md bg-brand px-3.5 py-2.5 text-white shadow-card md:max-w-[72%]"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onMenu();
        }}
        onTouchStart={() => {
          clear();
          timer.current = setTimeout(onMenu, 450);
        }}
        onTouchEnd={clear}
        onTouchMove={clear}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="whitespace-pre-wrap break-words text-[14.5px] leading-[1.45]">{m.metin}</div>
        <div className="mt-1.5 flex items-center justify-end gap-1 text-[10.5px] font-semibold text-white/90">
          <Icon size={11} />
          <span>
            {m.kanal === "not" ? "not" : `${m.alici_sayisi} kişi`} · <span className="num">{fmtTime(m.created_at)}</span>
          </span>
          {m.kanal !== "not" ? <CheckCheck size={13} className="text-white" /> : null}
        </div>
      </div>
    </div>
  );
}

function MsgAction({ icon: Icon, label, onClick, danger }: { icon: LucideIcon; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={cx("flex h-7 w-7 items-center justify-center rounded-lg transition", danger ? "text-danger hover:bg-soft-danger" : "text-muted hover:bg-paper hover:text-navy")}
    >
      <Icon size={14} />
    </button>
  );
}

function EditSheet({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: { ad: string; aciklama: string; renk: string };
  onSave: (v: { ad: string; aciklama: string; renk: string }) => void;
}) {
  const [ad, setAd] = useState(initial.ad);
  const [aciklama, setAciklama] = useState(initial.aciklama);
  const [renk, setRenk] = useState(initial.renk);
  const [err, setErr] = useState<string | null>(null);
  const save = () => {
    if (!ad.trim()) {
      setErr("Sınıf adı girin.");
      return;
    }
    onSave({ ad, aciklama, renk });
  };
  const footer: ReactNode = (
    <div className="flex gap-2">
      <Button kind="ghost" onClick={onClose}>
        Vazgeç
      </Button>
      <Button className="flex-1" onClick={save}>
        Kaydet
      </Button>
    </div>
  );
  return (
    <Sheet open={open} onClose={onClose} title="Sınıfı düzenle" footer={footer}>
      <div className="space-y-4">
        <Field label="Sınıf adı" error={err}>
          <Input
            value={ad}
            onChange={(e) => {
              setAd(e.target.value);
              if (err) setErr(null);
            }}
            onKeyDown={(e) => (e.key === "Enter" ? save() : null)}
            placeholder="A Sınıfı · Aralık 2026"
            maxLength={80}
            autoFocus
          />
        </Field>
        <Field label="Açıklama (isteğe bağlı)">
          <Input value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Eğitim yeri, saat, eğitmen…" maxLength={160} />
        </Field>
        <ColorPicker value={renk} onChange={setRenk} />
      </div>
    </Sheet>
  );
}

export default function SinifChatPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SinifChatPageView />
    </Suspense>
  );
}
