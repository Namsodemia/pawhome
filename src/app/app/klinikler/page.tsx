import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/utils";
import { LocationButton } from "@/components/LocationButton";

export default async function KliniklerPage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string }>;
}) {
  const sp = await searchParams;
  const userLat = sp.lat ? Number(sp.lat) : 40.99;
  const userLng = sp.lng ? Number(sp.lng) : 29.03;

  const rows = await prisma.clinic.findMany();
  const clinics = rows
    .map((c) => ({
      ...c,
      distance: haversineKm(userLat, userLng, c.latitude, c.longitude),
    }))
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="h-screen w-full flex flex-col relative text-slate-800 overflow-hidden">
      <div className="h-[45vh] w-full bg-slate-200 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop"
          alt=""
          className="w-full h-full object-cover opacity-60 grayscale-[30%]"
        />

        <div className="absolute top-0 left-0 w-full px-5 pt-safe mt-4 z-20">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 flex items-center p-2">
            <Link href="/app">
              <i className="fa-solid fa-arrow-left text-slate-400 px-3"></i>
            </Link>
            <input
              type="text"
              placeholder="Veteriner veya klinik ara..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500 text-slate-800"
            />
            <LocationButton />
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer z-10">
          <div className="bg-white px-2 py-1 rounded-lg shadow-md mb-1 whitespace-nowrap">
            <span className="text-[10px] font-bold text-slate-800">Sen Buradasın</span>
          </div>
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
        </div>
      </div>

      <div className="flex-1 bg-white -mt-6 rounded-t-[2rem] relative z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] flex flex-col pb-24 overflow-hidden">
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        <div className="px-5 py-3">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            <button className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shadow-md">
              <i className="fa-solid fa-location-arrow mr-1"></i> En Yakın
            </button>
            <button className="px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-medium whitespace-nowrap">
              🚨 Nöbetçi
            </button>
            <button className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium whitespace-nowrap">
              Şu An Açık
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 space-y-4 pb-4">
          {clinics.length > 0 ? (
            clinics.map((clinic) => {
              const isEmergency = clinic.status === "nobetci";
              const isOpen = clinic.status === "acik";
              const statusClass = isEmergency
                ? "bg-red-500 text-white animate-pulse"
                : isOpen
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-500";
              const borderClass = isEmergency ? "border-l-4 border-l-red-500" : "";
              const statusLabel = isEmergency ? "NÖBETÇİ" : isOpen ? "AÇIK" : "KAPALI";

              return (
                <div
                  key={clinic.id}
                  className={`bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex gap-4 relative overflow-hidden group active:bg-slate-50 transition-colors ${borderClass}`}
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                    {clinic.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={clinic.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className={`w-full h-full ${
                          isEmergency ? "bg-red-50 text-red-500" : "bg-slate-200 text-slate-500"
                        } flex items-center justify-center text-2xl`}
                      >
                        <i className="fa-solid fa-user-doctor"></i>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-900 text-sm">{clinic.name}</h3>
                      <div className={`${statusClass} text-[9px] font-bold px-1.5 py-0.5 rounded`}>
                        {statusLabel}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 my-1">
                      <div className="flex text-yellow-400 text-[10px]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <i
                            key={i}
                            className={`${
                              i < Math.round(clinic.rating) ? "fa-solid" : "fa-regular"
                            } fa-star`}
                          ></i>
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400">({clinic.ratingCount})</span>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-3">
                      <i className="fa-solid fa-location-dot text-pw-primary mr-1"></i>
                      {clinic.distance.toFixed(1)} km • {clinic.address}
                    </p>

                    <div className="flex gap-2">
                      <a
                        href={`tel:${clinic.phone ?? ""}`}
                        className={`flex-1 ${
                          isEmergency ? "bg-red-500 shadow-red-200" : "bg-pw-primary"
                        } text-white text-[10px] font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform`}
                      >
                        <i className="fa-solid fa-phone"></i> Ara
                      </a>
                      <button className="w-8 h-8 rounded-lg border border-slate-200 text-pw-secondary flex items-center justify-center hover:bg-green-50 active:scale-95 transition-transform">
                        <i className="fa-solid fa-diamond-turn-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-400">
              <p>Yakınınızda kayıtlı klinik bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
