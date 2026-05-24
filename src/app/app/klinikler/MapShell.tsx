"use client";

import dynamic from "next/dynamic";

// Leaflet uses window/document — must load client-only
const ClinicMap = dynamic(
  () => import("@/components/ClinicMap").then((m) => m.ClinicMap),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
          <span className="text-xs font-medium">Harita yükleniyor...</span>
        </div>
      </div>
    ),
  }
);

type Clinic = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  latitude: number;
  longitude: number;
  status: string;
  rating: number;
  ratingCount: number;
  distance: number;
};

export function MapShell({
  userLat,
  userLng,
  clinics,
}: {
  userLat: number;
  userLng: number;
  clinics: Clinic[];
}) {
  return (
    <div className="absolute inset-0">
      <ClinicMap userLat={userLat} userLng={userLng} clinics={clinics} />
    </div>
  );
}
