import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [
    userCount,
    petCount,
    reminderCount,
    postCount,
    commentCount,
    likeCount,
    clinicCount,
    blogCount,
    publishedBlogCount,
    contactCount,
    unreadContactCount,
    recentUsers,
    recentPosts,
    recentContacts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.pet.count(),
    prisma.reminder.count(),
    prisma.forumPost.count({ where: { isDeleted: false } }),
    prisma.forumComment.count(),
    prisma.forumLike.count(),
    prisma.clinic.count(),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { status: "published" } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { status: "yeni" } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.forumPost.findMany({
      take: 5,
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.contactMessage.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Bugün {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Toplam Kullanıcı" value={userCount} icon="fa-users" color="from-blue-500 to-blue-600" href="/admin/users" />
        <Stat label="Evcil Hayvan" value={petCount} icon="fa-paw" color="from-orange-500 to-pink-500" href="/admin/pets" />
        <Stat label="Forum Gönderisi" value={postCount} icon="fa-comments" color="from-purple-500 to-indigo-500" href="/admin/forum" />
        <Stat label="Klinik" value={clinicCount} icon="fa-stethoscope" color="from-green-500 to-emerald-500" href="/admin/clinics" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat label="Hatırlatıcı" value={reminderCount} icon="fa-bell" color="from-amber-500 to-orange-500" />
        <Stat label="Yorum" value={commentCount} icon="fa-comment" color="from-teal-500 to-cyan-500" />
        <Stat label="Beğeni" value={likeCount} icon="fa-thumbs-up" color="from-rose-500 to-red-500" />
        <Stat
          label="İletişim"
          value={contactCount}
          badge={unreadContactCount > 0 ? `${unreadContactCount} yeni` : undefined}
          icon="fa-envelope"
          color="from-slate-700 to-slate-900"
          href="/admin/contacts"
        />
      </div>

      {/* Blog status */}
      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Blog Durumu</h3>
            <Link href="/admin/blog" className="text-xs text-pw-primary font-semibold">
              Yönet →
            </Link>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <div className="text-3xl font-bold text-slate-900">{publishedBlogCount}</div>
              <div className="text-xs text-slate-500">Yayında</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-400">{blogCount - publishedBlogCount}</div>
              <div className="text-xs text-slate-500">Taslak</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-gradient-to-br from-pw-primary to-pw-secondary rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative">
            <h3 className="font-bold mb-2">PawHome AI 🤖</h3>
            <p className="text-sm text-blue-50 mb-4">
              Gemini 2.5 Flash entegre, kullanıcılarına 7/24 veteriner asistanlığı sunuyor.
            </p>
            <div className="flex gap-3">
              <Link
                href="/app/vet-ai"
                className="bg-white text-pw-primary px-4 py-2 rounded-xl text-xs font-bold"
              >
                Asistanı Dene
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Yeni Kullanıcılar</h3>
            <Link href="/admin/users" className="text-xs text-pw-primary font-semibold">Tümü</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentUsers.map((u) => (
              <div key={u.id} className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-pw-primary flex items-center justify-center text-xs font-bold">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{u.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  u.role === "admin" ? "bg-purple-100 text-purple-700" :
                  u.role === "moderator" ? "bg-blue-100 text-blue-700" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Son Forum Gönderileri</h3>
            <Link href="/admin/forum" className="text-xs text-pw-primary font-semibold">Tümü</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentPosts.map((p) => (
              <div key={p.id} className="p-4">
                <div className="text-sm font-semibold text-slate-800 line-clamp-1">{p.title}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {p.user.name} · {p.category} · {p.createdAt.toLocaleDateString("tr-TR")}
                </div>
              </div>
            ))}
            {recentPosts.length === 0 && <div className="p-4 text-xs text-slate-400">Henüz gönderi yok</div>}
          </div>
        </div>
      </div>

      {recentContacts.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Son İletişim Mesajları</h3>
            <Link href="/admin/contacts" className="text-xs text-pw-primary font-semibold">Tümü</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentContacts.map((c) => (
              <div key={c.id} className="p-4 flex items-center gap-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                  c.status === "yeni" ? "bg-amber-100 text-amber-700" :
                  c.status === "okundu" ? "bg-blue-100 text-blue-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {c.status}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{c.subject}</div>
                  <div className="text-[11px] text-slate-500">{c.name} · {c.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  color,
  href,
  badge,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
  href?: string;
  badge?: string;
}) {
  const inner = (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative">
      {badge && (
        <span className="absolute top-3 right-3 text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">
          {badge}
        </span>
      )}
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center mb-3`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value.toLocaleString("tr-TR")}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
