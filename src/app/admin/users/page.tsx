import { prisma } from "@/lib/prisma";
import { updateUserRole, toggleBan, deleteUser } from "./actions";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBanned: true,
      createdAt: true,
      _count: { select: { pets: true, forumPosts: true } },
    },
  });

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Kullanıcılar</h1>
          <p className="text-sm text-slate-500 mt-1">Toplam {users.length} hesap</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left p-4">Kullanıcı</th>
                <th className="text-left p-4 hidden md:table-cell">E-posta</th>
                <th className="text-center p-4">Rol</th>
                <th className="text-center p-4 hidden lg:table-cell">Pet</th>
                <th className="text-center p-4 hidden lg:table-cell">Post</th>
                <th className="text-center p-4">Durum</th>
                <th className="text-right p-4">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-pw-primary flex items-center justify-center text-xs font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{u.name}</div>
                        <div className="text-[10px] text-slate-400 md:hidden">{u.email}</div>
                        <div className="text-[10px] text-slate-400">
                          {u.createdAt.toLocaleDateString("tr-TR")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-slate-600">{u.email}</td>
                  <td className="p-4 text-center">
                    <form action={updateUserRole}>
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className={`text-[11px] font-semibold px-2 py-1 rounded border-0 outline-none cursor-pointer ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : u.role === "moderator"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      >
                        <option value="user">user</option>
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                      </select>
                    </form>
                  </td>
                  <td className="p-4 text-center hidden lg:table-cell text-slate-600">{u._count.pets}</td>
                  <td className="p-4 text-center hidden lg:table-cell text-slate-600">{u._count.forumPosts}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded ${
                        u.isBanned ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {u.isBanned ? "BANLI" : "AKTİF"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <form action={toggleBan}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          className={`text-[10px] font-semibold px-2.5 py-1 rounded ${
                            u.isBanned
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                          title={u.isBanned ? "Ban kaldır" : "Banla"}
                        >
                          <i className={`fa-solid ${u.isBanned ? "fa-unlock" : "fa-ban"}`}></i>
                        </button>
                      </form>
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          className="text-[10px] font-semibold px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
                          title="Sil"
                        >
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
