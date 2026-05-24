import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTR, reminderStyle } from "@/lib/utils";

export default async function PlanlarPage() {
  const session = await auth();
  const userId = Number(session!.user.id);

  const reminders = await prisma.reminder.findMany({
    where: { userId },
    orderBy: { dueDate: "asc" },
  });

  const now = new Date();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md z-40 border-b border-slate-100 px-5 py-4 shadow-sm flex items-center gap-4">
        <Link
          href="/app"
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 active:scale-95 transition"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Tüm Planlar</h1>
      </header>

      <main className="pt-20 pb-28 px-5 min-h-screen">
        <div className="flex flex-col gap-3">
          {reminders.length > 0 ? (
            reminders.map((item) => {
              const style = reminderStyle(item.type);
              const isPast = item.dueDate < now;
              return (
                <div
                  key={item.id}
                  className={`bg-white p-4 rounded-2xl border-l-4 ${
                    item.type === "vaccine" ? "border-pw-accent" : "border-pw-primary"
                  } shadow-sm flex items-center justify-between ${
                    isPast ? "opacity-60 grayscale" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full ${style.bg} ${style.text} flex items-center justify-center text-lg`}
                    >
                      <i className={`fa-solid ${style.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <i className="fa-regular fa-calendar text-[10px] text-slate-400"></i>
                        <p className="text-xs text-slate-500">{formatDateTR(item.dueDate)}</p>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.description ?? ""}</p>
                    </div>
                  </div>
                  {!isPast ? (
                    <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
                      <i className="fa-solid fa-ellipsis"></i>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      Geçmiş
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center mt-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl text-slate-300 mb-4">
                <i className="fa-regular fa-calendar-xmark"></i>
              </div>
              <h3 className="text-slate-600 font-bold">Hiç plan yok</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-[200px]">
                Dostun için yeni hatırlatıcılar ekleyerek takvimini oluşturabilirsin.
              </p>
              <Link href="/app" className="mt-6 text-pw-primary font-semibold text-sm">
                Ana Sayfaya Dön
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
