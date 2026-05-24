import Link from "next/link";

export default function FeaturesPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-pw-primary text-sm font-bold uppercase tracking-wider mb-2">Özellikler</p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
          Bir evcil dost sahibinin ihtiyacı olan her şey
        </h1>
        <p className="mt-4 text-slate-600 text-lg">
          PawHome, bakımı eğlenceli ve organize hale getirir.
        </p>
      </div>

      <div className="space-y-20">
        <Feature
          tag="Plan"
          title="Akıllı Hatırlatıcılar"
          desc="Aşı, mama saati, yürüyüş, veteriner randevuları. Her şeyi tek bir takvimde planla. Tekrar seçenekleri, kategori bazlı renkler, geçmişin özeti."
          bullets={[
            "Aşı, mama, yürüyüş, vet randevusu için hızlı butonlar",
            "Tek seferlik veya tekrarlı hatırlatıcılar",
            "Push bildirimleri (iOS + Android)",
            "Geçmiş planları otomatik arşivler",
          ]}
          imageEmoji="📅"
          imageBg="from-blue-500 to-indigo-600"
        />

        <Feature
          tag="AI"
          title="VetAI Asistan"
          desc="ChatGPT (gpt-4o-mini) destekli özel yetiştirilmiş veteriner asistanı. Türkçe, empatik ve sorumlu. Acil durumlarda doğru veteriner kliniğine yönlendirir."
          bullets={[
            "7/24 ücretsiz danışma (Premium pakette sınırsız)",
            "Türkçe doğal dil yanıtları",
            "Tıbbi teşhis koymaz, sorumlu davranır",
            "Konuşma geçmişi cihazında saklı",
          ]}
          imageEmoji="🩺"
          imageBg="from-purple-500 to-pink-500"
          reverse
        />

        <Feature
          tag="Konum"
          title="Klinik Bulucu"
          desc="Bulunduğun yere göre veteriner klinikleri sıralı şekilde göster. Açık/Nöbetçi durumlarını gör, tek tıkla ara veya yol tarifi al."
          bullets={[
            "Haversine formülü ile gerçek km mesafesi",
            "Nöbetçi klinikler için kırmızı acil etiketi",
            "Telefon arama (tel:) tek tıkla",
            "Apple/Google Maps yol tarifi entegrasyonu",
          ]}
          imageEmoji="📍"
          imageBg="from-green-500 to-emerald-600"
        />

        <Feature
          tag="Topluluk"
          title="Forum"
          desc="Diğer hayvan sahipleriyle deneyim paylaş. Beslenme, sağlık, eğitim, hikaye kategorilerinde sorular ve cevaplar."
          bullets={[
            "4 ana kategori: Beslenme, Sağlık, Eğitim, Hikaye",
            "Beğeni ve yorum sistemi",
            "Profil sayfasında istatistikler ve puan",
            "Spam koruması (yakında)",
          ]}
          imageEmoji="💬"
          imageBg="from-orange-500 to-red-500"
          reverse
        />

        <Feature
          tag="Pet"
          title="Çoklu Evcil Hayvan Profilleri"
          desc="Birden fazla dost varsa ekstra ücret yok (Premium). Her dost için ayrı sağlık skoru, hatırlatıcı, fotoğraf."
          bullets={[
            "Köpek, kedi (yakında: kuş, tavşan, balık)",
            "Cins, yaş, sağlık ve enerji skoru",
            "Premium: sınırsız evcil hayvan",
            "Ücretsiz: 1 evcil hayvan profili",
          ]}
          imageEmoji="🐈"
          imageBg="from-yellow-500 to-orange-600"
        />
      </div>

      {/* CTA */}
      <div className="mt-24 text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-pw-primary text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/30"
        >
          Hemen Dene <i className="fa-solid fa-arrow-right text-sm"></i>
        </Link>
      </div>
    </div>
  );
}

function Feature({
  tag,
  title,
  desc,
  bullets,
  imageEmoji,
  imageBg,
  reverse,
}: {
  tag: string;
  title: string;
  desc: string;
  bullets: string[];
  imageEmoji: string;
  imageBg: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`grid md:grid-cols-2 gap-10 items-center ${
        reverse ? "md:flex-row-reverse" : ""
      }`}
    >
      <div className={reverse ? "md:order-2" : ""}>
        <p className="text-pw-primary text-xs font-bold uppercase tracking-wider mb-2">{tag}</p>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{title}</h2>
        <p className="text-slate-600 mb-5 leading-relaxed">{desc}</p>
        <ul className="space-y-2">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
              <i className="fa-solid fa-check text-pw-secondary mt-1"></i>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={reverse ? "md:order-1" : ""}>
        <div
          className={`aspect-square max-w-sm mx-auto rounded-3xl bg-gradient-to-br ${imageBg} flex items-center justify-center text-9xl shadow-2xl`}
        >
          {imageEmoji}
        </div>
      </div>
    </div>
  );
}
