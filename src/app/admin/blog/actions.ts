"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

const blogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  category: z.enum(["saglik", "beslenme", "egitim", "hikaye", "haber"]),
  status: z.enum(["draft", "published"]),
  coverEmoji: z.string().min(1).default("🐾"),
  coverImage: z.string().optional().or(z.literal("")),
  readTime: z.coerce.number().int().min(1).default(5),
});

export async function createBlogPost(formData: FormData) {
  const me = await requireAdmin();
  const data = blogSchema.parse(Object.fromEntries(formData));
  const slug = data.slug?.trim() || slugify(data.title);
  await prisma.blogPost.create({
    data: {
      authorId: me.id,
      slug,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      status: data.status,
      coverEmoji: data.coverEmoji,
      coverImage: data.coverImage || null,
      readTime: data.readTime,
      publishedAt: data.status === "published" ? new Date() : null,
    },
  });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function updateBlogPost(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().parse(formData.get("id"));
  const data = blogSchema.parse(Object.fromEntries(formData));
  const existing = await prisma.blogPost.findUniqueOrThrow({ where: { id } });
  const slug = data.slug?.trim() || existing.slug;
  await prisma.blogPost.update({
    where: { id },
    data: {
      slug,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      category: data.category,
      status: data.status,
      coverEmoji: data.coverEmoji,
      coverImage: data.coverImage || null,
      readTime: data.readTime,
      publishedAt:
        data.status === "published" && !existing.publishedAt ? new Date() : existing.publishedAt,
    },
  });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  redirect("/admin/blog");
}

export async function toggleStatus(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().parse(formData.get("id"));
  const post = await prisma.blogPost.findUniqueOrThrow({ where: { id } });
  const newStatus = post.status === "published" ? "draft" : "published";
  await prisma.blogPost.update({
    where: { id },
    data: {
      status: newStatus,
      publishedAt: newStatus === "published" && !post.publishedAt ? new Date() : post.publishedAt,
    },
  });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function deleteBlogPost(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().parse(formData.get("id"));
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
