"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  Banknote,
  CircleCheck,
  MessageCircle,
  MessagesSquare,
  Pencil,
  Phone,
  Trash2,
  UserX,
  Wallet,
} from "lucide-react";
import { Badge, Button, ButtonLink, Card, Chips, Empty, Field, Input, PageHeader, ProgressBar, Segment } from "@/components/ui";
import { FieldGroup } from "@/components/FieldGroup";
import { confirmDialog, toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx, fmtDate, fmtDateTime, money, parseNum, pct } from "@/lib/format";
import type { Kursiyer } from "@/lib/types";
import { KursiyerForm } from "../KursiyerForm";

const ACTION_CLS = "inline-flex h-9 select-none items-center justify-center gap-2 rounded-2xl px-3.5 text-[13px] font-bold transition active:scale-[.98]";

/** wa.me için: rakam dışı karakterler atılır, baştaki 0 → 90 (10 haneli 5xx → 905xx). */
function waNumber(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "90" + d.slice(1);
  else if (d.length === 10 && d.startsWith("5")) d = "90" + d;
  return d;
}

export default function KursiyerDetailPage() {
  const params = useParams<{ id: string }>();
  const kid = Number(params?.id);
  return <KursiyerDetail key={kid} kid={kid} />;
}

function KursiyerDetail({ kid }: { kid: number }) {
  const router = useRouter();
  const k = useStore((s) => s.kursiyerler.find((x) => x.id === kid));
  const kasalar = useStore((s) => s.kasalar);
  const transactions = useStore((s) => s.transactions);
  const uyeler = useStore((s) => s.uyeler);
  const siniflar = useStore((s) => s.siniflar);
  const categories = useStore((s) => s.categories);
  const [editKey, setEditKey] = useState<number | null>(null);
  const [gone, setGone] = useState(false);

  const linkedTrx = useMemo(() => transactions.find((t) => t.ref_type === "kursiyer" && t.ref_id === kid), [transactions, kid]);
  const classes = useMemo(() => {
    const ids = new Set(uyeler.filter((u) => u.kursiyer_id === kid).map((u) => u.sinif_id));
    return siniflar.filter((s) => ids.has(s.id));
  }, [uyeler, siniflar, kid]);

  if (gone) return null;
  if (!k) {
    return (
      <div>
        <PageHeader title="Kayıt bulunamadı" back="/app/musteri" />
        <Empty
          icon={UserX}
          title="Bu kursiyer bulunamadı"
          text="Kayıt silinmiş ya da bağlantı hatalı olabilir."
          action={
            <ButtonLink href="/app/musteri" kind="secondary">
              Müşteri listesine dön
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const kasaTitle = k.kasa_id ? kasalar.find((x) => x.id === k.kasa_id)?.title ?? "—" : "Seçilmedi";
  const collected = Math.round((k.total_amount - k.remaining_amount) * 100) / 100;
  const debt = k.remaining_amount > 0;
  const cpct = pct(collected, k.total_amount);

  const remove = async () => {
    const ok = await confirmDialog({
      title: "Kaydı sil",
      text: `${k.full_name} ve bağlı kasa hareketi silinecek.${classes.length ? " Sınıf üyelikleri kalır ancak kursiyer bağlantısı kaldırılır." : ""}`,
      okLabel: "Sil",
      danger: true,
    });
    if (!ok) return;
    setGone(true);
    useStore.getState().deleteKursiyer(kid);
    toast("Kayıt silindi.");
    router.push("/app/musteri");
  };

  return (
    <div>
      <PageHeader
        title={k.full_name}
        back="/app/musteri"
        subtitle={
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {k.group_name ? <Badge tone="blue">{k.group_name}</Badge> : null}
            {k.list_no ? <Badge tone="gray">{k.list_no}</Badge> : null}
            <Badge tone={debt ? "red" : "green"}>{debt ? "BORÇLU" : "ÖDENDİ"}</Badge>
          </div>
        }
        actions={
          <Button kind="ghost" small icon={Pencil} onClick={() => setEditKey(Date.now())} className="hidden lg:inline-flex">
            Düzenle
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <Card>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <MiniStat label="Sözleşme" value={money(k.total_amount)} />
              <MiniStat label="Tahsil" value={money(collected)} tone="text-success" />
              <MiniStat label="Kalan" value={money(k.remaining_amount)} tone={debt ? "text-danger" : "text-success"} highlight={debt} />
              <MiniStat label="Nakit" value={money(k.cash_amount)} />
              <MiniStat label="Banka" value={money(k.bank_amount)} />
              <MiniStat label="Tahsilat oranı" value={`%${cpct}`} tone="text-brand-blue">
                <ProgressBar value={cpct} className="mt-1.5" />
              </MiniStat>
            </div>

            <dl className="mt-5 grid gap-x-6 gap-y-2.5 text-[13.5px] sm:grid-cols-2">
              <Line label="Telefon" mono>
                {k.phone || "-"}
              </Line>
              <Line label="TC" mono>
                {k.tc || "-"}
              </Line>
              <Line label="E-posta">{k.email ? <a href={`mailto:${k.email}`} className="text-brand-blue hover:underline">{k.email}</a> : "-"}</Line>
              <Line label="İl / ilçe">{k.city || "-"}</Line>
              <Line label="Kasa">{kasaTitle}</Line>
              <Line label="Tarih" mono>
                {fmtDate(k.invoice_issue_date)}
              </Line>
              <Line label="Plasiyer">{k.plasiyer || "-"}</Line>
              <Line label="Kayıt" mono>
                {fmtDateTime(k.created_at)}
              </Line>
              {k.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-[11.5px] font-bold uppercase tracking-wider text-muted">Not</dt>
                  <dd className="mt-1 whitespace-pre-line rounded-2xl bg-paper px-3.5 py-2.5 text-text">{k.notes}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              {k.phone ? (
                <>
                  <a href={`tel:${k.phone.replace(/[^\d+]/g, "")}`} className={cx(ACTION_CLS, "bg-soft-blue text-brand-blue hover:bg-[#d6eaf4]")}>
                    <Phone size={15} strokeWidth={2.4} /> Ara
                  </a>
                  <a
                    href={`https://wa.me/${waNumber(k.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={cx(ACTION_CLS, "bg-soft-green text-success hover:bg-[#d5efdf]")}
                  >
                    <MessageCircle size={15} strokeWidth={2.4} /> WhatsApp
                  </a>
                </>
              ) : null}
              <Button kind="ghost" small icon={Pencil} onClick={() => setEditKey(Date.now())}>
                Düzenle
              </Button>
            </div>
          </Card>

          <Card>
            <div className="section-label">Kasa kaydı</div>
            {linkedTrx ? (
              <Link
                href="/app/kasa"
                className="mt-3 flex items-center gap-3 rounded-2xl border border-line/70 bg-paper/50 p-3 transition hover:border-brand-blue/30 hover:bg-soft-blue/40"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soft-green text-success">
                  <ArrowDownLeft size={19} strokeWidth={2.4} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold text-ink">{linkedTrx.description}</span>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    <span className="num">{fmtDate(linkedTrx.trx_date)}</span> · {kasalar.find((x) => x.id === linkedTrx.kasa_id)?.title ?? "Kasasız"} ·{" "}
                    {categories.find((c) => c.id === linkedTrx.category_id)?.name ?? "-"} · {linkedTrx.payment_method === "nakit" ? "Nakit" : "Banka"}
                  </span>
                </span>
                <span className="num shrink-0 text-[14px] font-semibold text-success">+{money(linkedTrx.amount)}</span>
              </Link>
            ) : (
              <div className="mt-2 text-[13px] leading-relaxed text-muted">
                Kasaya bağlı kayıt yok. Kasa seçip tahsilat işlediğinizde tahsil edilen toplam tutar tek bir gelir kaydı olarak kasaya yansır.
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div className="section-label">Sınıflar</div>
              <span className="num text-[11.5px] text-muted">{classes.length}</span>
            </div>
            {classes.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {classes.map((s) => (
                  <Link
                    key={s.id}
                    href={`/app/siniflar/${s.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-[13px] font-bold text-navy transition hover:border-brand-blue/40 hover:text-brand-blue"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.renk || "#107398" }} />
                    {s.ad}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 text-[13px] text-muted">
                <MessagesSquare size={16} /> Bu kişi henüz bir sınıfa eklenmemiş.{" "}
                <Link href="/app/siniflar" className="font-bold text-brand-blue hover:underline">
                  Sınıflar
                </Link>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24">
          {debt ? (
            <QuickPay key={`${k.remaining_amount}-${k.kasa_id ?? 0}`} k={k} />
          ) : (
            <Card className="bg-soft-green/60">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success text-white">
                  <CircleCheck size={22} />
                </span>
                <div>
                  <div className="text-[15px] font-extrabold text-navy">Borç kapandı</div>
                  <div className="text-[12.5px] text-muted">Sözleşme tutarının tamamı tahsil edildi.</div>
                </div>
              </div>
            </Card>
          )}
          <Button kind="danger" block icon={Trash2} onClick={remove}>
            Kaydı sil
          </Button>
          <div className="px-1 text-center text-[11.5px] leading-relaxed text-muted">Silme işlemi bağlı kasa hareketini de kaldırır.</div>
        </div>
      </div>

      {editKey ? <KursiyerForm key={editKey} id={kid} onClose={() => setEditKey(null)} /> : null}
    </div>
  );
}

function MiniStat({ label, value, tone = "text-navy", highlight, children }: { label: string; value: string; tone?: string; highlight?: boolean; children?: ReactNode }) {
  return (
    <div className={cx("min-w-0 rounded-2xl border p-3 sm:p-3.5", highlight ? "border-danger/25 bg-soft-danger/40" : "border-line/70 bg-paper/40")}>
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted sm:text-[11px]">{label}</div>
      <div className={cx("num mt-1 whitespace-nowrap text-[15px] font-extrabold leading-tight sm:text-[18px]", tone)}>{value}</div>
      {children}
    </div>
  );
}

function Line({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-2 sm:block sm:border-0 sm:pb-0">
      <dt className="shrink-0 text-[11.5px] font-bold uppercase tracking-wider text-muted">{label}</dt>
      <dd className={cx("min-w-0 truncate text-right text-ink sm:mt-0.5 sm:text-left", mono && "num")}>{children}</dd>
    </div>
  );
}

function QuickPay({ k }: { k: Kursiyer }) {
  const kasalar = useStore((s) => s.kasalar);
  const active = useMemo(() => kasalar.filter((x) => x.is_active), [kasalar]);
  const [amount, setAmount] = useState(() => k.remaining_amount.toLocaleString("tr-TR", { maximumFractionDigits: 2, useGrouping: false }));
  const [method, setMethod] = useState<"nakit" | "banka">("nakit");
  const [kasaId, setKasaId] = useState<number>(() => k.kasa_id ?? (active.length === 1 ? active[0].id : 0));
  const [busy, setBusy] = useState(false);

  const kasaOpts = useMemo(() => {
    const opts = [{ value: 0, label: "Seçilmedi" }, ...active.map((x) => ({ value: x.id, label: x.title }))];
    if (kasaId && !active.some((x) => x.id === kasaId)) {
      const x = kasalar.find((y) => y.id === kasaId);
      if (x) opts.push({ value: x.id, label: `${x.title} (kaldırıldı)` });
    }
    return opts;
  }, [active, kasalar, kasaId]);

  const amt = parseNum(amount);
  const half = Math.round((k.remaining_amount / 2) * 100) / 100;

  function pay() {
    setBusy(true);
    try {
      useStore.getState().addPayment(k.id, amt, method, kasaId || null);
      toast(`${money(amt)} işlendi.`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  const fmt = (n: number) => n.toLocaleString("tr-TR", { maximumFractionDigits: 2, useGrouping: false });

  return (
    <Card className="border-orange/30">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange text-white">
          <Banknote size={18} />
        </span>
        <div>
          <div className="text-[15px] font-extrabold text-navy">Hızlı tahsilat</div>
          <div className="num text-[12px] text-muted">Kalan {money(k.remaining_amount)}</div>
        </div>
      </div>
      <div className="mt-4 space-y-3.5">
        <Field label="Tutar (₺)" hint={amt > 0 ? <span className="num">= {money(amt)}</span> : undefined}>
          <Input mono inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="text-[20px] font-extrabold" />
        </Field>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setAmount(fmt(k.remaining_amount))}
            className="rounded-full bg-paper px-3 py-1 text-[12px] font-bold text-muted hover:text-navy"
          >
            Tamamı
          </button>
          {half > 0 ? (
            <button type="button" onClick={() => setAmount(fmt(half))} className="rounded-full bg-paper px-3 py-1 text-[12px] font-bold text-muted hover:text-navy">
              Yarısı
            </button>
          ) : null}
        </div>
        <Segment
          value={method}
          onChange={setMethod}
          options={[
            { value: "nakit", label: "Nakit" },
            { value: "banka", label: "Banka / EFT" },
          ]}
        />
        <FieldGroup label="Kasa (kim tahsil etti?)">
          <Chips options={kasaOpts} value={kasaId} onChange={setKasaId} />
        </FieldGroup>
        <Button kind="orange" block icon={Wallet} onClick={pay} loading={busy}>
          Tahsilatı işle
        </Button>
        <div className="text-[12px] leading-relaxed text-muted">Kasa seçiliyse tahsilat kasaya otomatik gelir olarak yansır (çift kayıt oluşmaz).</div>
      </div>
    </Card>
  );
}
