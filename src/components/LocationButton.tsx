"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LocationButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function getLocation() {
    if (!navigator.geolocation) {
      alert("Tarayıcınız konum servisini desteklemiyor.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        router.push(`/klinikler?lat=${latitude}&lng=${longitude}`);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert("Konum izni reddedildi. Varsayılan konum (İstanbul) gösteriliyor.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          alert("Konum bilgisi alınamıyor.");
        } else if (err.code === err.TIMEOUT) {
          alert("Konum isteği zaman aşımına uğradı.");
        } else {
          alert("Bilinmeyen bir hata oluştu.");
        }
      }
    );
  }

  return (
    <button
      onClick={getLocation}
      disabled={loading}
      className="w-8 h-8 rounded-full bg-pw-primary text-white flex items-center justify-center shadow-sm active:scale-90 transition disabled:opacity-60"
    >
      <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-location-crosshairs"} text-xs`}></i>
    </button>
  );
}
