import Link from "next/link";
import { prisma } from "@/lib/prisma";

const categoryStyles: Record<string, { label: string; color: string }> = {
  saglik: { label: "Sağlık", color: "bg-red-100 text-red-700" },
  beslenme: { label: "Beslenme", color: "bg-green-100 text-green-700" },
  egitim: { label: "Eğitim", color: "bg-blue-100 text-blue-700" },
  hikaye: { label: "Hikaye", color: "bg-purple-100 text-purple-700" },
  haber: { label: "Haber", color: "bg-amber-100 text-amber-700" },
};

function formatDateTR(d: Date): string {
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const revalidate = 60; // ISR: 60s

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverEmoji: true,
      category: true,
      readTime: true,
      publishedAt: true,
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-5 py-16 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-pw-primary text-sm font-bold uppercase tracking-wider mb-2">Blog</p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
          Bilgi, ipucu ve hikayeler
        </h1>
        <p className="mt-4 text-slate-600 text-lg">
          Veterinerlerle birlikte hazırladığımız içerikler.
        </p>
      </div>

      <div className="flex gap-2 justify-center mb-10 flex-wrap">
        {["Hepsi", "Sağlık", "Beslenme", "Eğitim", "Hikaye"].map((c, i) => (
          <button
            key={c}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              i === 0
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-pw-primary hover:text-pw-primary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p>Henüz blog yazısı yayınlanmadı.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => {
            const cat = categoryStyles[p.category] ?? categoryStyles.haber;
            return (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                  {p.coverEmoji}
                </div>
                <div className="p-5">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${cat.color}`}
                  >
                    {cat.label}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-3 leading-snug group-hover:text-pw-primary transition-colors">
                    {p.title}
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{p.excerpt}</p>
                  <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
                    {p.publishedAt && <span>{formatDateTR(p.publishedAt)}</span>}
                    <span>·</span>
                    <span>{p.readTime} dk okuma</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
