"use client";

import { create } from "zustand";
import type {
  BetaMessage,
  BetaMessageParam,
  BetaToolResultBlockParam,
  BetaToolUseBlock,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { Effort, ModelId } from "@/lib/types";
import { useStore } from "@/lib/store";
import { currentEffort, currentModel, describeError, newQueryId, refreshAiStatus } from "@/lib/ai/client";
import { buildConversation, callAssistant, replyText, runAction, toolUses } from "@/lib/ai/assistant";

/**
 * Asistan oturum durumu bileşen dışında tutulur; sayfadan ayrılıp dönünce akış ve bekleyen onaylar kaybolmaz.
 * Kalıcı sohbet (kullanıcı/asistan/sistem mesajları) store'daki `chat` dizisindedir.
 */

export type Decision = "ok" | "no";

export interface PendingApproval {
  /** Bu isteğe kadar gönderilen mesajlar (değiştirilmez, yalnızca eklenir) */
  messages: BetaMessageParam[];
  /** Modelin yanıtı — thinking blokları dahil olduğu gibi geri gönderilir */
  response: BetaMessage;
  tools: BetaToolUseBlock[];
  decisions: Record<string, Decision>;
  model: ModelId;
  effort: Effort;
  round: number;
  /** Bu sorunun kimliği — araç turları da aynı sorgu sayılır */
  queryId: string;
}

interface SessionState {
  busy: boolean;
  streamText: string;
  pending: PendingApproval | null;
}

export const useAsistan = create<SessionState>(() => ({ busy: false, streamText: "", pending: null }));

const MAX_ROUNDS = 8;
let controller: AbortController | null = null;
let turnSeq = 0;

const addChat = (role: "user" | "assistant" | "system", content: string) => useStore.getState().addChat(role, content);

export function toolTitle(name: string): string {
  return name.replace(/_/g, " ");
}

/** Bekleyen (karar verilmemiş) işlemleri iptal eder ve bildirir. */
function cancelPending(note: boolean) {
  const p = useAsistan.getState().pending;
  if (!p) return;
  if (note) for (const t of p.tools) if (!p.decisions[t.id]) addChat("system", `⚠️ İşlem onaylanmadı: ${toolTitle(t.name)}`);
  useAsistan.setState({ pending: null });
}

/** Yeni kullanıcı mesajı → yeni tur. */
export async function sendMessage(question: string): Promise<void> {
  const q = question.trim();
  if (!q || useAsistan.getState().busy) return;
  cancelPending(true);
  const before = useStore.getState().chat;
  const messages = buildConversation(before, q);
  addChat("user", q);
  // Model ve effort tur boyunca sabit kalır (thinking blokları modele bağlıdır)
  await runRound(messages, currentModel(), currentEffort(), 0, newQueryId());
}

async function runRound(messages: BetaMessageParam[], model: ModelId, effort: Effort, round: number, queryId: string): Promise<void> {
  const my = ++turnSeq;
  const ac = new AbortController();
  controller = ac;
  useAsistan.setState({ busy: true, streamText: "" });
  let partial = "";
  try {
    const res = await callAssistant(messages, {
      model,
      effort,
      signal: ac.signal,
      queryId,
      onText: (t) => {
        partial = t;
        if (my === turnSeq) useAsistan.setState({ streamText: t });
      },
    });
    if (my !== turnSeq) return;
    if (res.stop_reason === "refusal") {
      useAsistan.setState({ streamText: "" });
      addChat("system", "Model bu isteği reddetti.");
      return;
    }
    const text = replyText(res);
    const tools = toolUses(res);
    if (text) addChat("assistant", text);
    useAsistan.setState({ streamText: "" });

    if (res.stop_reason === "tool_use" && tools.length) {
      if (round >= MAX_ROUNDS) {
        addChat("system", "İşlem zinciri çok uzadı; isteği bölerek tekrar deneyin.");
        return;
      }
      useAsistan.setState({ pending: { messages, response: res, tools, decisions: {}, model, effort, round, queryId } });
      return;
    }
    if (res.stop_reason === "max_tokens") addChat("system", "Yanıt uzunluk sınırına takıldı; soruyu daraltarak tekrar deneyin.");
    else if (!text && round === 0) addChat("system", "Asistan boş yanıt döndürdü.");
  } catch (e) {
    if (my !== turnSeq) return;
    useAsistan.setState({ streamText: "" });
    if (ac.signal.aborted) {
      if (partial.trim()) addChat("assistant", partial.trim() + " …");
      addChat("system", "Yanıt durduruldu.");
    } else {
      addChat("system", describeError(e));
    }
  } finally {
    refreshAiStatus();
    if (my === turnSeq) {
      controller = null;
      useAsistan.setState({ busy: false });
    }
  }
}

/** Onay kartında Onayla / Vazgeç. Tüm kartlar karara bağlanınca işlemler uygulanır ve model sonuçlarla devam eder. */
export function decide(toolUseId: string, d: Decision): void {
  const p = useAsistan.getState().pending;
  if (!p || p.decisions[toolUseId] || useAsistan.getState().busy) return;
  const next: PendingApproval = { ...p, decisions: { ...p.decisions, [toolUseId]: d } };
  if (!next.tools.every((t) => next.decisions[t.id])) {
    useAsistan.setState({ pending: next });
    return;
  }
  useAsistan.setState({ pending: null });
  void resolve(next);
}

async function resolve(p: PendingApproval): Promise<void> {
  const results: BetaToolResultBlockParam[] = [];
  for (const t of p.tools) {
    if (p.decisions[t.id] === "ok") {
      try {
        const out = runAction(t.name, (t.input ?? {}) as Record<string, unknown>);
        addChat("system", "✅ " + out);
        results.push({ type: "tool_result", tool_use_id: t.id, content: out });
      } catch (e) {
        const msg = describeError(e);
        addChat("system", "⚠️ " + msg);
        results.push({ type: "tool_result", tool_use_id: t.id, content: msg, is_error: true });
      }
    } else {
      addChat("system", `⚠️ İşlem onaylanmadı: ${toolTitle(t.name)}`);
      results.push({ type: "tool_result", tool_use_id: t.id, content: "Kullanıcı işlemi onaylamadı.", is_error: true });
    }
  }
  // Yalnızca ekleme: önceki mesajlar + modelin yanıtı (değiştirilmeden) + tüm araç sonuçları tek kullanıcı mesajında
  const messages: BetaMessageParam[] = [...p.messages, { role: "assistant", content: p.response.content }, { role: "user", content: results }];
  await runRound(messages, p.model, p.effort, p.round + 1, p.queryId);
}

/** Akışı durdurur. */
export function stopStreaming(): void {
  controller?.abort();
}

/** Sohbet temizlenince oturumu sıfırlar. */
export function resetSession(): void {
  turnSeq += 1;
  controller?.abort();
  controller = null;
  useAsistan.setState({ busy: false, streamText: "", pending: null });
}
