import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const petSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["dog", "cat"]),
  breed: z.string().optional().nullable(),
  age: z.number().int().min(0).max(50).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = Number(session.user!.id);

  const body = await req.json();
  const parsed = petSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const pet = await prisma.pet.create({
    data: {
      userId,
      name: parsed.data.name,
      type: parsed.data.type,
      breed: parsed.data.breed ?? null,
      age: parsed.data.age ?? null,
    },
  });

  return NextResponse.json({ pet });
}
