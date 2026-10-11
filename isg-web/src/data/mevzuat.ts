/**
 * Saha rehberi — 6331 sayılı Kanun ve ilgili yönetmeliklerden özet tablolar.
 * Mevzuat değişebilir; kesin işlem için güncel Resmî Gazete metnine bakılmalıdır.
 */
export type Bolum = { baslik: string; aciklama?: string; satirlar: [string, string][] };

/** Grup ikonları (mobil uygulamadaki Ionicons adları; web'de lucide karşılıklarına eşlenir) */
export type MevzuatIkon = "time" | "alert-circle" | "construct" | "people-circle" | "grid" | "shield-checkmark";

export type MevzuatGrup = { id: string; baslik: string; ikon: MevzuatIkon; bolumler: Bolum[] };

export const MEVZUAT: MevzuatGrup[] = [
  {
    id: "sureler",
    baslik: "Tehlike sınıfına göre süreler",
    ikon: "time",
    bolumler: [
      {
        baslik: "Risk değerlendirmesi yenileme (RD Yönetmeliği m.12)",
        satirlar: [
          ["Az tehlikeli", "En geç 6 yılda bir"],
          ["Tehlikeli", "En geç 4 yılda bir"],
          ["Çok tehlikeli", "En geç 2 yılda bir"],
          ["Derhal yenileme", "Taşınma/bina değişikliği, teknoloji/ekipman değişikliği, iş kazası veya meslek hastalığı, mevzuat değişikliği, yeni tehlike"],
        ],
      },
      {
        baslik: "Çalışan İSG eğitimi (Eğitim Yönetmeliği)",
        satirlar: [
          ["Az tehlikeli", "En az 8 saat, 3 yılda bir"],
          ["Tehlikeli", "En az 12 saat, 2 yılda bir"],
          ["Çok tehlikeli", "En az 16 saat, yılda bir"],
          ["İşe başlamadan önce", "Temel eğitim tamamlanmadan işe başlatılamaz"],
          ["Değişiklik hâlinde", "İş değişikliği, ekipman/teknoloji değişikliği, 6 aydan uzun uzaklaşma sonrası ek eğitim"],
        ],
      },
      {
        baslik: "Sağlık gözetimi — periyodik muayene",
        satirlar: [
          ["Az tehlikeli", "En geç 5 yılda bir"],
          ["Tehlikeli", "En geç 3 yılda bir"],
          ["Çok tehlikeli", "En geç yılda bir"],
          ["İşe giriş", "Tehlikeli ve çok tehlikeli sınıfta işe giriş muayenesi olmadan çalıştırılamaz"],
        ],
      },
      {
        baslik: "İSG uzmanı asgari çalışma süresi (çalışan başına / ay)",
        satirlar: [
          ["Az tehlikeli", "10 dakika"],
          ["Tehlikeli", "20 dakika"],
          ["Çok tehlikeli", "40 dakika"],
          ["Tam gün uzman", "Az tehl. 1000+, tehl. 500+, çok tehl. 250+ çalışanda her katı için bir tam gün uzman"],
        ],
      },
      {
        baslik: "İşyeri hekimi asgari çalışma süresi (çalışan başına / ay)",
        satirlar: [
          ["Az tehlikeli", "5 dakika"],
          ["Tehlikeli", "10 dakika"],
          ["Çok tehlikeli", "15 dakika"],
          ["Tam gün hekim", "Az tehl. 2000+, tehl. 1000+, çok tehl. 750+ çalışanda"],
        ],
      },
      {
        baslik: "Uzman belge sınıfı — görev alabileceği işyeri",
        satirlar: [
          ["A sınıfı", "Bütün tehlike sınıfları"],
          ["B sınıfı", "Tehlikeli ve az tehlikeli"],
          ["C sınıfı", "Az tehlikeli"],
        ],
      },
    ],
  },
  {
    id: "bildirim",
    baslik: "Kaza ve bildirim süreleri",
    ikon: "alert-circle",
    bolumler: [
      {
        baslik: "İşverenin bildirim yükümlülüğü (6331 m.14)",
        satirlar: [
          ["İş kazası", "Kazadan sonraki 3 iş günü içinde SGK'ya"],
          ["Meslek hastalığı", "Öğrenildiği tarihten itibaren 3 iş günü içinde SGK'ya"],
          ["Sağlık hizmeti sunucuları", "İş kazasını en geç 10 gün içinde SGK'ya bildirir"],
          ["Kayıt", "Kaza ve ramak kala olayları incelenip rapor düzenlenir, kayıt altına alınır"],
        ],
      },
      {
        baslik: "Kaza sonrası yapılacaklar",
        satirlar: [
          ["1", "İlk yardım ve tıbbi müdahale, alanın güvene alınması"],
          ["2", "Kaza yerinin fotoğraf/kroki ile tespiti, tanık ifadeleri"],
          ["3", "Kaza inceleme raporu ve kök neden analizi (5 Neden, balık kılçığı)"],
          ["4", "SGK bildirimi (3 iş günü), gerekirse kolluk"],
          ["5", "Risk değerlendirmesinin yenilenmesi ve düzeltici faaliyet"],
        ],
      },
      {
        baslik: "İdari para cezası gerektiren başlıca haller",
        satirlar: [
          ["RD yapmamak", "m.10 — aylık devam eden ceza"],
          ["Uzman/hekim görevlendirmemek", "m.6 — her biri için ayrı"],
          ["Eğitim vermemek", "m.17 — çalışan başına"],
          ["Kaza bildirmemek", "m.14"],
          ["Sağlık gözetimi yapmamak", "m.15 — çalışan başına"],
        ],
      },
    ],
  },
  {
    id: "periyodik",
    baslik: "Periyodik kontrol süreleri",
    ikon: "construct",
    bolumler: [
      {
        baslik: "İş Ekipmanları Yönetmeliği — azami süreler",
        aciklama: "Üretici farklı süre belirtmemişse uygulanan azami süreler.",
        satirlar: [
          ["Kaldırma ve iletme ekipmanları (vinç, forklift, caraskal)", "Yılda 1"],
          ["Asansörler (insan/yük)", "Yılda 1"],
          ["Basınçlı kaplar, kazanlar, kompresör tankları", "Yılda 1"],
          ["Yangın tesisatı, hortum, motopomp", "Yılda 1"],
          ["Elektrik tesisatı, topraklama, paratoner", "Yılda 1"],
          ["Havalandırma ve klima tesisatı", "Yılda 1"],
          ["İskeleler", "Kurulum sonrası ve 6 ayda bir (madenler 3 ay)"],
          ["Tezgâhlar (torna, freze, pres vb.)", "Yılda 1"],
          ["Taşınabilir yangın söndürücüler", "Yılda 1 (6 ayda bir kontrol), 4 yılda bir hidrostatik test"],
        ],
      },
    ],
  },
  {
    id: "kurul",
    baslik: "İSG kurulu ve organizasyon",
    ikon: "people-circle",
    bolumler: [
      {
        baslik: "İSG Kurulu (6331 m.22)",
        satirlar: [
          ["Kurulması gereken işyeri", "50 ve daha fazla çalışan + 6 aydan uzun süren sürekli işler"],
          ["Toplantı sıklığı", "Çok tehlikeli: ayda 1 · Tehlikeli: 2 ayda 1 · Az tehlikeli: 3 ayda 1"],
          ["Üyeler", "İşveren/vekili, İSG uzmanı, işyeri hekimi, İK/personel sorumlusu, sivil savunma uzmanı (varsa), formen/ustabaşı, çalışan temsilcisi"],
        ],
      },
      {
        baslik: "Çalışan temsilcisi sayısı (m.20)",
        satirlar: [
          ["2-50 çalışan", "1"],
          ["51-100", "2"],
          ["101-500", "3"],
          ["501-1000", "4"],
          ["1001-2000", "5"],
          ["2001+", "6"],
        ],
      },
      {
        baslik: "Acil durum destek elemanı (Acil Durumlar Yönetmeliği m.11)",
        satirlar: [
          ["Çok tehlikeli", "Her 30 çalışana 1"],
          ["Tehlikeli", "Her 40 çalışana 1"],
          ["Az tehlikeli", "Her 50 çalışana 1"],
          ["Görevler", "Arama-kurtarma-tahliye, yangınla mücadele, ilk yardım"],
          ["Tatbikat", "Yılda en az 1 kez"],
        ],
      },
      {
        baslik: "İlk yardımcı sayısı (İlk Yardım Yönetmeliği)",
        satirlar: [
          ["Az tehlikeli", "Her 20 çalışana 1"],
          ["Tehlikeli", "Her 15 çalışana 1"],
          ["Çok tehlikeli", "Her 10 çalışana 1"],
        ],
      },
    ],
  },
  {
    id: "matris",
    baslik: "5x5 risk matrisi",
    ikon: "grid",
    bolumler: [
      {
        baslik: "Olasılık (O)",
        satirlar: [
          ["1 — Çok küçük", "Yılda bir"],
          ["2 — Küçük", "Üç ayda bir"],
          ["3 — Orta", "Ayda bir"],
          ["4 — Yüksek", "Haftada bir"],
          ["5 — Çok yüksek", "Her gün"],
        ],
      },
      {
        baslik: "Şiddet (Ş)",
        satirlar: [
          ["1 — Çok hafif", "İş saati kaybı yok, ilk yardım"],
          ["2 — Hafif", "İş günü kaybı yok, ayakta tedavi"],
          ["3 — Orta", "Hafif yaralanma, tedavi gerekir"],
          ["4 — Ciddi", "Ölüm, ciddi yaralanma, meslek hastalığı"],
          ["5 — Çok ciddi", "Birden çok ölüm, sürekli iş göremezlik"],
        ],
      },
      {
        baslik: "Skor = O × Ş",
        satirlar: [
          ["20-25", "Kabul edilemez — Derhal"],
          ["15-19", "Yüksek — 1-15 gün"],
          ["8-14", "Dikkate değer — 1-30 gün"],
          ["1-7", "Kabul edilebilir — 1-45 gün"],
        ],
      },
      {
        baslik: "Kontrol hiyerarşisi (RD Yönetmeliği m.10)",
        satirlar: [
          ["1", "Tehlikeyi ortadan kaldırma"],
          ["2", "Tehlikeliyi tehlikeli olmayanla değiştirme"],
          ["3", "Mühendislik / toplu koruma önlemleri"],
          ["4", "İdari önlemler, uyarı levhaları, eğitim"],
          ["5", "Kişisel koruyucu donanım (son çare)"],
        ],
      },
    ],
  },
  {
    id: "kkd",
    baslik: "KKD ve işaretler",
    ikon: "shield-checkmark",
    bolumler: [
      {
        baslik: "Kişisel koruyucu donanım — temel kurallar",
        satirlar: [
          ["CE işareti", "Zorunlu; KKD Yönetmeliği (EU 2016/425)"],
          ["Kategori I", "Düşük risk (bahçıvan eldiveni)"],
          ["Kategori II", "Orta risk (baret, güvenlik ayakkabısı)"],
          ["Kategori III", "Ölümcül/geri dönüşsüz risk (solunum koruyucu, düşüş önleyici)"],
          ["İşveren", "Ücretsiz sağlar, bakım-temizlik-değişimi yapar, kullanımı denetler"],
        ],
      },
      {
        baslik: "Güvenlik ve sağlık işaretleri renk kodları",
        satirlar: [
          ["Kırmızı", "Yasak, tehlike alarmı, yangın ekipmanı"],
          ["Sarı / turuncu", "Uyarı, dikkat"],
          ["Mavi", "Zorunluluk (KKD kullan)"],
          ["Yeşil", "Acil çıkış, ilk yardım, tehlike yok"],
        ],
      },
    ],
  },
];
