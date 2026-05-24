import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user!.id);
  const pet = await prisma.pet.findFirst({
    where: { userId },
    orderBy: { id: "asc" },
    select: { name: true },
  });

  return (
    <>
      <div className="max-w-md mx-auto bg-pw-surface min-h-screen relative">{children}</div>
      <BottomNav userName={session.user.name ?? "Kullanıcı"} petName={pet?.name ?? null} />
    </>
  );
}
