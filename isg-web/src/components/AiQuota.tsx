"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Gift, KeyRound } from "lucide-react";
import { getApiKey, serverStatus, subscribeAiConfig, type ServerStatus } from "@/lib/ai/client";
import { cx } from "@/lib/format";

/**
 * Ücretsiz yapay zekâ deneme kotası (sunucudaki ortak anahtarla yapılan sorgular).
 *  - Kullanıcının kendi anahtarı varsa (tarayıcıda ya da sunucuda) ya da yönetici sınırsız kullanıyorsa gösterilmez.
 *  - Hak varsa küçük bir rozet, bittiyse Ayarlar'a yönlendiren uyarı kartı.
 */

export type AiQuotaState = { kind: "hidden" } | { kind: "left"; left: number; limit: number } | { kind: "bitti"; limit: number };

const HIDDEN: AiQuotaState = { kind: "hidden" };

export function quotaOf(st: ServerStatus | null, localKey: string): AiQuotaState {
  if (!st || localKey || st.ownKey) return HIDDEN;
  const f = st.free;
  // Ortak anahtar yoksa ücretsiz hak da kullanılamaz; o durumu "anahtar girin" uyarıları anlatır
  if (!f || f.unlimited || st.sharedKey === false) return HIDDEN;
  const limit = Math.max(0, Number(f.limit) || 0);
  if (!limit) return HIDDEN;
  const left = Math.max(0, Math.min(limit, Number(f.left) || 0));
  return left > 0 ? { kind: "left", left, limit } : { kind: "bitti", limit };
}

/** Sunucu durumunu okur; her sorgudan sonra (refreshAiStatus) ve anahtar değişince yenilenir. */
export function useAiQuota(): AiQuotaState {
  const localKey = useSyncExternalStore(subscribeAiConfig, getApiKey, () => "");
  const [st, setSt] = useState<ServerStatus | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => {
      void serverStatus().then((s) => {
        if (alive) setSt(s);
      });
    };
    load();
    const unsub = subscribeAiConfig(load);
    return () => {
      alive = false;
      unsub();
    };
  }, []);
  return quotaOf(st, localKey);
}

/**
 * variant:
 *  - "auto"    → hak varsa rozet, bittiyse uyarı kartı
 *  - "badge"   → yalnızca rozet (hak varken)
 *  - "warning" → yalnızca uyarı kartı (hak bitince)
 * link=false: Ayarlar sayfasının içinde kullanılırken kendine bağlantı vermez.
 */
export function AiQuota({
  variant = "auto",
  link = true,
  className,
}: {
  variant?: "auto" | "badge" | "warning";
  link?: boolean;
  className?: string;
}) {
  const q = useAiQuota();
  if (q.kind === "left" && variant !== "warning") return <AiQuotaBadge left={q.left} limit={q.limit} className={className} />;
  if (q.kind === "bitti" && variant !== "badge") return <AiQuotaWarning limit={q.limit} link={link} className={className} />;
  return null;
}

export function AiQuotaBadge({ left, limit, className }: { left: number; limit: number; className?: string }) {
  const low = left <= 1;
  return (
    <span
      title={`Her hesaba ${limit} ücretsiz yapay zekâ soru hakkı tanınır.`}
      className={cx(
        "inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-bold leading-tight",
        low ? "bg-soft-warn text-warn" : "bg-soft-blue text-brand-blue",
        className,
      )}
    >
      <Gift size={14} strokeWidth={2.5} className="shrink-0" />
      <span className="min-w-0">
        Ücretsiz deneme:{" "}
        <span className="num">
          {left} / {limit}
        </span>{" "}
        soru hakkı kaldı
      </span>
    </span>
  );
}

/** Hak bitince bilgi kartı. `link` eski çağrılarla uyum için kabul edilir; kullanıcılar anahtar girmediğinden Ayarlar'a yönlendirilmez. */
export function AiQuotaWarning({ limit, className }: { limit: number; link?: boolean; className?: string }) {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
        <KeyRound size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-extrabold">Ücretsiz soru hakkınız bitti</span>
        <span className="mt-0.5 block text-[12.5px] font-semibold leading-relaxed">
          {limit} ücretsiz yapay zekâ sorusunun tamamını kullandınız. Daha fazla kullanım için site yöneticisiyle iletişime geçin.
        </span>
      </span>
    </>
  );
  return <div className={cx("flex items-center gap-3 rounded-2xl border border-[#F3DFA9] bg-soft-warn px-4 py-3 text-warn", className)}>{body}</div>;
}
