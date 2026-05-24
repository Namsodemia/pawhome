import { prisma } from "@/lib/prisma";
import { updateStatus, deleteMessage } from "./actions";

export default async function AdminContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab ?? "all";
  const statusFilter =
    tab === "yeni" || tab === "okundu" || tab === "yanitlandi"
      ? { status: tab as "yeni" | "okundu" | "yanitlandi" }
      : {};

  const messages = await prisma.contactMessage.findMany({
    where: statusFilter,
    orderBy: { createdAt: "desc" },
  });

  const [yeniCount, okunduCount, yanitlandiCount, total] = await Promise.all([
    prisma.contactMessage.count({ where: { status: "yeni" } }),
    prisma.contactMessage.count({ where: { status: "okundu" } }),
    prisma.contactMessage.count({ where: { status: "yanitlandi" } }),
    prisma.contactMessage.count(),
  ]);
  const countByStatus = {
    yeni: yeniCount,
    okundu: okunduCount,
    yanitlandi: yanitlandiCount,
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">İletişim Mesajları</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        <TabLink href="/admin/contacts?tab=all" active={tab === "all"} count={total}>
          Hepsi
        </TabLink>
        <TabLink href="/admin/contacts?tab=yeni" active={tab === "yeni"} count={countByStatus.yeni ?? 0} accent="amber">
          Yeni
        </TabLink>
        <TabLink href="/admin/contacts?tab=okundu" active={tab === "okundu"} count={countByStatus.okundu ?? 0} accent="blue">
          Okundu
        </TabLink>
        <TabLink href="/admin/contacts?tab=yanitlandi" active={tab === "yanitlandi"} count={countByStatus.yanitlandi ?? 0} accent="green">
          Yanıtlandı
        </TabLink>
      </div>

      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400">
            Bu kategoride mesaj yok.
          </div>
        ) : (
          messages.map((m) => (
            <details key={m.id} className="bg-white rounded-2xl border border-slate-100 group">
              <summary className="p-5 cursor-pointer list-none flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded shrink-0 ${
                      m.status === "yeni"
                        ? "bg-amber-100 text-amber-700"
                        : m.status === "okundu"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {m.status.toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{m.subject}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {m.name} · {m.email} · {m.createdAt.toLocaleString("tr-TR")}
                    </div>
                  </div>
                </div>
                <i className="fa-solid fa-chevron-down text-slate-400 group-open:rotate-180 transition"></i>
              </summary>

              <div className="px-5 pb-5 pt-2 border-t border-slate-50">
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mb-4">
                  {m.message}
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <a
                    href={`mailto:${m.email}?subject=Re:${encodeURIComponent(m.subject)}`}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-pw-primary text-white"
                  >
                    <i className="fa-solid fa-envelope mr-1.5"></i>E-posta yaz
                  </a>

                  <div className="flex gap-2">
                    <form action={updateStatus}>
                      <input type="hidden" name="id" value={m.id} />
                      <select
                        name="status"
                        defaultValue={m.status}
                        className="text-[11px] font-semibold px-2 py-1.5 rounded border border-slate-200 bg-white cursor-pointer"
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      >
                        <option value="yeni">yeni</option>
                        <option value="okundu">okundu</option>
                        <option value="yanitlandi">yanıtlandı</option>
                      </select>
                    </form>
                    <form action={deleteMessage}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="text-[11px] font-semibold px-3 py-1.5 rounded bg-red-50 text-red-700 hover:bg-red-100">
                        <i className="fa-solid fa-trash mr-1"></i>Sil
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}

function TabLink({
  href,
  active,
  count,
  accent = "slate",
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  accent?: "slate" | "amber" | "blue" | "green";
  children: React.ReactNode;
}) {
  const accentClass = {
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
  }[accent];
  return (
    <a
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold ${
        active ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"
      }`}
    >
      {children}
      <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? "bg-white/20" : accentClass}`}>
        {count}
      </span>
    </a>
  );
}
