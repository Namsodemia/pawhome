import { prisma } from "@/lib/prisma";
import { categoryStyle } from "@/lib/utils";
import { AddPostModal } from "@/components/AddPostModal";

function timeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "Az önce";
  const min = Math.round(diff / 60);
  if (min < 60) return `${min} dk önce`;
  const hour = Math.round(diff / 3600);
  if (hour < 24) return `${hour} saat önce`;
  const day = Math.round(diff / 86400);
  return `${day} gün önce`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function ForumPage() {
  const posts = await prisma.forumPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return (
    <>
      <header className="fixed top-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-md z-40 border-b border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] pt-4 pb-2 px-5">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-900">Topluluk 💬</h1>
          <button className="relative w-9 h-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <i className="fa-regular fa-bell"></i>
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input
            type="text"
            placeholder="Konularda ara..."
            className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-pw-primary/20 outline-none transition-all placeholder:text-slate-400"
          />
        </div>
      </header>

      <main className="w-full pt-[8.5rem] pb-28 px-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mt-2 mb-5 py-1">
          <Chip active>Hepsi</Chip>
          <Chip>🐕 Köpekler</Chip>
          <Chip>🐈 Kediler</Chip>
          <Chip>💊 Sağlık</Chip>
          <Chip>🦴 Beslenme</Chip>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl p-4 border border-blue-100 mb-5 flex items-start gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg shadow-sm flex-shrink-0">
            📢
          </div>
          <div>
            <h3 className="text-xs font-bold text-pw-primary mb-1">Kurallar Güncellendi</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Veteriner tavsiyesi yerine geçmeyen paylaşımlar hakkında kurallarımızı güncelledik.{" "}
              <span className="underline font-medium cursor-pointer">İncele</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => {
              const style = categoryStyle(post.category);
              return (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                        {getInitials(post.user.name)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{post.user.name}</p>
                        <p className="text-[10px] text-slate-400">{timeAgo(post.createdAt)}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md ${style.color} text-[9px] font-bold uppercase tracking-wide border`}
                    >
                      {style.label}
                    </span>
                  </div>

                  <h2 className="text-sm font-bold text-slate-800 mb-2 leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-3">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                    <div className="flex gap-1.5">
                      <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        #{post.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-xs">
                      <button className="flex items-center gap-1 hover:text-pw-primary transition-colors">
                        <i className="fa-regular fa-thumbs-up"></i> {post.likes}
                      </button>
                      <button className="flex items-center gap-1 hover:text-pw-primary transition-colors">
                        <i className="fa-regular fa-comment"></i> {post.comments}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm">Henüz hiç gönderi paylaşılmamış.</p>
            </div>
          )}
        </div>
      </main>

      <AddPostModal />
    </>
  );
}

function Chip({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
        active
          ? "bg-slate-900 text-white font-semibold shadow-md shadow-slate-900/20"
          : "bg-white border border-slate-200 text-slate-600 font-medium hover:border-pw-primary hover:text-pw-primary"
      }`}
    >
      {children}
    </button>
  );
}
