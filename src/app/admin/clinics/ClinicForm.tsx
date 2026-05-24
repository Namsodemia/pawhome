export function ClinicForm({
  action,
  initial,
  submitLabel = "Kaydet",
}: {
  action: (formData: FormData) => Promise<void>;
  initial?: {
    id?: number;
    name?: string;
    address?: string | null;
    phone?: string | null;
    latitude?: number;
    longitude?: number;
    status?: string;
    rating?: number;
    ratingCount?: number;
    image?: string | null;
  };
  submitLabel?: string;
}) {
  return (
    <form action={action} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 max-w-2xl">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Klinik Adı *</label>
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Adres</label>
        <input
          name="address"
          defaultValue={initial?.address ?? ""}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Telefon</label>
          <input
            name="phone"
            placeholder="+9021234567"
            defaultValue={initial?.phone ?? ""}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Durum *</label>
          <select
            name="status"
            required
            defaultValue={initial?.status ?? "acik"}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
          >
            <option value="acik">Açık</option>
            <option value="nobetci">Nöbetçi</option>
            <option value="kapali">Kapalı</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Enlem (Latitude) *</label>
          <input
            type="number"
            name="latitude"
            step="0.000001"
            required
            defaultValue={initial?.latitude ?? 41.0}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Boylam (Longitude) *</label>
          <input
            type="number"
            name="longitude"
            step="0.000001"
            required
            defaultValue={initial?.longitude ?? 29.0}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Puan (0-5)</label>
          <input
            type="number"
            name="rating"
            step="0.1"
            min="0"
            max="5"
            defaultValue={initial?.rating ?? 0}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Puan Sayısı</label>
          <input
            type="number"
            name="ratingCount"
            min="0"
            defaultValue={initial?.ratingCount ?? 0}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Resim URL (opsiyonel)</label>
        <input
          name="image"
          placeholder="https://..."
          defaultValue={initial?.image ?? ""}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="bg-pw-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-blue-500/30"
        >
          {submitLabel}
        </button>
        <a
          href="/admin/clinics"
          className="bg-slate-100 text-slate-700 font-semibold px-6 py-2.5 rounded-xl text-sm"
        >
          İptal
        </a>
      </div>
    </form>
  );
}
