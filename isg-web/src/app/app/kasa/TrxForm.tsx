"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, Trash2 } from "lucide-react";
import { Button, Chips, Field, Input, Segment, Sheet } from "@/components/ui";
import { FieldGroup } from "@/components/FieldGroup";
import { confirmDialog, toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { money, parseNum, today } from "@/lib/format";
import type { PayMethod, TrxType } from "@/lib/types";

/** Arayüzdeki ödeme aracı seçenekleri; EFT 'banka', Kredi Kartı 'kart' olarak saklanır. */
type MethodUi = "nakit" | "banka" | "eft" | "kart";
const METHOD_OPTS: { value: MethodUi; label: string }[] = [
  { value: "nakit", label: "Nakit" },
  { value: "banka", label: "Banka" },
  { value: "eft", label: "EFT" },
  { value: "kart", label: "Kredi Kartı" },
];
const toStored = (m: MethodUi): PayMethod => (m === "eft" ? "banka" : m);

/** "Kasa Hareketi" formu. Ebeveyn, her açılışta `key` vererek yeniden bağlar (durum sıfırlanır). */
export function TrxForm({ id, onClose }: { id: number | null; onClose: () => void }) {
  const existing = useStore((s) => (id ? s.transactions.find((t) => t.id === id) : undefined));
  const kasalar = useStore((s) => s.kasalar);
  const categories = useStore((s) => s.categories);
  const active = useMemo(() => kasalar.filter((k) => k.is_active), [kasalar]);

  const [type, setType] = useState<TrxType>(existing?.type ?? "gider");
  const [amount, setAmount] = useState(existing ? String(existing.amount).replace(".", ",") : "");
  const [desc, setDesc] = useState(existing?.description ?? "");
  const [date, setDate] = useState(existing?.trx_date ?? today());
  const [kasaId, setKasaId] = useState<number>(() => {
    if (existing) return existing.kasa_id ?? 0;
    return active.length === 1 ? active[0].id : 0;
  });
  const [catId, setCatId] = useState<number | null>(existing?.category_id ?? null);
  const [method, setMethod] = useState<MethodUi>(existing?.payment_method ?? "nakit");
  const [errors, setErrors] = useState<{ amount?: string; desc?: string }>({});

  const catsOfType = useMemo(() => categories.filter((c) => c.type === type), [categories, type]);
  const effectiveCat = catId && catsOfType.some((c) => c.id === catId) ? catId : (catsOfType[0]?.id ?? null);

  // Kaldırılmış bir kasaya bağlı eski kayıt düzenlenirken o kasa da seçenekte görünsün
  const kasaOpts = useMemo(() => {
    const opts = [{ value: 0, label: "Kasasız" }, ...active.map((k) => ({ value: k.id, label: k.title }))];
    if (kasaId && !active.some((k) => k.id === kasaId)) {
      const k = kasalar.find((x) => x.id === kasaId);
      if (k) opts.push({ value: k.id, label: `${k.title} (kaldırıldı)` });
    }
    return opts;
  }, [active, kasalar, kasaId]);

  const amt = parseNum(amount);
  const editable = !existing || existing.ref_type === "manual";

  function save(e?: FormEvent) {
    e?.preventDefault();
    const errs: typeof errors = {};
    if (!(amt > 0)) errs.amount = "Tutar sıfırdan büyük olmalı.";
    if (!desc.trim()) errs.desc = "Açıklama girin.";
    setErrors(errs);
    if (errs.amount || errs.desc) {
      toast(errs.amount || errs.desc || "", "error");
      return;
    }
    const payload = {
      type,
      amount: amt,
      description: desc.trim(),
      trx_date: date || today(),
      kasa_id: kasaId || null,
      category_id: effectiveCat,
      payment_method: toStored(method),
    };
    const st = useStore.getState();
    if (existing) {
      st.updateTrx(existing.id, payload);
      toast("Hareket güncellendi.");
    } else {
      st.addTrx(payload);
      toast(`${type === "gelir" ? "Gelir" : "Gider"} kaydedildi: ${money(amt)}`);
    }
    onClose();
  }

  async function remove() {
    if (!existing) return;
    const ok = await confirmDialog({ title: "Hareketi sil", text: "Bu kasa hareketi silinecek.", okLabel: "Sil", danger: true });
    if (!ok) return;
    useStore.getState().deleteTrx(existing.id);
    toast("Hareket silindi.");
    onClose();
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={existing ? "Kasa Hareketini Düzenle" : "Kasa Hareketi"}
      footer={
        <div className="flex gap-2">
          {existing && editable ? (
            <Button type="button" kind="danger" icon={Trash2} onClick={remove}>
              Sil
            </Button>
          ) : null}
          <Button type="submit" form="trx-form" icon={Check} block disabled={!editable}>
            {existing ? "Güncelle" : "Kaydet"}
          </Button>
        </div>
      }
    >
      <form id="trx-form" onSubmit={save} className="space-y-4" noValidate>
        <Segment
          value={type}
          onChange={(v) => {
            setType(v);
            setCatId(null);
          }}
          options={[
            { value: "gelir", label: "Gelir" },
            { value: "gider", label: "Gider" },
          ]}
        />

        <Field
          label="Tutar (₺)"
          error={errors.amount}
          hint={amount && amt > 0 ? <span className="num">= {money(amt)}</span> : "Örn. 1.500 veya 1.250,50"}
        >
          <Input
            mono
            inputMode="decimal"
            autoFocus={!existing}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className={type === "gelir" ? "!py-3.5 text-[26px] font-extrabold text-success" : "!py-3.5 text-[26px] font-extrabold text-danger"}
          />
        </Field>

        <Field label="Açıklama" error={errors.desc}>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Örn. Ofis kirası Eylül" maxLength={200} />
        </Field>

        <Field label="Tarih">
          <Input type="date" mono value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <FieldGroup label="Kasa (hangi kasaya işlensin?)">
          <Chips options={kasaOpts} value={kasaId} onChange={setKasaId} />
        </FieldGroup>

        <FieldGroup label="Kategori">
          {catsOfType.length ? (
            <Chips options={catsOfType.map((c) => ({ value: c.id, label: c.name }))} value={effectiveCat} onChange={setCatId} />
          ) : (
            <div className="text-[13px] text-muted">Bu tür için kategori yok. Ayarlar &gt; Kategoriler bölümünden ekleyebilirsiniz.</div>
          )}
        </FieldGroup>

        <FieldGroup label="Ödeme aracı">
          <Chips options={METHOD_OPTS} value={method} onChange={setMethod} />
        </FieldGroup>

        {!editable ? (
          <div className="rounded-2xl bg-soft-blue px-4 py-3 text-[13px] text-brand-blue">
            Bu hareket bir kursiyer tahsilatından otomatik oluştu; Müşteri Takip ekranından düzenlenir.
          </div>
        ) : null}
      </form>
    </Sheet>
  );
}
