"use client";

import { useMemo, useRef, useState } from "react";
import { Check, CloudUpload, Download, MessagesSquare, Pencil, Search, UserPlus, Users, X } from "lucide-react";
import { Badge, Button, Chips, Field, Input, Textarea } from "@/components/ui";
import { confirmDialog, toast } from "@/components/feedback";
import { useStore } from "@/lib/store";
import { cx, norm, upperTR } from "@/lib/format";
import { normPhone, parseList, prettyPhone } from "@/lib/phone";
import type { Sinif, Uye } from "@/lib/types";

export type UyeMode = "liste" | "yapistir" | "tek" | "musteri";

const PLACEHOLDER = "Ayşe Yılmaz 0532 123 45 67\nMehmet Kaya;05331234567\n3. Ali Demir\t+90 544 111 22 33";

export function MembersPanel({
  sinif,
  uyeler,
  mode,
  setMode,
  onDone,
}: {
  sinif: Sinif;
  uyeler: Uye[];
  mode: UyeMode;
  setMode: (m: UyeMode) => void;
  /** Mobil Sheet'te "Sohbete git" butonu için */
  onDone?: () => void;
}) {
  const bulkAddUye = useStore((s) => s.bulkAddUye);
  const addUye = useStore((s) => s.addUye);
  const updateUye = useStore((s) => s.updateUye);
  const deleteUye = useStore((s) => s.deleteUye);
  const kursiyerler = useStore((s) => s.kursiyerler);

  const [text, setText] = useState("");
  const [ad, setAd] = useState("");
  const [tel, setTel] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [err, setErr] = useState<{ ad?: string; tel?: string }>({});
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const adRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(() => [...uyeler].sort((a, b) => a.ad.localeCompare(b.ad, "tr")), [uyeler]);
  const shown = useMemo(() => {
    const n = norm(q);
    if (!n) return sorted;
    return sorted.filter((u) => norm(`${u.ad} ${u.telefon ?? ""} ${prettyPhone(u.telefon)}`).includes(n));
  }, [sorted, q]);
  const numarali = uyeler.filter((u) => u.telefon).length;

  const preview = useMemo(() => parseList(text), [text]);
  const withPhone = preview.filter((p) => p.telefon).length;

  const groups = useMemo(() => {
    const inClass = new Set(uyeler.map((u) => u.kursiyer_id).filter((x): x is number => x != null));
    const m = new Map<string, { name: string; n: number; tel: number; added: number }>();
    for (const k of kursiyerler) {
      if (!k.is_active) continue;
      const key = k.group_name?.trim() || "";
      const g = m.get(key) ?? { name: key || "(Grupsuz)", n: 0, tel: 0, added: 0 };
      g.n += 1;
      if (normPhone(k.phone)) g.tel += 1;
      if (inClass.has(k.id)) g.added += 1;
      m.set(key, g);
    }
    return [...m.entries()].map(([key, g]) => ({ key, ...g })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, "tr"));
  }, [kursiyerler, uyeler]);

  function changeMode(m: UyeMode) {
    if (m === "tek") {
      setEditId(null);
      setAd("");
      setTel("");
      setErr({});
    }
    setMode(m);
  }

  function importPaste() {
    if (!preview.length) return;
    setBusy(true);
    try {
      const r = bulkAddUye(sinif.id, preview);
      setText("");
      setMode("liste");
      toast(`${r.ok} kişi eklendi.${r.skip ? ` ${r.skip} kişi zaten vardı, atlandı.` : ""}`);
    } finally {
      setBusy(false);
    }
  }

  function importGroup(key: string, name: string) {
    const ks = kursiyerler.filter((k) => k.is_active && (k.group_name?.trim() || "") === key);
    if (!ks.length) return;
    const r = bulkAddUye(
      sinif.id,
      ks.map((k) => ({ ad: k.full_name, telefon: normPhone(k.phone), kursiyer_id: k.id })),
    );
    setMode("liste");
    toast(`${name}: ${r.ok} kişi eklendi.${r.skip ? ` ${r.skip} kişi zaten vardı.` : ""}`);
  }

  function saveOne() {
    const e: { ad?: string; tel?: string } = {};
    if (!ad.trim()) e.ad = "Ad soyad girin.";
    const p = normPhone(tel);
    if (tel.trim() && !p) e.tel = "Numara geçersiz. Örn. 0532 123 45 67";
    if (!e.tel && p && uyeler.some((u) => u.telefon === p && u.id !== editId)) e.tel = "Bu numara sınıfta zaten kayıtlı.";
    setErr(e);
    if (e.ad || e.tel) return;
    if (editId) {
      const cur = uyeler.find((u) => u.id === editId);
      updateUye(editId, ad, p, cur?.not_ ?? "");
      toast("Üye güncellendi.");
    } else {
      addUye(sinif.id, ad, p);
      toast(`${ad.trim()} eklendi.`);
    }
    setAd("");
    setTel("");
    setEditId(null);
    setMode("liste");
  }

  function startEdit(u: Uye) {
    setEditId(u.id);
    setAd(u.ad);
    setTel(u.telefon ? prettyPhone(u.telefon) : "");
    setErr({});
    setMode("tek");
    requestAnimationFrame(() => adRef.current?.focus());
  }

  async function remove(u: Uye) {
    const ok = await confirmDialog({ title: "Üyeyi çıkar", text: `${u.ad} sınıftan çıkarılacak.`, okLabel: "Çıkar", danger: true });
    if (ok) {
      deleteUye(u.id);
      toast(`${u.ad} çıkarıldı.`);
    }
  }

  return (
    <div>
      <Chips<UyeMode>
        value={mode}
        onChange={changeMode}
        options={[
          { value: "liste", label: `Üyeler (${uyeler.length})` },
          { value: "yapistir", label: "Liste yapıştır" },
          { value: "tek", label: editId ? "Düzenle" : "Tek kişi" },
          { value: "musteri", label: "Müşteri Takip'ten" },
        ]}
      />

      {/* ---------------- yapıştır */}
      {mode === "yapistir" ? (
        <div className="mt-4">
          <div className="text-[15px] font-extrabold text-navy">Ad ve numaraları yapıştırın</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            Her satıra bir kişi. Excel&apos;den, WhatsApp&apos;tan ya da nottan kopyalayın; sıra numarası, noktalı virgül, tab fark etmez.
            <br />
            Örn: &quot;Ayşe Yılmaz 0532 123 45 67&quot;
          </p>
          <Textarea
            mono
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            autoCapitalize="none"
            className="mt-3 min-h-[180px]"
          />
          {preview.length ? (
            <div className="mt-3 rounded-2xl bg-paper p-3.5">
              <div className="text-[13px] font-bold text-navy">
                {preview.length} kişi bulundu · {withPhone} numaralı
                {preview.length - withPhone ? ` · ${preview.length - withPhone} numarasız` : ""}
              </div>
              <div className="mt-2 space-y-1">
                {preview.slice(0, 6).map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="truncate text-text">{p.ad}</span>
                    <span className={cx("num shrink-0 text-[12.5px]", p.telefon ? "text-brand-teal" : "text-danger")}>
                      {p.telefon ? prettyPhone(p.telefon) : "numara yok"}
                    </span>
                  </div>
                ))}
                {preview.length > 6 ? <div className="text-[12.5px] text-muted">… ve {preview.length - 6} kişi daha</div> : null}
              </div>
            </div>
          ) : null}
          <Button icon={CloudUpload} block className="mt-3" onClick={importPaste} loading={busy} disabled={!preview.length}>
            {`${preview.length || ""} Kişiyi Yükle`.trim()}
          </Button>
        </div>
      ) : null}

      {/* ---------------- tek kişi */}
      {mode === "tek" ? (
        <form
          className="mt-4 space-y-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            saveOne();
          }}
        >
          <div className="text-[15px] font-extrabold text-navy">{editId ? "Üyeyi düzenle" : "Tek kişi ekle"}</div>
          <Field label="Ad soyad" error={err.ad}>
            <input ref={adRef} className="field" value={ad} onChange={(e) => setAd(e.target.value)} autoCapitalize="words" autoComplete="off" autoFocus />
          </Field>
          <Field label="Telefon" error={err.tel} hint="Boş bırakılabilir; numarasız üyelere mesaj gönderilmez.">
            <Input mono value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" placeholder="0532 123 45 67" autoComplete="off" />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" icon={Check} className="flex-1">
              {editId ? "Güncelle" : "Ekle"}
            </Button>
            {editId ? (
              <Button
                type="button"
                kind="ghost"
                onClick={() => {
                  setEditId(null);
                  setAd("");
                  setTel("");
                  setErr({});
                  setMode("liste");
                }}
              >
                Vazgeç
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      {/* ---------------- müşteri takip */}
      {mode === "musteri" ? (
        <div className="mt-4">
          <div className="text-[15px] font-extrabold text-navy">Müşteri Takip&apos;ten yükle</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">Bir program seçin; o programdaki kursiyerler telefonlarıyla birlikte sınıfa eklenir.</p>
          {groups.length ? (
            <div className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {groups.map((g) => (
                <button
                  key={g.key || "__grupsuz"}
                  type="button"
                  onClick={() => importGroup(g.key, g.name)}
                  className="flex w-full items-center gap-3 bg-white px-3.5 py-3 text-left transition hover:bg-paper"
                >
                  <Users size={18} className="shrink-0 text-brand-teal" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-navy">{g.name}</span>
                    <span className="block text-[11.5px] text-muted">
                      {g.tel} numaralı{g.added ? ` · ${g.added} kişi zaten sınıfta` : ""}
                    </span>
                  </span>
                  <Badge tone="teal" className="num">
                    {g.n} kişi
                  </Badge>
                  <Download size={17} className="shrink-0 text-muted" />
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-2xl bg-paper px-4 py-3 text-[13px] text-muted">Müşteri Takip&apos;te kayıt yok.</div>
          )}
        </div>
      ) : null}

      {/* ---------------- liste */}
      {mode === "liste" ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="section-label">Üyeler</div>
            <span className="num text-[11.5px] text-muted">{numarali} numaralı</span>
          </div>
          {uyeler.length > 8 ? (
            <div className="relative mb-2">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Üye ara…"
                className="h-9 w-full rounded-xl border border-line bg-white pl-8 pr-3 text-[13px] outline-none focus:border-brand-blue"
              />
            </div>
          ) : null}
          {uyeler.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-paper/60 px-4 py-6 text-center">
              <UserPlus size={22} className="mx-auto text-brand-blue" />
              <div className="mt-2 text-[13px] text-muted">Henüz üye yok. &quot;Liste yapıştır&quot; ile numaraları yükleyin.</div>
              <Button small kind="secondary" className="mt-3" onClick={() => setMode("yapistir")}>
                Liste yapıştır
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {shown.map((u) => (
                <div key={u.id} className="flex items-center gap-2.5 rounded-2xl border border-line/70 bg-white p-2.5 shadow-card">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E1F2F3] text-[14px] font-extrabold text-brand-teal">
                    {upperTR(u.ad.trim().slice(0, 1)) || "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13.5px] font-bold text-navy">{u.ad}</span>
                      {u.kursiyer_id ? (
                        <Badge tone="blue" className="!px-1.5 !py-0 !text-[10px]">
                          kursiyer
                        </Badge>
                      ) : null}
                    </div>
                    <div className={cx("num text-[12px]", u.telefon ? "text-muted" : "text-danger")}>{u.telefon ? prettyPhone(u.telefon) : "numara yok"}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(u)}
                    aria-label={`${u.ad} düzenle`}
                    title="Düzenle"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-brand-teal hover:bg-[#E1F2F3]"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(u)}
                    aria-label={`${u.ad} çıkar`}
                    title="Çıkar"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-danger hover:bg-soft-danger"
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
              {shown.length === 0 ? <div className="py-4 text-center text-[13px] text-muted">Eşleşen üye yok.</div> : null}
            </div>
          )}
          {onDone && uyeler.length ? (
            <Button icon={MessagesSquare} block className="mt-3" onClick={onDone}>
              Sohbete git
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
