"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updateAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = Number(session.user!.id);

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const newPass = String(formData.get("password") ?? "").trim();

  const data: { name: string; email: string; password?: string } = { name, email };
  if (newPass) {
    data.password = await bcrypt.hash(newPass, 10);
  }

  await prisma.user.update({ where: { id: userId }, data });

  redirect("/hesap?saved=1");
}
