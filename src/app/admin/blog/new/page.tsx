import { BlogForm } from "../BlogForm";
import { createBlogPost } from "../actions";

export default function NewBlogPage() {
  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">Yeni Blog Yazısı</h1>
      <BlogForm action={createBlogPost} submitLabel="Oluştur" />
    </div>
  );
}
