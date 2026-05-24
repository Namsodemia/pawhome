"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const idSchema = z.coerce.number().int().positive();

export async function togglePin(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  const post = await prisma.forumPost.findUnique({ where: { id }, select: { isPinned: true } });
  if (!post) return;
  await prisma.forumPost.update({ where: { id }, data: { isPinned: !post.isPinned } });
  revalidatePath("/admin/forum");
  revalidatePath("/app/forum");
}

export async function softDeletePost(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  await prisma.forumPost.update({ where: { id }, data: { isDeleted: true } });
  revalidatePath("/admin/forum");
  revalidatePath("/app/forum");
}

export async function restorePost(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  await prisma.forumPost.update({ where: { id }, data: { isDeleted: false } });
  revalidatePath("/admin/forum");
}

export async function hardDeletePost(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get("id"));
  await prisma.forumPost.delete({ where: { id } });
  revalidatePath("/admin/forum");
}
