import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { avatarUrl, formatDateTR, reminderStyle } from "@/lib/utils";
import { AddPetCard, HomeQuickActions } from "@/components/HomeActions";
import { ReminderItem } from "@/components/ReminderItem";

export default async function HomePage() {
  const session = await auth();
  const userId = Number(session!.user.id);
  const userName = session!.user?.name ?? "Kullanıcı";

  const pet = await prisma.pet.findFirst({
    where: { userId },
    orderBy: { id: "asc" },
  });

  const reminders = pet
    ? await prisma.reminder.findMany({
        where: { userId, petId: pet.id, isCompleted: false },
        orderBy: { dueDate: "asc" },
        take: 5,
      })
    : [];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md z-40 border-b border-slate-100 px-5 pt-4 pb-3 shadow-sm">
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <Link
              href="/app/profil"
              className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-300"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl(userName)} alt="" className="w-full h-full object-cover" />
            </Link>
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Hoş geldin,</p>
              <h1 className="text-base font-bold text-slate-900 leading-tight">{userName} 👋</h1>
            </div>
          </div>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2" aria-label="PawHome">
            <Image
              src="/logo-icon.png"
              alt="PawHome"
              width={32}
              height={32}
              priority
              className="object-contain"
            />
          </Link>

          <Link
            href="/app/bildirimler"
            className="relative w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
          >
            <i className="fa-regular fa-bell text-lg"></i>
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </Link>
        </div>
      </header>

      <main className="w-full pt-20 pb-28 px-5">
        {pet ? (
          <div className="block glass-card rounded-3xl p-5 text-white relative overflow-hidden mb-6 active:scale-[0.98] transition-transform">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl backdrop-blur-sm">
                  {pet.type === "cat" ? "🐈" : "🐕"}
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-wide">{pet.name}</h2>
                  <div className="flex items-center gap-2 text-blue-50 text-xs mt-0.5">
                    <span className="bg-white/20 px-2 py-0.5 rounded-md">{pet.age ?? "-"} Yaş</span>
                    <span>•</span>
                    <span>{pet.breed ?? ""}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AddPetCard />
        )}

        <HomeQuickActions petId={pet?.id ?? null} disabled={!pet} />

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Sıradaki Planlar</h3>
            <Link href="/app/planlar" className="text-xs text-pw-primary font-semibold">
              Tümünü Gör
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {reminders.length > 0 ? (
              reminders.map((item) => {
                const s = reminderStyle(item.type);
                return (
                  <ReminderItem
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    type={item.type}
                    description={item.description ?? ""}
                    dueLabel={formatDateTR(item.dueDate)}
                    icon={s.icon}
                    bgClass={s.bg}
                    textClass={s.text}
                    borderClass={item.type === "vaccine" ? "border-pw-accent" : "border-pw-primary"}
                  />
                );
              })
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400">Yaklaşan bir plan bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>

        <Link
          href="/app/vet-ai"
          className="bg-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow-lg text-white active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pw-primary to-purple-500 flex items-center justify-center text-lg shadow-inner">
            ✨
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold">Asistana Danış</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {pet ? pet.name : "Evcil dostun"} hakkında soru sor.
            </p>
          </div>
          <i className="fa-solid fa-chevron-right text-xs text-slate-500"></i>
        </Link>
      </main>
    </>
  );
}

