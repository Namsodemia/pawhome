"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, MessageCircle, MessagesSquare, Plus, Search, Users } from "lucide-react";
import { Button, Card, Empty, Fab, Field, Hero, HeroKicker, Input, PageHeader, Section } from "@/components/ui";
import { toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx, fmtDate, norm } from "@/lib/format";
import { ColorPicker, SINIF_RENKLERI, SinifInitial } from "./_parts/common";

export default function SiniflarPage() {
  const router = useRouter();
  const siniflar = useStore((s) => s.siniflar);
  const uyeler = useStore((s) => s.uyeler);
  const mesajlar = useStore((s) => s.mesajlar);
  const addSinif = useStore((s) => s.addSinif);

  const [creating, setCreating] = useState(false);
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [renk, setRenk] = useState(SINIF_RENKLERI[1]);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const adRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  function openCreate() {
    setCreating(true);
    requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      adRef.current?.focus({ preventScroll: true });
    });
  }

  // ?yeni=1 → oluşturma kartını aç
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get("yeni")) return;
    setCreating(true);
    requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      adRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const items = useMemo(() => {
    const count = new Map<number, number>();
    for (const u of uyeler) count.set(u.sinif_id, (count.get(u.sinif_id) ?? 0) + 1);
    const lastMsg = new Map<number, { metin: string; created_at: string; id: number }>();
    for (const m of mesajlar) {
      const cur = lastMsg.get(m.sinif_id);
      if (!cur || m.id > cur.id) lastMsg.set(m.sinif_id, m);
    }
    return siniflar
      .map((s) => {
        const lm = lastMsg.get(s.id);
        return { ...s, uye_sayisi: count.get(s.id) ?? 0, son_mesaj: lm?.metin ?? null, son_tarih: lm?.created_at ?? null };
      })
      .sort((a, b) => (b.son_tarih || b.created_at).localeCompare(a.son_tarih || a.created_at));
  }, [siniflar, uyeler, mesajlar]);

  const filtered = useMemo(() => {
    const n = norm(q);
    if (!n) return items;
    return items.filter((s) => norm(`${s.ad} ${s.aciklama}`).includes(n));
  }, [items, q]);

  const toplamUye = uyeler.filter((u) => siniflar.some((s) => s.id === u.sinif_id)).length;

  function create() {
    if (!ad.trim()) {
      setErr("Sınıf adı girin.");
      adRef.current?.focus();
      return;
    }
    const id = addSinif(ad, aciklama, renk);
    toast(`${ad.trim()} oluşturuldu. Şimdi üyeleri ekleyin.`);
    setAd("");
    setAciklama("");
    setErr(null);
    setCreating(false);
    router.push(`/app/siniflar/detay/?id=${id}&uyeler=yapistir`);
  }

  return (
    <div>
      <PageHeader title="Sınıflar" subtitle="Kursiyer grupları · WhatsApp / SMS ile toplu duyuru" />

      <Hero>
        <HeroKicker>SINIFLAR · GRUP MESAJLAŞMA</HeroKicker>
        <div className="mt-3 flex gap-7">
          <div>
            <div className="num text-[34px] font-extrabold leading-none tracking-tight">{siniflar.length}</div>
            <div className="mt-1 text-[12px] font-semibold text-white/80">sınıf</div>
          </div>
          <div>
            <div className="num text-[34px] font-extrabold leading-none tracking-tight">{toplamUye}</div>
            <div className="mt-1 text-[12px] font-semibold text-white/80">kişi</div>
          </div>
          <div className="hidden sm:block">
            <div className="num text-[34px] font-extrabold leading-none tracking-tight">{mesajlar.filter((m) => siniflar.some((s) => s.id === m.sinif_id)).length}</div>
            <div className="mt-1 text-[12px] font-semibold text-white/80">duyuru</div>
          </div>
        </div>
        <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-white/90">
          Sınıf oluştur, ad ve numaraları yapıştır, WhatsApp veya SMS ile herkese tek seferde duyuru gönder. Öğrenciler sınıfın katılım
          koduyla İsgora&apos;dan da katılıp duyuruları uygulamada görebilir.
        </p>
      </Hero>

      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Oluşturma kartı — mobilde Fab ile açılır, masaüstünde sağda hep görünür */}
        <div className={cx("lg:order-2", !creating && "hidden lg:block")}>
          <div ref={cardRef} className="scroll-mt-24 lg:sticky lg:top-24">
            <Section label="Yeni sınıf">
              <Card>
                <div className="space-y-3.5">
                  <Field label="Sınıf adı" error={err}>
                    <input
                      ref={adRef}
                      className="field"
                      value={ad}
                      onChange={(e) => {
                        setAd(e.target.value);
                        if (err) setErr(null);
                      }}
                      onKeyDown={(e) => (e.key === "Enter" ? create() : null)}
                      placeholder="A Sınıfı · Aralık 2026"
                      maxLength={80}
                    />
                  </Field>
                  <Field label="Açıklama (isteğe bağlı)">
                    <Input value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Eğitim yeri, saat, eğitmen…" maxLength={160} />
                  </Field>
                  <ColorPicker value={renk} onChange={setRenk} />
                </div>
                <div className="mt-5 flex gap-2">
                  <Button icon={ArrowRight} onClick={create} className="flex-1">
                    Oluştur ve üye ekle
                  </Button>
                  {creating ? (
                    <Button kind="ghost" onClick={() => setCreating(false)} className="lg:hidden">
                      Vazgeç
                    </Button>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-paper px-3 py-2">
                  <SinifInitial ad={ad || "?"} renk={renk} size={30} />
                  <div className="min-w-0 text-[12.5px]">
                    <div className="truncate font-bold text-navy">{ad.trim() || "Sınıf adı"}</div>
                    <div className="truncate text-muted">{aciklama.trim() || "Önizleme"}</div>
                  </div>
                </div>
              </Card>
            </Section>
          </div>
        </div>

        {/* Liste */}
        <div className="lg:order-1">
          <Section
            label="Sınıflar"
            right={
              items.length > 4 ? (
                <div className="relative w-44 sm:w-56">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Sınıf ara…"
                    className="h-9 w-full rounded-xl border border-line bg-white pl-8 pr-3 text-[13px] outline-none focus:border-brand-blue"
                  />
                </div>
              ) : null
            }
          >
            {items.length === 0 ? (
              <Empty
                icon={MessagesSquare}
                title="Henüz sınıf yok"
                text="Bir sınıf oluşturup kursiyerlerin numaralarını yükleyin."
                action={
                  <Button small icon={Plus} onClick={openCreate}>
                    Sınıf oluştur
                  </Button>
                }
              />
            ) : filtered.length === 0 ? (
              <Empty icon={Search} title="Sonuç yok" text="Aramanızla eşleşen sınıf bulunamadı." />
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => (
                  <Link
                    key={s.id}
                    href={`/app/siniflar/detay/?id=${s.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-line/70 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-bar md:p-3.5"
                  >
                    <SinifInitial ad={s.ad} renk={s.renk} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-navy group-hover:text-brand-blue">{s.ad}</span>
                        {s.son_tarih ? <span className="num shrink-0 text-[11px] text-muted">{fmtDate(s.son_tarih)}</span> : null}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[12.5px] text-muted">
                        {s.son_mesaj ? <MessageCircle size={12} className="shrink-0 text-brand-teal" /> : null}
                        <span className="truncate">{s.son_mesaj ?? (s.aciklama || "Henüz mesaj yok")}</span>
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#E1F2F3] px-2 py-1 text-brand-teal">
                      <Users size={12} />
                      <span className="num text-[11.5px] font-bold">{s.uye_sayisi}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {!creating ? (
        <div className="lg:hidden">
          <Fab label="Yeni Sınıf" icon={Plus} onClick={openCreate} />
        </div>
      ) : null}
    </div>
  );
}
