import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendPushToUser } from "@/lib/push";

/** Kullanıcıya test bildirimi gönderir */
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = Number(session.user.id);

  const res = await sendPushToUser(userId, {
    title: "PawHome 🐾",
    body: `Merhaba ${session.user.name}, test bildirimi başarılı!`,
    url: "/app",
    tag: "test",
  });

  return NextResponse.json(res);
}
