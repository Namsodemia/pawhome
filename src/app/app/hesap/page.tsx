import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateAccount } from "./actions";

export default async function HesapPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await auth();
  const userId = Number(session!.user.id);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const sp = await searchParams;
  const saved = sp.saved === "1";

  return (
    <>
      <header className="bg-white p-4 border-b border-slate-200 flex items-center gap-4 sticky top-0 z-10">
        <Link
          href="/app/profil"
          className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <h1 className="font-bold text-lg">Hesap Bilgileri</h1>
      </header>

      <main className="p-6 pb-28">
        {saved && (
          <div className="bg-green-100 text-green-700 p-3 rounded-xl mb-4 text-sm font-medium">
            Bilgilerin başarıyla güncellendi!
          </div>
        )}

        <form action={updateAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Ad Soyad</label>
            <input
              type="text"
              name="name"
              defaultValue={user.name}
              required
              className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">E-posta</label>
            <input
              type="email"
              name="email"
              defaultValue={user.email}
              required
              className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Yeni Şifre (Değiştirmek istemiyorsan boş bırak)
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••"
              className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 mt-4"
          >
            Değişiklikleri Kaydet
          </button>
        </form>
      </main>
    </>
  );
}
