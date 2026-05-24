"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { avatarUrl } from "@/lib/utils";

export function BottomNav({ userName, petName }: { userName: string; petName?: string | null }) {
  const path = usePathname();
  const is = (p: string) => path === p;

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-slate-100 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      <div className="flex justify-between items-end px-6 py-2 relative max-w-md mx-auto">
        <NavItem href="/app" icon="fa-house" label="Ev" active={is("/app")} />
        <NavItem href="/app/forum" icon="fa-comments" label="Topluluk" active={is("/app/forum")} marginRight />

        <div className="absolute -top-8 left-1/2 -translate-x-1/2 group cursor-pointer z-50">
          <div className="chat-bubble absolute -top-10 left-1/2 -translate-x-1/2 w-max max-w-[120px]">
            <div className="bg-slate-900 text-white text-[10px] font-semibold py-1.5 px-3 rounded-xl shadow-lg relative">
              {petName ?? "Dostun"} nasıl? 🩺
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
            </div>
          </div>
          <Link href="/app/vet-ai" className="block">
            <button className="vet-ai-btn w-[72px] h-[72px] rounded-full border-[5px] border-white flex flex-col items-center justify-center text-white shadow-xl shadow-indigo-500/30 transition-transform active:scale-95">
              <i className="fa-solid fa-wand-magic-sparkles text-2xl mb-0.5"></i>
              <span className="text-[9px] font-bold tracking-wide">VetAI</span>
            </button>
          </Link>
        </div>

        <NavItem
          href="/app/klinikler"
          icon="fa-map-location-dot"
          label="Klinikler"
          active={is("/app/klinikler")}
          marginLeft
        />

        <Link
          href="/app/profil"
          className={`flex flex-col items-center gap-1 min-w-[3.5rem] group ${
            is("/app/profil") ? "" : "text-slate-400 hover:text-slate-600 transition"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden mb-0.5 ${
              is("/app/profil") ? "border border-pw-primary" : "border border-slate-300"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl(userName)} alt="" className="w-full h-full object-cover" />
          </div>
          <span
            className={`text-[10px] ${
              is("/app/profil") ? "font-bold text-pw-primary" : "font-medium"
            }`}
          >
            Ben
          </span>
        </Link>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
  marginLeft,
  marginRight,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  marginLeft?: boolean;
  marginRight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 min-w-[3.5rem] group ${
        marginLeft ? "ml-4" : ""
      } ${marginRight ? "mr-4" : ""} ${
        active ? "" : "text-slate-400 hover:text-slate-600 transition"
      }`}
    >
      <div className="relative">
        <i
          className={`fa-solid ${icon} text-xl transition-transform group-active:scale-90 ${
            active ? "text-pw-primary" : ""
          }`}
        ></i>
        {active && (
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-pw-primary rounded-full"></span>
        )}
      </div>
      <span
        className={`text-[10px] mt-1 ${
          active ? "font-bold text-pw-primary" : "font-medium"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
