"use client";

import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type {
  Analysis,
  Category,
  ChatMsg,
  Cevap,
  Denetim,
  DenetimInput,
  Kasa,
  Kursiyer,
  KursiyerInput,
  Mesaj,
  MesajKanal,
  Olay,
  OlayInput,
  PayMethod,
  RiskRow,
  RiskRowInput,
  Settings,
  Sinif,
  SinavSonuc,
  Trx,
  TrxType,
  Uye,
} from "./types";
import { nowIso, norm, today } from "./format";
import { buildDemoData } from "./demo";

// Veriler tarayıcıda IndexedDB'de tutulur (mobil uygulamadaki çevrimdışı SQLite'ın web karşılığı).
// IndexedDB kullanılamazsa (bazı gizli sekmeler) localStorage'a, o da yoksa belleğe düşer.
const idbStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return (await idbGet<string>(name)) ?? null;
    } catch {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
  },
  setItem: async (name, value) => {
    try {
      await idbSet(name, value);
    } catch {
      try {
        localStorage.setItem(name, value);
      } catch {
        /* kalıcı depolama yok */
      }
    }
  },
  removeItem: async (name) => {
    try {
      await idbDel(name);
    } catch {
      /* yok say */
    }
    try {
      localStorage.removeItem(name);
    } catch {
      /* yok say */
    }
  },
};

export const SEED_KASALAR = ["Şirket / Kasa"];
export const SEED_CATEGORIES: Array<[TrxType, string]> = [
  ["gelir", "Tahsilat"],
  ["gelir", "Eğitim Geliri"],
  ["gelir", "Risk Analizi Geliri"],
  ["gelir", "OSGB Hizmet Geliri"],
  ["gelir", "Diğer Gelir"],
  ["gider", "Genel Gider"],
  ["gider", "Personel Maaş"],
  ["gider", "Kira"],
  ["gider", "Kırtasiye"],
  ["gider", "Ulaşım / Yakıt"],
  ["gider", "Vergi / SGK"],
  ["gider", "Reklam"],
  ["gider", "Diğer Gider"],
];

export interface Data {
  seq: number;
  kasalar: Kasa[];
  categories: Category[];
  transactions: Trx[];
  kursiyerler: Kursiyer[];
  analyses: Analysis[];
  riskRows: RiskRow[];
  sinavSonuclari: SinavSonuc[];
  olaylar: Olay[];
  denetimler: Denetim[];
  siniflar: Sinif[];
  uyeler: Uye[];
  mesajlar: Mesaj[];
  chat: ChatMsg[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = { model: "claude-opus-5-5", effort: "medium", firma: "" };

export function initialData(): Data {
  let seq = 0;
  const kasalar: Kasa[] = SEED_KASALAR.map((title) => ({ id: ++seq, title, is_active: true }));
  const categories: Category[] = SEED_CATEGORIES.map(([type, name]) => ({ id: ++seq, type, name }));
  return {
    seq,
    kasalar,
    categories,
    transactions: [],
    kursiyerler: [],
    analyses: [],
    riskRows: [],
    sinavSonuclari: [],
    olaylar: [],
    denetimler: [],
    siniflar: [],
    uyeler: [],
    mesajlar: [],
    chat: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

const DATA_KEYS: (keyof Data)[] = [
  "seq",
  "kasalar",
  "categories",
  "transactions",
  "kursiyerler",
  "analyses",
  "riskRows",
  "sinavSonuclari",
  "olaylar",
  "denetimler",
  "siniflar",
  "uyeler",
  "mesajlar",
  "chat",
  "settings",
];

export interface TrxInput {
  trx_date?: string;
  type: TrxType;
  kasa_id: number | null;
  category_id: number | null;
  payment_method?: PayMethod;
  description: string;
  amount: number;
}

export interface Actions {
  // kasa / kategori
  addKasa: (title: string) => number;
  renameKasa: (id: number, title: string) => void;
  deactivateKasa: (id: number) => void;
  addCategory: (type: TrxType, name: string) => number;
  removeCategory: (id: number) => void;
  // hareketler
  addTrx: (t: TrxInput) => number;
  updateTrx: (id: number, t: TrxInput) => void;
  deleteTrx: (id: number) => void;
  // kursiyer
  addKursiyer: (k: KursiyerInput) => number;
  updateKursiyer: (id: number, k: KursiyerInput) => void;
  deleteKursiyer: (id: number) => void;
  addPayment: (id: number, amount: number, method: "nakit" | "banka", kasaId: number | null) => void;
  // risk
  createAnalysis: (a: Pick<Analysis, "title" | "nace_code" | "sector_name" | "hazard_class" | "hazard_auto" | "description" | "item_count">) => number;
  updateAnalysis: (id: number, patch: Partial<Analysis>) => void;
  deleteAnalysis: (id: number) => void;
  appendRows: (analysisId: number, rows: RiskRowInput[]) => void;
  clearRows: (analysisId: number) => void;
  updateRow: (id: number, r: RiskRowInput) => void;
  deleteRow: (id: number) => void;
  // sınav
  saveSonuc: (r: Omit<SinavSonuc, "id" | "created_at">) => void;
  // kaza / ramak kala
  saveOlay: (o: OlayInput, id?: number | null) => number;
  deleteOlay: (id: number) => void;
  // denetim
  saveDenetim: (d: DenetimInput, id?: number | null) => number;
  deleteDenetim: (id: number) => void;
  // sınıflar
  addSinif: (ad: string, aciklama: string, renk: string) => number;
  updateSinif: (id: number, ad: string, aciklama: string, renk: string) => void;
  deleteSinif: (id: number) => void;
  addUye: (sinifId: number, ad: string, telefon: string | null, not_?: string, kursiyerId?: number | null) => number;
  updateUye: (id: number, ad: string, telefon: string | null, not_: string) => void;
  deleteUye: (id: number) => void;
  bulkAddUye: (sinifId: number, rows: { ad: string; telefon: string | null; kursiyer_id?: number | null }[]) => { ok: number; skip: number };
  addMesaj: (sinifId: number, metin: string, kanal: MesajKanal, alici: number) => number;
  deleteMesaj: (id: number) => void;
  // asistan sohbeti
  addChat: (role: ChatMsg["role"], content: string) => number;
  clearChat: () => void;
  // ayarlar & yedek
  setSettings: (patch: Partial<Settings>) => void;
  exportData: () => Data;
  importData: (d: Partial<Data>) => void;
  resetAll: () => void;
  loadDemo: () => void;
}

export type Store = Data & Actions;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * KasaCari'deki kursiyer_sync_kasa mantığı: tahsilat = toplam − kalan.
 * Kasa seçili ve tahsilat > 0 ise transactions'a ref_type='kursiyer' ile TEK gelir kaydı upsert edilir;
 * aksi hâlde bağlı kayıt silinir. Böylece kursiyer parası kasada çift sayılmaz.
 */
function syncKasa(s: Data, kursiyerId: number): Data {
  const k = s.kursiyerler.find((x) => x.id === kursiyerId);
  const existing = s.transactions.find((t) => t.ref_type === "kursiyer" && t.ref_id === kursiyerId);
  if (!k) {
    return existing ? { ...s, transactions: s.transactions.filter((t) => t !== existing) } : s;
  }
  const collected = round2(k.total_amount - k.remaining_amount);
  if (!k.kasa_id || collected <= 0 || !k.is_active) {
    return existing ? { ...s, transactions: s.transactions.filter((t) => t !== existing) } : s;
  }
  const cat = s.categories.find((c) => c.type === "gelir" && norm(c.name).includes("tahsilat")) ?? s.categories.find((c) => c.type === "gelir");
  const method: PayMethod = k.cash_amount > 0 && k.bank_amount === 0 ? "nakit" : "banka";
  const description = `Kursiyer tahsilatı: ${k.full_name}${k.group_name ? ` (${k.group_name})` : ""}`;
  const trx_date = k.invoice_issue_date || today();
  if (existing) {
    const upd: Trx = { ...existing, trx_date, kasa_id: k.kasa_id, category_id: cat?.id ?? null, payment_method: method, description, amount: collected };
    return { ...s, transactions: s.transactions.map((t) => (t === existing ? upd : t)) };
  }
  const id = s.seq + 1;
  const t: Trx = {
    id,
    trx_date,
    type: "gelir",
    kasa_id: k.kasa_id,
    category_id: cat?.id ?? null,
    payment_method: method,
    description,
    amount: collected,
    ref_type: "kursiyer",
    ref_id: kursiyerId,
    created_at: nowIso(),
  };
  return { ...s, seq: id, transactions: [...s.transactions, t] };
}

function pickData(s: Store | Data): Data {
  const out = {} as Record<string, unknown>;
  for (const k of DATA_KEYS) out[k] = (s as unknown as Record<string, unknown>)[k];
  return out as unknown as Data;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      /** Yeni benzersiz id üretir (tüm tablolarda ortak sayaç). */
      const nextId = () => {
        const id = get().seq + 1;
        set({ seq: id });
        return id;
      };

      return {
        ...initialData(),

        // ---------- kasa ----------
        addKasa: (title) => {
          const id = nextId();
          set((s) => ({ kasalar: [...s.kasalar, { id, title: title.trim(), is_active: true }] }));
          return id;
        },
        renameKasa: (id, title) => set((s) => ({ kasalar: s.kasalar.map((k) => (k.id === id ? { ...k, title: title.trim() } : k)) })),
        deactivateKasa: (id) => set((s) => ({ kasalar: s.kasalar.map((k) => (k.id === id ? { ...k, is_active: false } : k)) })),
        addCategory: (type, name) => {
          const id = nextId();
          set((s) => ({ categories: [...s.categories, { id, type, name: name.trim() }] }));
          return id;
        },
        removeCategory: (id) =>
          set((s) => ({
            categories: s.categories.filter((c) => c.id !== id),
            transactions: s.transactions.map((t) => (t.category_id === id ? { ...t, category_id: null } : t)),
          })),

        // ---------- hareketler ----------
        addTrx: (t) => {
          const id = nextId();
          const row: Trx = {
            id,
            trx_date: t.trx_date || today(),
            type: t.type,
            kasa_id: t.kasa_id,
            category_id: t.category_id,
            payment_method: t.payment_method || "nakit",
            description: t.description.trim(),
            amount: round2(t.amount),
            ref_type: "manual",
            ref_id: null,
            created_at: nowIso(),
          };
          set((s) => ({ transactions: [...s.transactions, row] }));
          return id;
        },
        updateTrx: (id, t) =>
          set((s) => ({
            transactions: s.transactions.map((x) =>
              x.id === id && x.ref_type === "manual"
                ? {
                    ...x,
                    trx_date: t.trx_date || today(),
                    type: t.type,
                    kasa_id: t.kasa_id,
                    category_id: t.category_id,
                    payment_method: t.payment_method || "nakit",
                    description: t.description.trim(),
                    amount: round2(t.amount),
                  }
                : x,
            ),
          })),
        deleteTrx: (id) => set((s) => ({ transactions: s.transactions.filter((x) => !(x.id === id && x.ref_type === "manual")) })),

        // ---------- kursiyer ----------
        addKursiyer: (k) => {
          const id = nextId();
          const row: Kursiyer = {
            ...k,
            full_name: k.full_name.trim(),
            total_amount: round2(k.total_amount),
            cash_amount: round2(k.cash_amount),
            bank_amount: round2(k.bank_amount),
            remaining_amount: round2(Math.max(0, k.total_amount - k.cash_amount - k.bank_amount)),
            id,
            is_active: true,
            created_at: nowIso(),
          };
          set((s) => syncKasa({ ...pickData(s), kursiyerler: [...s.kursiyerler, row] }, id));
          return id;
        },
        updateKursiyer: (id, k) =>
          set((s) =>
            syncKasa(
              {
                ...pickData(s),
                kursiyerler: s.kursiyerler.map((x) =>
                  x.id === id
                    ? {
                        ...x,
                        ...k,
                        full_name: k.full_name.trim(),
                        remaining_amount: round2(Math.max(0, k.total_amount - k.cash_amount - k.bank_amount)),
                      }
                    : x,
                ),
              },
              id,
            ),
          ),
        deleteKursiyer: (id) =>
          set((s) => ({
            kursiyerler: s.kursiyerler.filter((k) => k.id !== id),
            transactions: s.transactions.filter((t) => !(t.ref_type === "kursiyer" && t.ref_id === id)),
            uyeler: s.uyeler.map((u) => (u.kursiyer_id === id ? { ...u, kursiyer_id: null } : u)),
          })),
        addPayment: (id, amount, method, kasaId) => {
          const k = get().kursiyerler.find((x) => x.id === id);
          if (!k) throw new Error("Kursiyer bulunamadı.");
          if (k.remaining_amount <= 0.005) throw new Error("Bu kaydın kalan borcu yok.");
          if (!(amount > 0)) throw new Error("Tutar sıfırdan büyük olmalı.");
          if (amount > k.remaining_amount + 0.005) throw new Error(`Tutar kalan borcu (${k.remaining_amount.toLocaleString("tr-TR")} ₺) aşıyor.`);
          const upd: Kursiyer = {
            ...k,
            cash_amount: round2(k.cash_amount + (method === "nakit" ? amount : 0)),
            bank_amount: round2(k.bank_amount + (method === "banka" ? amount : 0)),
            remaining_amount: round2(Math.max(0, k.remaining_amount - amount)),
            kasa_id: kasaId ?? k.kasa_id,
            invoice_issue_date: k.invoice_issue_date || today(),
          };
          set((s) => syncKasa({ ...pickData(s), kursiyerler: s.kursiyerler.map((x) => (x.id === id ? upd : x)) }, id));
        },

        // ---------- risk ----------
        createAnalysis: (a) => {
          const id = nextId();
          const row: Analysis = {
            id,
            title: a.title.trim(),
            nace_code: a.nace_code.trim(),
            sector_name: a.sector_name.trim(),
            hazard_class: a.hazard_class,
            hazard_auto: a.hazard_auto,
            description: a.description.trim(),
            item_count: a.item_count,
            activity_desc: "",
            personnel: "",
            employer_label: "",
            sektor_uygulama: "",
            status: "taslak",
            analysis_date: today(),
            created_at: nowIso(),
          };
          set((s) => ({ analyses: [...s.analyses, row] }));
          return id;
        },
        updateAnalysis: (id, patch) => set((s) => ({ analyses: s.analyses.map((a) => (a.id === id ? { ...a, ...patch, id } : a)) })),
        deleteAnalysis: (id) =>
          set((s) => ({ analyses: s.analyses.filter((a) => a.id !== id), riskRows: s.riskRows.filter((r) => r.analysis_id !== id) })),
        appendRows: (analysisId, rows) =>
          set((s) => {
            let seq = s.seq;
            let n = s.riskRows.filter((r) => r.analysis_id === analysisId).reduce((m, r) => Math.max(m, r.sort_no), 0);
            const add: RiskRow[] = rows.map((r) => ({ ...r, id: ++seq, analysis_id: analysisId, sort_no: ++n }));
            return { seq, riskRows: [...s.riskRows, ...add] };
          }),
        clearRows: (analysisId) => set((s) => ({ riskRows: s.riskRows.filter((r) => r.analysis_id !== analysisId) })),
        updateRow: (id, r) => set((s) => ({ riskRows: s.riskRows.map((x) => (x.id === id ? { ...x, ...r } : x)) })),
        deleteRow: (id) => set((s) => ({ riskRows: s.riskRows.filter((x) => x.id !== id) })),

        // ---------- sınav ----------
        saveSonuc: (r) => {
          const id = nextId();
          set((s) => ({ sinavSonuclari: [...s.sinavSonuclari, { ...r, id, created_at: nowIso() }] }));
        },

        // ---------- olaylar ----------
        saveOlay: (o, id) => {
          if (id) {
            set((s) => ({ olaylar: s.olaylar.map((x) => (x.id === id ? { ...x, ...o } : x)) }));
            return id;
          }
          const nid = nextId();
          set((s) => ({ olaylar: [...s.olaylar, { ...o, id: nid, created_at: nowIso() }] }));
          return nid;
        },
        deleteOlay: (id) => set((s) => ({ olaylar: s.olaylar.filter((x) => x.id !== id) })),

        // ---------- denetim ----------
        saveDenetim: (d, id) => {
          if (id) {
            set((s) => ({ denetimler: s.denetimler.map((x) => (x.id === id ? { ...x, ...d } : x)) }));
            return id;
          }
          const nid = nextId();
          set((s) => ({ denetimler: [...s.denetimler, { ...d, id: nid, created_at: nowIso() }] }));
          return nid;
        },
        deleteDenetim: (id) => set((s) => ({ denetimler: s.denetimler.filter((x) => x.id !== id) })),

        // ---------- sınıflar ----------
        addSinif: (ad, aciklama, renk) => {
          const id = nextId();
          set((s) => ({ siniflar: [...s.siniflar, { id, ad: ad.trim(), aciklama: aciklama.trim(), renk, created_at: nowIso() }] }));
          return id;
        },
        updateSinif: (id, ad, aciklama, renk) =>
          set((s) => ({ siniflar: s.siniflar.map((x) => (x.id === id ? { ...x, ad: ad.trim(), aciklama: aciklama.trim(), renk } : x)) })),
        deleteSinif: (id) =>
          set((s) => ({
            siniflar: s.siniflar.filter((x) => x.id !== id),
            uyeler: s.uyeler.filter((u) => u.sinif_id !== id),
            mesajlar: s.mesajlar.filter((m) => m.sinif_id !== id),
          })),
        addUye: (sinifId, ad, telefon, not_ = "", kursiyerId = null) => {
          const id = nextId();
          set((s) => ({ uyeler: [...s.uyeler, { id, sinif_id: sinifId, ad: ad.trim(), telefon, not_, kursiyer_id: kursiyerId, created_at: nowIso() }] }));
          return id;
        },
        updateUye: (id, ad, telefon, not_) => set((s) => ({ uyeler: s.uyeler.map((u) => (u.id === id ? { ...u, ad: ad.trim(), telefon, not_ } : u)) })),
        deleteUye: (id) => set((s) => ({ uyeler: s.uyeler.filter((u) => u.id !== id) })),
        bulkAddUye: (sinifId, rows) => {
          const s = get();
          const existing = s.uyeler.filter((u) => u.sinif_id === sinifId);
          const phones = new Set(existing.map((u) => u.telefon).filter(Boolean) as string[]);
          const names = new Set(existing.map((u) => norm(u.ad)));
          let ok = 0;
          let skip = 0;
          let seq = s.seq;
          const add: Uye[] = [];
          for (const r of rows) {
            if ((r.telefon && phones.has(r.telefon)) || (!r.telefon && names.has(norm(r.ad)))) {
              skip += 1;
              continue;
            }
            add.push({ id: ++seq, sinif_id: sinifId, ad: r.ad.trim(), telefon: r.telefon, not_: "", kursiyer_id: r.kursiyer_id ?? null, created_at: nowIso() });
            if (r.telefon) phones.add(r.telefon);
            names.add(norm(r.ad));
            ok += 1;
          }
          set({ seq, uyeler: [...s.uyeler, ...add] });
          return { ok, skip };
        },
        addMesaj: (sinifId, metin, kanal, alici) => {
          const id = nextId();
          set((s) => ({ mesajlar: [...s.mesajlar, { id, sinif_id: sinifId, metin: metin.trim(), kanal, alici_sayisi: alici, created_at: nowIso() }] }));
          return id;
        },
        deleteMesaj: (id) => set((s) => ({ mesajlar: s.mesajlar.filter((m) => m.id !== id) })),

        // ---------- asistan ----------
        addChat: (role, content) => {
          const id = nextId();
          set((s) => ({ chat: [...s.chat, { id, role, content, created_at: nowIso() }].slice(-200) }));
          return id;
        },
        clearChat: () => set({ chat: [] }),

        // ---------- ayarlar & yedek ----------
        setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
        exportData: () => pickData(get()),
        importData: (d) => {
          const base = initialData();
          const merged = { ...base } as Record<string, unknown>;
          for (const k of DATA_KEYS) {
            const v = (d as Record<string, unknown>)[k];
            if (v !== undefined && v !== null) merged[k] = v;
          }
          const data = merged as unknown as Data;
          data.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
          set(data);
        },
        resetAll: () => set(initialData()),
        loadDemo: () => {
          const { data, kursiyerIds } = buildDemoData(pickData(get()));
          set(kursiyerIds.reduce((acc, kid) => syncKasa(acc, kid), data));
        },
      };
    },
    {
      name: "isgora-data",
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => pickData(s),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted || {}) as Partial<Data>;
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...(p.settings || {}) } };
      },
    },
  ),
);

// ---------- yardımcı seçiciler ----------

export interface KasaBalance {
  id: number;
  title: string;
  gelir: number;
  gider: number;
  bakiye: number;
}

export function kasaBalances(s: Pick<Data, "kasalar" | "transactions">): KasaBalance[] {
  return s.kasalar
    .filter((k) => k.is_active)
    .map((k) => {
      let gelir = 0;
      let gider = 0;
      for (const t of s.transactions) {
        if (t.kasa_id !== k.id) continue;
        if (t.type === "gelir") gelir += t.amount;
        else gider += t.amount;
      }
      return { id: k.id, title: k.title, gelir: round2(gelir), gider: round2(gider), bakiye: round2(gelir - gider) };
    });
}

export function trxTotals(trx: Trx[]): { gelir: number; gider: number; net: number } {
  let gelir = 0;
  let gider = 0;
  for (const t of trx) {
    if (t.type === "gelir") gelir += t.amount;
    else gider += t.amount;
  }
  return { gelir: round2(gelir), gider: round2(gider), net: round2(gelir - gider) };
}

export function monthSummary(trx: Trx[], ym: string): { gelir: number; gider: number } {
  const t = trxTotals(trx.filter((x) => x.trx_date.slice(0, 7) === ym));
  return { gelir: t.gelir, gider: t.gider };
}

export function kursiyerTotals(list: Kursiyer[]): { n: number; total: number; collected: number; remaining: number } {
  const act = list.filter((k) => k.is_active);
  const total = act.reduce((a, k) => a + k.total_amount, 0);
  const remaining = act.reduce((a, k) => a + k.remaining_amount, 0);
  return { n: act.length, total: round2(total), collected: round2(total - remaining), remaining: round2(remaining) };
}

export function analysisSummary(rows: RiskRow[], analysisId: number): { rows: number; max: number } {
  let n = 0;
  let max = 0;
  for (const r of rows) {
    if (r.analysis_id !== analysisId) continue;
    n += 1;
    max = Math.max(max, r.o * r.s);
  }
  return { rows: n, max };
}

export function olayStats(list: Olay[]): { kaza: number; ramak: number; kayip_gun: number; bildirilmemis: number } {
  return {
    kaza: list.filter((o) => o.tur === "kaza").length,
    ramak: list.filter((o) => o.tur === "ramak_kala").length,
    kayip_gun: list.reduce((a, o) => a + (Number(o.kayip_gun) || 0), 0),
    bildirilmemis: list.filter((o) => o.tur === "kaza" && !o.sgk_bildirildi).length,
  };
}

/** Mobil uygulamadaki gibi: kapsam dışı hariç tüm maddeler paydada (cevapsız madde uygun sayılmaz). */
export function denetimPuan(cevaplar: Record<number, Cevap>, maddeSayisi?: number): number {
  const vals = Object.values(cevaplar);
  const total = maddeSayisi ?? vals.length;
  const applicable = total - vals.filter((v) => v === "na").length;
  if (applicable <= 0) return 0;
  return Math.round((vals.filter((v) => v === "uygun").length * 100) / applicable);
}

export function findKasaByName(s: Pick<Data, "kasalar">, name: string): Kasa | null {
  const n = norm(name);
  if (!n) return null;
  const act = s.kasalar.filter((k) => k.is_active);
  return act.find((k) => norm(k.title) === n) ?? act.find((k) => norm(k.title).includes(n)) ?? null;
}

export function findCategoryByName(s: Pick<Data, "categories">, type: TrxType, name?: string | null): Category | null {
  const all = s.categories.filter((c) => c.type === type);
  const n = norm(name || "");
  return (n && (all.find((c) => norm(c.name) === n) ?? all.find((c) => norm(c.name).includes(n)))) || all[0] || null;
}

export function findKursiyerByName(s: Pick<Data, "kursiyerler">, name: string): Kursiyer[] {
  const n = norm(name);
  const act = s.kursiyerler.filter((k) => k.is_active);
  const exact = act.filter((k) => norm(k.full_name) === n);
  if (exact.length) return exact;
  return act.filter((k) => norm(k.full_name).includes(n));
}
