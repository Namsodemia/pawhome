"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Infinity as InfinityIcon, Lock, RotateCcw, Search, SearchX, Sparkles, Undo2, Unlock, Users, X } from "lucide-react";
import { Avatar, Badge, Button, Chips, Empty, Field, Input, Loading, PageHeader, ProgressBar, Sheet, Stat } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { cx, norm } from "@/lib/format";
import { useSync } from "@/lib/sync";
import { ROLLER, rolBilgi } from "@/lib/roles";
import { kullaniciDurum, kullaniciHak, kullanicilar, type HakIslem, type YonetimKullanici } from "@/lib/api";

/** Yönetici: kullanıcılar ve yapay zekâ soru hakları. Hak ekle / belirle / sınırsız yap / sıfırla, hesabı kapat-aç. */
export default function KullanicilarPage() {
  const yonetici = useSync((s) => s.yonetici);
  const backend = useSync((s) => s.backend);
  const [list, setList] = useState<YonetimKullanici[] | null>(null);
  const [varsayilan, setVarsayilan] = useState(4);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [rol, setRol] = useState<string>("");
  const [sel, setSel] = useState<number | null>(null);

  const load = useCallback(() => {
    kullanicilar()
      .then((j) => {
        setList(j.kullanicilar);
        setVarsayilan(j.varsayilan);
        setErr(null);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (backend && yonetici) load();
  }, [backend, yonetici, load]);

  const replace = (u: YonetimKullanici) => setList((l) => (l ? l.map((x) => (x.id === u.id ? u : x)) : l));

  const filtered = useMemo(() => {
    if (!list) return [];
    const n = norm(q);
    return list.filter((u) => {
      if (rol === "_yonetici" ? !u.yonetici : rol && u.rol !== rol) return false;
      if (n && !norm(`${u.ad_soyad} ${u.eposta} ${u.telefon} ${u.kurum} ${u.osgb?.ad ?? ""}`).includes(n)) return false;
      return true;
    });
  }, [list, q, rol]);

  const stats = useMemo(() => {
    const l = list ?? [];
    return {
      n: l.length,
      used: l.reduce((t, u) => t + u.ai.used, 0),
      bitti: l.filter((u) => !u.ai.unlimited && u.ai.used >= u.ai.limit).length,
      ozel: l.filter((u) => u.ai.ozel).length,
    };
  }, [list]);

  if (backend === null) return <Loading />;
  if (!backend || !yonetici) {
    return (
      <div>
        <Header />
        <Empty icon={Lock} title="Bu sayfa yalnızca site yöneticisine açık" text="Kullanıcılara yapay zekâ hakkı tanımak için yönetici hesabıyla giriş yapın." />
      </div>
    );
  }

  const secili = list?.find((u) => u.id === sel) ?? null;

  return (
    <div>
      <Header />
      {err ? <div className="mb-4 rounded-2xl bg-soft-danger px-3.5 py-3 text-[13px] font-semibold text-danger">{err}</div> : null}
      {!list ? (
        <Loading text="Kullanıcılar yükleniyor…" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <Stat label="Kullanıcı" value={<span className="num">{stats.n}</span>} />
            <Stat label="Kullanılan soru" value={<span className="num">{stats.used}</span>} tone="blue" />
            <Stat label="Hakkı biten" value={<span className="num">{stats.bitti}</span>} tone={stats.bitti ? "orange" : "navy"} />
            <Stat label="Özel hak tanınan" value={<span className="num">{stats.ozel}</span>} tone="green" />
          </div>
          <div className="mt-3 rounded-2xl bg-soft-blue px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-brand-blue">
            Varsayılan hak: her hesaba <span className="num">{varsayilan}</span> soru. Bir asistan sorusu, bir risk analizinin tamamı ya da bir “AI ile güçlendir” 1 hak
            sayılır. Varsayılanı <Link href="/app/ayarlar/" className="underline underline-offset-2">Ayarlar › Sunucu ayarları</Link>&apos;ndan değiştirebilirsiniz.
          </div>

          <div className="mt-4 relative">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ad, e-posta, telefon, kurum…" className="field !pl-10 !pr-10 shadow-card" aria-label="Kullanıcı ara" />
            {q ? (
              <button type="button" onClick={() => setQ("")} aria-label="Aramayı temizle" className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-paper">
                <X size={16} />
              </button>
            ) : null}
          </div>
          <Chips
            scroll
            className="mt-3"
            value={rol}
            onChange={setRol}
            options={[
              { value: "", label: `Tümü (${list.length})` },
              ...ROLLER.map((r) => ({ value: r.id, label: `${r.kisa} (${list.filter((u) => u.rol === r.id).length})` })),
            ]}
          />

          <div className="mt-4 space-y-2">
            {filtered.length === 0 ? (
              <Empty icon={list.length ? SearchX : Users} title={list.length ? "Sonuç yok" : "Henüz kullanıcı yok"} />
            ) : (
              filtered.map((u) => <Satir key={u.id} u={u} onOpen={() => setSel(u.id)} />)
            )}
          </div>
        </>
      )}
      {secili ? <Detay u={secili} varsayilan={varsayilan} onClose={() => setSel(null)} onChange={replace} /> : null}
    </div>
  );
}

function Header() {
  return (
    <>
      <Link href="/app/ayarlar/" className="mb-2 inline-flex items-center gap-1 text-[13px] font-bold text-muted hover:text-brand-blue">
        <ChevronLeft size={16} /> Ayarlar
      </Link>
      <PageHeader title="Kullanıcılar ve haklar" subtitle="Yapay zekâ soru hakkı tanıyın, hesapları yönetin" />
    </>
  );
}

function hakMetni(u: YonetimKullanici): string {
  if (u.yonetici) return "Yönetici · sınırsız";
  if (u.ai.unlimited) return u.ai.ozel === "sinirsiz" ? "Sınırsız (siz tanıdınız)" : "Sınırsız (yöneticinin OSGB çalışanı)";
  return `${u.ai.used} / ${u.ai.limit} soru kullandı`;
}

function Satir({ u, onOpen }: { u: YonetimKullanici; onOpen: () => void }) {
  const r = rolBilgi(u.rol);
  const bitti = !u.ai.unlimited && u.ai.used >= u.ai.limit;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={u.yonetici}
      className={cx(
        "flex w-full items-center gap-3 rounded-2xl border border-line/70 bg-white p-3 text-left shadow-card transition",
        u.yonetici ? "cursor-default" : "hover:-translate-y-0.5 hover:shadow-bar",
        !u.aktif && "opacity-60",
      )}
    >
      <Avatar name={u.ad_soyad || u.eposta} color={r.renk} size={42} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[14.5px] font-bold text-ink">{u.ad_soyad || u.eposta}</span>
          {u.yonetici ? <Badge tone="navy">Yönetici</Badge> : null}
          {!u.aktif ? <Badge tone="red">Kapalı</Badge> : null}
          {!u.dogrulandi ? <Badge tone="warn">E-posta doğrulanmadı</Badge> : null}
          {u.ai.ozel === "limit" ? <Badge tone="green">Özel hak</Badge> : null}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-muted">
          {r.kisa}
          {u.osgb ? ` · ${u.osgb.ad}` : u.kurum ? ` · ${u.kurum}` : ""} · {u.eposta}
        </span>
        <span className={cx("mt-0.5 block text-[11.5px] font-bold sm:hidden", bitti ? "text-danger" : u.ai.unlimited ? "text-success" : "text-navy")}>{hakMetni(u)}</span>
      </span>
      <span className="hidden w-[190px] shrink-0 sm:block">
        <span className={cx("block text-right text-[12px] font-bold", bitti ? "text-danger" : u.ai.unlimited ? "text-success" : "text-navy")}>{hakMetni(u)}</span>
        {!u.ai.unlimited ? <ProgressBar value={u.ai.limit ? Math.min(100, (u.ai.used / u.ai.limit) * 100) : 100} tone={bitti ? "danger" : "brand"} className="mt-1.5 !h-1.5" /> : null}
      </span>
      {!u.yonetici ? <ChevronRight size={16} className="shrink-0 text-muted/60" /> : null}
    </button>
  );
}

function tarih(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Detay({ u, varsayilan, onClose, onChange }: { u: YonetimKullanici; varsayilan: number; onClose: () => void; onChange: (u: YonetimKullanici) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [belirle, setBelirle] = useState(String(u.ai.limit));
  useEffect(() => setBelirle(String(u.ai.limit)), [u.ai.limit]);
  const kalan = Math.max(0, u.ai.limit - u.ai.used);

  async function hak(h: HakIslem, tag: string, msg: string) {
    setBusy(tag);
    try {
      onChange(await kullaniciHak(u.id, h));
      toast(msg);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function durum() {
    if (u.aktif) {
      const ok = await confirmDialog({ title: "Hesabı kapat", text: `${u.ad_soyad || u.eposta} giriş yapamaz; verileri silinmez. Sonra yeniden açabilirsiniz.`, okLabel: "Kapat", danger: true });
      if (!ok) return;
    }
    setBusy("durum");
    try {
      onChange(await kullaniciDurum(u.id, !u.aktif));
      toast(u.aktif ? "Hesap kapatıldı." : "Hesap açıldı.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Sheet open onClose={onClose} title={u.ad_soyad || u.eposta}>
      <div className="space-y-5">
        <div className="rounded-2xl border border-line bg-paper/50 p-3.5 text-[12.5px] leading-relaxed text-text">
          <div className="font-bold text-navy">{rolBilgi(u.rol).ad}</div>
          <div className="mt-1 break-words text-muted">
            {u.eposta}
            {u.telefon ? ` · ${u.telefon}` : ""}
            {u.osgb ? ` · Bağlı OSGB: ${u.osgb.ad}` : u.kurum ? ` · ${u.kurum}` : ""}
          </div>
          <div className="mt-1 text-muted">
            Kayıt: {tarih(u.olusturma)} · Son giriş: {tarih(u.son_giris)}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-[13px] font-extrabold text-navy">
            <Sparkles size={16} className="text-brand-blue" /> Yapay zekâ hakkı
          </div>
          <div className="rounded-2xl border border-line p-3.5">
            {u.ai.unlimited ? (
              <div className="text-[14px] font-bold text-success">{hakMetni(u)}</div>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="num text-[24px] font-extrabold text-navy">
                    {kalan} <span className="text-[13px] font-bold text-muted">soru kaldı</span>
                  </span>
                  <span className="num text-[12.5px] text-muted">
                    {u.ai.used} / {u.ai.limit} kullandı{u.ai.ozel === "limit" ? " · özel hak" : ` · varsayılan ${varsayilan}`}
                  </span>
                </div>
                <ProgressBar value={u.ai.limit ? Math.min(100, (u.ai.used / u.ai.limit) * 100) : 100} tone={kalan ? "brand" : "danger"} className="mt-2" />
              </>
            )}
            {!u.ai.aktif ? <div className="mt-2 text-[12px] font-semibold text-warn">Ortak Claude anahtarı tanımlı değil; haklar anahtar girilince kullanılabilir.</div> : null}
          </div>

          <div className="mt-3 text-[12px] font-bold text-muted">Hak ekle</div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {[1, 5, 10, 50].map((n) => (
              <Button key={n} kind="secondary" small onClick={() => void hak({ islem: "ekle", deger: n }, `+${n}`, `${n} soru hakkı eklendi.`)} loading={busy === `+${n}`} disabled={!!busy}>
                +{n}
              </Button>
            ))}
          </div>

          <form
            className="mt-3 grid grid-cols-[1fr_auto] items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Math.max(0, Math.floor(Number(belirle)));
              if (!Number.isFinite(n)) return;
              void hak({ islem: "belirle", deger: n }, "belirle", `Toplam hak ${n} soru olarak belirlendi.`);
            }}
          >
            <Field label="Toplam hakkı belirle (kullandıkları dahil)">
              <Input type="number" inputMode="numeric" min={0} value={belirle} onChange={(e) => setBelirle(e.target.value)} />
            </Field>
            <Button type="submit" small loading={busy === "belirle"} disabled={!!busy}>
              Kaydet
            </Button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {u.ai.ozel === "sinirsiz" ? (
              <Button kind="secondary" small icon={InfinityIcon} onClick={() => void hak({ islem: "sinirsiz", deger: false }, "sinirsiz", "Sınırsız hak kaldırıldı.")} loading={busy === "sinirsiz"} disabled={!!busy}>
                Sınırsızı kaldır
              </Button>
            ) : (
              <Button kind="secondary" small icon={InfinityIcon} onClick={() => void hak({ islem: "sinirsiz", deger: true }, "sinirsiz", "Kullanıcı artık sınırsız.")} loading={busy === "sinirsiz"} disabled={!!busy}>
                Sınırsız yap
              </Button>
            )}
            <Button kind="ghost" small icon={RotateCcw} onClick={() => void hak({ islem: "sifirla" }, "sifirla", "Kullanılan sorular sıfırlandı.")} loading={busy === "sifirla"} disabled={!!busy || u.ai.used === 0}>
              Kullanımı sıfırla
            </Button>
            {u.ai.ozel ? (
              <Button kind="ghost" small icon={Undo2} onClick={() => void hak({ islem: "varsayilan" }, "varsayilan", "Varsayılan hakka dönüldü.")} loading={busy === "varsayilan"} disabled={!!busy}>
                Varsayılana dön
              </Button>
            ) : null}
          </div>
        </div>

        <div className="border-t border-line pt-4">
          <Button kind={u.aktif ? "danger" : "secondary"} small icon={u.aktif ? Lock : Unlock} onClick={() => void durum()} loading={busy === "durum"} disabled={!!busy}>
            {u.aktif ? "Hesabı kapat" : "Hesabı aç"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
