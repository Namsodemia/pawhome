"use client";

import { useState, type FormEvent } from "react";
import { Check, Eye, EyeOff, KeyRound, Trash2, WandSparkles } from "lucide-react";
import { Button, Chips, Field, Input, Sheet } from "@/components/ui";
import { FieldGroup } from "@/components/FieldGroup";
import { confirmDialog, toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/format";
import { ApiError, type Calisan, type CalisanInput, type CalisanRol } from "@/lib/api";
import type { Profil } from "@/lib/roles";
import { ATAMALAR, DSP_MESLEKLERI, atamalariTemizle, atananFirmaSayisi, calisanEkle, calisanGuncelle, calisanSil, rastgeleSifre, rolEtiket } from "./ortak";

export interface GirisBilgisi {
  ad_soyad: string;
  rol: CalisanRol;
  eposta: string;
  sifre: string;
  /** true: yeni hesap; false: mevcut hesabın şifresi değişti */
  yeni: boolean;
}

type ErrKey = "ad_soyad" | "eposta" | "sifre" | "sifre2";

const hataMetni = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : "İşlem tamamlanamadı.");

/**
 * OSGB çalışanı (İGU / İH / DSP) giriş hesabı ekleme / düzenleme formu.
 * Şifre sunucuda saklanır, bir daha gösterilmez; yeni hesapta (ya da şifre değişince) onGiris ile ebeveyne verilir.
 */
export function CalisanForm({ calisan, onClose, onGiris }: { calisan?: Calisan | null; onClose: () => void; onGiris: (g: GirisBilgisi) => void }) {
  const firmalar = useStore((s) => s.kursiyerler);
  const p: Profil = calisan?.profil ?? {};
  const [f, setF] = useState({
    ad_soyad: calisan?.ad_soyad ?? "",
    eposta: calisan?.eposta ?? "",
    telefon: calisan?.telefon ?? "",
    belge_no: p.belge_no ?? "",
    sifre: "",
    sifre2: "",
  });
  const [rol, setRol] = useState<CalisanRol>(calisan?.rol ?? "uzman");
  const [sinif, setSinif] = useState<"A" | "B" | "C" | "">(p.uzmanlik_sinifi ?? "");
  const [meslek, setMeslek] = useState<string>(p.meslek ?? "");
  const [aktif, setAktif] = useState<boolean>(calisan?.aktif ?? true);
  const [goster, setGoster] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<ErrKey, string>>>({});

  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const firmaSayisi = calisan ? atananFirmaSayisi(calisan.id, firmalar) : 0;
  const meslekOpts = DSP_MESLEKLERI.includes(meslek) || !meslek ? DSP_MESLEKLERI : [...DSP_MESLEKLERI, meslek];

  function sifreUret() {
    const s = rastgeleSifre();
    setF((x) => ({ ...x, sifre: s, sifre2: s }));
    setGoster(true);
  }

  async function save(e?: FormEvent) {
    e?.preventDefault();
    const errs: typeof errors = {};
    if (!f.ad_soyad.trim()) errs.ad_soyad = "Ad soyad zorunlu.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.eposta.trim())) errs.eposta = "Geçerli bir e-posta girin.";
    const sifreVar = !!f.sifre || !!f.sifre2;
    if (!calisan || sifreVar) {
      if (f.sifre.length < 8) errs.sifre = calisan ? "Yeni şifre en az 8 karakter olmalı." : "Şifre en az 8 karakter olmalı.";
      else if (f.sifre !== f.sifre2) errs.sifre2 = "Şifreler eşleşmiyor.";
    }
    setErrors(errs);
    const first = errs.ad_soyad || errs.eposta || errs.sifre || errs.sifre2;
    if (first) {
      toast(first, "error");
      return;
    }
    const input: CalisanInput = {
      ad_soyad: f.ad_soyad.trim(),
      eposta: f.eposta.trim().toLowerCase(),
      rol,
      telefon: f.telefon.trim(),
      uzmanlik_sinifi: rol === "uzman" ? sinif : "",
      belge_no: f.belge_no.trim(),
      meslek: rol === "dsp" ? meslek : "",
    };
    setBusy(true);
    try {
      if (!calisan) {
        const c = await calisanEkle({ ...input, sifre: f.sifre });
        toast(`${c.ad_soyad} için hesap oluşturuldu.`);
        onGiris({ ad_soyad: c.ad_soyad, rol: c.rol, eposta: c.eposta, sifre: f.sifre, yeni: true });
      } else {
        const c = await calisanGuncelle(calisan.id, { ...input, aktif, ...(sifreVar ? { sifre: f.sifre } : {}) });
        if (c.rol !== calisan.rol) {
          const n = atamalariTemizle(c.id, c.rol);
          if (n) toast(`Görev değiştiği için ${n} firmadaki eski ataması kaldırıldı.`, "info");
        }
        toast("Çalışan güncellendi.");
        if (sifreVar) onGiris({ ad_soyad: c.ad_soyad, rol: c.rol, eposta: c.eposta, sifre: f.sifre, yeni: false });
      }
      onClose();
    } catch (err) {
      toast(hataMetni(err), "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!calisan) return;
    const ok = await confirmDialog({
      title: "Çalışan hesabını sil",
      text:
        `${calisan.ad_soyad} adlı çalışanın hesap ve tüm kayıtları silinir; bu işlem geri alınamaz.` +
        (firmaSayisi ? `\nAtandığı ${firmaSayisi} firmadaki görevlendirmesi de kaldırılır.` : "") +
        "\nYalnızca girişini durdurmak istiyorsanız hesabı pasif yapın.",
      okLabel: "Hesabı sil",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await calisanSil(calisan.id);
      toast("Çalışan hesabı silindi.");
      onClose();
    } catch (err) {
      toast(hataMetni(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={calisan ? "Çalışanı Düzenle" : "Yeni Çalışan Hesabı"}
      footer={
        <div className="flex gap-2">
          {calisan ? (
            <Button type="button" kind="danger" icon={Trash2} onClick={remove} disabled={busy} aria-label="Hesabı sil">
              <span className="hidden sm:inline">Sil</span>
            </Button>
          ) : (
            <Button type="button" kind="ghost" onClick={onClose}>
              Vazgeç
            </Button>
          )}
          <Button type="submit" form="calisan-form" icon={Check} block loading={busy}>
            {calisan ? "Güncelle" : "Hesabı oluştur"}
          </Button>
        </div>
      }
    >
      <form id="calisan-form" onSubmit={save} noValidate className="space-y-4">
        <Field label="Ad soyad *" error={errors.ad_soyad}>
          <Input value={f.ad_soyad} onChange={(e) => set("ad_soyad")(e.target.value)} autoFocus={!calisan} autoCapitalize="words" autoComplete="off" />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="E-posta (giriş adı) *" error={errors.eposta}>
            <Input type="email" inputMode="email" autoCapitalize="none" autoComplete="off" value={f.eposta} onChange={(e) => set("eposta")(e.target.value)} />
          </Field>
          <Field label="Telefon">
            <Input mono type="tel" inputMode="tel" value={f.telefon} onChange={(e) => set("telefon")(e.target.value)} placeholder="05xx xxx xx xx" />
          </Field>
        </div>

        <FieldGroup
          label="Görev"
          hint={calisan && firmaSayisi && rol !== calisan.rol ? <span className="text-warn">Görev değişirse {firmaSayisi} firmadaki eski ataması kaldırılır.</span> : undefined}
        >
          <Chips options={ATAMALAR.map((a) => ({ value: a.rol, label: rolEtiket(a.rol) }))} value={rol} onChange={setRol} />
        </FieldGroup>

        {rol === "uzman" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
            <FieldGroup label="Uzmanlık sınıfı">
              <Chips<"A" | "B" | "C" | "">
                options={[
                  { value: "A", label: "A sınıfı" },
                  { value: "B", label: "B sınıfı" },
                  { value: "C", label: "C sınıfı" },
                ]}
                value={sinif}
                onChange={(v) => setSinif(sinif === v ? "" : v)}
              />
            </FieldGroup>
            <Field label="Uzmanlık belge no">
              <Input mono value={f.belge_no} onChange={(e) => set("belge_no")(e.target.value)} autoComplete="off" />
            </Field>
          </div>
        ) : rol === "hekim" ? (
          <Field label="İşyeri hekimliği belge no">
            <Input mono value={f.belge_no} onChange={(e) => set("belge_no")(e.target.value)} autoComplete="off" />
          </Field>
        ) : (
          <>
            <FieldGroup label="Meslek">
              <Chips options={meslekOpts.map((m) => ({ value: m, label: m }))} value={meslek} onChange={(v) => setMeslek(meslek === v ? "" : v)} />
            </FieldGroup>
            <Field label="DSP belge no">
              <Input mono value={f.belge_no} onChange={(e) => set("belge_no")(e.target.value)} autoComplete="off" />
            </Field>
          </>
        )}

        <div className="space-y-3 rounded-xl2 border border-line bg-paper/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[13px] font-extrabold text-navy">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brandSoft text-brand-blue">
                <KeyRound size={15} />
              </span>
              {calisan ? "Şifreyi değiştir" : "Giriş şifresi"}
            </div>
            <button type="button" onClick={sifreUret} className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-blue hover:underline">
              <WandSparkles size={14} /> Rastgele şifre üret
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={calisan ? "Yeni şifre" : "Şifre *"} error={errors.sifre}>
              <div className="relative">
                <Input
                  mono
                  type={goster ? "text" : "password"}
                  autoComplete="new-password"
                  value={f.sifre}
                  onChange={(e) => set("sifre")(e.target.value)}
                  placeholder="En az 8 karakter"
                  className="!pr-11"
                />
                <button
                  type="button"
                  onClick={() => setGoster((v) => !v)}
                  aria-label={goster ? "Şifreyi gizle" : "Şifreyi göster"}
                  title={goster ? "Şifreyi gizle" : "Şifreyi göster"}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-navy"
                >
                  {goster ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
            <Field label={calisan ? "Yeni şifre (tekrar)" : "Şifre (tekrar) *"} error={errors.sifre2}>
              <Input mono type={goster ? "text" : "password"} autoComplete="new-password" value={f.sifre2} onChange={(e) => set("sifre2")(e.target.value)} />
            </Field>
          </div>
          <div className="text-[12px] leading-relaxed text-muted">
            {calisan
              ? "Boş bırakırsanız şifre değişmez. Şifre sunucuda şifrelenmiş saklanır; kaydettikten sonra bir daha gösterilmez."
              : "Kaydedince giriş bilgileri bir kez gösterilir; çalışanınıza iletmek için kopyalayın."}
          </div>
        </div>

        {calisan ? (
          <button
            type="button"
            role="switch"
            aria-checked={aktif}
            onClick={() => setAktif((v) => !v)}
            className="flex w-full items-center gap-3 rounded-xl2 border border-line bg-white px-4 py-3 text-left transition hover:bg-paper/60"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold text-navy">{aktif ? "Hesap aktif" : "Hesap pasif"}</span>
              <span className="block text-[12px] text-muted">
                {aktif ? "Çalışan giriş yapabilir ve firmalara atanabilir." : "Çalışan giriş yapamaz; kayıtları silinmez."}
              </span>
            </span>
            <span className={cx("relative h-7 w-12 shrink-0 rounded-full transition", aktif ? "bg-brand" : "bg-line")}>
              <span className={cx("absolute top-1 h-5 w-5 rounded-full bg-white shadow-card transition-all", aktif ? "left-6" : "left-1")} />
            </span>
          </button>
        ) : null}
      </form>
    </Sheet>
  );
}
