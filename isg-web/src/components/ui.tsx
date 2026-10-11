"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { ChevronLeft, LoaderCircle, X, type LucideIcon } from "lucide-react";
import { cx, initials } from "@/lib/format";
import { meta } from "@/lib/risk";

// ---------------------------------------------------------------- Logo

export function Logo({ variant = "horizontal", white, className }: { variant?: "horizontal" | "mark" | "full"; white?: boolean; className?: string }) {
  const src =
    variant === "mark" ? "/logo-mark.png" : variant === "full" ? "/logo.png" : white ? "/logo-horizontal-white.png" : "/logo-horizontal.png";
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="İsgora — İş Sağlığı ve Güvenliği App" className={cx("select-none", className)} draggable={false} />;
}

// ---------------------------------------------------------------- Layout parçaları

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: string | boolean;
  actions?: ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back ? (
          typeof back === "string" ? (
            <Link href={back} className="mb-1 inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-brand-blue">
              <ChevronLeft size={16} /> Geri
            </Link>
          ) : (
            <button onClick={() => router.back()} className="mb-1 inline-flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-brand-blue">
              <ChevronLeft size={16} /> Geri
            </button>
          )
        ) : null}
        <h1 className="truncate text-[24px] font-extrabold tracking-tight text-navy md:text-[28px]">{title}</h1>
        {subtitle ? <div className="mt-0.5 text-[13.5px] text-muted">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className,
  onClick,
  href,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  padded?: boolean;
}) {
  const cls = cx(
    "block rounded-xl2 border border-line/70 bg-white shadow-card",
    padded && "p-4 md:p-5",
    (onClick || href) && "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-bar",
    className,
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  if (onClick)
    return (
      <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => (e.key === "Enter" ? onClick() : null)} className={cls}>
        {children}
      </div>
    );
  return <div className={cls}>{children}</div>;
}

export function Hero({ children, tone = "brand", className }: { children: ReactNode; tone?: "brand" | "dark"; className?: string }) {
  return (
    <div
      className={cx(
        "hero-glow relative overflow-hidden rounded-xl3 p-5 text-white shadow-fab md:p-6",
        tone === "brand" ? "bg-brand" : "bg-brandDark",
        className,
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function HeroKicker({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/85">{children}</div>;
}

export function Section({ label, right, children, className }: { label: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("mt-7", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="section-label">{label}</div>
        {right}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------- Butonlar

type BtnKind = "primary" | "secondary" | "ghost" | "danger" | "orange" | "dark" | "white";
const BTN: Record<BtnKind, string> = {
  primary: "bg-brand text-white shadow-fab hover:brightness-105",
  secondary: "bg-soft-blue text-brand-blue hover:bg-[#d6eaf4]",
  ghost: "bg-transparent text-navy hover:bg-paper border border-line",
  danger: "bg-soft-danger text-danger hover:bg-[#fbd5dc]",
  orange: "bg-orange text-white hover:brightness-105",
  dark: "bg-navy text-white hover:bg-navy-deep",
  white: "bg-white text-navy hover:bg-white/90 shadow-card",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: BtnKind;
  small?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  block?: boolean;
}

export function Button({ kind = "primary", small, loading, icon: Icon, block, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        "inline-flex select-none items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-55",
        small ? "h-9 px-3.5 text-[13px]" : "h-11 px-5 text-[14.5px]",
        block && "w-full",
        BTN[kind],
        className,
      )}
    >
      {loading ? <LoaderCircle size={small ? 15 : 17} className="animate-spin" /> : Icon ? <Icon size={small ? 15 : 17} strokeWidth={2.4} /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  kind = "primary",
  small,
  icon: Icon,
  children,
  className,
  block,
  external,
}: {
  href: string;
  kind?: BtnKind;
  small?: boolean;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  block?: boolean;
  external?: boolean;
}) {
  const cls = cx(
    "inline-flex select-none items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[.98]",
    small ? "h-9 px-3.5 text-[13px]" : "h-11 px-5 text-[14.5px]",
    block && "w-full",
    BTN[kind],
    className,
  );
  const inner = (
    <>
      {Icon ? <Icon size={small ? 15 : 17} strokeWidth={2.4} /> : null}
      {children}
    </>
  );
  if (external)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {inner}
      </a>
    );
  return (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  className,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  tone?: "default" | "danger" | "brand";
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition",
        tone === "danger"
          ? "border-soft-danger bg-soft-danger text-danger hover:bg-[#fbd5dc]"
          : tone === "brand"
            ? "border-soft-blue bg-soft-blue text-brand-blue hover:bg-[#d6eaf4]"
            : "border-line bg-white text-navy hover:bg-paper",
        className,
      )}
    >
      <Icon size={18} />
    </button>
  );
}

/** Mobilde sekme çubuğunun üstünde, masaüstünde sağ altta duran gradyan hap buton. */
export function Fab({ label, icon: Icon, href, onClick }: { label: string; icon: LucideIcon; href?: string; onClick?: () => void }) {
  const cls =
    "no-print fixed bottom-[100px] right-4 z-30 inline-flex h-14 items-center gap-2.5 rounded-full bg-brand pl-2 pr-5 text-[14.5px] font-extrabold text-white shadow-fab transition hover:brightness-105 active:scale-[.98] lg:bottom-8 lg:right-8";
  const inner = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-blue">
        <Icon size={20} strokeWidth={2.6} />
      </span>
      {label}
    </>
  );
  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

// ---------------------------------------------------------------- Form alanları

export function Field({ label, hint, error, children, className }: { label?: string; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      {label ? <span className="mb-1.5 block text-[12.5px] font-bold text-navy">{label}</span> : null}
      {children}
      {error ? <span className="mt-1 block text-[12px] font-semibold text-danger">{error}</span> : hint ? <span className="mt-1 block text-[12px] text-muted">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, mono, ...rest }: InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return <input {...rest} className={cx("field", mono && "font-mono", className)} />;
}

export function Textarea({ className, mono, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }) {
  return <textarea {...rest} className={cx("field min-h-[110px] resize-y leading-relaxed", mono && "font-mono text-[13.5px]", className)} />;
}

export interface Opt<T extends string | number> {
  value: T;
  label: ReactNode;
}

/** Çip seçici (mobil uygulamadaki Select) */
export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  className,
  scroll,
}: {
  options: Opt<T>[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  className?: string;
  scroll?: boolean;
}) {
  return (
    <div className={cx("flex gap-2", scroll ? "scroll-x -mx-1 overflow-x-auto px-1 pb-1" : "flex-wrap", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={cx(
              "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-bold transition",
              active ? "border-transparent bg-brand text-white shadow-fab" : "border-line bg-white text-text hover:border-brand-blue/40 hover:text-brand-blue",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Segment<T extends string>({ options, value, onChange, className }: { options: Opt<T>[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cx("inline-flex w-full rounded-2xl bg-paper p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cx(
            "flex-1 rounded-xl px-3 py-2 text-[13.5px] font-bold transition",
            o.value === value ? "bg-white text-navy shadow-card" : "text-muted hover:text-navy",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Göstergeler

type Tone = "green" | "blue" | "teal" | "orange" | "red" | "gray" | "navy" | "violet" | "warn";
const BADGE: Record<Tone, string> = {
  green: "bg-soft-green text-success",
  blue: "bg-soft-blue text-brand-blue",
  teal: "bg-[#E1F2F3] text-brand-teal",
  orange: "bg-soft-orange text-[#C0561A]",
  red: "bg-soft-danger text-danger",
  gray: "bg-paper text-muted",
  navy: "bg-navy text-white",
  violet: "bg-soft-violet text-violet",
  warn: "bg-soft-warn text-warn",
};

export function Badge({ tone = "gray", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-bold", BADGE[tone], className)}>{children}</span>;
}

const STAT_TONE: Record<Tone, string> = {
  green: "text-success",
  blue: "text-brand-blue",
  teal: "text-brand-teal",
  orange: "text-orange",
  red: "text-danger",
  gray: "text-muted",
  navy: "text-navy",
  violet: "text-violet",
  warn: "text-warn",
};

export function Stat({ label, value, tone = "navy", sub, className }: { label: string; value: ReactNode; tone?: Tone; sub?: ReactNode; className?: string }) {
  return (
    <div className={cx("rounded-2xl border border-line/70 bg-white p-3.5 shadow-card", className)}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className={cx("num mt-1 text-[19px] font-extrabold leading-tight", STAT_TONE[tone])}>{value}</div>
      {sub ? <div className="mt-0.5 text-[11.5px] text-muted">{sub}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, className, tone = "brand", track = "bg-paper" }: { value: number; className?: string; tone?: "brand" | "white" | "danger"; track?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full", track, className)}>
      <div
        className={cx("h-full rounded-full transition-all duration-500", tone === "brand" ? "bg-brand" : tone === "white" ? "bg-white" : "bg-danger")}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl2 border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brandSoft text-brand-blue">
        <Icon size={26} />
      </div>
      <div className="mt-3 text-[16px] font-extrabold text-navy">{title}</div>
      {text ? <div className="mt-1 max-w-md text-[13.5px] leading-relaxed text-muted">{text}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function IconBox({ icon: Icon, color, size = 44, gradient }: { icon: LucideIcon; color?: string; size?: number; gradient?: boolean }) {
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center rounded-2xl text-white", gradient && "bg-brand")}
      style={{ width: size, height: size, background: gradient ? undefined : color }}
    >
      <Icon size={Math.round(size * 0.48)} strokeWidth={2.2} />
    </span>
  );
}

export function Avatar({ name, color, size = 40 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white"
      style={{ width: size, height: size, background: color || "linear-gradient(135deg,#5CBD7D,#107398)", fontSize: Math.round(size * 0.36) }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 3, color }: { names: string[]; max?: number; color?: string }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((n, i) => (
        <span key={i} className="rounded-full ring-2 ring-white">
          <Avatar name={n} size={28} color={color} />
        </span>
      ))}
      {rest > 0 ? (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-paper text-[11px] font-bold text-muted ring-2 ring-white">+{rest}</span>
      ) : null}
    </div>
  );
}

/** Risk skoru kutusu (o×s ve renk bandı) */
export function ScoreBox({ o, s, size = 52, caption }: { o: number; s: number; size?: number; caption?: string }) {
  const m = meta(o, s);
  return (
    <span
      className="inline-flex shrink-0 flex-col items-center justify-center rounded-2xl"
      style={{ width: size, height: size, background: m.color, color: m.text }}
      title={`${m.label} · Termin: ${m.termin}`}
    >
      <span className="num text-[18px] font-extrabold leading-none" style={{ fontSize: Math.round(size * 0.36) }}>
        {m.score}
      </span>
      <span className="num mt-0.5 text-[10px] font-semibold opacity-80">{caption ?? `${o}×${s}`}</span>
    </span>
  );
}

// ---------------------------------------------------------------- Sheet (modal / alt sayfa)

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-navy-deep/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          "relative flex max-h-[92vh] w-full animate-slide-up flex-col rounded-t-xl3 bg-white shadow-pop sm:rounded-xl3",
          wide ? "sm:max-w-3xl" : "sm:max-w-xl",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="text-[17px] font-extrabold text-navy">{title}</div>
          <button onClick={onClose} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-xl text-muted hover:bg-paper hover:text-navy">
            <X size={19} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-line px-5 py-3.5 pb-safe">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("flex items-center gap-3", className)}>{children}</div>;
}

export function Divider() {
  return <div className="my-4 h-px bg-line" />;
}

export function Loading({ text = "Yükleniyor…" }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-[14px] font-semibold text-muted">
      <LoaderCircle size={18} className="animate-spin text-brand-blue" /> {text}
    </div>
  );
}
