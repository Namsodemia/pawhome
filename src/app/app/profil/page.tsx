import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { avatarUrl } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await auth();
  const userId = Number(session!.user.id);
  const userName = session!.user?.name ?? "Kullanıcı";

  const [petCount, postCount, pets] = await Promise.all([
    prisma.pet.count({ where: { userId } }),
    prisma.forumPost.count({ where: { userId } }),
    prisma.pet.findMany({ where: { userId }, orderBy: { id: "asc" } }),
  ]);

  const score = postCount * 10 + petCount * 50 + 100;

  return (
    <>
      <header className="bg-white pb-6 pt-safe rounded-b-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-pw-primary to-blue-400"></div>

        <div className="relative z-10 flex justify-between items-center px-5 pt-4 text-white">
          <h1 className="text-lg font-bold opacity-0">Profil</h1>
          <Link
            href="/app/hesap"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md active:bg-white/30 transition"
          >
            <i className="fa-solid fa-gear text-sm"></i>
          </Link>
        </div>

        <div className="relative z-10 px-5 mt-4 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-slate-200 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl(userName)}
              alt="Profil"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center mt-3">
            <h2 className="text-xl font-bold text-slate-900">{userName}</h2>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold border border-yellow-200 flex items-center gap-1">
                <i className="fa-solid fa-crown text-[8px]"></i> Premium Üye
              </span>
              <span className="text-xs text-slate-400">• İstanbul</span>
            </div>
          </div>

          <div className="flex items-center gap-8 mt-5 w-full justify-center">
            <Stat value={petCount} label="Evcil Hayvan" />
            <div className="w-px h-8 bg-slate-200"></div>
            <Stat value={postCount} label="Forum Post" />
            <div className="w-px h-8 bg-slate-200"></div>
            <Stat value={score} label="Puan" />
          </div>
        </div>
      </header>

      <main className="px-5 py-6 pb-28">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Evcil Dostlarım</h3>
            <Link
              href="/app"
              className="w-7 h-7 rounded-full bg-pw-primary/10 text-pw-primary flex items-center justify-center text-xs hover:bg-pw-primary hover:text-white transition"
            >
              <i className="fa-solid fa-plus"></i>
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {pets.length > 0 ? (
              pets.map((p) => (
                <div
                  key={p.id}
                  className="min-w-[140px] bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] flex flex-col items-center relative active:scale-95 transition-transform"
                >
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 ring-2 ring-white"></div>
                  <div
                    className={`w-14 h-14 rounded-full ${
                      p.type === "cat" ? "bg-blue-100" : "bg-orange-100"
                    } flex items-center justify-center text-2xl mb-2`}
                  >
                    {p.type === "cat" ? "🐈" : "🐕"}
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">{p.name}</h4>
                  <p className="text-[10px] text-slate-400">{p.breed ?? ""}</p>
                  <button className="mt-3 w-full py-1.5 rounded-lg bg-slate-50 text-[10px] font-semibold text-slate-600 hover:bg-pw-primary hover:text-white transition-colors">
                    Profili
                  </button>
                </div>
              ))
            ) : (
              <div className="min-w-[140px] flex flex-col items-center justify-center text-slate-400 text-xs">
                Henüz dostun yok.
              </div>
            )}

            <Link
              href="/app"
              className="min-w-[100px] bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 active:bg-slate-100"
            >
              <i className="fa-solid fa-plus text-xl"></i>
              <span className="text-[10px] font-medium">Yeni Ekle</span>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
          <MenuItem href="/app/hesap" icon="fa-user" iconBg="bg-blue-50" iconColor="text-pw-primary" title="Hesap Bilgileri" subtitle="Ad, e-posta ve şifre işlemleri" hover="group-hover:text-pw-primary" />
          <MenuItem href="/app/abonelik" icon="fa-star" iconBg="bg-yellow-50" iconColor="text-yellow-600" title="Abonelik Paketim" subtitle="Premium avantajlarını yönet" hover="group-hover:text-yellow-600" />
          <MenuItem href="/app/bildirimler" icon="fa-bell" iconBg="bg-purple-50" iconColor="text-purple-600" title="Bildirim Ayarları" subtitle="Hatırlatıcılar ve haberler" hover="group-hover:text-purple-600" />
          <MenuItem href="/app/yardim" icon="fa-circle-question" iconBg="bg-green-50" iconColor="text-pw-secondary" title="Yardım ve Destek" subtitle="SSS ve İletişim" hover="group-hover:text-pw-secondary" last />
        </div>

        <Link
          href="/logout"
          className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100 active:scale-[0.98] transition-transform"
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          Çıkış Yap
        </Link>

        <p className="text-center text-[10px] text-slate-400 mt-4">
          Versiyon 1.0.4 • PetWhisper Inc.
        </p>
      </main>
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-slate-800">{value}</p>
      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
}

function MenuItem({
  href,
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  hover,
  last,
}: {
  href: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  hover: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 p-4 ${
        last ? "" : "border-b border-slate-50"
      } active:bg-slate-50 transition-colors group`}
    >
      <div
        className={`w-9 h-9 rounded-full ${iconBg} ${iconColor} flex items-center justify-center text-sm`}
      >
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <p className="text-[10px] text-slate-400">{subtitle}</p>
      </div>
      <i className={`fa-solid fa-chevron-right text-xs text-slate-300 ${hover}`}></i>
    </Link>
  );
}
