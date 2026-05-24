"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";

const links = [
  { href: "/features", label: "Özellikler" },
  { href: "/pricing", label: "Fiyatlandırma" },
  { href: "/about", label: "Hakkımızda" },
  { href: "/blog", label: "Blog" },
  { href: "/sss", label: "SSS" },
  { href: "/contact", label: "İletişim" },
];

export function MarketingNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        <Link href="/" className="text-lg" aria-label="PawHome anasayfa">
          <Logo variant="light" size={36} />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                path === l.href ? "text-pw-primary" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-700 hover:text-pw-primary transition-colors"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="bg-pw-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-shadow"
          >
            Ücretsiz Başla
          </Link>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700"
          aria-label="Menü"
        >
          <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`}></i>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white">
          <div className="px-5 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`text-sm font-medium py-2 ${
                  path === l.href ? "text-pw-primary" : "text-slate-700"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 text-center py-3 rounded-xl border border-slate-200 text-sm font-semibold"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="flex-1 text-center py-3 rounded-xl bg-pw-primary text-white text-sm font-semibold"
              >
                Ücretsiz Başla
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
