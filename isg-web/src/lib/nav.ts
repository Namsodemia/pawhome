import {
  BookOpen,
  Calculator,
  ClipboardCheck,
  GraduationCap,
  House,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Siren,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  short?: string;
  icon: LucideIcon;
  color: string;
}

export const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "Genel",
    items: [{ href: "/app", label: "Ana Sayfa", short: "Ana Sayfa", icon: House, color: "#107398" }],
  },
  {
    group: "Modüller",
    items: [
      { href: "/app/risk", label: "Risk Analizi", short: "Risk", icon: ShieldCheck, color: "#5CBD7D" },
      { href: "/app/kasa", label: "Kasa / Cari", short: "Kasa", icon: Wallet, color: "#107398" },
      { href: "/app/musteri", label: "Müşteri Takip", short: "Müşteri", icon: Users, color: "#0B6F7B" },
      { href: "/app/siniflar", label: "Sınıflar", short: "Sınıflar", icon: MessagesSquare, color: "#1B8ECF" },
      { href: "/app/sinav", label: "Sınav Hazırlık", short: "Sınav", icon: GraduationCap, color: "#6C5CE7" },
      { href: "/app/asistan", label: "İsgora Asistan", short: "Asistan", icon: Sparkles, color: "#107398" },
    ],
  },
  {
    group: "İSG Araçları",
    items: [
      { href: "/app/mevzuat", label: "Mevzuat Rehberi", icon: BookOpen, color: "#1E3145" },
      { href: "/app/kaza", label: "Kaza / Ramak Kala", icon: Siren, color: "#D6334C" },
      { href: "/app/denetim", label: "Saha Denetimi", icon: ClipboardCheck, color: "#3AA466" },
      { href: "/app/hesap", label: "İSG Hesaplayıcı", icon: Calculator, color: "#F4772E" },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { href: "/app/ayarlar", label: "Ayarlar", icon: Settings, color: "#6E7C8C" };

export const ALL_NAV: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];

/** Mobil alt sekme çubuğu — mobil uygulamadaki 6 sekme, aynı sırayla */
export const TABS: NavItem[] = ["/app", "/app/risk", "/app/kasa", "/app/musteri", "/app/sinav", "/app/asistan"].map(
  (h) => ALL_NAV.find((n) => n.href === h)!,
);

export function isActive(rawPathname: string, href: string): boolean {
  // Statik dışa aktarımda adresler "/" ile bitebilir (trailingSlash)
  const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, "") : rawPathname;
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(href + "/");
}

export function titleFor(pathname: string): string {
  const hit = [...ALL_NAV].sort((a, b) => b.href.length - a.href.length).find((n) => isActive(pathname, n.href));
  return hit?.label ?? "İsgora";
}
