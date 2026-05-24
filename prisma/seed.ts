import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const demoPassword = await bcrypt.hash("demo1234", 10);
  const adminPassword = await bcrypt.hash("admin1234", 10);

  // --- Users ---
  const admin = await prisma.user.upsert({
    where: { email: "admin@pawhome.app" },
    update: { role: "admin" },
    create: {
      name: "Admin",
      email: "admin@pawhome.app",
      password: adminPassword,
      role: "admin",
    },
  });

  const demo = await prisma.user.upsert({
    where: { email: "demo@pawhome.app" },
    update: {},
    create: {
      name: "Demo Kullanıcı",
      email: "demo@pawhome.app",
      password: demoPassword,
      pets: {
        create: [
          {
            name: "Luna",
            type: "cat",
            breed: "British Shorthair",
            age: 3,
            healthScore: 92,
            energyScore: 78,
          },
        ],
      },
    },
    include: { pets: true },
  });

  const luna = demo.pets[0];
  if (luna) {
    const existingReminders = await prisma.reminder.count({
      where: { userId: demo.id },
    });
    if (existingReminders === 0) {
      await prisma.reminder.createMany({
        data: [
          {
            userId: demo.id,
            petId: luna.id,
            title: "Karma Aşı",
            description: "Veteriner kliniğinde aşı randevusu",
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
            type: "vaccine",
          },
          {
            userId: demo.id,
            petId: luna.id,
            title: "Akşam Yürüyüşü",
            description: "Park turu",
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 5),
            type: "walk",
          },
        ],
      });
    }
  }

  // --- Clinics ---
  await prisma.clinic.deleteMany();
  await prisma.clinic.createMany({
    data: [
      { name: "Pati Veteriner Kliniği", address: "Bağdat Cad. No:123, Kadıköy", phone: "+902161234567", latitude: 40.9876, longitude: 29.0345, status: "acik", rating: 4.8, ratingCount: 142 },
      { name: "Anadolu Veteriner Hastanesi", address: "Fenerbahçe Cad. No:67, Kadıköy", phone: "+902163334455", latitude: 40.9651, longitude: 29.0376, status: "acik", rating: 4.7, ratingCount: 98 },
      { name: "Üsküdar Hayvan Sağlığı", address: "Halk Cad. No:12, Üsküdar", phone: "+902163332211", latitude: 41.0235, longitude: 29.0145, status: "nobetci", rating: 4.5, ratingCount: 67 },
      { name: "24 Saat Hayvan Hastanesi", address: "Barbaros Bulvarı No:45, Beşiktaş", phone: "+902127654321", latitude: 41.0431, longitude: 29.0067, status: "nobetci", rating: 4.6, ratingCount: 189 },
      { name: "Levent Vet Clinic", address: "Büyükdere Cad. No:201, Levent", phone: "+902122224477", latitude: 41.0817, longitude: 29.0167, status: "acik", rating: 4.9, ratingCount: 312 },
      { name: "Şişli Pet Care", address: "Halaskargazi Cad. No:78, Şişli", phone: "+902121110099", latitude: 41.0608, longitude: 28.9870, status: "acik", rating: 4.3, ratingCount: 54 },
      { name: "Dostum Veteriner", address: "İstiklal Cad. No:200, Beyoğlu", phone: "+902129876543", latitude: 41.0359, longitude: 28.9788, status: "acik", rating: 4.9, ratingCount: 213 },
      { name: "Galata Hayvan Dostu", address: "Galip Dede Cad. No:33, Beyoğlu", phone: "+902122448811", latitude: 41.0258, longitude: 28.9744, status: "kapali", rating: 4.2, ratingCount: 41 },
      { name: "Bakırköy Veteriner", address: "İncirli Cad. No:155, Bakırköy", phone: "+902125567788", latitude: 40.9776, longitude: 28.8721, status: "acik", rating: 4.6, ratingCount: 127 },
      { name: "Ataköy 24/7 Acil", address: "Sahil Yolu, Ataköy", phone: "+902125559911", latitude: 40.9778, longitude: 28.8542, status: "nobetci", rating: 4.8, ratingCount: 203 },
    ],
  });

  // --- Blog posts ---
  const blogCount = await prisma.blogPost.count();
  if (blogCount === 0) {
    const now = new Date();
    await prisma.blogPost.createMany({
      data: [
        {
          authorId: admin.id,
          slug: "kopek-asi-takvimi-2026",
          title: "Köpekler için aşı takvimi: 2026 güncel rehber",
          excerpt: "Yavru köpeğin ilk 6 ayı kritik. Hangi aşıyı ne zaman yaptırmalısın, veteriner hekimle birlikte hazırladığımız rehber.",
          content: `# Köpekler için aşı takvimi

Yavru köpeğin ilk 6 ayı sağlığı için kritik öneme sahiptir. Düzenli aşılama, hayat kurtarıcı bağışıklık sistemini güçlendirir.

## 6-8 Haftalık
- **Karma aşı (DHPP)**: Distemper, Hepatit, Parvovirus, Parainfluenza için
- Beslenme kontrolü ve genel sağlık taraması

## 10-12 Haftalık
- DHPP rapeli
- **Leptospira** aşısı (su kaynakları için)
- Kuduz aşısı (kanun gereği zorunlu, 3 aylıktan itibaren)

## 14-16 Haftalık
- Son DHPP dozu
- Kuduz rapeli

## Yıllık
- Karma aşı + kuduz rapelleri
- Yıllık genel sağlık muayenesi

## Önemli Not
Her köpeğin ihtiyacı farklıdır. Veteriner hekiminize danışarak köpeğinize özel program oluşturun.`,
          coverEmoji: "💉",
          category: "saglik",
          status: "published",
          readTime: 6,
          publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
        },
        {
          authorId: admin.id,
          slug: "kedi-beslenmesi-kuru-mu-yas-mi",
          title: "Kediler için ideal beslenme: kuru mu, yaş mı?",
          excerpt: "Yetişkin kediler için günlük kalori ihtiyacı, su tüketimi, mama seçimi. Yaygın hataları anlatıyoruz.",
          content: `# Kedi beslenmesi rehberi

## Kuru vs Yaş Mama
**Kuru mama avantajları:**
- Diş sağlığı için iyi
- Daha ekonomik
- Saklaması kolay

**Yaş mama avantajları:**
- Daha fazla su içeriği
- Daha çekici aroma
- İdrar yolu sağlığı için iyi

## Günlük Kalori İhtiyacı
- Yetişkin (4-5 kg): 200-250 kcal/gün
- Yavru (4 ay): 250-300 kcal/gün
- Yaşlı: 180-200 kcal/gün

## Yapılmaması Gerekenler
- ❌ Çikolata
- ❌ Soğan/sarımsak
- ❌ Süt (laktoz intoleransı)
- ❌ Çiğ et (parazit riski)

## Su Tüketimi
Kediler doğal olarak az su içer. Yaş mama ek su sağlar. Çeşme/fıskiye tipi su kapları içmeyi teşvik eder.`,
          coverEmoji: "🍽️",
          category: "beslenme",
          status: "published",
          readTime: 8,
          publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10),
        },
        {
          authorId: admin.id,
          slug: "yavru-kopek-egitim-5-kural",
          title: "Yavru köpek eğitiminde 5 temel kural",
          excerpt: "Pozitif pekiştirme, tutarlılık, sabır. Eve yeni gelen yavruyla ilk haftalarda nelere dikkat etmeli?",
          content: `# Yavru köpek eğitimi: 5 altın kural

## 1. Pozitif Pekiştirme
Cezalandırma değil, ödüllendirme. Doğru davranışı ödüllendirin, yanlışı görmezden gelin.

## 2. Tutarlılık
Aile bireyleri aynı komutları, aynı kuralları uygulamalı. Karışıklık eğitimi bozar.

## 3. Kısa Seanslar
Yavru dikkati 5-10 dakika sürer. Günde 3-4 kısa seans, uzun bir seansa kıyasla çok daha verimli.

## 4. Sosyalizasyon
3-14 hafta arası kritik dönem. Farklı insanlar, hayvanlar, sesler, ortamlarla tanıştırın.

## 5. Sabır
Yavru bir bebektir. Hata yapacak, anlamayacak. Sabırlı olun, sürekli tekrar edin.`,
          coverEmoji: "🎾",
          category: "egitim",
          status: "published",
          readTime: 5,
          publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 17),
        },
        {
          authorId: admin.id,
          slug: "acil-vet-belirtileri",
          title: "Bunları görürsen acilen veterinere git",
          excerpt: "8 acil durum belirtisi. Nefes darlığı, kusma, ishal, bilinç kaybı — hangisi ne anlama geliyor?",
          content: `# Acil durum belirtileri

Bu belirtilerden herhangi birini gördüğünüzde **derhal** veterinere başvurun:

1. **Nefes darlığı, hızlı nefes alma** — Kalp veya akciğer sorunu
2. **Bilinç kaybı, sersemlik** — Düşük şeker, nörolojik problem
3. **Sürekli kusma (24 saatten fazla)** — Tıkanma, zehirlenme
4. **Kanlı ishal** — Parvovirus, parazit, iç kanama
5. **Kanama (kontrol edilemeyen)** — Travma
6. **Şişmiş karın** — Mide burulması (acil cerrahi)
7. **İdrar yapamama** — Mesane taşı, böbrek problemi
8. **Doğum güçlüğü** — Komplikasyon riski

**Telefonunuzda kayıtlı tutun:**
- 24 saat açık veteriner numarası
- En yakın hayvan hastanesi adresi`,
          coverEmoji: "🚨",
          category: "saglik",
          status: "published",
          readTime: 4,
          publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 25),
        },
        {
          authorId: admin.id,
          slug: "kedi-davranis-isaretleri",
          title: "Kedinin davranışını anlama: 12 yaygın işaret",
          excerpt: "Kuyruk hareketleri, mırlama, ısırma — kedinin sana ne söylemeye çalıştığını çöz.",
          content: `# Kedi dilini öğren

## Kuyruk
- **Dik, ucu titrek**: Mutlu, seni gördü
- **Kabarık**: Korkmuş veya saldırgan
- **Yere sallanan**: Sinirli, dikkat et
- **U şeklinde**: Oyun moduna geçti

## Sesler
- **Mırlama**: Genelde mutluluk, bazen ağrı veya stres
- **Tıslama**: "Yaklaşma" uyarısı
- **Trill (titrek miyav)**: Selamlama

## Vücut Dili
- **Yan dönmüş**: "Sana güveniyorum"
- **Karnını gösterme**: Güven işareti (ama dokunmaya izin vermez!)
- **Yavaş göz kırpma**: "Kedi öpücüğü", sevgi

Kedinin dilini anlamak ilişkinizi güçlendirir.`,
          coverEmoji: "🐈",
          category: "egitim",
          status: "published",
          readTime: 7,
          publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
        },
        {
          authorId: admin.id,
          slug: "yaz-sicaginda-kopek-bakimi",
          title: "Yaz sıcağında köpeğini korumanın 10 yolu",
          excerpt: "Sıcak çarpması belirtileri, su tüketimi, gezdirme saatleri. Yaz aylarında özel önlemler.",
          content: `# Yazın köpeğin için 10 önlem

1. **Sabah erken / akşam geç gezdir** — 10:00-17:00 arası asfalt yakar
2. **Asfalt sıcaklık testi**: Elini 10 sn tutamıyorsan köpek de yürüyemez
3. **Sürekli su** — Termos su kabı, dışarıda bile
4. **Asla arabada bırakma** — 5 dakika bile ölümcül
5. **Tıraş etme** — Tüy izolasyon sağlar, çift kat ırklarda yanma riski
6. **Serin yerler** — Gölge, fayans, soğutma matı
7. **Klima dikkat** — Direkt üflenmesin, üşütme yapar
8. **Yüzme** — Sevenler için harika, can yeleği şart
9. **Pati kremi** — Sıcak zeminde yanmayı önler
10. **Sıcak çarpması belirtisi**: Aşırı soluma, koyu dil, sersemlik → ACİL VET

## Sıcak Çarpması İlk Yardım
1. Serin (soğuk değil) suyla ıslat
2. Klimalı yere götür
3. Su iç
4. **Hemen vete götür**`,
          coverEmoji: "☀️",
          category: "saglik",
          status: "published",
          readTime: 6,
          publishedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 35),
        },
      ],
    });
  }

  console.log("");
  console.log("✅ Seed tamamlandı.");
  console.log("");
  console.log("📋 Hesaplar:");
  console.log("   👤 demo@pawhome.app / demo1234   (kullanıcı)");
  console.log("   🛡️  admin@pawhome.app / admin1234 (admin)");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
