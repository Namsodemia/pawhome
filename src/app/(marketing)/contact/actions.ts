"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function contactAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "Genel soru").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    redirect("/contact?error=missing");
  }

  await prisma.contactMessage.create({
    data: { name, email, subject, message },
  });

  redirect("/contact?sent=1");
}
