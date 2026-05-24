import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
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

export async function generateStaticParams() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  });
  if (!post) return { title: "Yazı bulunamadı" };
  return {
    title: `${post.title} | PawHome Blog`,
    description: post.excerpt,
  };
}

export const revalidate = 300; // 5 min ISR

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  });

  if (!post || post.status !== "published") {
    notFound();
  }

  // View count'ı async olarak artır (kullanıcıyı bekletme)
  prisma.blogPost
    .update({ where: { id: post.id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  // Diğer ilgili yazılar (aynı kategori, son 3)
  const related = await prisma.blogPost.findMany({
    where: {
      status: "published",
      category: post.category,
      id: { not: post.id },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { id: true, slug: true, title: true, coverEmoji: true, readTime: true },
  });

  const cat = categoryStyles[post.category] ?? categoryStyles.haber;

  return (
    <article className="max-w-3xl mx-auto px-5 py-12 md:py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-pw-primary transition-colors mb-8"
      >
        <i className="fa-solid fa-arrow-left text-xs"></i> Tüm yazılar
      </Link>

      <header className="mb-8">
        <span
          className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${cat.color}`}
        >
          {cat.label}
        </span>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mt-4 leading-tight">
          {post.title}
        </h1>
        <p className="text-lg text-slate-600 mt-4 leading-relaxed">{post.excerpt}</p>

        <div className="flex items-center gap-3 mt-6 text-xs text-slate-500">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pw-primary to-pw-secondary text-white flex items-center justify-center text-xs font-bold">
            {post.author.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-700">{post.author.name}</div>
            <div>
              {post.publishedAt && formatDateTR(post.publishedAt)} · {post.readTime} dk okuma ·{" "}
              {post.views.toLocaleString("tr-TR")} okunma
            </div>
          </div>
        </div>
      </header>

      <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center text-9xl mb-10 border border-slate-100">
        {post.coverEmoji}
      </div>

      <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-p:leading-relaxed prose-a:text-pw-primary prose-strong:text-slate-900 prose-li:my-1">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      <hr className="my-12 border-slate-100" />

      {/* Share */}
      <div className="flex items-center justify-between gap-4 mb-12">
        <div className="text-sm text-slate-500">Bu yazıyı beğendin mi? Paylaş:</div>
        <div className="flex gap-2">
          {[
            { icon: "fa-twitter", color: "hover:text-sky-500" },
            { icon: "fa-facebook", color: "hover:text-blue-600" },
            { icon: "fa-linkedin", color: "hover:text-blue-700" },
            { icon: "fa-whatsapp", color: "hover:text-green-500" },
          ].map((s) => (
            <button
              key={s.icon}
              className={`w-10 h-10 rounded-full bg-slate-100 text-slate-500 ${s.color} flex items-center justify-center transition-colors`}
            >
              <i className={`fa-brands ${s.icon}`}></i>
            </button>
          ))}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-5">İlgili yazılar</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="block bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-pw-primary/30 transition-all"
              >
                <div className="text-4xl mb-3">{r.coverEmoji}</div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{r.title}</h3>
                <div className="text-[10px] text-slate-400 mt-2">{r.readTime} dk okuma</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mt-16 bg-gradient-to-br from-pw-primary/5 to-pw-secondary/5 border border-slate-100 rounded-3xl p-8 text-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          PawHome&apos;u henüz denemedin mi?
        </h3>
        <p className="text-sm text-slate-600 mb-5">
          Dostun için akıllı bakım asistanı — ücretsiz başla.
        </p>
        <Link
          href="/register"
          className="inline-block bg-pw-primary text-white font-bold px-7 py-3 rounded-2xl shadow-lg shadow-blue-500/30"
        >
          Ücretsiz Hesap Oluştur
        </Link>
      </section>
    </article>
  );
}
