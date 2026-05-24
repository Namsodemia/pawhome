import Link from "next/link";

const posts = [
  {
    slug: "kopek-asi-takvimi",
    cat: "Sağlık",
    catColor: "bg-red-100 text-red-700",
    title: "Köpekler için aşı takvimi: 2026 güncel rehber",
    excerpt: "Yavru köpeğin ilk 6 ayı kritik. Hangi aşıyı ne zaman yaptırmalısın, veteriner hekimle birlikte hazırladığımız rehber.",
    date: "12 Mart 2026",
    readTime: "6 dk",
    emoji: "💉",
  },
  {
    slug: "kedi-beslenmesi",
    cat: "Beslenme",
    catColor: "bg-green-100 text-green-700",
    title: "Kediler için ideal beslenme: kuru mu, yaş mı?",
    excerpt: "Yetişkin kediler için günlük kalori ihtiyacı, su tüketimi, mama seçimi. Yaygın hataları anlatıyoruz.",
    date: "5 Mart 2026",
    readTime: "8 dk",
    emoji: "🍽️",
  },
  {
    slug: "kopek-egitim-temel",
    cat: "Eğitim",
    catColor: "bg-blue-100 text-blue-700",
    title: "Yavru köpek eğitiminde 5 temel kural",
    excerpt: "Pozitif pekiştirme, tutarlılık, sabır. Eve yeni gelen yavruyla ilk haftalarda nelere dikkat etmeli?",
    date: "28 Şubat 2026",
    readTime: "5 dk",
    emoji: "🎾",
  },
  {
    slug: "vet-ne-zaman",
    cat: "Sağlık",
    catColor: "bg-red-100 text-red-700",
    title: "Bunları görürsen acilen veterinere git",
    excerpt: "8 acil durum belirtisi. Nefes darlığı, kusma, ishal, bilinç kaybı — hangisi ne anlama geliyor?",
    date: "20 Şubat 2026",
    readTime: "4 dk",
    emoji: "🚨",
  },
  {
    slug: "kedi-davranis",
    cat: "Eğitim",
    catColor: "bg-blue-100 text-blue-700",
    title: "Kedinin davranışını anlama: 12 yaygın işaret",
    excerpt: "Kuyruk hareketleri, mırlama, ısırma — kedinin sana ne söylemeye çalıştığını çöz.",
    date: "15 Şubat 2026",
    readTime: "7 dk",
    emoji: "🐈",
  },
  {
    slug: "yaz-sicagi",
    cat: "Sağlık",
    catColor: "bg-red-100 text-red-700",
    title: "Yaz sıcağında köpeğini korumanın 10 yolu",
    excerpt: "Sıcak çarpması belirtileri, su tüketimi, gezdirme saatleri. Yaz aylarında özel önlemler.",
    date: "8 Şubat 2026",
    readTime: "6 dk",
    emoji: "☀️",
  },
];

export default function BlogPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-16 md:py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-pw-primary text-sm font-bold uppercase tracking-wider mb-2">Blog</p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
          Bilgi, ipucu ve hikayeler
        </h1>
        <p className="mt-4 text-slate-600 text-lg">
          Veterinerlerle birlikte hazırladığımız içerikler.
        </p>
      </div>

      <div className="flex gap-2 justify-center mb-10 flex-wrap">
        {["Hepsi", "Sağlık", "Beslenme", "Eğitim", "Hikaye"].map((c, i) => (
          <button
            key={c}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              i === 0
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-pw-primary hover:text-pw-primary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="group bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
              {p.emoji}
            </div>
            <div className="p-5">
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${p.catColor}`}
              >
                {p.cat}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-3 leading-snug group-hover:text-pw-primary transition-colors">
                {p.title}
              </h2>
              <p className="text-sm text-slate-600 mt-2 line-clamp-2">{p.excerpt}</p>
              <div className="flex items-center gap-3 mt-4 text-xs text-slate-400">
                <span>{p.date}</span>
                <span>·</span>
                <span>{p.readTime} okuma</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-14 text-center">
        <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-semibold text-sm text-slate-700 hover:border-pw-primary hover:text-pw-primary transition-colors">
          Daha Fazla Yükle
        </button>
      </div>
    </div>
  );
}
