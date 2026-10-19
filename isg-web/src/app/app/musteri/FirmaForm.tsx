"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Building2, Check, FileSignature, UsersRound, type LucideIcon } from "lucide-react";
import { Button, Chips, Field, Input, ProgressBar, Sheet, Textarea } from "@/components/ui";
import { toast } from "@/components/feedback";
import { FieldGroup } from "@/components/FieldGroup";
import { useStore } from "@/lib/store";
import { cx, money, parseNum, pct } from "@/lib/format";
import type { Calisan } from "@/lib/api";
import type { FirmaInput, HazardClass } from "@/lib/types";
import { ATAMALAR, TEHLIKE_ETIKET, TEHLIKE_SINIFLARI, hizmetSecenekleri, isTehlike, useEkip, type AtamaAlan } from "./ortak";

/** T.C. kimlik no algoritma kontrolü (10. ve 11. hane). */
export function tcChecksumOk(tc: string): boolean {
  if (!/^[1-9]\d{10}$/.test(tc)) return false;
  const d = tc.split("").map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const d10 = (((odd * 7 - even) % 10) + 10) % 10;
  const d11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return d10 === d[9] && d11 === d[10];
}

const numStr = (n: number) => (n ? n.toLocaleString("tr-TR", { maximumFractionDigits: 2, useGrouping: false }) : "");

type ErrKey = "full_name" | "tc" | "email" | "amount" | "calisan" | "bitis";

/**
 * Müşteri Takip — firma ekleme / düzenleme formu.
 * Veri modeli geriye dönük uyum için "kursiyer" kaydıdır (bkz. types.ts: Firma = Kursiyer).
 * Ebeveyn her açılışta `key` vererek yeniden bağlar.
 */
export function FirmaForm({ id, onClose, onSaved }: { id?: number | null; onClose: () => void; onSaved?: (id: number) => void }) {
  const existing = useStore((s) => (id ? s.kursiyerler.find((k) => k.id === id) : undefined));
  const firmalar = useStore((s) => s.kursiyerler);
  const kasalar = useStore((s) => s.kasalar);
  const { sunucu, ekip, durum } = useEkip();

  const [f, setF] = useState(() => ({
    full_name: existing?.full_name ?? "",
    tc: existing?.tc ?? "",
    yetkili: existing?.yetkili ?? "",
    phone: existing?.phone ?? "",
    email: existing?.email ?? "",
    city: existing?.city ?? "",
    adres: existing?.adres ?? "",
    sgk_sicil: existing?.sgk_sicil ?? "",
    nace_kodu: existing?.nace_kodu ?? "",
    calisan_sayisi: existing?.calisan_sayisi ? String(existing.calisan_sayisi) : "",
    group_name: existing?.group_name ?? "",
    list_no: existing?.list_no ?? "",
    total: existing ? numStr(existing.total_amount) : "",
    cash: existing ? numStr(existing.cash_amount) : "",
    bank: existing ? numStr(existing.bank_amount) : "",
    plasiyer: existing?.plasiyer ?? "",
    notes: existing?.notes ?? "",
    invoice_issue_date: existing?.invoice_issue_date ?? "",
    sozlesme_bitis: existing?.sozlesme_bitis ?? "",
  }));
  const [tehlike, setTehlike] = useState<HazardClass | "">(() => {
    const t = existing?.tehlike_sinifi;
    return isTehlike(t) ? t : "";
  });
  const [kasaId, setKasaId] = useState<number>(existing?.kasa_id ?? 0);
  const [atama, setAtama] = useState<Record<AtamaAlan, number>>(() => ({
    igu_id: existing?.igu_id ?? 0,
    ih_id: existing?.ih_id ?? 0,
    dsp_id: existing?.dsp_id ?? 0,
  }));
  const [errors, setErrors] = useState<Partial<Record<ErrKey, string>>>({});

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const groups = useMemo(() => hizmetSecenekleri(firmalar.filter((k) => k.is_active).map((k) => k.group_name)), [firmalar]);
  const kasaOpts = useMemo(() => {
    const act = kasalar.filter((k) => k.is_active);
    const opts = [{ value: 0, label: "Seçilmedi" }, ...act.map((k) => ({ value: k.id, label: k.title }))];
    if (kasaId && !act.some((k) => k.id === kasaId)) {
      const k = kasalar.find((x) => x.id === kasaId);
      if (k) opts.push({ value: k.id, label: `${k.title} (kaldırıldı)` });
    }
    return opts;
  }, [kasalar, kasaId]);

  const total = parseNum(f.total);
  const cash = parseNum(f.cash);
  const bank = parseNum(f.bank);
  const remaining = Math.max(0, Math.round((total - cash - bank) * 100) / 100);
  const over = cash + bank > total + 0.005;
  const tcDigits = f.tc.replace(/\D/g, "");
  const tcWarn = tcDigits.length === 11 && !tcChecksumOk(tcDigits);
  const ekipBos = !sunucu || (durum === "hazir" && !ekip.some((c) => c.aktif));

  function save(e?: FormEvent) {
    e?.preventDefault();
    const errs: typeof errors = {};
    if (!f.full_name.trim()) errs.full_name = "Firma adı zorunlu.";
    if (f.tc.trim() && !/^\d{10,11}$/.test(tcDigits)) errs.tc = "Vergi no 10, TC kimlik no 11 haneli olmalı.";
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errs.email = "Geçerli bir e-posta girin.";
    if (f.calisan_sayisi.trim() && !/^\d+$/.test(f.calisan_sayisi.trim())) errs.calisan = "Çalışan sayısı tam sayı olmalı.";
    if (f.invoice_issue_date && f.sozlesme_bitis && f.sozlesme_bitis < f.invoice_issue_date) errs.bitis = "Sözleşme bitişi başlangıçtan önce olamaz.";
    if (over) errs.amount = "Tahsilat toplamı sözleşme tutarını aşamaz.";
    setErrors(errs);
    const first = errs.full_name || errs.tc || errs.email || errs.calisan || errs.bitis || errs.amount;
    if (first) {
      toast(first, "error");
      return;
    }
    const payload: FirmaInput = {
      full_name: f.full_name.trim(),
      tc: f.tc.trim() ? tcDigits : "",
      phone: f.phone.trim(),
      email: f.email.trim(),
      city: f.city.trim(),
      group_name: f.group_name.trim(),
      list_no: f.list_no.trim(),
      total_amount: total,
      cash_amount: cash,
      bank_amount: bank,
      remaining_amount: remaining,
      kasa_id: kasaId || null,
      plasiyer: f.plasiyer.trim(),
      notes: f.notes.trim(),
      invoice_issue_date: f.invoice_issue_date,
      yetkili: f.yetkili.trim(),
      tehlike_sinifi: tehlike,
      calisan_sayisi: f.calisan_sayisi.trim() ? Number(f.calisan_sayisi.trim()) : 0,
      nace_kodu: f.nace_kodu.trim(),
      sgk_sicil: f.sgk_sicil.trim(),
      adres: f.adres.trim(),
      sozlesme_bitis: f.sozlesme_bitis,
      igu_id: atama.igu_id || null,
      ih_id: atama.ih_id || null,
      dsp_id: atama.dsp_id || null,
    };
    const st = useStore.getState();
    let nid: number;
    if (existing) {
      st.updateKursiyer(existing.id, payload);
      nid = existing.id;
      toast("Firma güncellendi.");
    } else {
      nid = st.addKursiyer(payload);
      toast(`${payload.full_name} eklendi.`);
    }
    onSaved?.(nid);
    onClose();
  }

  return (
    <Sheet
      open
      wide
      onClose={onClose}
      title={existing ? "Firmayı Düzenle" : "Yeni Firma"}
      footer={
        <div className="flex gap-2">
          <Button type="button" kind="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" form="firma-form" icon={Check} block>
            {existing ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      }
    >
      <form id="firma-form" onSubmit={save} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormCard icon={Building2} title="Firma bilgileri">
          <Field label="Firma adı / unvanı *" error={errors.full_name}>
            <Input value={f.full_name} onChange={(e) => set("full_name")(e.target.value)} autoFocus={!existing} autoComplete="off" placeholder="Örn. Demirel Otomotiv Ltd. Şti." />
          </Field>
          <Field
            label="Vergi / TC kimlik no"
            error={errors.tc}
            hint={tcWarn ? <span className="text-warn">TC kimlik no algoritma kontrolü tutmadı, kontrol edin.</span> : "Şirketse 10 haneli vergi no, şahıs firmasıysa 11 haneli TC kimlik no."}
          >
            <Input mono inputMode="numeric" maxLength={11} value={f.tc} onChange={(e) => set("tc")(e.target.value.replace(/\D/g, ""))} placeholder="10 ya da 11 hane" />
          </Field>
          <Field label="Yetkili kişi">
            <Input value={f.yetkili} onChange={(e) => set("yetkili")(e.target.value)} autoCapitalize="words" autoComplete="off" placeholder="Görüşülen kişi" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Telefon">
              <Input mono type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="05xx xxx xx xx" />
            </Field>
            <Field label="E-posta" error={errors.email}>
              <Input type="email" inputMode="email" autoCapitalize="none" value={f.email} onChange={(e) => set("email")(e.target.value)} />
            </Field>
          </div>
          <Field label="İl / ilçe">
            <Input value={f.city} onChange={(e) => set("city")(e.target.value)} placeholder="Örn. Mersin / Yenişehir" />
          </Field>
          <Field label="Adres">
            <Textarea value={f.adres} onChange={(e) => set("adres")(e.target.value)} className="!min-h-[64px]" rows={2} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="SGK işyeri sicil no">
              <Input mono value={f.sgk_sicil} onChange={(e) => set("sgk_sicil")(e.target.value)} autoComplete="off" />
            </Field>
            <Field label="NACE kodu">
              <Input mono value={f.nace_kodu} onChange={(e) => set("nace_kodu")(e.target.value)} placeholder="00.00.00" autoComplete="off" />
            </Field>
          </div>
          <FieldGroup label="Tehlike sınıfı">
            <Chips<HazardClass | "">
              options={[{ value: "", label: "Belirtilmedi" }, ...TEHLIKE_SINIFLARI.map((h) => ({ value: h, label: TEHLIKE_ETIKET[h] }))]}
              value={tehlike}
              onChange={setTehlike}
            />
          </FieldGroup>
          <Field label="Çalışan sayısı" error={errors.calisan}>
            <Input mono inputMode="numeric" value={f.calisan_sayisi} onChange={(e) => set("calisan_sayisi")(e.target.value.replace(/\D/g, ""))} placeholder="0" />
          </Field>
        </FormCard>

        <FormCard icon={FileSignature} title="Sözleşme ve tahsilat">
          <FieldGroup label="Hizmet / grup">
            <Chips options={groups.map((g) => ({ value: g, label: g }))} value={f.group_name} onChange={(v) => set("group_name")(f.group_name === v ? "" : v)} />
          </FieldGroup>
          <Field label="Hizmet (elle)">
            <Input value={f.group_name} onChange={(e) => set("group_name")(e.target.value)} placeholder="Listede yoksa yazın" />
          </Field>
          <Field label="Sözleşme no / dönem">
            <Input value={f.list_no} onChange={(e) => set("list_no")(e.target.value)} placeholder="Örn. 2026/014 ya da 2026 yıllık" />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Sözleşme başlangıcı">
              <Input type="date" mono value={f.invoice_issue_date} onChange={(e) => set("invoice_issue_date")(e.target.value)} />
            </Field>
            <Field label="Sözleşme bitişi" error={errors.bitis}>
              <Input type="date" mono value={f.sozlesme_bitis} onChange={(e) => set("sozlesme_bitis")(e.target.value)} />
            </Field>
          </div>
          <Field label="Sözleşme tutarı (₺)">
            <Input mono inputMode="decimal" value={f.total} onChange={(e) => set("total")(e.target.value)} placeholder="0,00" className="text-[18px] font-bold" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nakit tahsilat (₺)">
              <Input mono inputMode="decimal" value={f.cash} onChange={(e) => set("cash")(e.target.value)} placeholder="0,00" />
            </Field>
            <Field label="Banka tahsilat (₺)">
              <Input mono inputMode="decimal" value={f.bank} onChange={(e) => set("bank")(e.target.value)} placeholder="0,00" />
            </Field>
          </div>
          <div className={cx("rounded-2xl px-4 py-3", over ? "bg-soft-danger" : remaining > 0 ? "bg-soft-orange" : "bg-soft-green")}>
            <div className="flex items-baseline justify-between gap-3">
              <span className={cx("num text-[15px] font-extrabold", over ? "text-danger" : remaining > 0 ? "text-danger" : "text-success")}>
                Kalan: {money(remaining)}
              </span>
              {total > 0 ? <span className="num text-[12px] font-semibold text-muted">%{pct(Math.min(total, cash + bank), total)} tahsil</span> : null}
            </div>
            {total > 0 ? <ProgressBar value={pct(cash + bank, total)} className="mt-2" track="bg-white/70" tone={over ? "danger" : "brand"} /> : null}
            {errors.amount || over ? <div className="mt-1.5 text-[12px] font-semibold text-danger">Tahsilat toplamı sözleşme tutarını aşamaz.</div> : null}
          </div>
          <FieldGroup label="Kasa (kim tahsil etti?)" hint="Kasa seçilirse tahsil edilen tutar kasaya otomatik gelir olarak yansır (çift kayıt oluşmaz).">
            <Chips options={kasaOpts} value={kasaId} onChange={setKasaId} />
          </FieldGroup>
          <Field label="Satış temsilcisi">
            <Input value={f.plasiyer} onChange={(e) => set("plasiyer")(e.target.value)} />
          </Field>
          <Field label="Not">
            <Textarea value={f.notes} onChange={(e) => set("notes")(e.target.value)} className="min-h-[84px]" />
          </Field>
        </FormCard>

        <FormCard icon={UsersRound} title="Atanan ekip" className="md:col-span-2">
          {ekipBos ? (
            <div className="rounded-2xl bg-soft-blue px-4 py-3 text-[13px] leading-relaxed text-brand-blue">
              Önce Çalışanlar sekmesinden çalışan ekleyin.{" "}
              {sunucu ? (
                <Link href="/app/musteri?sekme=calisanlar" className="font-bold underline" onClick={onClose}>
                  Çalışanlar
                </Link>
              ) : (
                <span className="text-muted">Çalışan hesapları için sunucu bağlantısı gerekir.</span>
              )}
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {ATAMALAR.map((a) => (
              <AtamaSelect
                key={a.alan}
                label={`${a.ad} (${a.kisa})`}
                value={atama[a.alan]}
                onChange={(v) => setAtama((p) => ({ ...p, [a.alan]: v }))}
                adaylar={ekip.filter((c) => c.rol === a.rol)}
                yukleniyor={sunucu && durum === "yukleniyor"}
              />
            ))}
          </div>
        </FormCard>
      </form>
    </Sheet>
  );
}

function AtamaSelect({
  label,
  value,
  onChange,
  adaylar,
  yukleniyor,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  adaylar: Calisan[];
  yukleniyor: boolean;
}) {
  const aktif = adaylar.filter((c) => c.aktif).sort((a, b) => a.ad_soyad.localeCompare(b.ad_soyad, "tr"));
  const secili = value ? adaylar.find((c) => c.id === value) : undefined;
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cx("field cursor-pointer !py-2.5 text-[14px]", !value && "text-muted")}
        disabled={yukleniyor && !aktif.length}
      >
        <option value={0}>{yukleniyor && !aktif.length ? "Yükleniyor…" : "Atanmadı"}</option>
        {aktif.map((c) => (
          <option key={c.id} value={c.id}>
            {c.ad_soyad}
          </option>
        ))}
        {value && (!secili || !secili.aktif) ? <option value={value}>{secili ? `${secili.ad_soyad} (pasif)` : yukleniyor ? "Yükleniyor…" : "Bulunamadı (silinmiş hesap)"}</option> : null}
      </select>
    </Field>
  );
}

function FormCard({ icon: Icon, title, children, className }: { icon: LucideIcon; title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("min-w-0 space-y-3.5 rounded-xl2 border border-line bg-paper/40 p-4", className)}>
      <div className="flex items-center gap-2 text-[13px] font-extrabold text-navy">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brandSoft text-brand-blue">
          <Icon size={15} />
        </span>
        {title}
      </div>
      {children}
    </div>
  );
}
