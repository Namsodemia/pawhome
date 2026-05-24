"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const idSchema = z.coerce.number().int().positive();

export async function updateUserRole(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const role = z.enum(["user", "moderator", "admin"]).parse(formData.get("role"));
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
}

export async function toggleBan(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const user = await prisma.user.findUnique({ where: { id }, select: { isBanned: true } });
  if (!user) return;
  await prisma.user.update({ where: { id }, data: { isBanned: !user.isBanned } });
  revalidatePath("/admin/users");
}

export async function deleteUser(formData: FormData) {
  const me = await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  if (id === me.id) return; // kendini silme
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}
