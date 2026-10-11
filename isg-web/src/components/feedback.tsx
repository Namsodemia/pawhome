"use client";

import { create } from "zustand";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Button } from "./ui";
import { cx } from "@/lib/format";

// ---------------------------------------------------------------- Toast

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
}

const useToasts = create<{ items: ToastItem[] }>(() => ({ items: [] }));
let toastSeq = 0;

export function toast(text: string, tone: ToastTone = "success") {
  const id = ++toastSeq;
  useToasts.setState((s) => ({ items: [...s.items, { id, text, tone }] }));
  setTimeout(() => useToasts.setState((s) => ({ items: s.items.filter((t) => t.id !== id) })), tone === "error" ? 6000 : 3200);
}

// ---------------------------------------------------------------- Onay penceresi

interface ConfirmOpts {
  title: string;
  text?: string;
  okLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}
interface ConfirmState extends ConfirmOpts {
  open: boolean;
  resolve?: (v: boolean) => void;
}
const useConfirmState = create<ConfirmState>(() => ({ open: false, title: "" }));

/** window.confirm yerine marka temalı, Promise tabanlı onay penceresi */
export function confirmDialog(opts: ConfirmOpts): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmState.setState({ ...opts, open: true, resolve });
  });
}

function close(v: boolean) {
  const s = useConfirmState.getState();
  s.resolve?.(v);
  useConfirmState.setState({ open: false, resolve: undefined });
}

export function FeedbackHost() {
  const items = useToasts((s) => s.items);
  const c = useConfirmState();
  return (
    <>
      <div className="no-print pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              "pointer-events-auto flex max-w-md animate-slide-up items-start gap-2.5 rounded-2xl px-4 py-3 text-[14px] font-semibold shadow-pop",
              t.tone === "success" ? "bg-navy text-white" : t.tone === "error" ? "bg-danger text-white" : "bg-white text-navy",
            )}
          >
            {t.tone === "success" ? <CircleCheck size={18} className="mt-0.5 shrink-0 text-brand-mint" /> : t.tone === "error" ? <TriangleAlert size={18} className="mt-0.5 shrink-0" /> : <Info size={18} className="mt-0.5 shrink-0 text-brand-blue" />}
            <span className="whitespace-pre-line">{t.text}</span>
          </div>
        ))}
      </div>
      {c.open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-5">
          <div className="absolute inset-0 animate-fade-in bg-navy-deep/45 backdrop-blur-[2px]" onClick={() => close(false)} />
          <div role="alertdialog" aria-modal="true" className="relative w-full max-w-sm animate-pop-in rounded-xl3 bg-white p-6 shadow-pop">
            <div className={cx("mb-3 flex h-11 w-11 items-center justify-center rounded-2xl", c.danger ? "bg-soft-danger text-danger" : "bg-soft-blue text-brand-blue")}>
              <TriangleAlert size={22} />
            </div>
            <div className="text-[17px] font-extrabold text-navy">{c.title}</div>
            {c.text ? <div className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-muted">{c.text}</div> : null}
            <div className="mt-5 flex gap-2">
              <Button kind="ghost" block onClick={() => close(false)}>
                {c.cancelLabel || "Vazgeç"}
              </Button>
              <Button kind={c.danger ? "danger" : "primary"} block onClick={() => close(true)} autoFocus>
                {c.okLabel || "Onayla"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
