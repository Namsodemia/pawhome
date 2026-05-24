"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

const items = [
  { href: "/admin", icon: "fa-gauge", label: "Dashboard", exact: true },
  { href: "/admin/users", icon: "fa-users", label: "Kullanıcılar" },
  { href: "/admin/pets", icon: "fa-paw", label: "Evcil Hayvanlar" },
  { href: "/admin/forum", icon: "fa-comments", label: "Forum" },
  { href: "/admin/clinics", icon: "fa-stethoscope", label: "Klinikler" },
  { href: "/admin/blog", icon: "fa-newspaper", label: "Blog" },
  { href: "/admin/contacts", icon: "fa-envelope", label: "İletişim" },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (item: typeof items[number]) =>
    item.exact ? path === item.href : path.startsWith(item.href);

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link href="/admin" className="flex items-center gap-2 font-bold">
          <Image src="/logo-icon.png" alt="" width={28} height={28} />
          <span className="text-sm">PawHome <span className="text-pw-primary">Admin</span></span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"
        >
          <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`}></i>
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-slate-800">
          <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 text-white">
            <Image src="/logo-icon-white.png" alt="" width={32} height={32} />
            <div>
              <div className="font-bold">PawHome</div>
              <div className="text-[10px] text-pw-primary font-semibold tracking-wider uppercase">
                Admin Panel
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? "bg-pw-primary/15 text-white border-l-2 border-pw-primary"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pw-primary to-pw-secondary flex items-center justify-center text-white text-sm font-bold">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="text-xs">
              <div className="font-semibold text-white">{adminName}</div>
              <div className="text-slate-400">Admin</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/app"
              className="flex-1 text-center text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-arrow-right mr-1"></i> Uygulama
            </Link>
            <Link
              href="/logout"
              className="flex-1 text-center text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-right-from-bracket mr-1"></i> Çıkış
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}
    </>
  );
}
