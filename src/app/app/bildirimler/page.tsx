import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NotificationsForm } from "./Form";
import { PushSubscribe } from "@/components/PushSubscribe";

export default async function BildirimlerPage() {
  const session = await auth();
  const userId = Number(session!.user.id);
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { notifyEmail: true, notifyApp: true },
  });

  return (
    <>
      <header className="bg-white p-4 border-b border-slate-200 flex items-center gap-4 sticky top-0 z-10">
        <Link
          href="/app/profil"
          className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <h1 className="font-bold text-lg">Bildirim Ayarları</h1>
      </header>

      <main className="p-6 pb-28">
        <NotificationsForm
          initialEmail={user.notifyEmail}
          initialApp={user.notifyApp}
        />
        <PushSubscribe />
      </main>
    </>
  );
}
