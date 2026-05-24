import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteBlogPost, toggleStatus } from "./actions";

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Blog Yazıları</h1>
          <p className="text-sm text-slate-500 mt-1">Toplam {posts.length} yazı</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="bg-pw-primary text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-blue-500/30"
        >
          <i className="fa-solid fa-plus mr-1.5"></i>Yeni Yazı
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left p-4">Yazı</th>
                <th className="text-center p-4 hidden md:table-cell">Kategori</th>
                <th className="text-center p-4">Durum</th>
                <th className="text-center p-4 hidden lg:table-cell">Okunma</th>
                <th className="text-center p-4 hidden lg:table-cell">Tarih</th>
                <th className="text-right p-4">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl">
                        {p.coverEmoji}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">{p.title}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          /{p.slug} · {p.author.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center hidden md:table-cell">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-100 text-slate-600">
                      {p.category}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded ${
                        p.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {p.status === "published" ? "YAYINDA" : "TASLAK"}
                    </span>
                  </td>
                  <td className="p-4 text-center hidden lg:table-cell text-slate-600">
                    {p.views.toLocaleString("tr-TR")}
                  </td>
                  <td className="p-4 text-center hidden lg:table-cell text-slate-500 text-xs">
                    {p.createdAt.toLocaleDateString("tr-TR")}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {p.status === "published" && (
                        <Link
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          className="text-[10px] font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </Link>
                      )}
                      <form action={toggleStatus}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          className={`text-[10px] font-semibold px-2.5 py-1 rounded ${
                            p.status === "published"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-green-50 text-green-700"
                          }`}
                          title={p.status === "published" ? "Taslağa al" : "Yayınla"}
                        >
                          <i className={`fa-solid ${p.status === "published" ? "fa-eye-slash" : "fa-paper-plane"}`}></i>
                        </button>
                      </form>
                      <Link
                        href={`/admin/blog/${p.id}`}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded bg-blue-50 text-pw-primary hover:bg-blue-100"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </Link>
                      <form action={deleteBlogPost}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="text-[10px] font-semibold px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
