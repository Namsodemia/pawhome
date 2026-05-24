"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  fullname: z.string().min(1, "Ad Soyad gerekli"),
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  terms: z.literal("on", { message: "Kullanım koşullarını onaylayın" }),
});

function fail(message: string): never {
  redirect(`/register?error=${encodeURIComponent(message)}`);
}

export async function registerAction(formData: FormData) {
  const parsed = schema.safeParse({
    fullname: String(formData.get("fullname") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? "").trim(),
    terms: formData.get("terms") ?? undefined,
  });

  if (!parsed.success) {
    fail(parsed.error.issues[0]?.message ?? "Form bilgileri eksik.");
  }

  const { fullname, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    fail("Bu e-posta adresi zaten kayıtlı.");
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name: fullname, email, password: hashed },
  });

  redirect("/login?registered=1");
}
