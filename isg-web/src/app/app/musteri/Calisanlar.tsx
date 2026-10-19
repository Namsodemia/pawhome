"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CircleCheck, CloudOff, Copy, Mail, Phone, RefreshCw, Search, SearchX, UserPlus, UsersRound, X } from "lucide-react";
import { Avatar, Badge, Button, Card, Chips, Empty, Fab, Loading, Section, Stat } from "@/components/ui";
import { toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx, fmtDateTime, norm } from "@/lib/format";
import type { Calisan, CalisanRol } from "@/lib/api";
import { CalisanForm, type GirisBilgisi } from "./CalisanForm";
import { ATAMALAR, ROL_RENK, ROL_TONE, ekipYukle, panoyaKopyala, rolEtiket, rolKisa, useEkip } from "./ortak";

/**
 * Müşteri Takip › Çalışanlar: OSGB'nin kendi İGU / İH / DSP çalışanları için giriş hesapları.
 * Hesaplar sunucuda tutulur (?r=ekip); arka uç yoksa bu bölüm çalışmaz.
 * `yeniKey` değişince (ör. ?sekme=calisanlar&yeni=1) yeni çalışan formu açılır.
 */
export function Calisanlar({ yeniKey }: { yeniKey: number }) {
  const { sunucu, ekip, durum, hata } = useEkip();
  const firmalar = useStore((s) => s.kursiyerler);
  const [rolF, setRolF] = useState<CalisanRol | "">("");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<{ key: number; calisan: Calisan | null } | null>(null);
  const [giris, setGiris] = useState<GirisBilgisi | null>(null);

  // sekme her açıldığında listeyi tazele (başka cihazda eklenen / giriş yapan çalışanlar)
  useEffect(() => {
    if (sunucu) void ekipYukle();
  }, [sunucu]);

  useEffect(() => {
    if (yeniKey && sunucu) setForm({ key: yeniKey, calisan: null });
  }, [yeniKey, sunucu]);

  const firmaAdlari = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const k of firmalar) {
      if (!k.is_active) continue;
      for (const a of ATAMALAR) {
        const cid = k[a.alan];
        if (!cid) continue;
        const arr = m.get(cid) ?? [];
        if (!arr.includes(k.full_name)) arr.push(k.full_name);
        m.set(cid, arr);
      }
    }
    return m;
  }, [firmalar]);

  const sayilar = useMemo(() => {
    const c: Record<CalisanRol, number> = { uzman: 0, hekim: 0, dsp: 0 };
    for (const x of ekip) c[x.rol] += 1;
    return c;
  }, [ekip]);

  const list = useMemo(() => {
    const n = norm(q);
    return ekip
      .filter((c) => (!rolF || c.rol === rolF) && (!n || norm(`${c.ad_soyad} ${c.eposta} ${c.telefon} ${rolKisa(c.rol)}`).includes(n)))
      .sort((a, b) => Number(b.aktif) - Number(a.aktif) || a.ad_soyad.localeCompare(b.ad_soyad, "tr"));
  }, [ekip, q, rolF]);

  const yeni = () => setForm({ key: Date.now(), calisan: null });

  if (!sunucu) {
    return (
      <Empty
        icon={CloudOff}
        title="Çalışan hesapları için sunucu bağlantısı gerekir"
        text="İGU, İH ve DSP çalışanlarınıza e-posta ve şifreyle giriş hesabı açmak için İsgora'nın sunucu (PHP) kurulumu gerekir. Yerel moddayken firmalar ve tahsilatlar bu tarayıcıda kaydedilmeye devam eder."
      />
    );
  }

  return (
    <div>
      {giris ? <GirisKarti g={giris} onClose={() => setGiris(null)} /> : null}

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Stat label="Çalışan" value={ekip.length} sub={`${ekip.filter((c) => c.aktif).length} aktif`} />
        {ATAMALAR.map((a) => (
          <Stat key={a.rol} label={a.kisa} value={sayilar[a.rol]} tone={ROL_TONE[a.rol]} sub={a.ad} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2.5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ad, e-posta, telefon…"
            className="field !pl-10 !pr-10 shadow-card"
            aria-label="Çalışan ara"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Aramayı temizle"
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-paper hover:text-navy"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
        <Button icon={UserPlus} onClick={yeni} className="hidden md:inline-flex">
          Çalışan Ekle
        </Button>
      </div>

      <Chips
        scroll
        className="mt-3"
        value={rolF}
        onChange={setRolF}
        options={[{ value: "" as const, label: `Tümü (${ekip.length})` }, ...ATAMALAR.map((a) => ({ value: a.rol, label: `${a.kisa} (${sayilar[a.rol]})` }))]}
      />

      <Section
        label="Çalışan hesapları"
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void ekipYukle()}
              className="inline-flex items-center gap-1 text-[12px] font-bold text-brand-blue hover:underline"
              aria-label="Listeyi yenile"
            >
              <RefreshCw size={13} className={cx(durum === "yukleniyor" && "animate-spin")} /> Yenile
            </button>
            <span className="num text-[11.5px] text-muted">{list.length} kişi</span>
          </div>
        }
      >
        {durum === "hata" && !ekip.length ? (
          <Empty
            icon={CloudOff}
            title="Çalışan listesi alınamadı"
            text={hata || "Sunucuya ulaşılamadı."}
            action={
              <Button kind="secondary" icon={RefreshCw} onClick={() => void ekipYukle()}>
                Tekrar dene
              </Button>
            }
          />
        ) : (durum === "bos" || durum === "yukleniyor") && !ekip.length ? (
          <Loading text="Çalışanlar yükleniyor…" />
        ) : !ekip.length ? (
          <Empty
            icon={UsersRound}
            title="Henüz çalışan hesabı yok"
            text="İş Sağlığı ve Güvenliği Uzmanı (İGU), İşyeri Hekimi (İH) ve Diğer Sağlık Personeli (DSP) çalışanlarınız için giriş hesabı açın; sonra firmalara atayın. Çalışan, kendisine atanan firmaları kendi hesabında görür."
            action={
              <Button icon={UserPlus} onClick={yeni}>
                Çalışan Ekle
              </Button>
            }
          />
        ) : !list.length ? (
          <Empty icon={SearchX} title="Sonuç yok" text="Aramanıza uyan çalışan bulunamadı." />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {list.map((c) => (
              <CalisanKart key={c.id} c={c} firmalar={firmaAdlari.get(c.id) ?? []} onClick={() => setForm({ key: Date.now(), calisan: c })} />
            ))}
          </div>
        )}
      </Section>

      <Fab label="Çalışan Ekle" icon={UserPlus} onClick={yeni} />

      {form ? <CalisanForm key={form.key} calisan={form.calisan} onClose={() => setForm(null)} onGiris={setGiris} /> : null}
    </div>
  );
}

function CalisanKart({ c, firmalar, onClick }: { c: Calisan; firmalar: string[]; onClick: () => void }) {
  const p = c.profil ?? {};
  const ek = [c.rol === "uzman" && p.uzmanlik_sinifi ? `${p.uzmanlik_sinifi} sınıfı` : "", c.rol === "dsp" ? p.meslek ?? "" : "", p.belge_no ? `Belge ${p.belge_no}` : ""].filter(Boolean);
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <Card onClick={onClick} className={cx(!c.aktif && "bg-paper/60")}>
      <div className="flex items-start gap-3">
        <span className={cx(!c.aktif && "opacity-50 grayscale")}>
          <Avatar name={c.ad_soyad} color={ROL_RENK[c.rol]} size={44} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 truncate text-[15px] font-extrabold text-navy">{c.ad_soyad}</div>
            <Badge tone={c.aktif ? "green" : "gray"} className="!py-0.5">
              {c.aktif ? "Aktif" : "Pasif"}
            </Badge>
          </div>
          <Badge tone={ROL_TONE[c.rol]} className="mt-1 !whitespace-normal !py-0.5 text-left">
            {rolEtiket(c.rol)}
          </Badge>
          {ek.length ? <div className="mt-1 truncate text-[12px] text-muted">{ek.join(" · ")}</div> : null}

          <div className="mt-2.5 flex flex-col gap-1 text-[13px]">
            <a href={`mailto:${c.eposta}`} onClick={stop} className="inline-flex min-w-0 items-center gap-1.5 text-brand-blue hover:underline">
              <Mail size={14} className="shrink-0" />
              <span className="truncate">{c.eposta}</span>
            </a>
            {c.telefon ? (
              <a href={`tel:${c.telefon.replace(/[^\d+]/g, "")}`} onClick={stop} className="num inline-flex items-center gap-1.5 text-text hover:text-brand-blue">
                <Phone size={14} className="shrink-0" />
                {c.telefon}
              </a>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-2.5 text-[12px] text-muted">
            <span className="num">{c.son_giris ? `Son giriş: ${fmtDateTime(c.son_giris)}` : "Henüz giriş yapmadı"}</span>
            <span
              className={cx("inline-flex items-center gap-1 font-bold", firmalar.length ? "text-brand-teal" : "text-muted")}
              title={firmalar.length ? firmalar.join("\n") : "Hiçbir firmaya atanmadı"}
            >
              <Building2 size={13} /> {firmalar.length ? `${firmalar.length} firma` : "Atanmadı"}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function GirisKarti({ g, onClose }: { g: GirisBilgisi; onClose: () => void }) {
  const adres = typeof window !== "undefined" ? `${window.location.origin}/giris.php` : "/giris.php";
  const metin =
    `İsgora giriş bilgileri\n` +
    `Çalışan: ${g.ad_soyad} — ${rolEtiket(g.rol)}\n` +
    `Giriş adresi: ${adres}\n` +
    `E-posta: ${g.eposta}\n` +
    `Şifre: ${g.sifre}`;

  async function kopyala() {
    if (await panoyaKopyala(metin)) toast("Giriş bilgileri kopyalandı.");
    else toast("Kopyalanamadı; bilgileri elle seçip kopyalayın.", "error");
  }

  return (
    <Card className="mb-5 border-success/30 bg-soft-green/30">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success text-white">
          <CircleCheck size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold text-navy">{g.yeni ? "Hesap oluşturuldu — giriş bilgileri" : "Şifre güncellendi — yeni giriş bilgileri"}</div>
          <div className="mt-0.5 text-[12.5px] leading-relaxed text-muted">Şifre bir daha gösterilmez. Bu bilgileri şimdi kopyalayıp çalışanınıza iletin.</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-white hover:text-navy">
          <X size={17} />
        </button>
      </div>
      <dl className="mt-3 space-y-2 rounded-2xl border border-line/70 bg-white px-4 py-3 text-[13.5px]">
        <Satir label="Çalışan">
          {g.ad_soyad} <span className="text-muted">· {rolKisa(g.rol)}</span>
        </Satir>
        <Satir label="E-posta" mono>
          {g.eposta}
        </Satir>
        <Satir label="Şifre" mono>
          <span className="select-all font-bold">{g.sifre}</span>
        </Satir>
        <Satir label="Giriş adresi" mono>
          <span className="select-all break-all">{adres}</span>
        </Satir>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button small icon={Copy} onClick={() => void kopyala()}>
          Kopyala
        </Button>
        <a
          href={`mailto:${g.eposta}?subject=${encodeURIComponent("İsgora giriş bilgileriniz")}&body=${encodeURIComponent(metin)}`}
          className="inline-flex h-9 select-none items-center justify-center gap-2 rounded-2xl bg-soft-blue px-3.5 text-[13px] font-bold text-brand-blue transition hover:bg-[#d6eaf4] active:scale-[.98]"
        >
          <Mail size={15} strokeWidth={2.4} /> E-postayla gönder
        </a>
      </div>
    </Card>
  );
}

function Satir({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-3">
      <dt className="text-[11.5px] font-bold uppercase tracking-wider text-muted">{label}</dt>
      <dd className={cx("min-w-0 break-words text-ink", mono && "num")}>{children}</dd>
    </div>
  );
}
