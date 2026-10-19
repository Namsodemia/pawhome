"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Building2,
  CalendarDays,
  CloudOff,
  Copy,
  KeyRound,
  Link2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  School,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Loading } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { useSync } from "@/lib/sync";
import { ApiError, sinifDavetLinki, sinifKodGetir, sinifKodUret, sinifOgrenciCikar, sinifOgrencileri, type SinifOgrenci } from "@/lib/api";
import { cx, fmtDate, upperTR } from "@/lib/format";
import { normPhone, prettyPhone } from "@/lib/phone";
import type { Sinif, Uye } from "@/lib/types";
import { copyText } from "./common";

/** Sınıfın uygulamadan katılım durumu: katılım kodu + kodla katılan öğrenciler (sunucudan). */
export interface Katilim {
  /** useSync.backend: true → sunucu var; false → yerel mod; null → henüz bilinmiyor */
  backend: boolean | null;
  loading: boolean;
  error: string | null;
  /** undefined → yüklenmedi; null → kod yok */
  kod: string | null | undefined;
  ogrenciler: SinifOgrenci[];
  /** Kod oluşturuluyor / yenileniyor */
  busy: boolean;
  reload: () => Promise<void>;
  uret: (yenile: boolean) => Promise<boolean>;
  cikar: (o: SinifOgrenci) => Promise<boolean>;
}

function errMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : "Beklenmeyen bir hata oluştu.";
}

/** Yeni oluşturulan sınıf henüz sunucuya yazılıyorsa (otomatik kayıt) bitmesini kısa bir süre bekler. */
function waitSynced(ms = 6000): Promise<void> {
  return new Promise((resolve) => {
    if (useSync.getState().status !== "saving") {
      resolve();
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      unsub();
      resolve();
    };
    const t = setTimeout(finish, ms);
    const unsub = useSync.subscribe((s) => {
      if (s.status !== "saving") finish();
    });
  });
}

export function useKatilim(sinifId: number | null): Katilim {
  const backend = useSync((s) => s.backend);
  const [kod, setKod] = useState<string | null | undefined>(undefined);
  const [ogrenciler, setOgrenciler] = useState<SinifOgrenci[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  const enabled = backend === true && sinifId != null && Number.isFinite(sinifId);

  const reload = useCallback(async () => {
    if (!enabled || sinifId == null) return;
    const my = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const [k, list] = await Promise.all([sinifKodGetir(sinifId), sinifOgrencileri(sinifId)]);
      if (my !== seq.current) return;
      setKod(k);
      setOgrenciler(list);
    } catch (e) {
      if (my !== seq.current) return;
      setError(errMsg(e));
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [enabled, sinifId]);

  useEffect(() => {
    setKod(undefined);
    setOgrenciler([]);
    setError(null);
    void reload();
  }, [reload]);

  const uret = useCallback(
    async (yenile: boolean) => {
      if (!enabled || sinifId == null) return false;
      setBusy(true);
      try {
        await waitSynced();
        const k = await sinifKodUret(sinifId, yenile);
        setKod(k);
        setError(null);
        return true;
      } catch (e) {
        toast(errMsg(e), "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [enabled, sinifId],
  );

  const cikar = useCallback(
    async (o: SinifOgrenci) => {
      if (!enabled || sinifId == null) return false;
      try {
        await sinifOgrenciCikar(sinifId, o.id);
        setOgrenciler((cur) => cur.filter((x) => x.id !== o.id));
        return true;
      } catch (e) {
        toast(errMsg(e), "error");
        return false;
      }
    },
    [enabled, sinifId],
  );

  return { backend, loading, error, kod, ogrenciler, busy, reload, uret, cikar };
}

/** Üye panelindeki "Uygulamadan katılım" bölümü (OSGB tarafı). */
export function AppJoinPanel({ sinif, uyeler, katilim }: { sinif: Sinif; uyeler: Uye[]; katilim: Katilim }) {
  const bulkAddUye = useStore((s) => s.bulkAddUye);
  const { backend, loading, error, kod, ogrenciler, busy } = katilim;

  const phoneSet = useMemo(() => new Set(uyeler.map((u) => u.telefon).filter((p): p is string => !!p)), [uyeler]);
  const eklenecek = useMemo(
    () =>
      ogrenciler
        .map((o) => ({ o, p: normPhone(o.telefon) }))
        .filter((x): x is { o: SinifOgrenci; p: string } => !!x.p && !phoneSet.has(x.p)),
    [ogrenciler, phoneSet],
  );

  if (backend !== true) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-paper px-4 py-4">
        <CloudOff size={20} className="mt-0.5 shrink-0 text-muted" />
        <div className="min-w-0">
          <div className="text-[14px] font-extrabold text-navy">Uygulamadan katılım</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">Uygulamadan katılım için sunucu bağlantısı gerekir.</p>
        </div>
      </div>
    );
  }

  const link = kod ? sinifDavetLinki(kod) : "";
  const waText = kod ? `${sinif.ad} sınıfına İsgora'dan katılın: ${link} (kod: ${kod})` : "";

  async function copy(text: string, ok: string) {
    if (await copyText(text)) toast(ok);
    else toast("Panoya kopyalanamadı.", "error");
  }

  async function yenile() {
    const ok = await confirmDialog({
      title: "Kodu yenile",
      text: "Eski kod ve davet bağlantısı geçersiz olur; yeni öğrenciler yalnızca yeni kodla katılabilir. Sınıfa katılmış öğrenciler etkilenmez.",
      okLabel: "Yenile",
      danger: true,
    });
    if (!ok) return;
    if (await katilim.uret(true)) toast("Yeni katılım kodu oluşturuldu.");
  }

  async function olustur() {
    if (await katilim.uret(false)) toast("Katılım kodu oluşturuldu.");
  }

  async function cikar(o: SinifOgrenci) {
    const ok = await confirmDialog({
      title: "Sınıftan çıkar",
      text: `${o.ad_soyad || o.eposta} sınıftan çıkarılacak ve duyuruları artık görmeyecek. Kodla yeniden katılabilir; bunu önlemek için kodu yenileyin.`,
      okLabel: "Çıkar",
      danger: true,
    });
    if (!ok) return;
    if (await katilim.cikar(o)) toast(`${o.ad_soyad || o.eposta} sınıftan çıkarıldı.`);
  }

  function telefonListesineEkle() {
    if (!eklenecek.length) return;
    const r = bulkAddUye(
      sinif.id,
      eklenecek.map(({ o, p }) => ({ ad: o.ad_soyad.trim() || prettyPhone(p), telefon: p })),
    );
    toast(`${r.ok} öğrenci telefon listesine eklendi.${r.skip ? ` ${r.skip} kişi zaten vardı.` : ""}`);
  }

  return (
    <div className="mt-4">
      <div className="text-[15px] font-extrabold text-navy">Uygulamadan katılım</div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
        Öğrenciler kayıt olurken ya da Sınıfım sayfasından bu kodu girerek sınıfa katılır; bu sınıfa gönderdiğiniz mesajları uygulamada duyuru olarak görür.
      </p>

      {/* ---------------- kod */}
      {kod === undefined && !error ? (
        <Loading />
      ) : kod === undefined ? (
        <div className="mt-3 rounded-2xl bg-soft-danger px-4 py-3">
          <div className="text-[13px] font-semibold text-danger">{error}</div>
          <Button small kind="white" icon={RefreshCw} className="mt-2.5" onClick={() => void katilim.reload()}>
            Tekrar dene
          </Button>
        </div>
      ) : kod ? (
        <div className="mt-3 rounded-2xl border border-line/70 bg-brandSoft p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-muted">Katılım kodu</span>
            <button
              type="button"
              onClick={() => void yenile()}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-bold text-muted transition hover:bg-white hover:text-navy disabled:opacity-50"
            >
              <RefreshCw size={13} className={busy ? "animate-spin" : undefined} /> Kodu yenile
            </button>
          </div>
          <div className="mt-1 select-all break-all font-mono text-[34px] font-extrabold leading-tight tracking-[0.2em] text-navy" aria-label={`Katılım kodu ${kod.split("").join(" ")}`}>
            {kod}
          </div>
          <div className="mt-3 space-y-2">
            <Button small kind="white" block icon={Copy} onClick={() => void copy(kod, "Kod kopyalandı.")}>
              Kodu kopyala
            </Button>
            <Button small kind="white" block icon={Link2} onClick={() => void copy(link, "Davet bağlantısı kopyalandı.")}>
              Davet bağlantısını kopyala
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-full select-none items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#25D366,#128C7E)] px-3.5 text-[13px] font-bold text-white shadow-card transition hover:brightness-105 active:scale-[.98]"
            >
              <MessageCircle size={15} strokeWidth={2.4} /> WhatsApp ile paylaş
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-line bg-paper/60 px-4 py-5 text-center">
          <School size={22} className="mx-auto text-brand-blue" />
          <div className="mt-2 text-[13.5px] font-bold text-navy">Bu sınıfın katılım kodu yok</div>
          <div className="mt-0.5 text-[12.5px] text-muted">Kodu oluşturup öğrencilerle paylaşın.</div>
          <Button small icon={KeyRound} className="mt-3" loading={busy} onClick={() => void olustur()}>
            Katılım kodu oluştur
          </Button>
        </div>
      )}

      {/* ---------------- kodla katılan öğrenciler */}
      {kod !== undefined ? (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0 text-[14px] font-extrabold text-navy">
              Uygulamadan katılan öğrenciler <span className="num font-bold text-muted">({ogrenciler.length})</span>
            </div>
            <button
              type="button"
              onClick={() => void katilim.reload()}
              disabled={loading}
              aria-label="Listeyi yenile"
              title="Listeyi yenile"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-brand-blue transition hover:bg-soft-blue disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : undefined} />
            </button>
          </div>

          {error ? <div className="mb-2 rounded-xl bg-soft-danger px-3 py-2 text-[12.5px] font-semibold text-danger">{error}</div> : null}

          {eklenecek.length ? (
            <div className="mb-2.5">
              <Button small kind="secondary" block icon={UserPlus} onClick={telefonListesineEkle}>
                Telefon listesine ekle ({eklenecek.length})
              </Button>
              <div className="mt-1 text-[11.5px] leading-snug text-muted">Telefonu olup WhatsApp/SMS üye listesinde olmayan öğrenciler üyelere eklenir.</div>
            </div>
          ) : null}

          {ogrenciler.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-paper/60 px-4 py-5 text-center text-[12.5px] leading-relaxed text-muted">
              Henüz uygulamadan katılan öğrenci yok.{kod ? " Kodu paylaştığınızda katılanlar burada görünür." : ""}
            </div>
          ) : (
            <div className="space-y-1.5">
              {ogrenciler.map((o) => {
                const p = normPhone(o.telefon);
                const listede = !!p && phoneSet.has(p);
                return (
                  <div key={o.id} className="flex items-start gap-2.5 rounded-2xl border border-line/70 bg-white p-2.5 shadow-card">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soft-blue text-[14px] font-extrabold text-brand-blue">
                      {upperTR((o.ad_soyad || o.eposta).trim().slice(0, 1)) || "?"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13.5px] font-bold text-navy">{o.ad_soyad || "Adsız öğrenci"}</span>
                        {listede ? (
                          <Badge tone="teal" className="!px-1.5 !py-0 !text-[10px]">
                            listede
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-0.5 space-y-0.5 text-[11.5px] text-muted">
                        {o.eposta ? (
                          <Meta icon={Mail}>
                            <span className="truncate">{o.eposta}</span>
                          </Meta>
                        ) : null}
                        <Meta icon={Phone}>
                          <span className={cx("num", !o.telefon && "text-[#9AA6B2]")}>{o.telefon ? (p ? prettyPhone(p) : o.telefon) : "telefon yok"}</span>
                        </Meta>
                        {o.kurum ? (
                          <Meta icon={Building2}>
                            <span className="truncate">{o.kurum}</span>
                          </Meta>
                        ) : null}
                        <Meta icon={CalendarDays}>
                          <span>
                            Katılma: <span className="num">{fmtDate(o.katilma)}</span>
                          </span>
                        </Meta>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void cikar(o)}
                      aria-label={`${o.ad_soyad || o.eposta} sınıftan çıkar`}
                      title="Sınıftan çıkar"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-danger hover:bg-soft-danger"
                    >
                      <X size={17} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Meta({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Icon size={12} className="shrink-0 text-[#9AA6B2]" />
      {children}
    </div>
  );
}

/** "Üyeler" listesinin üstündeki kısa özet satırı: dokununca "Uygulamadan katılım" bölümüne geçer. */
export function AppJoinTeaser({ katilim, onOpen }: { katilim: Katilim; onOpen: () => void }) {
  if (katilim.backend !== true || katilim.kod === undefined) return null;
  const n = katilim.ogrenciler.length;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mb-3 flex w-full items-center gap-2.5 rounded-2xl border border-line/70 bg-brandSoft px-3 py-2.5 text-left transition hover:border-brand-blue/40"
    >
      <School size={18} className="shrink-0 text-brand-blue" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-navy">
          {katilim.kod ? (
            <>
              Katılım kodu <span className="font-mono tracking-wider">{katilim.kod}</span>
            </>
          ) : (
            "Uygulamadan katılım"
          )}
        </span>
        <span className="block truncate text-[11.5px] text-muted">
          {katilim.kod ? (n ? `${n} öğrenci uygulamadan katıldı` : "Henüz uygulamadan katılan yok") : "Öğrenciler kodla katılıp duyuruları görsün"}
        </span>
      </span>
      <span className="shrink-0 text-[12px] font-bold text-brand-blue">{katilim.kod ? "Yönet" : "Kod oluştur"}</span>
    </button>
  );
}
