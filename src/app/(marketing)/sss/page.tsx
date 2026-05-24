import Link from "next/link";

const faqs: { cat: string; items: { q: string; a: string }[] }[] = [
  {
    cat: "Genel",
    items: [
      {
        q: "PawHome nedir?",
        a: "PawHome, evcil hayvan sahipleri için hatırlatıcı, sağlık takibi, klinik bulma, VetAI (ChatGPT destekli) danışmanlık ve topluluk forumunu tek uygulamada toplayan bir bakım asistanıdır.",
      },
      {
        q: "Hangi hayvanlar destekleniyor?",
        a: "Şu an köpek ve kedi destekleniyor. Yakında kuş, tavşan, balık ve sürüngenler eklenecek.",
      },
      {
        q: "Ücretsiz mi?",
        a: "Evet, temel özellikler ücretsiz ve sonsuza kadar öyle kalacak. Premium plan ile ekstra özellikler ve sınırsız kullanım açılır.",
      },
    ],
  },
  {
    cat: "Hesap",
    items: [
      {
        q: "Hesap nasıl açılır?",
        a: "Kayıt sayfasından ad, e-posta ve şifre ile 30 saniyede hesabını aç. E-posta doğrulaması yakında zorunlu olacak.",
      },
      {
        q: "Şifremi unuttum, ne yapmalıyım?",
        a: "Giriş sayfasındaki 'Şifremi Unuttum?' linkinden sıfırlama maili al. (Bu özellik şu an geliştirme aşamasında.)",
      },
      {
        q: "Hesabımı nasıl silerim?",
        a: "Profil > Ayarlar > Hesabı Sil. Veriler 30 gün içinde geri dönüşsüz şekilde silinir.",
      },
    ],
  },
  {
    cat: "VetAI",
    items: [
      {
        q: "VetAI gerçek bir veteriner mi?",
        a: "Hayır. VetAI, OpenAI gpt-4o-mini tabanlı bir yapay zeka asistanıdır. Bilgilendirme amaçlıdır, tıbbi teşhis koymaz. Acil durumlarda mutlaka gerçek veterinere başvur.",
      },
      {
        q: "VetAI ne zaman kullanılmamalı?",
        a: "Bilinç kaybı, nefes darlığı, ağır kanama, zehirlenme şüphesi, doğum güçlüğü gibi acil durumlarda derhal en yakın 24 saat açık veteriner kliniğine git.",
      },
      {
        q: "Veriler kaydediliyor mu?",
        a: "Konuşma geçmişi sadece cihazında saklanır, sunucularımızda tutulmaz. OpenAI API'ye gönderilen veriler için OpenAI'nın veri politikası geçerlidir.",
      },
    ],
  },
  {
    cat: "Premium & Faturalama",
    items: [
      {
        q: "İstediğim zaman iptal edebilir miyim?",
        a: "Evet, tek tıkla. İptal sonrası mevcut faturalama dönemi sonuna kadar Premium özelliklerini kullanmaya devam edersin.",
      },
      {
        q: "Hangi ödeme yöntemleri kabul ediliyor?",
        a: "Kredi kartı (Visa, Mastercard, Amex), Apple Pay, Google Pay. Türkiye'den Iyzico üzerinden işlem yapılır.",
      },
      {
        q: "Fatura alabilir miyim?",
        a: "Evet, her ödeme sonrası e-fatura otomatik e-postaya gönderilir. Kurumsal hesaplar için VKN bilgisini destek@pawhome.app'e iletmen yeterli.",
      },
    ],
  },
];

export default function SSSPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-16 md:py-24">
      <div className="text-center mb-12">
        <p className="text-pw-primary text-sm font-bold uppercase tracking-wider mb-2">
          Sıkça Sorulanlar
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">Nasıl yardımcı olabiliriz?</h1>
        <p className="mt-4 text-slate-600">
          Cevabını bulamadıysan{" "}
          <Link href="/contact" className="text-pw-primary font-semibold hover:underline">
            bize yaz
          </Link>
          .
        </p>
      </div>

      <div className="space-y-10">
        {faqs.map((group) => (
          <div key={group.cat}>
            <h2 className="text-xs font-bold text-pw-primary uppercase tracking-wider mb-4">
              {group.cat}
            </h2>
            <div className="space-y-3">
              {group.items.map((item) => (
                <details
                  key={item.q}
                  className="bg-white border border-slate-100 rounded-xl p-5 group"
                >
                  <summary className="font-semibold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                    <span>{item.q}</span>
                    <i className="fa-solid fa-chevron-down text-slate-400 group-open:rotate-180 transition"></i>
                  </summary>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-gradient-to-br from-pw-primary/5 to-pw-secondary/5 border border-slate-100 rounded-2xl p-8 text-center">
        <h3 className="text-lg font-bold text-slate-900">Aradığını bulamadın mı?</h3>
        <p className="text-sm text-slate-600 mt-2 mb-5">
          Destek ekibimiz 24 saat içinde dönüş yapıyor.
        </p>
        <Link
          href="/contact"
          className="inline-block bg-pw-primary text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-blue-500/30"
        >
          Bize Ulaş
        </Link>
      </div>
    </div>
  );
}
