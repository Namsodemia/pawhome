"use client";

import Image from "next/image";

/**
 * Full-screen branded loading screen. Use as a Suspense fallback or
 * an explicit overlay during heavy transitions.
 *
 * Variants:
 *   - "light" (default): white background, original colored logo
 *   - "dark": deep gradient background, white logo
 */
export function Preloader({
  variant = "light",
  message,
  className = "",
}: {
  variant?: "light" | "dark";
  message?: string;
  className?: string;
}) {
  const bg =
    variant === "dark"
      ? "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900"
      : "bg-gradient-to-br from-white via-blue-50 to-green-50";
  const logoSrc = variant === "dark" ? "/logo-icon-white.png" : "/logo-icon.png";
  const textColor = variant === "dark" ? "text-slate-300" : "text-slate-500";
  const ringColor = variant === "dark" ? "border-white/20" : "border-pw-primary/20";
  const progressColor = variant === "dark" ? "bg-white/70" : "bg-pw-primary";

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center ${bg} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer pulse rings */}
        <span className={`absolute w-32 h-32 rounded-full border-2 ${ringColor} animate-pw-ping`} />
        <span
          className={`absolute w-44 h-44 rounded-full border ${ringColor} animate-pw-ping`}
          style={{ animationDelay: "0.4s" }}
        />
        <span
          className={`absolute w-56 h-56 rounded-full border ${ringColor} animate-pw-ping opacity-50`}
          style={{ animationDelay: "0.8s" }}
        />

        {/* Logo with subtle bounce */}
        <div className="relative w-24 h-24 animate-pw-bounce">
          <Image
            src={logoSrc}
            alt="PawHome"
            fill
            sizes="96px"
            className="object-contain drop-shadow-2xl"
            priority
          />
        </div>
      </div>

      {/* Wordmark */}
      <div className="mt-10 flex items-baseline gap-1 text-2xl font-bold tracking-tight">
        <span className={variant === "dark" ? "text-white" : "text-slate-900"}>Paw</span>
        <span className="bg-gradient-to-r from-pw-primary to-teal-400 bg-clip-text text-transparent">
          Home
        </span>
        <span
          className={`ml-1 text-xs font-bold align-super ${
            variant === "dark" ? "text-teal-300" : "text-teal-500"
          }`}
        >
          AI
        </span>
      </div>

      {/* Animated dots progress */}
      <div className="mt-6 flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${progressColor} animate-pw-dot`} />
        <span
          className={`w-2 h-2 rounded-full ${progressColor} animate-pw-dot`}
          style={{ animationDelay: "0.15s" }}
        />
        <span
          className={`w-2 h-2 rounded-full ${progressColor} animate-pw-dot`}
          style={{ animationDelay: "0.3s" }}
        />
      </div>

      {message && <p className={`mt-5 text-sm ${textColor}`}>{message}</p>}
    </div>
  );
}

/**
 * Tiny inline spinner using just the paw — for buttons or small areas.
 */
export function LogoSpinner({
  size = 32,
  variant = "light",
}: {
  size?: number;
  variant?: "light" | "dark";
}) {
  const src = variant === "dark" ? "/logo-icon-white.png" : "/logo-icon.png";
  return (
    <span
      className="relative inline-block animate-pw-spin"
      style={{ width: size, height: size }}
    >
      <Image src={src} alt="" fill sizes={`${size}px`} className="object-contain" />
    </span>
  );
}
