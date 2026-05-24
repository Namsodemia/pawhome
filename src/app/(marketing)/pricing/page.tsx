import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-pw-primary text-sm font-bold uppercase tracking-wider mb-2">
          Fiyatlandırma
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
          Basit ve şeffaf fiyat
        </h1>
        <p className="mt-4 text-slate-600 text-lg">
          Ücretsiz başla, ihtiyacın olunca Premium&apos;a geç. Yıllık ödemede %25 indirim.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Plan
          name="Ücretsiz"
          price="₺0"
          period="sonsuza kadar"
          desc="Yeni başlayanlar için"
          cta="Hemen Başla"
          ctaHref="/register"
          features={[
            "1 evcil hayvan profili",
            "Temel hatırlatıcılar",
            "Forum erişimi",
            "Klinik arama",
            "Reklamlı VetAI (günde 5 mesaj)",
          ]}
        />
        <Plan
          name="Premium"
          price="₺49.99"
          period="/ay"
          desc="Tek dost ya da küçük aile için"
          cta="14 Gün Ücretsiz Dene"
          ctaHref="/register?plan=premium"
          highlight
          features={[
            "Sınırsız evcil hayvan",
            "Sınırsız VetAI sohbeti (reklamsız)",
            "Öncelikli destek",
            "Detaylı sağlık raporları",
            "Bildirim özelleştirme",
            "Aile paylaşımı (3 kullanıcı)",
          ]}
        />
        <Plan
          name="Klinik"
          price="₺499"
          period="/ay"
          desc="Veteriner klinikleri için"
          cta="İletişime Geç"
          ctaHref="/contact?plan=klinik"
          features={[
            "Premium tüm özellikleri",
            "Klinik profil sayfası",
            "Online randevu yönetimi",
            "Hasta veri tabanı",
            "Faturalama entegrasyonu",
            "API erişimi",
          ]}
        />
      </div>

      {/* Feature comparison */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Detaylı karşılaştırma</h2>
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4 font-semibold">Özellik</th>
                <th className="text-center p-4 font-semibold">Ücretsiz</th>
                <th className="text-center p-4 font-semibold text-pw-primary">Premium</th>
                <th className="text-center p-4 font-semibold">Klinik</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {[
                ["Evcil hayvan sayısı", "1", "Sınırsız", "Sınırsız"],
                ["VetAI mesaj/gün", "5", "Sınırsız", "Sınırsız"],
                ["Hatırlatıcı sayısı", "10", "Sınırsız", "Sınırsız"],
                ["Forum erişimi", "✓", "✓", "✓"],
                ["Klinik arama", "✓", "✓", "✓"],
                ["Sağlık raporları", "—", "✓", "✓"],
                ["Aile paylaşımı", "—", "3 kullanıcı", "10 kullanıcı"],
                ["Klinik profili", "—", "—", "✓"],
                ["API erişimi", "—", "—", "✓"],
                ["Öncelikli destek", "—", "✓", "✓"],
              ].map((row, i) => (
                <tr key={i} className={i % 2 ? "bg-slate-50/50" : ""}>
                  <td className="p-4 font-medium">{row[0]}</td>
                  <td className="p-4 text-center text-slate-500">{row[1]}</td>
                  <td className="p-4 text-center font-semibold">{row[2]}</td>
                  <td className="p-4 text-center text-slate-500">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Sıkça sorulan</h2>
        <div className="space-y-3">
          {[
            {
              q: "İstediğim zaman iptal edebilir miyim?",
              a: "Evet. Tek tıkla iptal, hiçbir taahhüt yok. Mevcut faturalandırma dönemi bitene kadar Premium özelliklerini kullanmaya devam edersin.",
            },
            {
              q: "Yıllık ödemede indirim var mı?",
              a: "Yıllık ödemede %25 indirim — Premium yıllık ₺449.91 yerine ₺337.43.",
            },
            {
              q: "Ücretsiz plan ne kadar süreyle?",
              a: "Sonsuza kadar. Reklamlı ama tam özellikli. Kredi kartı bilgisi istenmez.",
            },
            {
              q: "Premium'a yükseltirsem verilerim kaybolur mu?",
              a: "Hayır, tüm geçmiş hatırlatıcıların, evcil hayvan profillerin ve forum gönderilerin korunur.",
            },
          ].map((f) => (
            <details
              key={f.q}
              className="bg-white border border-slate-200 rounded-xl p-4 group"
            >
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                {f.q}
                <i className="fa-solid fa-chevron-down group-open:rotate-180 transition"></i>
              </summary>
              <p className="text-sm text-slate-600 mt-3">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function Plan({
  name,
  price,
  period,
  desc,
  cta,
  ctaHref,
  features,
  highlight,
}: {
  name: string;
  price: string;
  period: string;
  desc: string;
  cta: string;
  ctaHref: string;
  features: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative bg-white rounded-3xl border p-7 ${
        highlight
          ? "border-pw-primary shadow-2xl shadow-blue-500/10 md:-translate-y-2"
          : "border-slate-200"
      }`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pw-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          En Popüler
        </div>
      )}
      <h3 className="font-bold text-lg text-slate-900">{name}</h3>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
      <div className="mt-5 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-slate-900">{price}</span>
        <span className="text-sm text-slate-500">{period}</span>
      </div>
      <Link
        href={ctaHref}
        className={`block mt-6 text-center font-semibold py-3 rounded-xl transition-colors ${
          highlight
            ? "bg-pw-primary text-white shadow-lg shadow-blue-500/30"
            : "bg-slate-100 text-slate-800 hover:bg-slate-200"
        }`}
      >
        {cta}
      </Link>
      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
            <i className="fa-solid fa-check text-pw-secondary mt-1 flex-shrink-0"></i>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
