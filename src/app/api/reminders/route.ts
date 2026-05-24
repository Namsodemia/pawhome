import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { autoReminderDescription } from "@/lib/utils";

const schema = z.object({
  pet_id: z.number().int().positive(),
  type: z.enum(["walk", "vaccine", "food", "vet", "other"]),
  title: z.string().min(1),
  date: z.string().min(1),
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

  const pet = await prisma.pet.findFirst({
    where: { id: parsed.data.pet_id, userId },
    select: { id: true },
  });
  if (!pet) return NextResponse.json({ error: "Evcil hayvan bulunamadı." }, { status: 404 });

  const reminder = await prisma.reminder.create({
    data: {
      userId,
      petId: pet.id,
      title: parsed.data.title,
      description: autoReminderDescription(parsed.data.type),
      dueDate: new Date(parsed.data.date),
      type: parsed.data.type,
    },
  });

  return NextResponse.json({ reminder });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = Number(session.user!.id);

  const body = await req.json();
  const { id, isCompleted } = z
    .object({ id: z.number().int().positive(), isCompleted: z.boolean() })
    .parse(body);

  const updated = await prisma.reminder.updateMany({
    where: { id, userId },
    data: { isCompleted },
  });
  return NextResponse.json({ count: updated.count });
}
