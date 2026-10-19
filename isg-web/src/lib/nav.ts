import {
  BookOpen,
  Calculator,
  ClipboardCheck,
  GraduationCap,
  House,
  MessagesSquare,
  Presentation,
  School,
  Stethoscope,
  Settings,
  ShieldCheck,
  Siren,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { MODULLER, SEKMELER, type Modul, type Rol } from "./roles";

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
      { href: "/app/sinifim", label: "Sınıfım", short: "Sınıfım", icon: School, color: "#1B8ECF" },
      { href: "/app/sinav", label: "Sınav Hazırlık", short: "Sınav", icon: GraduationCap, color: "#6C5CE7" },
      { href: "/app/egitim", label: "Eğitimler", short: "Eğitim", icon: Presentation, color: "#E0812B" },
      { href: "/app/asistan", label: "İsgora Asistan", short: "Asistan", icon: Sparkles, color: "#107398" },
    ],
  },
  {
    group: "İSG Araçları",
    items: [
      { href: "/app/mevzuat", label: "Mevzuat Rehberi", short: "Mevzuat", icon: BookOpen, color: "#1E3145" },
      { href: "/app/kaza", label: "Kaza / Ramak Kala", short: "Kaza", icon: Siren, color: "#D6334C" },
      { href: "/app/denetim", label: "Saha Denetimi", short: "Denetim", icon: ClipboardCheck, color: "#3AA466" },
      { href: "/app/muayene", label: "Periyodik Muayene", short: "Muayene", icon: Stethoscope, color: "#D6334C" },
      { href: "/app/hesap", label: "İSG Hesaplayıcı", short: "Hesap", icon: Calculator, color: "#F4772E" },
    ],
  },
];

export const SETTINGS_ITEM: NavItem = { href: "/app/ayarlar", label: "Ayarlar", icon: Settings, color: "#6E7C8C" };

export const ALL_NAV: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];

/** Mobil alt sekme çubuğu — OSGB için mobil uygulamadaki 6 sekme, aynı sırayla */
export const TABS: NavItem[] = ["/app", "/app/risk", "/app/kasa", "/app/musteri", "/app/sinav", "/app/asistan"].map(
  (h) => ALL_NAV.find((n) => n.href === h)!,
);

function modulOfHref(href: string): Modul | null {
  const seg = href.split("/")[2];
  return seg ? (seg as Modul) : null;
}

/** Role göre kenar çubuğu grupları (izinsiz modüller gizlenir) */
export function navFor(rol: Rol): { group: string; items: NavItem[] }[] {
  const allowed = MODULLER[rol];
  return NAV_GROUPS.map((g) => ({
    group: g.group,
    items: g.items.filter((n) => {
      const m = modulOfHref(n.href);
      return m === null || allowed.includes(m);
    }),
  })).filter((g) => g.items.length > 0);
}

/** Role göre mobil alt sekmeler: Ana Sayfa + rolün en çok kullandığı modüller */
export function tabsFor(rol: Rol): NavItem[] {
  return ["/app", ...SEKMELER[rol].map((m) => `/app/${m}`)].map((h) => ALL_NAV.find((n) => n.href === h)!).filter(Boolean);
}

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
