import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VetAIChat } from "./Chat";

export default async function VetAIPage() {
  const session = await auth();
  const userId = Number(session!.user.id);
  const pet = await prisma.pet.findFirst({
    where: { userId },
    orderBy: { id: "asc" },
    select: { name: true },
  });

  return (
    <div className="flex flex-col h-screen bg-pw-surface">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/app"
          className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </Link>
        <div className="w-10 h-10 rounded-full vet-ai-btn flex items-center justify-center text-white text-base">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900">VetAI Asistan</h1>
          <p className="text-[11px] text-pw-secondary font-medium">Çevrimiçi</p>
        </div>
      </header>

      <VetAIChat petName={pet?.name ?? null} />
    </div>
  );
}
