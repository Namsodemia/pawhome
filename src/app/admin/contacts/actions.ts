"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const idSchema = z.coerce.number().int().positive();

export async function updateStatus(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const status = z.enum(["yeni", "okundu", "yanitlandi"]).parse(formData.get("status"));
  await prisma.contactMessage.update({ where: { id }, data: { status } });
  revalidatePath("/admin/contacts");
  revalidatePath("/admin");
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath("/admin/contacts");
  revalidatePath("/admin");
}
