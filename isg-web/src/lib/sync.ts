"use client";

import { create } from "zustand";
import type { StateStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";

/**
 * Veri kalıcılığı: PHP + SQLite arka ucu (public/api/index.php).
 *  - Açılışta tüm kayıtlar sunucudan yüklenir; oturum yoksa giriş sayfasına gidilir.
 *  - Her değişiklikten kısa süre sonra yalnızca değişen koleksiyonlar sunucuya gönderilir.
 *  - Başka sekme/cihaz araya kaydettiyse (sürüm çakışması) sayfa en güncel veriyle yenilenir.
 *  - Arka uç hiç yoksa (ör. `next dev`) tarayıcının IndexedDB'sine düşer ("yerel mod").
 */

export type SyncStatus = "loading" | "saved" | "saving" | "error" | "local" | "failed";

export interface SyncInfo {
  status: SyncStatus;
  backend: boolean | null;
  user: string | null;
  /** Kullanıcının adı soyadı (kayıtta girilen) */
  ad: string | null;
  /** Kayıtta seçilen rol: osgb | uzman | hekim | dsp | ogrenci */
  rol: string | null;
  profil: Record<string, string> | null;
  eposta: string | null;
  /** Sunucudaki ilk (kurucu) hesap — ortak yapay zekâ anahtarını yönetir */
  yonetici: boolean;
  /** Hesap bir OSGB'nin çalışanı olarak açıldıysa o OSGB */
  osgb: { id: number; ad: string } | null;
  message: string | null;
}

export const useSync = create<SyncInfo>(() => ({
  status: "loading",
  backend: null,
  user: null,
  ad: null,
  rol: null,
  profil: null,
  eposta: null,
  yonetici: false,
  osgb: null,
  message: null,
}));

const API = "/api/index.php";

let mode: "server" | "local" = "server";
let loadFailed = false;
let baseRev = 0;
let lastSent: Record<string, string> = {};
let pending: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<void> | null = null;
let retryDelay = 0;
let listenersReady = false;

export function apiFetch(route: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API}?r=${route}`, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: { "X-Isgora": "1", ...(init.headers || {}) },
  });
}

export function loginRedirect(): void {
  const next = window.location.pathname + window.location.search;
  window.location.href = `/giris.php?next=${encodeURIComponent(next)}`;
}

export function isServerMode(): boolean {
  return mode === "server" && !loadFailed && useSync.getState().backend === true;
}

function snapshot(state: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(state)) out[k] = JSON.stringify(state[k]);
  return out;
}

function setupListeners() {
  if (listenersReady || typeof window === "undefined") return;
  listenersReady = true;
  window.addEventListener("beforeunload", (e) => {
    if (pending || inflight) {
      void flush();
      e.preventDefault();
      e.returnValue = "";
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && pending) {
      if (timer) clearTimeout(timer);
      void flush();
    }
  });
}

function schedule(ms: number) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flush();
  }, ms);
}

async function flush(): Promise<void> {
  if (inflight) await inflight;
  if (!pending || loadFailed || mode !== "server") return;
  const value = pending;
  pending = null;
  const run = (async () => {
    let state: Record<string, unknown>;
    try {
      state = (JSON.parse(value) as { state: Record<string, unknown> }).state;
    } catch {
      return;
    }
    const snap = snapshot(state);
    const changes: Record<string, unknown> = {};
    for (const k of Object.keys(snap)) if (snap[k] !== lastSent[k]) changes[k] = state[k];
    if (!Object.keys(changes).length) {
      if (!pending) useSync.setState({ status: "saved", message: null });
      return;
    }
    useSync.setState({ status: "saving" });
    try {
      const body = JSON.stringify({ baseRev, changes });
      const r = await apiFetch("data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: body.length < 60000,
      });
      if (r.status === 401) {
        pending = pending ?? value;
        loginRedirect();
        return;
      }
      if (r.status === 409) {
        useSync.setState({ status: "error", message: "Veriler başka bir sekmede/cihazda güncellendi; en güncel hâl yükleniyor…" });
        setTimeout(() => window.location.reload(), 1500);
        loadFailed = true;
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as { rev: number };
      baseRev = j.rev;
      for (const k of Object.keys(changes)) lastSent[k] = snap[k];
      retryDelay = 0;
      useSync.setState({ status: pending ? "saving" : "saved", message: null });
    } catch {
      if (!pending) pending = value;
      retryDelay = Math.min(30000, retryDelay ? retryDelay * 2 : 3000);
      useSync.setState({ status: "error", message: "Sunucuya kaydedilemedi; yeniden deneniyor…" });
      schedule(retryDelay);
    }
  })();
  inflight = run;
  await run;
  inflight = null;
  if (pending && !timer && retryDelay === 0) schedule(300);
}

export const serverStorage: StateStorage = {
  getItem: async (name) => {
    setupListeners();
    let r: Response;
    try {
      r = await apiFetch("data");
    } catch {
      // Ağ hatası: sunucu verisinin üzerine yazmamak için kaydetmeyi kapat
      loadFailed = true;
      useSync.setState({ status: "failed", backend: true, message: "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip sayfayı yenileyin." });
      return null;
    }
    const ct = r.headers.get("content-type") || "";
    if (r.status === 401) {
      loginRedirect();
      return new Promise<string | null>(() => {}); // yönlendirme sürerken iskelet ekranda kalsın
    }
    if (r.status === 404 || !ct.includes("json")) {
      // PHP arka ucu yok → yerel mod (geliştirme / statik önizleme)
      mode = "local";
      useSync.setState({ status: "local", backend: false, message: null });
      try {
        return (await idbGet<string>(name)) ?? null;
      } catch {
        return null;
      }
    }
    if (!r.ok) {
      loadFailed = true;
      let msg = "Sunucu hatası. Sayfayı yenileyin.";
      try {
        msg = ((await r.json()) as { message?: string }).message || msg;
      } catch {
        /* yok say */
      }
      useSync.setState({ status: "failed", backend: true, message: msg });
      return null;
    }
    const j = (await r.json()) as {
      rev: number;
      empty: boolean;
      user: string;
      ad?: string;
      rol?: string;
      profil?: Record<string, string> | null;
      eposta?: string | null;
      yonetici?: boolean;
      osgb?: { id: number; ad: string } | null;
      state: Record<string, unknown>;
    };
    mode = "server";
    baseRev = j.rev;
    useSync.setState({
      status: "saved",
      backend: true,
      user: j.user,
      ad: j.ad ?? null,
      rol: j.rol ?? null,
      profil: j.profil ?? null,
      eposta: j.eposta ?? null,
      yonetici: !!j.yonetici,
      osgb: j.osgb ?? null,
      message: null,
    });
    if (j.empty) {
      lastSent = {};
      return null;
    }
    lastSent = snapshot(j.state);
    return JSON.stringify({ state: j.state, version: 1 });
  },
  setItem: async (name, value) => {
    if (mode === "local") {
      try {
        await idbSet(name, value);
      } catch {
        /* kalıcı depolama yok */
      }
      return;
    }
    if (loadFailed) return;
    pending = value;
    useSync.setState({ status: "saving" });
    schedule(700);
  },
  removeItem: async (name) => {
    try {
      await idbDel(name);
    } catch {
      /* yok say */
    }
  },
};

// ---------------------------------------------------------------- küçük anahtar-değer kayıtları (soru bankası)

export async function kvGet<T>(route: "bank", localKey: string): Promise<T | null> {
  if (useSync.getState().backend) {
    const r = await apiFetch(route);
    if (!r.ok) return null;
    return (await r.json()) as T | null;
  }
  return ((await idbGet<T>(localKey)) ?? null) as T | null;
}

export async function kvSet(route: "bank", localKey: string, value: unknown): Promise<void> {
  if (useSync.getState().backend) {
    const r = await apiFetch(route, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
    if (!r.ok) throw new Error("Sunucuya kaydedilemedi.");
    return;
  }
  await idbSet(localKey, value);
}

export async function kvDel(route: "bank", localKey: string): Promise<void> {
  if (useSync.getState().backend) {
    await apiFetch(route, { method: "DELETE" });
    return;
  }
  await idbDel(localKey);
}
