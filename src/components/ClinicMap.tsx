"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon paths (Leaflet's webpack/Next.js bug)
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom paw icon for clinics
const clinicIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 38px; height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #22c55e);
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 18px;
    ">🐾</div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -19],
});

const emergencyIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 42px; height: 42px;
      border-radius: 50%;
      background: linear-gradient(135deg, #dc2626, #ef4444);
      border: 3px solid white;
      box-shadow: 0 4px 16px rgba(220, 38, 38, 0.5);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 18px;
      animation: pw-pulse 1.5s infinite;
    ">🚨</div>
    <style>
      @keyframes pw-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
    </style>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21],
});

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

function FlyToUser({ lat, lng, version }: { lat: number; lng: number; version: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 13, { duration: 1.2 });
  }, [lat, lng, version, map]);
  return null;
}

export function ClinicMap({
  userLat,
  userLng,
  clinics,
}: {
  userLat: number;
  userLng: number;
  clinics: Clinic[];
}) {
  const center = useMemo<[number, number]>(() => [userLat, userLng], [userLat, userLng]);
  const flyKey = useRef(0);
  flyKey.current += 1;

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full"
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      <FlyToUser lat={userLat} lng={userLng} version={flyKey.current} />

      {/* User location pulsing dot */}
      <CircleMarker
        center={center}
        radius={9}
        pathOptions={{
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 1,
          weight: 3,
        }}
      >
        <Popup>
          <strong>Sen buradasın</strong>
        </Popup>
      </CircleMarker>
      <CircleMarker
        center={center}
        radius={22}
        pathOptions={{
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          weight: 0,
        }}
      />

      {/* Clinic markers */}
      {clinics.map((c) => {
        const isEmergency = c.status === "nobetci";
        return (
          <Marker
            key={c.id}
            position={[c.latitude, c.longitude]}
            icon={isEmergency ? emergencyIcon : clinicIcon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <strong className="text-sm">{c.name}</strong>
                  {isEmergency && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded">
                      NÖBETÇİ
                    </span>
                  )}
                </div>
                <div className="text-xs text-yellow-600 mb-1">
                  {"★".repeat(Math.round(c.rating))}
                  {"☆".repeat(5 - Math.round(c.rating))}{" "}
                  <span className="text-slate-400">({c.ratingCount})</span>
                </div>
                <div className="text-xs text-slate-600 mb-1">
                  📍 {c.distance.toFixed(1)} km
                </div>
                {c.address && (
                  <div className="text-xs text-slate-500 mb-2">{c.address}</div>
                )}
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className={`block text-center text-xs font-semibold py-1.5 rounded ${
                      isEmergency
                        ? "bg-red-500 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    📞 Ara
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
