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
  image: string | null;
  distance: number;
};

export function ClinicList({ clinics }: { clinics: Clinic[] }) {
  return (
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

          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${clinic.latitude},${clinic.longitude}`;

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

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{clinic.name}</h3>
                  <div className={`${statusClass} text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0`}>
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

                <p className="text-[11px] text-slate-500 mb-3 truncate">
                  <i className="fa-solid fa-location-dot text-pw-primary mr-1"></i>
                  {clinic.distance.toFixed(1)} km • {clinic.address}
                </p>

                <div className="flex gap-2">
                  {clinic.phone && (
                    <a
                      href={`tel:${clinic.phone}`}
                      className={`flex-1 ${
                        isEmergency ? "bg-red-500 shadow-red-200" : "bg-pw-primary"
                      } text-white text-[10px] font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform`}
                    >
                      <i className="fa-solid fa-phone"></i> Ara
                    </a>
                  )}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Yol tarifi al"
                    className="w-8 h-8 rounded-lg border border-slate-200 text-pw-secondary flex items-center justify-center hover:bg-green-50 active:scale-95 transition-transform"
                  >
                    <i className="fa-solid fa-diamond-turn-right"></i>
                  </a>
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
  );
}
