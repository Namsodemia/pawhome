import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  category: z.enum(["beslenme", "saglik", "egitim", "hikaye"]),
  title: z.string().min(1),
  content: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = Number(session.user!.id);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const post = await prisma.forumPost.create({
    data: {
      userId,
      category: parsed.data.category,
      title: parsed.data.title,
      content: parsed.data.content,
    },
  });

  return NextResponse.json({ post });
}
