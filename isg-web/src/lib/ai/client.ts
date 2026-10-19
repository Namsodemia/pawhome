"use client";

import Anthropic from "@anthropic-ai/sdk";
import type { Effort, ModelId } from "@/lib/types";
import { useStore } from "@/lib/store";

/**
 * İki çalışma modu:
 *  1) Kullanıcı kendi Anthropic API anahtarını Ayarlar'dan bu tarayıcı için girer → istek doğrudan tarayıcıdan gider.
 *  2) Anahtar girilmemişse istek /api/anthropic vekiline gider; PHP sunucu (public/api/index.php) veritabanında
 *     ya da config.php'de saklanan sunucu anahtarını ekler. Vekil yalnızca giriş yapmış kullanıcıya açıktır.
 */

export const MODELS: { id: ModelId; label: string; note: string }[] = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5", note: "En güçlü, en isabetli Türkçe" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", note: "Dengeli hız/maliyet" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", note: "En hızlı ve en ucuz" },
];
export const DEFAULT_MODEL: ModelId = "claude-opus-5-5";

const KEY_NAME = "anthropic_api_key";
const ACCESS_NAME = "isgora_access_code";

function lsGet(k: string): string {
  try {
    return localStorage.getItem(k) || "";
  } catch {
    return "";
  }
}
function lsSet(k: string, v: string) {
  try {
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
  } catch {
    /* gizli sekme vb. */
  }
}

export const getApiKey = () => lsGet(KEY_NAME).trim();
export const setApiKey = (k: string) => {
  lsSet(KEY_NAME, k.trim());
  _client = null;
  notify();
};
export const getAccessCode = () => lsGet(ACCESS_NAME).trim();
export const setAccessCode = (k: string) => {
  lsSet(ACCESS_NAME, k.trim());
  _client = null;
  notify();
};

// Anahtar değiştiğinde dinleyen bileşenleri (uyarı bandı vb.) güncelle
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
export function subscribeAiConfig(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Ücretsiz deneme sorguları: kendi anahtarı olmayan kullanıcılar ortak anahtarla sınırlı sayıda sorgu yapar */
export interface FreeQuota {
  limit: number;
  used: number;
  left: number;
  /** Yönetici hesabı — ortak anahtarı sınırsız kullanır */
  unlimited: boolean;
}

export interface ServerStatus {
  /** Bu kullanıcının isteklerine eklenecek bir anahtar var mı (kendi anahtarı ya da ücretsiz hakkı kalan ortak anahtar) */
  serverKey: boolean;
  accessCodeRequired: boolean;
  /** Kullanıcı kendi anahtarını kaydetmiş */
  ownKey?: boolean;
  /** Sunucuda ortak anahtar (config.php ya da yöneticinin girdiği) tanımlı */
  sharedKey?: boolean;
  free?: FreeQuota;
}
const NO_STATUS: ServerStatus = { serverKey: false, accessCodeRequired: false };
let _status: Promise<ServerStatus> | null = null;
export function serverStatus(): Promise<ServerStatus> {
  if (!_status) {
    _status = fetch("/api/index.php?r=ai-status", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<ServerStatus>) : NO_STATUS))
      .catch(() => NO_STATUS);
  }
  return _status;
}

/** Bir sorgu bittiğinde kalan ücretsiz hakkı yeniden okut (istemciyi yeniden kurmadan) */
export function refreshAiStatus() {
  _status = null;
  notify();
}

/**
 * Her kullanıcı işlemi (asistana bir soru, bir risk analizi üretimi…) tek "sorgu" sayılır.
 * Aynı işlemin araç turları ve SDK'nın yeniden denemeleri aynı kimliği taşır → sunucu bir kez sayar.
 */
export function newQueryId(): string {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
export function queryHeaders(id: string): Record<string, string> {
  return { "x-isgora-sorgu": id };
}

/** Sunucu anahtarı Ayarlar'dan değiştirildiğinde durum yeniden okunsun */
export function resetServerStatus() {
  _status = null;
  _client = null;
  notify();
}

export type AiMode = "key" | "server" | "none";
export async function aiMode(): Promise<AiMode> {
  if (getApiKey()) return "key";
  const s = await serverStatus();
  // Ücretsiz hakkı biten kullanıcı da vekile gider; yeni sorguyu sunucu 402 ile açıklayarak reddeder
  return s.serverKey || s.sharedKey ? "server" : "none";
}

export class AiError extends Error {}

let _client: Anthropic | null = null;
let _clientSig = "";

export async function client(): Promise<Anthropic> {
  const key = getApiKey();
  if (key) {
    const sig = `key:${key}`;
    if (!_client || _clientSig !== sig) {
      _client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 4, timeout: 600_000 });
      _clientSig = sig;
    }
    return _client;
  }
  const st = await serverStatus();
  // Ortak anahtar varken hakkı bitmiş olsa da vekile gidilir: sayılmış bir sorgunun araç turları sürebilir,
  // yeni sorguyu sunucu 402 + açıklamayla reddeder (describeError).
  if (!st.serverKey && !st.sharedKey) {
    throw new AiError("Anthropic API anahtarı girilmemiş. Ayarlar > Yapay Zekâ bölümünden ekleyin.");
  }
  const code = getAccessCode();
  const sig = `proxy:${code}`;
  if (!_client || _clientSig !== sig) {
    _client = new Anthropic({
      apiKey: "sunucu-vekili",
      baseURL: `${window.location.origin}/api/anthropic`,
      dangerouslyAllowBrowser: true,
      maxRetries: 3,
      timeout: 600_000,
      defaultHeaders: code ? { "x-isgora": "1", "x-isgora-access": code } : { "x-isgora": "1" },
    });
    _clientSig = sig;
  }
  return _client;
}

export function currentModel(): ModelId {
  const m = useStore.getState().settings.model;
  return MODELS.some((x) => x.id === m) ? m : DEFAULT_MODEL;
}

export function currentEffort(): Effort {
  return useStore.getState().settings.effort || "medium";
}

/** Opus 5.5 ve Sonnet 5.5'te güvenlik sınıflandırıcısı reddederse sunucu tarafı yedek modele geçiş */
export function fallbackParams(model: ModelId): { betas?: Anthropic.Beta.AnthropicBeta[]; fallbacks?: "default" } {
  if (model === "claude-haiku-5-5") return {};
  return { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };
}

/** Yanıttaki text bloklarını birleştirir. */
export function textOf(res: { content: Array<{ type: string }> }): string {
  return res.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/** Model bazen JSON dışına metin/kod bloğu sızdırır; ilk { ile son } arasını dener. */
export function extractJson<T = unknown>(text: string): T {
  const t = (text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try {
    return JSON.parse(t) as T;
  } catch {
    /* devam */
  }
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a !== -1 && b > a) {
    try {
      return JSON.parse(t.slice(a, b + 1)) as T;
    } catch {
      /* devam */
    }
  }
  throw new AiError("Model geçerli JSON döndürmedi.");
}

export function quotaMessage(limit: number): string {
  return `Ücretsiz ${limit} yapay zekâ sorgu hakkınız doldu. Devam etmek için Ayarlar > Yapay Zekâ bölümünden kendi Anthropic API anahtarınızı ekleyin.`;
}

export function describeError(e: unknown): string {
  if (e instanceof AiError) return e.message;
  if (e instanceof Anthropic.APIError && e.status === 402) {
    const msg = (e.error as { error?: { message?: string } } | undefined)?.error?.message;
    return msg || quotaMessage(5);
  }
  if (e instanceof Anthropic.AuthenticationError) return "API anahtarı geçersiz. Ayarlardan kontrol edin.";
  if (e instanceof Anthropic.PermissionDeniedError) return e.message?.includes("Oturum") ? "Oturum süresi doldu; sayfayı yenileyip tekrar giriş yapın." : "Erişim reddedildi. API anahtarı yetkilerini kontrol edin.";
  if (e instanceof Anthropic.RateLimitError) return "İstek sınırı aşıldı, biraz sonra tekrar deneyin.";
  if (e instanceof Anthropic.APIConnectionTimeoutError) return "İstek zaman aşımına uğradı. Kaldığı yerden devam edebilirsiniz.";
  if (e instanceof Anthropic.APIConnectionError) return "Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.";
  if (e instanceof Anthropic.APIError) {
    if (e.status === 503) return "Sunucuda API anahtarı tanımlı değil. Ayarlar > Yapay Zekâ bölümünden ekleyin.";
    if (e.status === 529 || e.status === 500) return "Yapay zekâ servisi şu an yoğun, biraz sonra tekrar deneyin.";
    return `API hatası ${e.status ?? ""}: ${e.message}`;
  }
  if (e instanceof Error) return e.message;
  return String(e);
}

/**
 * Yapılandırılmış JSON çıktısı isteyen tek seferlik çağrı.
 * Uzun çıktılar için akış (stream) kullanılır; tamamlanınca mesajın tamamı döner.
 */
export async function callJson<T>(opts: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
  effort?: Effort;
  signal?: AbortSignal;
}): Promise<T> {
  const c = await client();
  const model = currentModel();
  const qid = newQueryId();
  const stream = c.beta.messages.stream(
    {
      model,
      max_tokens: opts.maxTokens ?? 32000,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      output_config: { effort: opts.effort ?? currentEffort(), format: { type: "json_schema", schema: opts.schema } },
      ...fallbackParams(model),
    },
    { signal: opts.signal, headers: queryHeaders(qid) },
  );
  let res;
  try {
    res = await stream.finalMessage();
  } finally {
    refreshAiStatus();
  }
  if (res.stop_reason === "refusal") throw new AiError("Model bu isteği reddetti.");
  if (res.stop_reason === "max_tokens") throw new AiError("Yanıt uzunluk sınırına takıldı; daha az madde ile tekrar deneyin.");
  return extractJson<T>(textOf(res));
}
