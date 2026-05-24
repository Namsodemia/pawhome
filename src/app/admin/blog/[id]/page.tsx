import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogForm } from "../BlogForm";
import { updateBlogPost } from "../actions";

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id: Number(id) } });
  if (!post) notFound();

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">Blog Yazısı Düzenle</h1>
      <BlogForm action={updateBlogPost} initial={post} submitLabel="Güncelle" />
    </div>
  );
}
