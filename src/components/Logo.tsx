import Image from "next/image";

type Variant = "light" | "dark";

export function Logo({
  variant = "light",
  size = 36,
  showWordmark = true,
  className = "",
}: {
  variant?: Variant;
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  const src = variant === "dark" ? "/logo-icon-white.png" : "/logo-icon.png";
  const textColor = variant === "dark" ? "text-white" : "text-slate-900";
  const aiColor = variant === "dark" ? "text-teal-300" : "text-teal-500";

  return (
    <span className={`inline-flex items-center gap-2.5 font-bold ${className}`}>
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt="PawHome logo"
          width={size}
          height={size}
          priority
          className="object-contain"
          style={{ width: "auto", height: "100%" }}
        />
      </span>
      {showWordmark && (
        <span className={`tracking-tight leading-none ${textColor}`}>
          <span>Paw</span>
          <span className="bg-gradient-to-r from-pw-primary to-teal-400 bg-clip-text text-transparent">
            Home
          </span>
          <span className={`ml-1 text-[0.55em] font-bold align-super ${aiColor}`}>AI</span>
        </span>
      )}
    </span>
  );
}
