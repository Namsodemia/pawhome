import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteClinic } from "./actions";

export default async function AdminClinicsPage() {
  const clinics = await prisma.clinic.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Klinikler</h1>
          <p className="text-sm text-slate-500 mt-1">Toplam {clinics.length} klinik</p>
        </div>
        <Link
          href="/admin/clinics/new"
          className="bg-pw-primary text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow-md shadow-blue-500/30"
        >
          <i className="fa-solid fa-plus mr-1.5"></i>Yeni Klinik
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left p-4">Klinik</th>
                <th className="text-left p-4 hidden md:table-cell">Adres</th>
                <th className="text-center p-4">Durum</th>
                <th className="text-center p-4 hidden lg:table-cell">Puan</th>
                <th className="text-right p-4">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clinics.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{c.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {c.phone} · {c.latitude.toFixed(3)}, {c.longitude.toFixed(3)}
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell text-slate-600 text-xs">{c.address}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded ${
                        c.status === "nobetci"
                          ? "bg-red-100 text-red-700"
                          : c.status === "acik"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.status === "nobetci" ? "NÖBETÇİ" : c.status === "acik" ? "AÇIK" : "KAPALI"}
                    </span>
                  </td>
                  <td className="p-4 text-center hidden lg:table-cell">
                    <span className="text-yellow-500">★</span>{" "}
                    <span className="font-semibold">{c.rating.toFixed(1)}</span>
                    <span className="text-slate-400 text-[10px]"> ({c.ratingCount})</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/admin/clinics/${c.id}`}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded bg-blue-50 text-pw-primary hover:bg-blue-100"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </Link>
                      <form action={deleteClinic}>
                        <input type="hidden" name="id" value={c.id} />
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
