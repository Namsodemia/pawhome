import { prisma } from "@/lib/prisma";
import { deletePet } from "./actions";

export default async function AdminPetsPage() {
  const pets = await prisma.pet.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">
        Evcil Hayvanlar <span className="text-slate-400 text-base">({pets.length})</span>
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pets.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-14 h-14 rounded-2xl text-3xl flex items-center justify-center ${
                  p.type === "cat" ? "bg-blue-50" : "bg-orange-50"
                }`}
              >
                {p.type === "cat" ? "🐈" : "🐕"}
              </div>
              <form action={deletePet}>
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center text-xs"
                  title="Sil"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </form>
            </div>
            <h3 className="font-bold text-slate-900">{p.name}</h3>
            <p className="text-xs text-slate-500">{p.breed ?? "—"} · {p.age ?? "?"} yaş</p>

            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="text-[10px] text-slate-400">SAHİP</div>
              <div className="text-xs font-semibold text-slate-700">{p.user.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{p.user.email}</div>
            </div>

            <div className="flex gap-2 mt-3">
              <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                <div className="text-[9px] text-green-700 font-semibold uppercase">Sağlık</div>
                <div className="text-sm font-bold text-green-700">%{p.healthScore}</div>
              </div>
              <div className="flex-1 bg-yellow-50 rounded-lg p-2 text-center">
                <div className="text-[9px] text-yellow-700 font-semibold uppercase">Enerji</div>
                <div className="text-sm font-bold text-yellow-700">%{p.energyScore}</div>
              </div>
            </div>
          </div>
        ))}
        {pets.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            Henüz evcil hayvan eklenmedi.
          </div>
        )}
      </div>
    </div>
  );
}
