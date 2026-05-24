"use server";

import { redirect } from "next/navigation";

export async function contactAction(formData: FormData) {
  // TODO: e-posta gönderme entegrasyonu (Resend, Postmark, vs.)
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    redirect("/contact?error=missing");
  }

  // Şimdilik sadece logla
  console.log("[contact] new message:", { name, email, subject, message });

  redirect("/contact?sent=1");
}
