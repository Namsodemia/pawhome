"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleAlert,
  Clock,
  Grid3x3,
  Info,
  Printer,
  Search,
  ShieldCheck,
  UsersRound,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { MEVZUAT, type Bolum, type MevzuatGrup, type MevzuatIkon } from "@/data/mevzuat";
import { Button, Card, Empty, PageHeader } from "@/components/ui";
import { cx, norm } from "@/lib/format";
import { esc, printHtml } from "@/lib/print";
import { RISK_META } from "@/lib/risk";

const NOTE = "6331 sayılı Kanun ve yönetmeliklerden saha özeti. Kesin işlem için güncel Resmî Gazete metnine bakın.";

const ICONS: Record<MevzuatIkon, LucideIcon> = {
  time: Clock,
  "alert-circle": CircleAlert,
  construct: Wrench,
  "people-circle": UsersRound,
  grid: Grid3x3,
  "shield-checkmark": ShieldCheck,
};

const GROUP_COLORS: Record<string, string> = {
  sureler: "#107398",
  bildirim: "#D6334C",
  periyodik: "#F4772E",
  kurul: "#0B6F7B",
  matris: "#3AA466",
  kkd: "#1E3145",
};

/** Bazı satırlara görsel işaret (renk kodları, skor bantları) */
const SWATCH: Record<string, string> = {
  Kırmızı: "#D6334C",
  "Sarı / turuncu": "#FFB000",
  Mavi: "#1B8ECF",
  Yeşil: "#3AA466",
  "20-25": RISK_META.crit.color,
  "15-19": RISK_META.high.color,
  "8-14": RISK_META.mid.color,
  "1-7": RISK_META.low.color,
};

type Filtered = { grup: MevzuatGrup; bolumler: Bolum[]; hits: number };

function useIsDesktop(): boolean {
  const [desk, setDesk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const upd = () => setDesk(mq.matches);
    upd();
    mq.addEventListener("change", upd);
    return () => mq.removeEventListener("change", upd);
  }, []);
  return desk;
}

/** Aranan ifadeyi Türkçe-güvenli biçimde vurgular (norm() karakter sayısını korur). */
function Highlight({ text, q }: { text: string; q: string }): ReactNode {
  if (!q) return text;
  const nt = norm(text);
  if (nt.length !== text.length) return text;
  const parts: ReactNode[] = [];
  let from = 0;
  let idx = nt.indexOf(q, from);
  if (idx === -1) return text;
  let key = 0;
  while (idx !== -1) {
    if (idx > from) parts.push(text.slice(from, idx));
    parts.push(
      <mark key={key++} className="rounded bg-soft-warn px-0.5 text-ink">
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    from = idx + q.length;
    idx = nt.indexOf(q, from);
  }
  if (from < text.length) parts.push(text.slice(from));
  return <>{parts}</>;
}

export default function MevzuatPage() {
  const [open, setOpen] = useState<Set<string>>(() => new Set([MEVZUAT[0].id]));
  const [query, setQuery] = useState("");
  const q = norm(query);
  const desktop = useIsDesktop();

  const filtered: Filtered[] = useMemo(() => {
    if (!q) return MEVZUAT.map((grup) => ({ grup, bolumler: grup.bolumler, hits: 0 }));
    const out: Filtered[] = [];
    for (const grup of MEVZUAT) {
      const groupHit = norm(grup.baslik).includes(q);
      let hits = 0;
      const bolumler: Bolum[] = [];
      for (const b of grup.bolumler) {
        const bolumHit = groupHit || norm(b.baslik).includes(q) || norm(b.aciklama).includes(q);
        const rows = b.satirlar.filter(([k, v]) => norm(k).includes(q) || norm(v).includes(q));
        hits += rows.length;
        if (bolumHit) bolumler.push(b);
        else if (rows.length) bolumler.push({ ...b, satirlar: rows });
      }
      if (bolumler.length) out.push({ grup, bolumler, hits });
    }
    return out;
  }, [q]);

  const totalRows = MEVZUAT.reduce((a, g) => a + g.bolumler.reduce((b, x) => b + x.satirlar.length, 0), 0);
  const allOpen = MEVZUAT.every((g) => open.has(g.id));
  const isOpen = (id: string) => (q ? true : open.has(id));

  function toggle(id: string) {
    if (q) return;
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    setQuery("");
    setOpen(allOpen ? new Set() : new Set(MEVZUAT.map((g) => g.id)));
  }

  function printAll() {
    const html = MEVZUAT.map(
      (g) =>
        `<h2>${esc(g.baslik)}</h2>` +
        g.bolumler
          .map(
            (b) =>
              `<table style="margin-bottom:10px"><thead><tr><th colspan="2">${esc(b.baslik)}</th></tr></thead><tbody>` +
              (b.aciklama ? `<tr><td colspan="2" style="color:#6E7C8C">${esc(b.aciklama)}</td></tr>` : "") +
              b.satirlar.map(([k, v]) => `<tr><td style="width:38%;font-weight:700">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("") +
              `</tbody></table>`,
          )
          .join(""),
    ).join("");
    printHtml("İSG Mevzuat Rehberi", `<h1>İSG Mevzuat Rehberi</h1><div class="meta">${esc(NOTE)}</div>${html}`);
  }

  const cols: Filtered[][] = desktop ? [filtered.filter((_, i) => i % 2 === 0), filtered.filter((_, i) => i % 2 === 1)] : [filtered];

  return (
    <div>
      <PageHeader
        title="Mevzuat Rehberi"
        subtitle={`${MEVZUAT.length} başlık · ${totalRows} madde · saha özeti`}
        actions={
          <>
            <Button kind="ghost" small icon={allOpen ? ChevronsDownUp : ChevronsUpDown} onClick={toggleAll}>
              {allOpen ? "Tümünü kapat" : "Tümünü aç"}
            </Button>
            <Button kind="ghost" small icon={Printer} onClick={printAll} className="hidden sm:inline-flex">
              Yazdır
            </Button>
          </>
        }
      />

      <div className="flex items-start gap-2.5 rounded-2xl border border-soft-blue bg-soft-blue/60 px-4 py-3 text-[13px] leading-relaxed text-navy">
        <Info size={17} className="mt-0.5 shrink-0 text-brand-blue" />
        <span>{NOTE}</span>
      </div>

      <div className="relative mt-4">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mevzuatta ara… (ör. iskele, ilk yardımcı, 3 iş günü)"
          className="field pl-11 pr-11"
          aria-label="Mevzuatta ara"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Aramayı temizle"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl text-muted hover:bg-paper hover:text-navy"
          >
            <X size={17} />
          </button>
        ) : null}
      </div>
      {q ? (
        <div className="mt-2 text-[12.5px] font-semibold text-muted">
          {filtered.length ? `${filtered.length} başlıkta eşleşme bulundu.` : "Eşleşme bulunamadı."}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="mt-5">
          <Empty icon={Search} title="Sonuç yok" text={`"${query}" için mevzuat özetinde eşleşen satır bulunamadı.`} />
        </div>
      ) : (
        <div className={cx("mt-5 grid items-start gap-3", desktop && "grid-cols-2 gap-4")}>
          {cols.map((col, ci) => (
            <div key={ci} className="space-y-3">
              {col.map((f) => (
                <GroupCard key={f.grup.id} f={f} open={isOpen(f.grup.id)} onToggle={() => toggle(f.grup.id)} q={q} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupCard({ f, open, onToggle, q }: { f: Filtered; open: boolean; onToggle: () => void; q: string }) {
  const { grup, bolumler } = f;
  const Icon = ICONS[grup.ikon] ?? Info;
  const color = GROUP_COLORS[grup.id] ?? "#0B6F7B";
  const rowCount = grup.bolumler.reduce((a, b) => a + b.satirlar.length, 0);
  return (
    <Card padded={false} className="overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-paper/60 md:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: color }}>
          <Icon size={19} strokeWidth={2.3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-extrabold text-navy">
            <Highlight text={grup.baslik} q={q} />
          </span>
          <span className="block text-[12px] text-muted">
            {q && f.hits ? `${f.hits} eşleşen satır` : `${grup.bolumler.length} tablo · ${rowCount} satır`}
          </span>
        </span>
        <ChevronDown size={19} className={cx("shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-line bg-paper/40 px-3 py-3 md:px-4">
          {bolumler.map((b) => (
            <div key={b.baslik} className="rounded-2xl border border-line/70 bg-white p-3.5">
              <div className="text-[13.5px] font-extrabold text-brand-teal">
                <Highlight text={b.baslik} q={q} />
              </div>
              {b.aciklama ? (
                <div className="mt-0.5 text-[12px] text-muted">
                  <Highlight text={b.aciklama} q={q} />
                </div>
              ) : null}
              <dl className="mt-2">
                {b.satirlar.map(([k, v], i) => (
                  <div key={i} className="flex gap-3 border-t border-line py-2 text-[13px] first:border-t-0 sm:gap-4">
                    <dt className="flex w-[40%] shrink-0 items-start gap-2 font-bold text-ink">
                      {SWATCH[k] ? <span className="mt-1 h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: SWATCH[k] }} /> : null}
                      <span className={cx(/^\d/.test(k) && "num")}>
                        <Highlight text={k} q={q} />
                      </span>
                    </dt>
                    <dd className="min-w-0 flex-1 leading-[1.45] text-text">
                      <Highlight text={v} q={q} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
