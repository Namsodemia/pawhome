"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Check, UserRound, Wallet } from "lucide-react";
import { Button, Chips, Field, Input, ProgressBar, Sheet, Textarea } from "@/components/ui";
import { toast } from "@/components/feedback";
import { FieldGroup } from "@/components/FieldGroup";
import { useStore } from "@/lib/store";
import { cx, money, parseNum, pct } from "@/lib/format";
import { mergeGroups } from "@/lib/groups";
import type { KursiyerInput } from "@/lib/types";

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

/**
 * Kursiyer / müşteri ekleme-düzenleme formu (mobil uygulamadaki musteri/form ekranının iki kartı).
 * Ebeveyn her açılışta `key` vererek yeniden bağlar.
 */
export function KursiyerForm({ id, onClose, onSaved }: { id?: number | null; onClose: () => void; onSaved?: (id: number) => void }) {
  const existing = useStore((s) => (id ? s.kursiyerler.find((k) => k.id === id) : undefined));
  const kursiyerler = useStore((s) => s.kursiyerler);
  const kasalar = useStore((s) => s.kasalar);

  const [f, setF] = useState(() => ({
    full_name: existing?.full_name ?? "",
    tc: existing?.tc ?? "",
    phone: existing?.phone ?? "",
    email: existing?.email ?? "",
    city: existing?.city ?? "",
    group_name: existing?.group_name ?? "",
    list_no: existing?.list_no ?? "",
    total: existing ? numStr(existing.total_amount) : "",
    cash: existing ? numStr(existing.cash_amount) : "",
    bank: existing ? numStr(existing.bank_amount) : "",
    plasiyer: existing?.plasiyer ?? "",
    notes: existing?.notes ?? "",
    invoice_issue_date: existing?.invoice_issue_date ?? "",
  }));
  const [kasaId, setKasaId] = useState<number>(existing?.kasa_id ?? 0);
  const [errors, setErrors] = useState<Partial<Record<"full_name" | "tc" | "email" | "amount", string>>>({});

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const groups = useMemo(() => mergeGroups(kursiyerler.filter((k) => k.is_active).map((k) => k.group_name)), [kursiyerler]);
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

  function save(e?: FormEvent) {
    e?.preventDefault();
    const errs: typeof errors = {};
    if (!f.full_name.trim()) errs.full_name = "Ad soyad zorunlu.";
    if (f.tc.trim() && !/^\d{11}$/.test(tcDigits)) errs.tc = "TC kimlik no 11 haneli olmalı.";
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errs.email = "Geçerli bir e-posta girin.";
    if (over) errs.amount = "Tahsilat toplamı sözleşme tutarını aşamaz.";
    setErrors(errs);
    const first = errs.full_name || errs.tc || errs.email || errs.amount;
    if (first) {
      toast(first, "error");
      return;
    }
    const payload: KursiyerInput = {
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
    };
    const st = useStore.getState();
    let nid: number;
    if (existing) {
      st.updateKursiyer(existing.id, payload);
      nid = existing.id;
      toast("Kayıt güncellendi.");
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
      title={existing ? "Kursiyeri Düzenle" : "Yeni Kursiyer / Müşteri"}
      footer={
        <div className="flex gap-2">
          <Button type="button" kind="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" form="kursiyer-form" icon={Check} block>
            {existing ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      }
    >
      <form id="kursiyer-form" onSubmit={save} noValidate className="grid gap-4 md:grid-cols-2">
        <FormCard icon={UserRound} title="Kişi ve program">
          <Field label="Ad soyad *" error={errors.full_name}>
            <Input value={f.full_name} onChange={(e) => set("full_name")(e.target.value)} autoFocus={!existing} autoCapitalize="words" autoComplete="off" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Telefon">
              <Input mono type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="05xx xxx xx xx" />
            </Field>
            <Field label="TC kimlik no" error={errors.tc} hint={tcWarn ? <span className="text-warn">Algoritma kontrolü tutmadı, kontrol edin.</span> : undefined}>
              <Input mono inputMode="numeric" maxLength={11} value={f.tc} onChange={(e) => set("tc")(e.target.value.replace(/\D/g, ""))} placeholder="11 hane" />
            </Field>
          </div>
          <Field label="E-posta" error={errors.email}>
            <Input type="email" inputMode="email" autoCapitalize="none" value={f.email} onChange={(e) => set("email")(e.target.value)} />
          </Field>
          <Field label="İl / ilçe">
            <Input value={f.city} onChange={(e) => set("city")(e.target.value)} />
          </Field>
          <FieldGroup label="Program / eğitim">
            <Chips options={groups.map((g) => ({ value: g, label: g }))} value={f.group_name} onChange={(v) => set("group_name")(f.group_name === v ? "" : v)} />
          </FieldGroup>
          <Field label="Program (elle)">
            <Input value={f.group_name} onChange={(e) => set("group_name")(e.target.value)} placeholder="Listede yoksa yazın" />
          </Field>
          <Field label="Dönem / liste">
            <Input value={f.list_no} onChange={(e) => set("list_no")(e.target.value)} placeholder="Örn. Aralık 2026" />
          </Field>
        </FormCard>

        <FormCard icon={Wallet} title="Ücret ve tahsilat">
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
          <Field label="Tahsilat / fatura tarihi">
            <Input type="date" mono value={f.invoice_issue_date} onChange={(e) => set("invoice_issue_date")(e.target.value)} />
          </Field>
          <Field label="Plasiyer">
            <Input value={f.plasiyer} onChange={(e) => set("plasiyer")(e.target.value)} />
          </Field>
          <Field label="Not">
            <Textarea value={f.notes} onChange={(e) => set("notes")(e.target.value)} className="min-h-[84px]" />
          </Field>
        </FormCard>
      </form>
    </Sheet>
  );
}

function FormCard({ icon: Icon, title, children }: { icon: typeof Wallet; title: string; children: ReactNode }) {
  return (
    <div className="space-y-3.5 rounded-xl2 border border-line bg-paper/40 p-4">
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
