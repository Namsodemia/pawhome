"use client";

import type { ReactNode } from "react";
import { cx } from "@/lib/format";

/**
 * `Field` ile aynı görünüm, ancak <label> yerine <div role="group">.
 * Çip / segment gibi birden çok butonlu seçiciler için: <label> içinde olurlarsa
 * etiket metnine tıklamak ilk butonu tetikler.
 */
export function FieldGroup({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cx("block", className)}>
      {label ? <div className="mb-1.5 block text-[12.5px] font-bold text-navy">{label}</div> : null}
      {children}
      {error ? (
        <div className="mt-1 block text-[12px] font-semibold text-danger">{error}</div>
      ) : hint ? (
        <div className="mt-1.5 block text-[12px] leading-relaxed text-muted">{hint}</div>
      ) : null}
    </div>
  );
}
