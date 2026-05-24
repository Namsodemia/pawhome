import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  notifyEmail: z.boolean(),
  notifyApp: z.boolean(),
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

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      notifyEmail: parsed.data.notifyEmail,
      notifyApp: parsed.data.notifyApp,
    },
    select: { notifyEmail: true, notifyApp: true },
  });
  return NextResponse.json({ user });
}
