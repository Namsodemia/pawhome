"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CircleAlert, CloudCheck, Command, HardDrive, LoaderCircle, LogOut, Search, Settings } from "lucide-react";
import { Logo } from "@/components/ui";
import { FeedbackHost } from "@/components/feedback";
import { CommandPalette, useCommandPalette } from "./CommandPalette";
import { NAV_GROUPS, SETTINGS_ITEM, TABS, isActive, titleFor } from "@/lib/nav";
import { useHydrated } from "@/lib/hydrate";
import { useSync } from "@/lib/sync";
import { cx, longDateTR } from "@/lib/format";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/app";
  const hydrated = useHydrated();
  const openPalette = useCommandPalette((s) => s.open);
  const [date, setDate] = useState("");
  useEffect(() => setDate(longDateTR()), []);

  return (
    <div className="min-h-screen bg-paper">
      {/* Masaüstü kenar çubuğu */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-line bg-white lg:flex">
        <Link href="/app" className="flex items-center px-6 pb-2 pt-6">
          <Logo className="h-9 w-auto" />
        </Link>
        <div className="px-6 text-[10.5px] font-semibold text-muted">İş Sağlığı ve Güvenliği App</div>
        <button
          onClick={openPalette}
          className="mx-4 mt-5 flex items-center gap-2 rounded-2xl border border-line bg-paper px-3 py-2.5 text-[13px] font-semibold text-muted transition hover:border-brand-blue/40"
        >
          <Search size={16} /> Ara veya git…
          <span className="ml-auto inline-flex items-center gap-0.5 rounded-md border border-line bg-white px-1.5 py-0.5 text-[10.5px] font-bold">
            <Command size={11} />K
          </span>
        </button>
        <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((g) => (
            <div key={g.group} className="mt-4">
              <div className="px-3 pb-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#9AA6B2]">{g.group}</div>
              {g.items.map((n) => {
                const active = isActive(pathname, n.href);
                const Icon = n.icon;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={cx(
                      "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-bold transition",
                      active ? "bg-soft-blue text-brand-blue" : "text-text hover:bg-paper hover:text-navy",
                    )}
                  >
                    <span
                      className={cx("flex h-8 w-8 items-center justify-center rounded-xl transition", active ? "text-white" : "bg-paper text-muted group-hover:text-navy")}
                      style={active ? { background: n.color } : undefined}
                    >
                      <Icon size={17} strokeWidth={2.3} />
                    </span>
                    {n.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <Link
            href={SETTINGS_ITEM.href}
            className={cx(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-bold transition",
              isActive(pathname, SETTINGS_ITEM.href) ? "bg-soft-blue text-brand-blue" : "text-text hover:bg-paper",
            )}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-paper text-muted">
              <Settings size={17} />
            </span>
            Ayarlar
          </Link>
          <SidebarUser />
          <div className="px-3 pt-2 text-[10.5px] text-[#9AA6B2]">İsgora Web · v1.0</div>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        {/* Üst çubuk */}
        <header className="no-print sticky top-0 z-30 border-b border-line/60 bg-paper/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6 lg:px-8">
            <Link href="/app" className="lg:hidden">
              <Logo className="h-8 w-auto" />
            </Link>
            <div className="hidden min-w-0 lg:block">
              <div className="truncate text-[15px] font-extrabold text-navy">{titleFor(pathname)}</div>
              <div className="text-[12px] capitalize text-muted">{date}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <SyncBadge />
              <button
                onClick={openPalette}
                aria-label="Ara"
                className="flex h-10 items-center gap-2 rounded-2xl border border-line bg-white px-3 text-[13px] font-semibold text-muted hover:border-brand-blue/40 lg:hidden"
              >
                <Search size={17} />
              </button>
              <Link
                href="/app/ayarlar"
                aria-label="Ayarlar"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-white text-navy shadow-card hover:bg-paper lg:hidden"
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-36 pt-5 md:px-6 lg:px-8 lg:pb-20">
          <SyncBanner />
          {hydrated ? <div className="animate-fade-in">{children}</div> : <ShellSkeleton />}
          <footer className="mt-12 text-center text-[12px] text-[#9AA6B2]">İsgora · İş Sağlığı ve Güvenliği App</footer>
        </main>
      </div>

      {/* Mobil yüzen sekme çubuğu */}
      <nav className="no-print fixed inset-x-3.5 bottom-3.5 z-40 rounded-[24px] border border-line/60 bg-white/95 shadow-bar backdrop-blur pb-safe lg:hidden">
        <div className="grid h-[68px] grid-cols-6">
          {TABS.map((t) => {
            const active = isActive(pathname, t.href);
            const Icon = t.icon;
            return (
              <Link key={t.href} href={t.href} className="flex flex-col items-center justify-center gap-1">
                <span className={cx("flex h-8 w-11 items-center justify-center rounded-xl transition", active ? "bg-soft-blue text-brand-blue" : "text-[#8A97A6]")}>
                  <Icon size={20} strokeWidth={active ? 2.6 : 2} />
                </span>
                <span className={cx("text-[10.5px] font-bold", active ? "text-brand-blue" : "text-[#8A97A6]")}>{t.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {hydrated ? <CommandPalette /> : null}
      <FeedbackHost />
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-40 w-full rounded-xl3" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
      <div className="skeleton h-64 w-full" />
    </div>
  );
}

/** Kaydetme durumu: veriler PHP + SQLite sunucusuna yazılır */
function SyncBadge() {
  const status = useSync((s) => s.status);
  if (status === "loading") return null;
  const map = {
    saved: { icon: CloudCheck, text: "Kaydedildi", cls: "text-success" },
    saving: { icon: LoaderCircle, text: "Kaydediliyor…", cls: "text-brand-blue" },
    error: { icon: CircleAlert, text: "Kaydedilemedi", cls: "text-danger" },
    failed: { icon: CircleAlert, text: "Bağlantı yok", cls: "text-danger" },
    local: { icon: HardDrive, text: "Yerel mod", cls: "text-muted" },
  } as const;
  const m = map[status];
  const Icon = m.icon;
  return (
    <span className={cx("inline-flex h-10 items-center gap-1.5 rounded-2xl border border-line bg-white px-3 text-[12px] font-bold", m.cls)} title={m.text}>
      <Icon size={15} className={status === "saving" ? "animate-spin" : undefined} />
      <span className="hidden sm:inline">{m.text}</span>
    </span>
  );
}

function SyncBanner() {
  const status = useSync((s) => s.status);
  const message = useSync((s) => s.message);
  if (!message || (status !== "error" && status !== "failed")) return null;
  return (
    <div className="no-print mb-4 flex items-start gap-2 rounded-2xl bg-soft-danger px-4 py-3 text-[13.5px] font-bold text-danger">
      <CircleAlert size={17} className="mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {status === "failed" ? (
        <button onClick={() => window.location.reload()} className="shrink-0 underline">
          Yenile
        </button>
      ) : null}
    </div>
  );
}

function SidebarUser() {
  const user = useSync((s) => s.user);
  const backend = useSync((s) => s.backend);
  if (!backend) return null;
  return (
    <a
      href="/giris.php?cikis=1"
      className="mt-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] font-bold text-text transition hover:bg-soft-danger hover:text-danger"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-paper text-muted">
        <LogOut size={16} />
      </span>
      <span className="min-w-0 flex-1 truncate">Çıkış yap{user ? <span className="block truncate text-[11px] font-semibold text-muted">{user}</span> : null}</span>
    </a>
  );
}
