export function BlogForm({
  action,
  initial,
  submitLabel = "Kaydet",
}: {
  action: (formData: FormData) => Promise<void>;
  initial?: {
    id?: number;
    title?: string;
    slug?: string;
    excerpt?: string;
    content?: string;
    category?: string;
    status?: string;
    coverEmoji?: string;
    coverImage?: string | null;
    readTime?: number;
  };
  submitLabel?: string;
}) {
  return (
    <form action={action} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5 max-w-4xl">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Başlık *</label>
        <input
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Slug{" "}
            <span className="text-slate-400 font-normal">(boş bırakırsan başlıktan üretilir)</span>
          </label>
          <input
            name="slug"
            defaultValue={initial?.slug ?? ""}
            placeholder="kopek-asi-takvimi"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-pw-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kategori *</label>
          <select
            name="category"
            required
            defaultValue={initial?.category ?? "haber"}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
          >
            <option value="saglik">Sağlık</option>
            <option value="beslenme">Beslenme</option>
            <option value="egitim">Eğitim</option>
            <option value="hikaye">Hikaye</option>
            <option value="haber">Haber</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Özet *</label>
        <textarea
          name="excerpt"
          required
          rows={2}
          defaultValue={initial?.excerpt ?? ""}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          İçerik (Markdown) *
        </label>
        <textarea
          name="content"
          required
          rows={20}
          defaultValue={initial?.content ?? ""}
          placeholder={"# Başlık\n\nParagraf yazısı...\n\n## Alt başlık\n\n- Madde 1\n- Madde 2"}
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-pw-primary resize-y"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Emoji</label>
          <input
            name="coverEmoji"
            defaultValue={initial?.coverEmoji ?? "🐾"}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-2xl text-center focus:outline-none focus:border-pw-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Okuma (dk)</label>
          <input
            type="number"
            name="readTime"
            min="1"
            defaultValue={initial?.readTime ?? 5}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Kapak Resmi URL (ops.)
          </label>
          <input
            name="coverImage"
            defaultValue={initial?.coverImage ?? ""}
            placeholder="https://..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pw-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Durum *</label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="draft"
              defaultChecked={initial?.status !== "published"}
              className="accent-pw-primary"
            />
            <span className="text-sm">Taslak</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="published"
              defaultChecked={initial?.status === "published"}
              className="accent-pw-primary"
            />
            <span className="text-sm">Yayınla</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="bg-pw-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-md shadow-blue-500/30"
        >
          {submitLabel}
        </button>
        <a
          href="/admin/blog"
          className="bg-slate-100 text-slate-700 font-semibold px-6 py-2.5 rounded-xl text-sm"
        >
          İptal
        </a>
      </div>
    </form>
  );
}
