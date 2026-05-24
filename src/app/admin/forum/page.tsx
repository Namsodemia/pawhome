import { prisma } from "@/lib/prisma";
import { togglePin, softDeletePost, restorePost, hardDeletePost } from "./actions";

export default async function AdminForumPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab ?? "active";

  const posts = await prisma.forumPost.findMany({
    where: tab === "deleted" ? { isDeleted: true } : { isDeleted: false },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { comments: true, likes: true } },
    },
  });

  const [activeCount, deletedCount] = await Promise.all([
    prisma.forumPost.count({ where: { isDeleted: false } }),
    prisma.forumPost.count({ where: { isDeleted: true } }),
  ]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Forum Moderasyonu</h1>

      <div className="flex gap-2 mb-6">
        <a
          href="/admin/forum?tab=active"
          className={`px-4 py-2 rounded-xl text-xs font-semibold ${
            tab === "active" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
          }`}
        >
          Aktif ({activeCount})
        </a>
        <a
          href="/admin/forum?tab=deleted"
          className={`px-4 py-2 rounded-xl text-xs font-semibold ${
            tab === "deleted" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
          }`}
        >
          Silinmiş ({deletedCount})
        </a>
      </div>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {p.category}
                </span>
                {p.isPinned && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-pw-primary">
                    <i className="fa-solid fa-thumbtack mr-1"></i>SABİT
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                {p.createdAt.toLocaleDateString("tr-TR")}
              </div>
            </div>

            <h3 className="font-bold text-slate-900 mb-1">{p.title}</h3>
            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{p.content}</p>

            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{p.user.name}</span>
                <span className="ml-2 text-slate-400">{p.user.email}</span>
                <span className="ml-3">👍 {p._count.likes}</span>
                <span className="ml-2">💬 {p._count.comments}</span>
              </div>

              <div className="flex gap-2">
                {tab === "active" ? (
                  <>
                    <form action={togglePin}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        className={`text-[10px] font-semibold px-3 py-1.5 rounded ${
                          p.isPinned ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-pw-primary"
                        }`}
                      >
                        <i className="fa-solid fa-thumbtack mr-1"></i>
                        {p.isPinned ? "Kaldır" : "Sabitle"}
                      </button>
                    </form>
                    <form action={softDeletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-[10px] font-semibold px-3 py-1.5 rounded bg-red-50 text-red-700">
                        <i className="fa-solid fa-trash mr-1"></i>Sil
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <form action={restorePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-[10px] font-semibold px-3 py-1.5 rounded bg-green-50 text-green-700">
                        <i className="fa-solid fa-rotate-left mr-1"></i>Geri al
                      </button>
                    </form>
                    <form action={hardDeletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-[10px] font-semibold px-3 py-1.5 rounded bg-red-100 text-red-700">
                        <i className="fa-solid fa-xmark mr-1"></i>Kalıcı Sil
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            {tab === "active" ? "Aktif gönderi yok." : "Silinmiş gönderi yok."}
          </div>
        )}
      </div>
    </div>
  );
}
