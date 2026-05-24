import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/utils";
import { LocationButton } from "@/components/LocationButton";
import { ClinicList } from "./ClinicList";
import { MapShell } from "./MapShell";

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
      id: c.id,
      name: c.name,
      address: c.address,
      phone: c.phone,
      latitude: c.latitude,
      longitude: c.longitude,
      status: c.status as string,
      rating: c.rating,
      ratingCount: c.ratingCount,
      image: c.image,
      distance: haversineKm(userLat, userLng, c.latitude, c.longitude),
    }))
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="h-screen w-full flex flex-col relative text-slate-800 overflow-hidden">
      {/* Real Leaflet map */}
      <div className="h-[45vh] w-full relative">
        <MapShell userLat={userLat} userLng={userLng} clinics={clinics} />

        {/* Floating search bar */}
        <div className="absolute top-0 left-0 w-full px-5 pt-safe mt-4 z-[500]">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-100 flex items-center p-2">
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
      </div>

      {/* Bottom sheet with clinic cards */}
      <div className="flex-1 bg-white -mt-6 rounded-t-[2rem] relative z-[600] shadow-[0_-5px_20px_rgba(0,0,0,0.1)] flex flex-col pb-24 overflow-hidden">
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        <div className="px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              {clinics.length} klinik bulundu
            </span>
            <span className="text-[10px] text-slate-400">
              Konumun: {userLat.toFixed(3)}, {userLng.toFixed(3)}
            </span>
          </div>
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

        <ClinicList clinics={clinics} />
      </div>
    </div>
  );
}
