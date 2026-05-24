import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);

  const { id } = await params;
  const postId = Number(id);
  if (!postId) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  // Var mı kontrolü
  const existing = await prisma.forumLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    // Beğeni varsa kaldır (toggle)
    await prisma.forumLike.delete({ where: { id: existing.id } });
    const count = await prisma.forumLike.count({ where: { postId } });
    return NextResponse.json({ liked: false, count });
  }

  await prisma.forumLike.create({ data: { postId, userId } });
  const count = await prisma.forumLike.count({ where: { postId } });
  return NextResponse.json({ liked: true, count });
}
