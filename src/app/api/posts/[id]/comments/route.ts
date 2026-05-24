import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!postId) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const comments = await prisma.forumComment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({ comments });
}

const schema = z.object({
  content: z.string().min(1).max(2000),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);

  const { id } = await params;
  const postId = Number(id);
  if (!postId) return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "Post bulunamadı" }, { status: 404 });

  const comment = await prisma.forumComment.create({
    data: { postId, userId, content: parsed.data.content },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({ comment });
}
