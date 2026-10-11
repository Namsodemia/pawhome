/** Saha denetim kontrol listesi şablonları (mobil uygulamadaki src/data/denetim.ts ile aynı). */
export type Sablon = { id: string; ad: string; maddeler: string[] };

export const SABLONLAR: Sablon[] = [
  {
    id: "genel",
    ad: "Genel İşyeri Denetimi",
    maddeler: [
      "Risk değerlendirmesi güncel ve tehlike sınıfına uygun süre içinde",
      "Acil durum planı hazır, tahliye krokileri asılı",
      "Acil çıkış yolları açık, işaretli ve aydınlatılmış",
      "Yangın söndürücüler yerinde, periyodik kontrolü yapılmış",
      "İlk yardım dolabı dolu ve erişilebilir, ilk yardımcı belirlenmiş",
      "Elektrik panoları kapalı, kilitli ve yalıtkan paspas mevcut",
      "Kablolar ve prizler sağlam, uzatma kabloları düzgün",
      "Zemin kuru, kaygan olmayan; takılma tehlikesi yok",
      "Merdiven ve korkuluklar sağlam, yükseklik uygun",
      "Uyarı ve zorunluluk levhaları uygun yerlerde",
      "Aydınlatma yeterli, havalandırma çalışıyor",
      "KKD temin edilmiş ve kullanılıyor",
      "Çalışanların İSG eğitim belgeleri mevcut",
      "Sağlık raporları / periyodik muayeneler güncel",
      "Kimyasallar etiketli, MSDS/GBF mevcut, uygun depolanmış",
      "Makine koruyucuları takılı, acil stop butonları çalışıyor",
      "İş ekipmanları periyodik kontrol raporları mevcut",
      "Düzen ve temizlik (5S) sağlanmış",
      "Sigara içme alanı belirlenmiş, yangın riski yok",
      "Alt işveren / ziyaretçi İSG bilgilendirmesi yapılıyor",
    ],
  },
  {
    id: "santiye",
    ad: "İnşaat Şantiyesi",
    maddeler: [
      "Sağlık ve güvenlik planı mevcut, koordinatör atanmış",
      "Şantiye çevre çiti, giriş kontrolü ve uyarı levhaları",
      "Baret, yelek, güvenlik ayakkabısı herkeste",
      "Yüksekte çalışmada emniyet kemeri ve yaşam hattı",
      "İskele kurulum belgesi ve periyodik kontrol etiketi",
      "Döşeme kenarları ve boşluklar korkuluklu / kapatılmış",
      "Kazı şevleri güvenli, iksa yapılmış",
      "Vinç/kule vinç periyodik kontrol raporu ve operatör belgesi",
      "Elektrik dağıtım panoları kaçak akım röleli",
      "Merdiven ve rampalar sağlam, aydınlatılmış",
      "Sosyal tesisler (yemekhane, tuvalet, soyunma) hijyenik",
      "Yangın söndürücü ve ilk yardım noktaları belirli",
      "Malzeme istifi düzenli, devrilme tehlikesi yok",
      "Kaynak işlerinde maske, paravan ve gaz tüpleri sabit",
    ],
  },
  {
    id: "mutfak",
    ad: "Restoran / Mutfak",
    maddeler: [
      "Zemin kaymaz, ıslak zemin uyarısı kullanılıyor",
      "Davlumbaz ve baca temizliği yapılmış",
      "LPG/doğal gaz tesisatı kontrol edilmiş, gaz dedektörü var",
      "Yangın söndürücü (K sınıfı) mutfakta mevcut",
      "Fritöz ve ocak çevresinde yanık önlemleri",
      "Bıçaklar ve kesme ekipmanları güvenli saklanıyor",
      "Soğuk hava deposu içeriden açılabiliyor",
      "Elektrikli cihazlar topraklı, kablolar sağlam",
      "Hijyen eğitimi belgeleri mevcut",
      "Kimyasal temizlik ürünleri etiketli ve ayrı depolanmış",
      "İlk yardım dolabı ve yanık jeli erişilebilir",
    ],
  },
  {
    id: "ofis",
    ad: "Ofis / Büro",
    maddeler: [
      "Ekranlı araçlar ergonomisi: sandalye, monitör yüksekliği",
      "Kablolar zeminde takılma yaratmıyor",
      "Acil çıkış ve toplanma alanı biliniyor",
      "Yangın söndürücü ve alarm sistemi çalışıyor",
      "Aydınlatma ve havalandırma yeterli",
      "Dolaplar sabitlenmiş, ağır malzeme alt raflarda",
      "İlk yardım dolabı ve ilk yardımcı mevcut",
      "Çay ocağı / mutfak elektrik güvenliği",
      "Merdiven korkulukları ve basamak bantları sağlam",
      "Temel İSG eğitimi belgeleri mevcut",
    ],
  },
];

export function sablonById(id: string | null | undefined): Sablon {
  return SABLONLAR.find((s) => s.id === id) ?? SABLONLAR[0];
}

export function sablonAdi(id: string | null | undefined): string {
  return SABLONLAR.find((s) => s.id === id)?.ad ?? (id || "-");
}
