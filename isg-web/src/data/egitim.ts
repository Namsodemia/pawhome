/**
 * Eğitimler modülü içeriği.
 *
 * "Temel İş Sağlığı ve Güvenliği Eğitimi", Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin
 * Usul ve Esasları Hakkında Yönetmelik'teki konu başlıklarını izler. Metinler bilgilendirme
 * amaçlıdır; işverenin yaptıracağı resmî eğitimin yerini tutmaz.
 */

export interface Soru {
  soru: string;
  /** Dört seçenek */
  secenekler: string[];
  /** Doğru seçeneğin sırası (0'dan başlar) */
  dogru: number;
  aciklama: string;
  /** Sorunun ilgili olduğu ders (bitirme sınavında "ilgili ders" bağlantısı için) */
  ders?: string;
}

export interface Bolum {
  baslik: string;
  /** Paragraflar */
  metin: string[];
  maddeler?: string[];
}

export interface Ders {
  id: string;
  baslik: string;
  sure_dk: number;
  ozet: string;
  bolumler: Bolum[];
  /** Akılda kalacak kısa notlar */
  onemli?: string[];
  /** 2–3 kısa pekiştirme sorusu */
  sorular: Soru[];
}

export interface Kurs {
  id: string;
  baslik: string;
  aciklama: string;
  sure_saat: number;
  hedef_kitle: string;
  dersler: Ders[];
  sinav: Soru[];
  gecme_notu: number;
}

// ---------------------------------------------------------------- Dersler

const DERSLER: Ders[] = [
  // 1 ---------------------------------------------------------------
  {
    id: "mevzuat",
    baslik: "Çalışma Mevzuatı ve 6331 Sayılı Kanun",
    sure_dk: 20,
    ozet:
      "İş sağlığı ve güvenliğinin neden önemli olduğunu, Türkiye'deki temel mevzuatın yapısını ve 6331 sayılı İş Sağlığı ve Güvenliği Kanunu'nun ana ilkelerini öğreneceksiniz.",
    bolumler: [
      {
        baslik: "İş sağlığı ve güvenliği nedir?",
        metin: [
          "İş sağlığı ve güvenliği; çalışma ortamında var olan ya da dışarıdan gelebilecek tehlikelerden çalışanları korumak, iş kazalarını ve meslek hastalıklarını önlemek için yürütülen sistemli çalışmaların bütünüdür. Amaç yalnızca kazaları azaltmak değildir; çalışanların bedensel, ruhsal ve sosyal yönden iyi olmasını sağlamak, işyerinin ve üretimin güvenliğini de korumaktır.",
          "Bu eğitim boyunca sık geçecek iki kavramı baştan ayırmak gerekir. Tehlike, işyerinde var olan ya da dışarıdan gelebilecek, çalışanı veya işyerini etkileyebilecek zarar ya da hasar verme potansiyelidir. Risk ise bu tehlikeden kaynaklanacak kayıp, yaralanma ya da başka zararlı bir sonucun meydana gelme ihtimalidir. Örneğin ıslak bir zemin bir tehlikedir; birinin bu zeminde kayıp düşme ihtimali ise risktir.",
        ],
      },
      {
        baslik: "Mevzuatın yapısı",
        metin: [
          "Türkiye'de iş sağlığı ve güvenliğinin dayanağı Anayasa'dır. Anayasa, herkesin yaşama, maddi ve manevi varlığını koruma ve geliştirme hakkını güvence altına alır; kimsenin yaşına, cinsiyetine ve gücüne uygun olmayan işlerde çalıştırılamayacağını belirtir. Bu ilkeler kanunlarla ayrıntılandırılır, kanunlara dayanılarak çıkarılan yönetmelik ve tebliğlerle de uygulamaya dönüştürülür. Başlıca düzenlemeler şunlardır:",
        ],
        maddeler: [
          "6331 sayılı İş Sağlığı ve Güvenliği Kanunu: Alanın temel kanunudur; işveren ve çalışanların görev, yetki, sorumluluk, hak ve yükümlülüklerini düzenler.",
          "4857 sayılı İş Kanunu: İş sözleşmesi, çalışma süreleri, ücret ve fesih gibi çalışma ilişkilerini düzenler.",
          "5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu: İş kazası ve meslek hastalığının sigorta açısından tanımını, bildirimini ve sağlanan hakları düzenler.",
          "Yönetmelikler: Risk değerlendirmesi, acil durumlar, kişisel koruyucu donanımlar, iş ekipmanları, gürültü, ekranlı araçlar gibi konularda ayrıntılı kurallar koyar.",
          "Uluslararası kaynaklar: Türkiye'nin taraf olduğu Uluslararası Çalışma Örgütü (ILO) sözleşmeleri ve Avrupa Birliği mevzuatına uyum çalışmaları da ulusal düzenlemeleri şekillendirir.",
        ],
      },
      {
        baslik: "6331 sayılı Kanun'un kapsamı ve ilkeleri",
        metin: [
          "6331 sayılı Kanun, 30 Haziran 2012'de Resmî Gazete'de yayımlanmıştır. Kamu ve özel sektöre ait bütün işlere ve işyerlerine, bu işyerlerinin işverenlerine ve işveren vekillerine, çırak ve stajyerler de dâhil olmak üzere tüm çalışanlara uygulanır. Ev hizmetleri ile çalışan istihdam etmeden kendi adına ve hesabına mal ve hizmet üretenler gibi sınırlı istisnalar vardır.",
          "Kanun'un temel yaklaşımı önleyiciliktir: Kaza olduktan sonra müdahale etmek yerine riskler önceden belirlenir, ortadan kaldırılır ya da azaltılır. Bunun için işveren risk değerlendirmesi yapmak veya yaptırmakla yükümlüdür. İşyerleri, yapılan işin niteliğine göre az tehlikeli, tehlikeli ve çok tehlikeli olmak üzere üç tehlike sınıfına ayrılır; eğitim süreleri gibi pek çok kural bu sınıfa göre belirlenir.",
          "Kanun, işverenin uyması gereken risklerden korunma ilkelerini de sayar. Bunlardan bazıları şunlardır:",
        ],
        maddeler: [
          "Riskten kaçınmak; kaçınılması mümkün olmayan riskleri analiz etmek.",
          "Risklerle kaynağında mücadele etmek.",
          "Tehlikeli olanı, tehlikesiz veya daha az tehlikeli olanla değiştirmek.",
          "Toplu korunma tedbirlerine, kişisel korunma tedbirlerine göre öncelik vermek.",
          "Çalışanlara uygun talimatlar vermek.",
        ],
      },
      {
        baslik: "Çalışanların eğitimi",
        metin: [
          "Kanun'a göre işveren, çalışanların iş sağlığı ve güvenliği eğitimi almasını sağlamak zorundadır. Eğitim; işe başlamadan önce, çalışma yeri veya iş değişikliğinde, iş ekipmanının değişmesi ya da yeni teknoloji uygulanması hâlinde verilir; değişen risklere göre yenilenir ve düzenli aralıklarla tekrarlanır. Eğitimin maliyeti çalışana yansıtılamaz ve eğitimde geçen süre çalışma süresinden sayılır.",
          "Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik, temel eğitimin konu başlıklarını ve asgari sürelerini belirler. Bu eğitimdeki dersler de o konu başlıklarını izler.",
        ],
        maddeler: [
          "Asgari eğitim süresi: az tehlikeli işyerlerinde 8 saat, tehlikeli işyerlerinde 12 saat, çok tehlikeli işyerlerinde 16 saat.",
          "Tekrar sıklığı: çok tehlikeli sınıfta yılda en az bir, tehlikeli sınıfta iki yılda en az bir, az tehlikeli sınıfta üç yılda en az bir kez.",
          "İş kazası geçiren veya meslek hastalığına yakalanan çalışana, işe başlamadan önce ilave eğitim verilir.",
          "Herhangi bir sebeple altı aydan fazla işten uzak kalanlara, işe yeniden başlamadan önce bilgi yenileme eğitimi verilir.",
        ],
      },
    ],
    onemli: [
      "Tehlike zarar verme potansiyelidir; risk bu zararın gerçekleşme ihtimalidir.",
      "6331 sayılı Kanun, kamu ve özel sektördeki bütün işlere ve çırak, stajyer dâhil tüm çalışanlara uygulanır.",
      "Temel eğitim en az 8 / 12 / 16 saattir (az tehlikeli / tehlikeli / çok tehlikeli).",
      "Eğitim çalışma süresinden sayılır; maliyeti çalışana yansıtılamaz.",
    ],
    sorular: [
      {
        soru: "Aşağıdakilerden hangisi “risk” kavramını doğru tanımlar?",
        secenekler: [
          "Zarar veya hasar verme potansiyeli",
          "Tehlikeden kaynaklanacak zararlı bir sonucun meydana gelme ihtimali",
          "İşyerinde meydana gelen her türlü kaza",
          "İşverenin aldığı koruyucu önlem",
        ],
        dogru: 1,
        aciklama: "Tehlike zarar verme potansiyelidir; risk ise bu tehlikeden kaynaklanacak kayıp, yaralanma veya başka zararlı sonucun gerçekleşme ihtimalidir.",
      },
      {
        soru: "Tehlikeli sınıftaki bir işyerinde temel iş sağlığı ve güvenliği eğitimi en az kaç saat olmalıdır?",
        secenekler: ["8 saat", "12 saat", "16 saat", "24 saat"],
        dogru: 1,
        aciklama: "Asgari süreler az tehlikeli sınıfta 8, tehlikeli sınıfta 12, çok tehlikeli sınıfta 16 saattir.",
      },
      {
        soru: "Çok tehlikeli sınıftaki işyerlerinde iş sağlığı ve güvenliği eğitimi en az hangi sıklıkta tekrarlanır?",
        secenekler: ["Yılda en az bir kez", "İki yılda en az bir kez", "Üç yılda en az bir kez", "Beş yılda en az bir kez"],
        dogru: 0,
        aciklama: "Tekrar sıklığı çok tehlikeli sınıfta yılda en az bir, tehlikeli sınıfta iki yılda en az bir, az tehlikeli sınıfta üç yılda en az bir kezdir.",
      },
    ],
  },

  // 2 ---------------------------------------------------------------
  {
    id: "hak-sorumluluk",
    baslik: "Çalışanların Yasal Hak ve Sorumlulukları",
    sure_dk: 20,
    ozet:
      "İş sağlığı ve güvenliği yalnızca işverenin değil, herkesin görevidir. Bu derste işverenin genel yükümlülüğünü, çalışanların haklarını, çalışmaktan kaçınma hakkının nasıl kullanılacağını ve çalışanların yükümlülüklerini öğreneceksiniz.",
    bolumler: [
      {
        baslik: "İşverenin genel yükümlülüğü",
        metin: [
          "İşveren, çalışanların işle ilgili sağlık ve güvenliğini sağlamakla yükümlüdür. Mesleki risklerin önlenmesi, eğitim ve bilgi verilmesi dâhil her türlü tedbiri almak, organizasyonu yapmak, gerekli araç ve gereçleri sağlamak, risk değerlendirmesi yapmak veya yaptırmak ve alınan tedbirlere uyulup uyulmadığını denetlemek işverenin görevidir.",
          "İşveren, iş sağlığı ve güvenliği hizmetlerini dışarıdaki uzman kişi ve kuruluşlardan (örneğin bir OSGB'den) alsa bile sorumluluktan kurtulmaz. Çalışanların bu alandaki yükümlülükleri de işverenin sorumluluklarını ortadan kaldırmaz. İş sağlığı ve güvenliği tedbirlerinin maliyeti çalışanlara yansıtılamaz.",
        ],
      },
      {
        baslik: "Çalışanların hakları",
        metin: ["Kanun, çalışanlara sağlık ve güvenliklerini korumaları için çeşitli haklar tanır:"],
        maddeler: [
          "Bilgilendirilme: İşyerindeki riskler, alınan önlemler, ilk yardım ve acil durum görevlileri hakkında bilgi alma.",
          "Eğitim: İşe başlamadan önce ve düzenli aralıklarla, maliyeti kendisine yansıtılmadan eğitim alma.",
          "Görüş bildirme ve katılım: İş sağlığı ve güvenliği konularında görüş ve öneri sunma; çalışan temsilcisi seçme ve seçilme.",
          "Sağlık gözetimi: İşe giriş ve periyodik sağlık muayenelerinden, maliyeti kendisine yansıtılmadan yararlanma.",
          "Çalışmaktan kaçınma: Ciddi ve yakın tehlike karşısında Kanun'un 13. maddesindeki usule göre çalışmaktan kaçınma.",
          "Başvuru: Mevzuata aykırılıkları Çalışma ve Sosyal Güvenlik Bakanlığına bildirme (ALO 170).",
        ],
      },
      {
        baslik: "Çalışmaktan kaçınma hakkı (Kanun md. 13)",
        metin: [
          "Ciddi ve yakın tehlikeyle karşı karşıya kalan çalışan, iş sağlığı ve güvenliği kuruluna, kurulun bulunmadığı işyerlerinde ise işverene başvurarak durumun tespit edilmesini ve gerekli tedbirlerin alınmasına karar verilmesini talep edebilir. Kurul acilen toplanır, işveren ise derhâl kararını verir; durum tutanakla tespit edilir ve karar çalışana ve çalışan temsilcisine yazılı olarak bildirilir.",
          "Kurul veya işveren çalışanın talebi yönünde karar verirse çalışan, gerekli tedbirler alınıncaya kadar çalışmaktan kaçınabilir. Bu dönemde ücreti ile kanunlardan ve iş sözleşmesinden doğan diğer hakları saklıdır. Talebine rağmen gerekli tedbirler alınmazsa çalışan, tabi olduğu kanun veya iş sözleşmesi hükümlerine göre iş sözleşmesini feshedebilir.",
          "Ciddi ve yakın tehlikenin önlenemez olduğu durumlarda ise çalışanlar işyerini veya tehlikeli bölgeyi terk ederek belirlenen güvenli yere gider. Çalışanlar bu hareketlerinden dolayı haklarını kaybetmez.",
        ],
      },
      {
        baslik: "Çalışanların yükümlülükleri (Kanun md. 19)",
        metin: [
          "Çalışanlar, aldıkları eğitim ve işverenin talimatları doğrultusunda kendilerinin ve yaptıkları işten etkilenen diğer çalışanların sağlık ve güvenliğini tehlikeye düşürmemekle yükümlüdür. Kanun bu yükümlülükleri şöyle sayar:",
        ],
        maddeler: [
          "Makine, cihaz, araç, gereç, tehlikeli madde ve taşıma ekipmanlarını kurallara uygun kullanmak; bunların güvenlik donanımlarını doğru kullanmak, keyfî olarak çıkarmamak ve değiştirmemek.",
          "Kendilerine sağlanan kişisel koruyucu donanımı doğru kullanmak ve korumak.",
          "Ciddi ve yakın bir tehlikeyle karşılaştıklarında ya da koruma tedbirlerinde bir eksiklik gördüklerinde işverene veya çalışan temsilcisine derhâl haber vermek.",
          "Teftişe yetkili makamın tespit ettiği eksiklik ve mevzuata aykırılıkların giderilmesinde işveren ve çalışan temsilcisiyle iş birliği yapmak.",
          "Kendi görev alanında, sağlık ve güvenlik alanında yapılacak çalışmalarda işveren ve çalışan temsilcisiyle iş birliği yapmak.",
        ],
      },
      {
        baslik: "Çalışan temsilcisi ve kurul",
        metin: [
          "Çalışan temsilcisi; iş sağlığı ve güvenliği çalışmalarına katılma, çalışmaları izleme, tedbir alınmasını isteme ve tekliflerde bulunma gibi konularda çalışanları temsil eder. Temsilci sayısı işyerindeki çalışan sayısına göre belirlenir. Elli ve daha fazla çalışanın bulunduğu ve altı aydan fazla süren sürekli işlerin yapıldığı işyerlerinde ise iş sağlığı ve güvenliği kurulu oluşturulur.",
        ],
      },
    ],
    onemli: [
      "Ciddi ve yakın tehlikede önce kurula, kurul yoksa işverene başvurulur; karar yazılı bildirilir.",
      "Tehlike önlenemiyorsa çalışan işyerini veya tehlikeli bölgeyi terk edip güvenli yere gider; bu yüzden hak kaybına uğramaz.",
      "Güvenlik donanımlarını çıkarmak veya devre dışı bırakmak yasaktır.",
      "Kurallara uymamak; yaralanmanın yanı sıra iş sözleşmesinin feshi ve hukuki sorumluluk gibi sonuçlar doğurabilir.",
    ],
    sorular: [
      {
        soru: "Kurulu bulunmayan bir işyerinde, önlenebilir nitelikte ciddi ve yakın bir tehlikeyle karşılaşan çalışan ilk olarak ne yapmalıdır?",
        secenekler: [
          "Hemen işten istifa etmelidir",
          "İşverene başvurarak durumun tespitini ve tedbir alınmasını talep etmelidir",
          "Durumu yalnızca iş arkadaşlarıyla paylaşmalıdır",
          "Hiçbir şey yapmadan çalışmaya devam etmelidir",
        ],
        dogru: 1,
        aciklama: "Kanun'un 13. maddesine göre çalışan kurula, kurul yoksa işverene başvurur; işveren derhâl karar verir ve kararı yazılı olarak bildirir.",
      },
      {
        soru: "Aşağıdakilerden hangisi çalışanın yükümlülüklerinden biri değildir?",
        secenekler: [
          "Kişisel koruyucu donanımı doğru kullanmak",
          "Makine koruyucularını keyfî olarak çıkarmamak",
          "İşyerinin risk değerlendirmesini tek başına yapıp onaylamak",
          "Gördüğü tehlikeyi işverene veya çalışan temsilcisine bildirmek",
        ],
        dogru: 2,
        aciklama: "Risk değerlendirmesi yapmak veya yaptırmak işverenin yükümlülüğüdür; çalışanlar bu çalışmaya katılır ve görüş bildirir.",
      },
      {
        soru: "Çalışmaktan kaçınma hakkını usulüne uygun kullanan çalışanın ücreti ne olur?",
        secenekler: ["Kesilir", "Yarıya indirilir", "Ücreti ve diğer hakları saklıdır", "Yalnızca asgari ücret ödenir"],
        dogru: 2,
        aciklama: "Çalışanın çalışmaktan kaçındığı dönemdeki ücreti ile kanunlardan ve iş sözleşmesinden doğan diğer hakları saklıdır.",
      },
    ],
  },

  // 3 ---------------------------------------------------------------
  {
    id: "temizlik-duzen",
    baslik: "İşyeri Temizliği ve Düzeni",
    sure_dk: 15,
    ozet:
      "Düzenli ve temiz bir işyeri; kayma, takılma ve düşme gibi en sık görülen kazaları önlemenin ilk adımıdır. Bu derste düzen ve temizliğin temel kurallarını ve 5S yöntemini öğreneceksiniz.",
    bolumler: [
      {
        baslik: "Düzen ve temizlik neden önemli?",
        metin: [
          "Kayma, takılma ve düşme, işyerlerinde en sık karşılaşılan kaza türleri arasındadır ve çoğunlukla dağınıklıktan, dökülen sıvılardan ya da geçiş yollarına bırakılan malzemelerden kaynaklanır. Düzensiz bir ortam ayrıca yangın yükünü artırır, acil durumlarda tahliyeyi zorlaştırır ve hijyen sorunlarına yol açar.",
          "İşyeri temizliği ve düzeni yalnızca temizlik personelinin işi değildir. Herkes kendi çalışma alanını düzenli tutmaktan, fark ettiği sorunu gidermekten ya da bildirmekten sorumludur.",
        ],
      },
      {
        baslik: "Temel kurallar",
        metin: ["Aşağıdaki kurallar hemen her işyerinde uygulanabilir:"],
        maddeler: [
          "Geçiş yolları, merdivenler ve acil çıkışlar her zaman açık tutulur; önlerine malzeme konmaz.",
          "Yangın söndürücülerin, yangın dolaplarının, elektrik panolarının ve ilk yardım dolaplarının önü kapatılmaz.",
          "Dökülen sıvı hemen temizlenir; temizlenene kadar alan “ıslak zemin” levhasıyla işaretlenir.",
          "Kablolar ve hortumlar geçiş yollarından geçirilmez; zorunluysa üzeri uygun şekilde kapatılır.",
          "Malzemeler sağlam ve düzgün istiflenir; ağır malzemeler alt raflara konur, raflar aşırı yüklenmez.",
          "Kesici aletler ve el aletleri kullanıldıktan sonra yerine kaldırılır.",
          "Atıklar türüne göre ayrıştırılır; yağlı bez, kimyasal ambalajı, pil gibi tehlikeli atıklar ayrı ve etiketli kaplarda toplanır.",
          "Yeme içme yalnızca belirlenmiş alanlarda yapılır; kimyasalla çalışılan yerlerde yiyecek bulundurulmaz.",
        ],
      },
      {
        baslik: "5S yöntemi",
        metin: ["Japonya kökenli 5S yöntemi, düzen ve temizliği kalıcı bir alışkanlığa dönüştürmek için kullanılan beş adımlı bir yaklaşımdır:"],
        maddeler: [
          "Ayıkla (Seiri): Gereksiz malzemeleri çalışma alanından uzaklaştırın.",
          "Düzenle (Seiton): Her şeyin bir yeri olsun ve her şey yerinde olsun.",
          "Temizle (Seiso): Çalışma alanını ve ekipmanı düzenli temizleyin; temizlik sırasında arızaları da fark edin.",
          "Standartlaştır (Seiketsu): İyi uygulamaları yazılı kurallar, etiketler ve renk kodlarıyla standart hâle getirin.",
          "Sürdür (Shitsuke): Kuralları alışkanlık hâline getirin ve düzenli olarak kontrol edin.",
        ],
      },
      {
        baslik: "Kişisel hijyen ve sosyal alanlar",
        metin: [
          "Lavabolar, tuvaletler, soyunma odaları ve yemekhaneler temiz ve kullanılabilir tutulmalıdır. Kimyasal madde, toz veya biyolojik etkenlerle çalıştıktan sonra ve yemekten önce eller mutlaka yıkanmalıdır. İş elbiseleri günlük kıyafetlerden ayrı saklanmalı; tehlikeli maddelerle kirlenen iş elbiseleri eve götürülmemeli, işyerinin belirlediği yöntemle temizlenmelidir.",
        ],
      },
    ],
    onemli: [
      "Acil çıkışların ve yangın söndürücülerin önü asla kapatılmaz.",
      "Dökülen sıvıyı gördüğünüzde hemen temizleyin ya da alanı işaretleyip bildirin.",
      "Her şeyin bir yeri olsun, her şey yerinde olsun.",
      "Ağır malzemeler alt raflara konur.",
    ],
    sorular: [
      {
        soru: "Zemine yağ döküldüğünü fark ettiniz. Doğru davranış hangisidir?",
        secenekler: [
          "Etrafından dolaşıp işinize devam etmek",
          "Hemen temizlemek ya da temizlenene kadar alanı işaretleyip bildirmek",
          "Üzerine karton koyup bırakmak",
          "Mesai bitimini beklemek",
        ],
        dogru: 1,
        aciklama: "Dökülen sıvı kayma ve düşme kazalarının başlıca nedenlerindendir; hemen temizlenmeli, temizlenene kadar alan işaretlenmelidir.",
      },
      {
        soru: "5S yönteminde “Her şeyin bir yeri olsun ve her şey yerinde olsun” ilkesi hangi adımı anlatır?",
        secenekler: ["Ayıkla", "Düzenle", "Temizle", "Sürdür"],
        dogru: 1,
        aciklama: "Düzenle (Seiton) adımı, gerekli malzemelerin belirli ve kolay ulaşılır yerlerde tutulmasını anlatır.",
      },
    ],
  },

  // 4 ---------------------------------------------------------------
  {
    id: "hukuki-sonuclar",
    baslik: "İş Kazası ve Meslek Hastalığından Doğan Hukuki Sonuçlar",
    sure_dk: 20,
    ozet:
      "İş kazası ve meslek hastalığının yasal tanımlarını, kaza sonrası kayıt ve bildirim yükümlülüklerini, işveren ve çalışan açısından doğan hukuki sonuçları ve kazaların temel sebeplerini öğreneceksiniz.",
    bolumler: [
      {
        baslik: "İş kazası nedir?",
        metin: [
          "6331 sayılı Kanun'a göre iş kazası; işyerinde veya işin yürütümü nedeniyle meydana gelen, ölüme sebebiyet veren veya vücut bütünlüğünü ruhen ya da bedenen engelli hâle getiren olaydır.",
          "5510 sayılı Kanun'a göre aşağıdaki durumlarda meydana gelen ve sigortalıyı hemen veya sonradan bedenen ya da ruhen engelli hâle getiren olaylar iş kazası sayılır:",
        ],
        maddeler: [
          "Sigortalının işyerinde bulunduğu sırada,",
          "İşveren tarafından yürütülmekte olan iş nedeniyle işyeri dışında,",
          "Görevli olarak işyeri dışında başka bir yere gönderilmesi nedeniyle asıl işini yapmaksızın geçen zamanlarda,",
          "Emziren kadın sigortalının çocuğuna süt vermek için ayrılan zamanlarda,",
          "İşverence sağlanan bir taşıtla işin yapıldığı yere gidiş gelişi sırasında.",
        ],
      },
      {
        baslik: "Meslek hastalığı nedir?",
        metin: [
          "Meslek hastalığı, mesleki risklere maruziyet sonucu ortaya çıkan hastalıktır. 5510 sayılı Kanun'a göre sigortalının çalıştığı veya yaptığı işin niteliğinden dolayı tekrarlanan bir sebeple ya da işin yürütüm şartları yüzünden uğradığı geçici veya sürekli hastalık, bedensel veya ruhsal engellilik hâlleridir. İş kazasından farkı, genellikle ani bir olayla değil uzun süreli maruziyetle ortaya çıkmasıdır.",
        ],
      },
      {
        baslik: "Kayıt ve bildirim",
        metin: [
          "İşveren bütün iş kazalarının ve meslek hastalıklarının kaydını tutar, gerekli incelemeleri yaparak raporlarını düzenler. Yaralanma veya ölüme yol açmasa da çalışanı, işyerini ya da iş ekipmanını zarara uğratma potansiyeli olan olaylar (ramak kala olaylar) da incelenir.",
        ],
        maddeler: [
          "İş kazası, kazadan sonraki 3 iş günü içinde Sosyal Güvenlik Kurumuna (SGK) bildirilir.",
          "Meslek hastalığı, işverenin öğrendiği tarihten itibaren 3 iş günü içinde SGK'ya bildirilir.",
          "İşyerinde meydana gelen iş kazası ayrıca o yerin yetkili kolluk kuvvetlerine derhâl bildirilir.",
          "Çalışan, ne kadar küçük olursa olsun yaşadığı her kazayı ve ramak kala olayı amirine hemen bildirmelidir.",
        ],
      },
      {
        baslik: "Hukuki sonuçlar",
        metin: ["Bir iş kazası veya meslek hastalığı; kazazede, işveren ve kusuru bulunan diğer kişiler için farklı hukuki sonuçlar doğurabilir:"],
        maddeler: [
          "Sosyal güvenlik hakları: Sigortalıya tedavi giderleri, geçici iş göremezlik ödeneği ve sürekli iş göremezlik geliri; ölüm hâlinde hak sahiplerine gelir gibi yardımlar SGK tarafından sağlanır.",
          "Rücu: Kaza veya hastalık işverenin kastı ya da iş sağlığı ve güvenliği mevzuatına aykırı hareketi sonucu meydana gelmişse SGK yaptığı harcamaları işverene ödettirebilir.",
          "Tazminat: Kazazede veya yakınları, kusuru bulunanlardan maddi ve manevi tazminat talep edebilir. Çalışanın kendi kusuru varsa tazminattan indirim yapılabilir.",
          "Cezai sorumluluk: Ölüm veya yaralanmayla sonuçlanan kazalarda kusuru bulunan kişiler, Türk Ceza Kanunu kapsamında taksirle öldürme veya taksirle yaralama suçlarından yargılanabilir. Bu sorumluluk yalnızca işverenle sınırlı değildir; talimatlara uymayarak başkasının yaralanmasına yol açan çalışan da sorumlu tutulabilir.",
          "İdari yaptırımlar: Mevzuata aykırılıklar için işverene idari para cezası uygulanır; hayati tehlike bulunan durumlarda iş durdurulabilir.",
          "İş sözleşmesi: Kendi isteği veya ihmali yüzünden işin güvenliğini tehlikeye düşüren çalışanın iş sözleşmesi, İş Kanunu hükümlerine göre feshedilebilir.",
        ],
      },
      {
        baslik: "Kazaların sebepleri",
        metin: [
          "Kazaların büyük bölümü iki temel nedenden kaynaklanır: güvensiz davranışlar (KKD kullanmamak, koruyucuyu çıkarmak, yetkisiz iş yapmak, acele etmek) ve güvensiz durumlar (korumasız makine, bozuk zemin, yetersiz aydınlatma). Heinrich'in klasik çalışmasına göre bir ağır yaralanmalı kazanın arkasında çok sayıda hafif yaralanmalı kaza ve yüzlerce yaralanmasız olay bulunur. Bu nedenle ramak kala olayları bildirmek, ciddi kazaları önlemenin en etkili yollarından biridir.",
        ],
      },
    ],
    onemli: [
      "İş kazası, kazadan sonraki 3 iş günü içinde SGK'ya bildirilir.",
      "Ramak kala olaylar da bildirilir ve incelenir; büyük kazaların habercisidir.",
      "Kusurlu davranış; tazminat, ceza ve iş sözleşmesinin feshi gibi sonuçlar doğurabilir.",
    ],
    sorular: [
      {
        soru: "İşveren, iş kazasını SGK'ya hangi süre içinde bildirmelidir?",
        secenekler: ["Kazadan sonraki 3 iş günü içinde", "Kazadan sonraki 10 gün içinde", "Kazadan sonraki 1 ay içinde", "Yalnızca çalışan isterse"],
        dogru: 0,
        aciklama: "İş kazası, kazadan sonraki 3 iş günü içinde SGK'ya bildirilir.",
      },
      {
        soru: "Yaralanma veya hasara yol açmadığı hâlde zarar verme potansiyeli taşıyan olaya ne ad verilir?",
        secenekler: ["Meslek hastalığı", "Ramak kala olay", "Mücbir sebep", "İş göremezlik"],
        dogru: 1,
        aciklama: "Ramak kala olay; çalışanı, işyerini ya da iş ekipmanını zarara uğratma potansiyeli olduğu hâlde zarara uğratmayan olaydır.",
      },
      {
        soru: "SGK'nın, işverenin mevzuata aykırı hareketi sonucu oluşan iş kazası için yaptığı harcamaları işverenden geri istemesine ne denir?",
        secenekler: ["Rücu", "İhbar tazminatı", "Kıdem tazminatı", "Arabuluculuk"],
        dogru: 0,
        aciklama: "Kaza işverenin kastı veya mevzuata aykırı hareketi sonucu meydana gelmişse SGK, yaptığı harcamaları rücu yoluyla işverene ödettirir.",
      },
    ],
  },

  // 5 ---------------------------------------------------------------
  {
    id: "meslek-hastaliklari",
    baslik: "Meslek Hastalıkları, Biyolojik ve Psikososyal Risk Etmenleri",
    sure_dk: 25,
    ozet:
      "Meslek hastalıklarının sebeplerini, hastalıktan korunma ilkelerini, biyolojik ve psikososyal risk etmenlerini ve tütün ürünlerinin zararlarını öğreneceksiniz.",
    bolumler: [
      {
        baslik: "Meslek hastalıklarının sebepleri",
        metin: [
          "Meslek hastalıkları, çalışma ortamındaki etkenlere uzun süre ve tekrar tekrar maruz kalınması sonucu gelişir. Belirtiler çoğu zaman yıllar sonra ortaya çıkar ve birçok meslek hastalığında oluşan hasar kalıcıdır. Bu nedenle meslek hastalıklarında asıl çözüm korunmadır. Başlıca örnekler şunlardır:",
        ],
        maddeler: [
          "Tozlar: Silis tozuna bağlı silikozis; asbeste bağlı asbestoz ve akciğer zarı kanseri (mezotelyoma).",
          "Gürültü: Kalıcı, geri dönüşü olmayan işitme kaybı.",
          "Kimyasallar: Kurşun, cıva ve çözücülere bağlı zehirlenmeler; mesleki astım ve deri hastalıkları.",
          "Titreşim: El-kol titreşimine bağlı damar, sinir ve eklem rahatsızlıkları.",
          "Ergonomik etkenler: Tekrarlayan hareketler ve zorlayıcı duruşlara bağlı kas-iskelet sistemi hastalıkları.",
        ],
      },
      {
        baslik: "Hastalıktan korunma ilkeleri",
        metin: [
          "Korunma önlemleri belirli bir öncelik sırasıyla uygulanır. Listede üstte yer alan önlemler daha etkilidir; kişisel koruyucu donanım ise diğer önlemlerin yetersiz kaldığı durumlarda başvurulan son çaredir:",
        ],
        maddeler: [
          "Tehlikeyi ortadan kaldırma: Tehlikeli işlemi veya maddeyi tamamen kaldırmak.",
          "İkame: Tehlikeli olanı, tehlikesiz veya daha az tehlikeli olanla değiştirmek (ör. solvent bazlı boya yerine su bazlı boya).",
          "Mühendislik önlemleri: Kapalı sistemler, lokal egzoz havalandırması, gürültü kaynağını yalıtma.",
          "İdari önlemler: Maruziyet süresini kısaltma, iş rotasyonu, talimatlar, eğitim ve uyarı işaretleri.",
          "Kişisel koruyucu donanım: Maske, kulak koruyucu, eldiven gibi donanımlar.",
        ],
      },
      {
        baslik: "Sağlık gözetimi",
        metin: [
          "İşe giriş muayenesi ve periyodik muayeneler, hastalığın erken belirtilerini yakalamaya yardımcı olur. Muayenelerinizi aksatmayın; öksürük, nefes darlığı, işitmede azalma, ciltte döküntü gibi değişiklikleri işyeri hekimine bildirin.",
        ],
      },
      {
        baslik: "Biyolojik risk etmenleri",
        metin: [
          "Biyolojik etkenler; bakteri, virüs, mantar ve parazit gibi enfeksiyona, alerjiye veya zehirlenmeye yol açabilen canlılardır. Sağlık hizmetleri, laboratuvarlar, tarım ve hayvancılık, gıda işleme, atık toplama ve kanalizasyon işleri gibi alanlarda risk daha yüksektir. Mevzuatta biyolojik etkenler, enfeksiyon oluşturma risk düzeyine göre dört gruba ayrılır.",
        ],
        maddeler: [
          "Kan ve vücut sıvılarıyla bulaşan hepatit B, hepatit C ve HIV, özellikle kesici-delici alet yaralanmalarıyla bulaşabilir.",
          "Hayvanlardan insanlara geçen hastalıklar (ör. bruselloz) tarım ve hayvancılıkta önemli bir risktir.",
          "Korunmada el hijyeni, uygun eldiven ve maske, kullanılmış iğnelerin kapağının geri takılmaması, kesici-delici atık kutusu kullanımı ve aşılama (ör. hepatit B aşısı) temel önlemlerdir.",
        ],
      },
      {
        baslik: "Psikososyal risk etmenleri",
        metin: [
          "Psikososyal riskler; işin tasarımı, organizasyonu, yönetimi ve çalışma ilişkilerinden kaynaklanan, stres, tükenmişlik, kaygı ve bunlara bağlı bedensel rahatsızlıklara yol açabilen etkenlerdir. İş yükünün ve vardiyaların dengeli planlanması, çalışanların görüşünün alınması, açık iletişim ve destek kanalları temel önlemlerdir. Taciz ve şiddet olayları gizlenmeden bildirilmelidir. Başlıca psikososyal risk etmenleri:",
        ],
        maddeler: [
          "Aşırı iş yükü, zaman baskısı ve uzun çalışma saatleri",
          "Vardiyalı ve gece çalışması",
          "Görev ve sorumlulukların belirsizliği, işe katılımın ve kontrolün az olması",
          "Psikolojik taciz (mobbing), ayrımcılık ve işyerinde şiddet",
          "İş güvencesizliği ve iş-özel yaşam dengesizliği",
        ],
      },
      {
        baslik: "Tütün ürünlerinin zararları ve pasif etkilenim",
        metin: [
          "Tütün kullanımı akciğer kanseri, kalp-damar hastalıkları ve kronik akciğer hastalıklarının başlıca nedenlerindendir; işyerindeki toz ve kimyasallarla birlikte zararlı etkiler artabilir. Başkasının tüttürdüğü dumanı solumak (pasif etkilenim) da ciddi sağlık sorunlarına yol açar. Kapalı çalışma alanlarında tütün ürünü kullanmak yasaktır. Yanıcı ve parlayıcı madde bulunan yerlerde sigara içmek ayrıca yangın ve patlama riski yaratır.",
        ],
      },
    ],
    onemli: [
      "Meslek hastalıklarında hasar çoğu zaman kalıcıdır; korunma tedaviden önce gelir.",
      "Önlem sırası: ortadan kaldırma → ikame → mühendislik → idari önlemler → KKD.",
      "Kullanılmış iğnenin kapağı geri takılmaz; kesici-delici atık kutusuna atılır.",
      "Kapalı çalışma alanlarında tütün ürünü kullanılmaz.",
    ],
    sorular: [
      {
        soru: "Silis tozuna uzun süre maruz kalan bir çalışanda hangi meslek hastalığı gelişebilir?",
        secenekler: ["Silikozis", "Bruselloz", "Karpal tünel sendromu", "Kurşun zehirlenmesi"],
        dogru: 0,
        aciklama: "Silikozis, solunan silis (kristal silika) tozunun akciğerde yol açtığı kalıcı bir meslek hastalığıdır.",
      },
      {
        soru: "Korunma önlemleri arasında en son başvurulması gereken hangisidir?",
        secenekler: ["Tehlikeyi ortadan kaldırma", "İkame", "Mühendislik önlemleri", "Kişisel koruyucu donanım"],
        dogru: 3,
        aciklama: "KKD, tehlike kaynağında yok edilemediğinde veya diğer önlemlerle yeterince azaltılamadığında kullanılan son çaredir.",
      },
      {
        soru: "Aşağıdakilerden hangisi psikososyal risk etmenidir?",
        secenekler: ["Gürültü", "Psikolojik taciz (mobbing)", "Silis tozu", "Hepatit B virüsü"],
        dogru: 1,
        aciklama: "Mobbing, iş organizasyonu ve çalışma ilişkilerinden kaynaklanan psikososyal bir risktir. Gürültü fiziksel, silis tozu kimyasal, hepatit B virüsü biyolojik etkendir.",
      },
    ],
  },

  // 6 ---------------------------------------------------------------
  {
    id: "ilk-yardim",
    baslik: "İlk Yardım",
    sure_dk: 20,
    ozet:
      "İlk yardımın amacını, temel uygulamalarını (koruma, bildirme, kurtarma), 112'nin doğru aranmasını ve olay yerinde dikkat edilecekleri öğreneceksiniz. Bu ders bir farkındalık dersidir; uygulamalı ilk yardım eğitiminin yerini tutmaz.",
    bolumler: [
      {
        baslik: "İlk yardım nedir?",
        metin: [
          "İlk yardım; herhangi bir kaza veya yaşamı tehlikeye düşüren bir durumda, sağlık görevlilerinin tıbbi yardımı sağlanıncaya kadar hayatın kurtarılması ya da durumun daha kötüye gitmesinin önlenmesi amacıyla olay yerinde, tıbbi araç gereç aranmaksızın mevcut araç ve gereçlerle yapılan ilaçsız uygulamalardır.",
          "İlk yardımın amaçları; hayati tehlikeyi ortadan kaldırmak, yaşamsal fonksiyonların sürdürülmesini sağlamak, hasta veya yaralının durumunun kötüleşmesini önlemek ve iyileşmeyi kolaylaştırmaktır. İşyerlerinde, tehlike sınıfına ve çalışan sayısına göre yeterli sayıda belgeli ilk yardımcı bulunması gerekir.",
        ],
      },
      {
        baslik: "Temel uygulamalar: Koruma, Bildirme, Kurtarma",
        metin: ["İlk yardımın üç temel uygulaması bu sırayla akılda tutulur:"],
        maddeler: [
          "Koruma: Önce kendi güvenliğinizi, sonra yaralının ve çevredekilerin güvenliğini sağlayın. Olay yerini değerlendirin; elektrik, yangın, trafik, gaz gibi tehlikeler varsa ortadan kaldırın veya güvenli mesafede kalın. Yeni kazaların oluşmasını önleyin.",
          "Bildirme: 112 Acil Çağrı Merkezini arayarak durumu bildirin. Mümkünse başka birinden aramasını isteyin; siz yaralıyla ilgilenin.",
          "Kurtarma: Yaralının bilincini ve solunumunu değerlendirin, eğitiminiz ölçüsünde gerekli ilk yardımı uygulayın ve sağlık ekibi gelene kadar yaralının yanında kalın.",
        ],
      },
      {
        baslik: "112'yi ararken",
        metin: ["112'yi aradığınızda sakin olun ve görevlinin sorularını yanıtlayın. Şu bilgileri açık ve net biçimde verin:"],
        maddeler: [
          "Adınız ve aradığınız telefon numarası",
          "Olay yerinin açık adresi ve tarif için belirgin noktalar",
          "Olayın ne olduğu (düşme, elektrik çarpması, yanık, zehirlenme vb.)",
          "Yaralı sayısı ve durumları (bilinci açık mı, nefes alıyor mu, kanama var mı?)",
          "O ana kadar yapılan ilk yardım uygulamaları",
          "Telefonu, görevli söylemeden kapatmayın; görevlinin yönlendirmelerini izleyin.",
        ],
      },
      {
        baslik: "Olay yerinde dikkat edilecekler",
        metin: [
          "Kalp masajı ve suni solunum gibi temel yaşam desteği uygulamaları uygulamalı eğitim gerektirir. Eğitim aldıysanız uygulayın; almadıysanız 112 görevlisinin telefonda vereceği yönlendirmeleri izleyin. Her durumda şu kurallara dikkat edin:",
        ],
        maddeler: [
          "Yangın, patlama, göçük gibi hayati bir tehlike yoksa yaralıyı yerinden oynatmayın; özellikle baş, boyun veya omurga yaralanmasından şüpheleniyorsanız hareket ettirmeyin.",
          "Bilinci kapalı ya da bulanık kişiye ağızdan yiyecek, içecek veya ilaç vermeyin.",
          "Kanamada temiz bir bezle yaraya doğrudan baskı uygulayın.",
          "Yanıkları serin, akan suyla soğutun; yanığa yağ, diş macunu gibi maddeler sürmeyin ve yapışmış giysileri çekip çıkarmayın.",
          "Elektrik çarpmasında akımı kesmeden yaralıya dokunmayın.",
          "Yaralıyı sıcak tutun, sakinleştirin ve yalnız bırakmayın.",
          "Bildiğinizden emin olmadığınız uygulamaları yapmayın.",
        ],
      },
      {
        baslik: "İşyerinde ilk yardım düzeni",
        metin: [
          "Her çalışan, işyerindeki ilk yardım dolabının yerini ve ilk yardımcıların kim olduğunu bilmelidir. İlk yardım dolabı kolay ulaşılabilir bir yerde, işaretli ve eksiksiz olmalı; kullanılan malzemeler yenilenmelidir. Acil durum telefon numaraları görünür yerlere asılmalıdır.",
        ],
      },
    ],
    onemli: [
      "Sıra: Koruma → Bildirme → Kurtarma.",
      "Önce kendi güvenliğiniz; kazazede sayısını artırmayın.",
      "Acil çağrı numarası 112'dir; telefonu görevli söylemeden kapatmayın.",
      "Hayati tehlike yoksa yaralıyı hareket ettirmeyin; bilinci kapalı kişiye bir şey içirmeyin.",
    ],
    sorular: [
      {
        soru: "İlk yardımın temel uygulamalarının doğru sıralaması hangisidir?",
        secenekler: ["Kurtarma – Bildirme – Koruma", "Koruma – Bildirme – Kurtarma", "Bildirme – Kurtarma – Koruma", "Kurtarma – Koruma – Bildirme"],
        dogru: 1,
        aciklama: "Önce olay yeri ve kişiler korunur, ardından 112'ye bildirilir, sonra eğitim ölçüsünde kurtarma ve ilk yardım uygulanır.",
      },
      {
        soru: "Elektrik çarpmış bir çalışana yardım etmeden önce ilk yapılması gereken nedir?",
        secenekler: ["Hemen eliyle tutup çekmek", "Üzerine su dökmek", "Akımı (sigorta veya şalterden) kesmek", "Ağzından su vermek"],
        dogru: 2,
        aciklama: "Akım kesilmeden yaralıya dokunan kişi de elektrik çarpmasına maruz kalır. Önce akım kesilir.",
      },
      {
        soru: "Bilinci kapalı bir yaralıya aşağıdakilerden hangisi yapılmamalıdır?",
        secenekler: ["112'yi aramak", "Ağızdan su veya ilaç vermek", "Yanında kalıp gözlemek", "Sıcak tutmak"],
        dogru: 1,
        aciklama: "Bilinci kapalı kişiye ağızdan bir şey verilmesi soluk yolunun tıkanmasına yol açabilir.",
      },
    ],
  },

  // 7 ---------------------------------------------------------------
  {
    id: "risk-etmenleri",
    baslik: "Kimyasal, Fiziksel ve Ergonomik Risk Etmenleri; Elle Kaldırma ve Taşıma",
    sure_dk: 25,
    ozet:
      "Kimyasalların vücuda giriş yollarını, etiket ve güvenlik bilgi formlarını, gürültü, titreşim ve aydınlatma gibi fiziksel etkenleri, ergonomik riskleri ve yükleri güvenli kaldırma tekniklerini öğreneceksiniz.",
    bolumler: [
      {
        baslik: "Kimyasal risk etmenleri",
        metin: [
          "Kimyasallar gaz, buhar, toz, duman, sis veya sıvı hâlinde bulunabilir. Vücuda başlıca solunum yoluyla, deriden emilerek veya sindirim yoluyla (ağızdan) girer; göze sıçrayarak da zarar verebilir. Etkileri tahriş ve yanıktan zehirlenmeye, alerjiden kansere kadar uzanabilir.",
          "Bir kimyasalla çalışmadan önce etiketi ve güvenlik bilgi formu (GBF) okunmalıdır. Etiketteki tehlike piktogramları (beyaz zemin üzerinde siyah sembollü, kırmızı çerçeveli baklava biçimli işaretler) maddenin yanıcı, aşındırıcı, zehirli veya çevreye zararlı olduğunu gösterir. Güvenlik bilgi formu ise maddenin tehlikelerini, güvenli kullanım ve depolama koşullarını, gereken kişisel koruyucu donanımı ve ilk yardım bilgilerini içerir.",
        ],
        maddeler: [
          "Kimyasalları orijinal ve etiketli kaplarında saklayın; asla içecek şişelerine aktarmayın.",
          "Birbiriyle tepkimeye girebilecek kimyasalları ayrı depolayın.",
          "Lokal havalandırma ve kapalı sistemleri kullanın; kapları kullanmadığınızda kapalı tutun.",
          "Güvenlik bilgi formunda belirtilen eldiven, gözlük veya maskeyi kullanın.",
          "Kimyasalla çalışılan alanda yemek yemeyin, bir şey içmeyin ve sigara içmeyin.",
        ],
      },
      {
        baslik: "Fiziksel risk etmenleri",
        metin: ["Fiziksel risk etmenleri; gürültü, titreşim, aydınlatma, sıcaklık-nem gibi termal konfor koşulları ve radyasyon gibi enerji kaynaklı etkenlerdir."],
        maddeler: [
          "Gürültü: Günlük 8 saatlik maruziyette 80 dB(A) en düşük maruziyet eylem değeridir; bu değer aşıldığında işveren kulak koruyucuları çalışanların kullanımına sunar. 85 dB(A) en yüksek maruziyet eylem değeridir; bu düzeye ulaşıldığında kulak koruyucuların takılarak kullanılması sağlanır. Kulak koruyucunun etkisi de hesaba katıldığında 87 dB(A) maruziyet sınır değeri aşılamaz.",
          "Titreşim: El aletlerinden kaynaklanan el-kol titreşimi ve araç ya da iş makinelerinden kaynaklanan bütün vücut titreşimi; maruziyet süresi sınırlanmalı, titreşimi azaltılmış ekipman seçilmelidir.",
          "Aydınlatma: Yetersiz veya göz kamaştırıcı aydınlatma göz yorgunluğuna ve kazalara yol açar.",
          "Termal konfor: Aşırı sıcak ortamlar sıcak çarpmasına, soğuk ortamlar soğuk stresine neden olabilir; yeterli su, dinlenme ve uygun giysi önemlidir.",
          "Radyasyon: İyonlaştırıcı (ör. röntgen) ve iyonlaştırıcı olmayan (ör. kaynak arkındaki ultraviyole) radyasyona karşı süreyi kısaltma, mesafeyi artırma ve zırhlama ilkeleri uygulanır.",
        ],
      },
      {
        baslik: "Ergonomik risk etmenleri",
        metin: [
          "Ergonomi, işin ve çalışma ortamının insana uygun hâle getirilmesidir. Tekrarlayan hareketler, uzun süre aynı pozisyonda (ayakta ya da oturarak) çalışma, eğilme ve uzanma gerektiren zorlayıcı duruşlar ve ağır yük taşıma; bel fıtığı, boyun ve omuz ağrıları, karpal tünel sendromu gibi kas-iskelet sistemi rahatsızlıklarına yol açar. Çalışma yüksekliğinin kişiye göre ayarlanması, sık kullanılan malzemelerin kolay ulaşılır yerde tutulması, kısa ve sık molalar ve iş rotasyonu temel önlemlerdir.",
        ],
      },
      {
        baslik: "Elle kaldırma ve taşıma",
        metin: [
          "Önce yükün elle taşınmasının gerekip gerekmediği sorgulanmalı; mümkünse transpalet, el arabası, kaldırma aracı gibi mekanik yardımcılar kullanılmalıdır. Elle taşıma kaçınılmazsa şu kurallara uyun:",
        ],
        maddeler: [
          "Yükün ağırlığını, dengesini ve tutma yerlerini önceden kontrol edin; taşıyacağınız yolu engellerden arındırın.",
          "Ayaklarınızı omuz genişliğinde açarak yüke yaklaşın.",
          "Dizlerinizi bükün, sırtınızı dik tutun; kaldırma gücünü bacaklarınızdan alın.",
          "Yükü iki elle sıkıca kavrayın ve vücudunuza yakın tutun.",
          "Kaldırırken ve taşırken gövdenizi döndürmeyin; yön değiştirmek için ayaklarınızla dönün.",
          "Görüşünüzü engelleyen, çok ağır veya hantal yükleri tek başınıza taşımayın; yardım isteyin.",
          "Yükü indirirken de aynı kurallara uyun; ani ve sarsıntılı hareketlerden kaçının.",
        ],
      },
    ],
    onemli: [
      "Kimyasalı etiketsiz kaba veya içecek şişesine koymayın; önce etiketi ve GBF'yi okuyun.",
      "Gürültüde 80 dB(A) koruyucu sağlanır, 85 dB(A) koruyucu takılır, 87 dB(A) aşılamaz.",
      "Yük vücuda yakın, sırt dik, güç bacaklardan; yük taşırken belden dönülmez.",
    ],
    sorular: [
      {
        soru: "Kimyasalların vücuda girişinde işyerlerinde en sık karşılaşılan yol hangisidir?",
        secenekler: ["Solunum yolu", "Kulak yolu", "Saç dipleri", "Tırnaklar"],
        dogru: 0,
        aciklama: "Gaz, buhar, toz ve duman hâlindeki kimyasallar en çok solunum yoluyla vücuda girer; bu nedenle havalandırma ve solunum koruma önemlidir.",
      },
      {
        soru: "Bir kimyasalın tehlikeleri, güvenli kullanımı ve ilk yardım bilgileri hangi belgede yer alır?",
        secenekler: ["Fatura", "Güvenlik bilgi formu (GBF)", "İrsaliye", "Garanti belgesi"],
        dogru: 1,
        aciklama: "Güvenlik bilgi formu; tehlikeleri, güvenli kullanım ve depolama koşullarını, gereken KKD'yi ve ilk yardım bilgilerini içerir.",
      },
      {
        soru: "Yük kaldırırken doğru teknik hangisidir?",
        secenekler: [
          "Dizler düz, belden eğilerek kaldırmak",
          "Yükü vücuttan uzak tutmak",
          "Dizleri bükerek, sırt dik ve yük vücuda yakın kaldırmak",
          "Kaldırırken gövdeyi döndürmek",
        ],
        dogru: 2,
        aciklama: "Güç bacaklardan alınır, sırt dik tutulur ve yük vücuda yakın taşınır; böylece bele binen yük azalır.",
      },
    ],
  },

  // 8 ---------------------------------------------------------------
  {
    id: "yangin",
    baslik: "Parlama, Patlama, Yangın ve Yangından Korunma",
    sure_dk: 25,
    ozet:
      "Yanmanın nasıl gerçekleştiğini, yangın sınıflarını, söndürme yöntemlerini, yangın söndürücü seçimini ve kullanımını, patlama riskini ve yangın anında yapılması gerekenleri öğreneceksiniz.",
    bolumler: [
      {
        baslik: "Yanma nasıl olur?",
        metin: [
          "Yanmanın gerçekleşmesi için üç unsur bir arada bulunmalıdır: yanıcı madde, oksijen (hava) ve yeterli ısı. Bu üç unsura yangın üçgeni denir; yanma sırasında oluşan zincirleme kimyasal tepkime de eklendiğinde yangın dörtgeninden söz edilir. Unsurlardan biri ortadan kaldırıldığında yangın söner.",
          "Parlama noktası, yanıcı bir sıvının yüzeyinde tutuşabilecek miktarda buhar oluşturduğu en düşük sıcaklıktır. Parlama noktası düşük olan sıvılar (ör. benzin, tiner) oda sıcaklığında bile tutuşabilir buhar çıkarır.",
        ],
      },
      {
        baslik: "Yangın sınıfları",
        metin: ["Yangınlar, yanan maddenin türüne göre sınıflandırılır. Doğru söndürücüyü seçmek için yangının sınıfını bilmek gerekir:"],
        maddeler: [
          "A sınıfı: Katı maddeler — odun, kâğıt, kumaş, plastik gibi genellikle kor bırakarak yanan maddeler.",
          "B sınıfı: Sıvılar ve sıvılaşabilen katılar — benzin, mazot, tiner, boya, alkol, katran.",
          "C sınıfı: Gazlar — doğal gaz, LPG, asetilen, hidrojen.",
          "D sınıfı: Yanabilen metaller — sodyum, potasyum, magnezyum, alüminyum tozu gibi.",
          "F sınıfı: Mutfaklardaki bitkisel ve hayvansal pişirme yağları.",
        ],
      },
      {
        baslik: "Söndürme yöntemleri ve söndürücü seçimi",
        metin: [
          "Söndürme; yanıcı maddenin ortamdan uzaklaştırılması, ortamın soğutulması, oksijenin kesilmesi (boğma) veya zincirleme tepkimenin kesilmesi yoluyla yapılır. Söndürücünün hangi yangın sınıfları için uygun olduğu etiketinde yazar.",
          "Elektrik yangınları ayrı bir sınıf olarak ele alınmaz: Önce elektrik kesilir, ardından elektriği iletmeyen söndürücülerle (karbondioksitli veya kuru kimyevi tozlu) müdahale edilir.",
        ],
        maddeler: [
          "ABC kuru kimyevi tozlu söndürücü: A, B ve C sınıfı yangınlarda kullanılır; işyerlerinde en yaygın türdür.",
          "Karbondioksitli (CO₂) söndürücü: Sıvı yangınlarında ve elektrikli cihaz yangınlarında kullanılır, iz bırakmaz. Boşaltma sırasında boynuzu çok soğuduğu için çıplak elle tutulmaz; dar ve kapalı alanlarda havadaki oksijeni azaltabilir.",
          "Köpüklü söndürücü: A ve B sınıfı yangınlarda etkilidir; etiketinde uygun olduğu belirtilmedikçe gerilim altındaki elektrikli cihazlarda kullanılmaz.",
          "Su: A sınıfı yangınlarda etkilidir; elektrik, metal ve yağ yangınlarında kullanılmaz.",
          "Özel söndürücüler: Metal yangınları için D sınıfı tozlu, pişirme yağı yangınları için F sınıfı söndürücüler kullanılır.",
          "Kızgın yağ yangınına asla su dökülmez; su, yanan yağı püskürterek yangını büyütür. Ocak kapatılır, kabın üstü kapakla veya yangın battaniyesiyle örtülür.",
        ],
      },
      {
        baslik: "Yangın söndürücü nasıl kullanılır?",
        metin: ["Söndürücüyle ancak küçük ve başlangıç aşamasındaki yangınlara, kendinizi tehlikeye atmadan müdahale edebilirsiniz:"],
        maddeler: [
          "Önce çevrenizi uyarın ve alarmı verin; kaçış yolu arkanızda kalacak şekilde durun.",
          "Söndürücüyü dik tutun ve emniyet pimini çekin.",
          "Güvenli bir mesafeden hortumu alevlere değil, yanan maddenin dibine (ateşin köküne) yöneltin.",
          "Tetiğe basın ve hortumu süpürür gibi sağa sola hareket ettirin.",
          "Açık alanda rüzgârı arkanıza alın.",
          "Yangın büyüyorsa, duman yoğunlaşıyorsa veya söndürücü bittiyse müdahaleyi bırakıp tahliye olun.",
          "Kullanılan söndürücüyü boş olarak yerine koymayın; dolum için bildirin.",
        ],
      },
      {
        baslik: "Patlama riski",
        metin: [
          "Yanıcı gaz, buhar veya tozların havayla belirli oranlarda karışması patlayıcı ortam oluşturur. Bu oranların sınırları alt ve üst patlama sınırı olarak adlandırılır; karışım bu aralıktaysa küçük bir kıvılcım patlamaya yol açabilir. Un, şeker, kömür ve ağaç tozu gibi yanıcı tozlar da havada asılı hâldeyken patlayabilir.",
          "Patlayıcı ortam bulunan alanlar işaretlenir. Bu alanlarda açık alevle çalışılmaz, sigara içilmez; kıvılcım çıkarmayan aletler ve patlayıcı ortama uygun (Ex işaretli) ekipman kullanılır. Gaz kaçağından şüphelenildiğinde elektrik düğmelerine dokunulmaz, ortam havalandırılır ve yetkililere haber verilir.",
        ],
      },
      {
        baslik: "Yangın anında",
        metin: ["Yangınla karşılaştığınızda:"],
        maddeler: [
          "“Yangın var!” diye çevrenizi uyarın, yangın alarm butonuna basın ve 112'yi arayın.",
          "Asansör kullanmayın; merdivenler ve işaretli kaçış yollarıyla tahliye olun.",
          "Dumanlı ortamda eğilerek veya emekleyerek ilerleyin; mümkünse ağzınızı ve burnunuzu ıslak bir bezle kapatın.",
          "Kapıyı açmadan önce elinizin tersiyle sıcaklığını kontrol edin; sıcaksa açmayın.",
          "Giysiniz tutuşursa koşmayın: Durun, yere yatın ve yuvarlanın.",
          "Toplanma alanına gidin ve sayım yapılmadan ayrılmayın.",
        ],
      },
    ],
    onemli: [
      "Yangın üçgeni: yanıcı madde + oksijen + ısı.",
      "A katı, B sıvı, C gaz, D metal, F pişirme yağı.",
      "Kızgın yağ yangınına su dökülmez.",
      "Söndürücü: pimi çek, ateşin dibine yönelt, tetiğe bas, süpürür gibi sağa sola hareket ettir.",
      "Yangında asansör kullanılmaz.",
    ],
    sorular: [
      {
        soru: "Benzin yangını hangi yangın sınıfına girer?",
        secenekler: ["A sınıfı", "B sınıfı", "C sınıfı", "D sınıfı"],
        dogru: 1,
        aciklama: "B sınıfı; benzin, tiner, boya, alkol gibi sıvıların ve sıvılaşabilen katıların yangınıdır.",
      },
      {
        soru: "Tavadaki kızgın yağ tutuştu. Aşağıdakilerden hangisi yapılmamalıdır?",
        secenekler: ["Ocağı kapatmak", "Tavanın üzerini kapakla örtmek", "Üzerine su dökmek", "F sınıfı söndürücü kullanmak"],
        dogru: 2,
        aciklama: "Kızgın yağa dökülen su anında buharlaşarak yanan yağı etrafa püskürtür ve yangını büyütür.",
      },
      {
        soru: "Yangın söndürücü kullanırken hortum nereye yöneltilmelidir?",
        secenekler: ["Alevlerin en üst kısmına", "Yanan maddenin dibine (ateşin köküne)", "Duman bulutuna", "Tavana"],
        dogru: 1,
        aciklama: "Söndürücü maddesi alevlere değil, yanan maddenin kendisine yani ateşin köküne yöneltilmelidir.",
      },
    ],
  },

  // 9 ---------------------------------------------------------------
  {
    id: "ekipman-elektrik",
    baslik: "İş Ekipmanları, Ekranlı Araçlar ve Elektrik Güvenliği",
    sure_dk: 25,
    ozet:
      "Makine ve el aletlerini güvenli kullanmanın kurallarını, ekranlı araçlarla sağlıklı çalışmayı ve elektrik tehlikelerine karşı alınacak önlemleri öğreneceksiniz.",
    bolumler: [
      {
        baslik: "İş ekipmanlarının güvenli kullanımı",
        metin: [
          "İş ekipmanı; işin yapılmasında kullanılan makine, alet, tesis ve tesisatın tümüdür. Ekipmana bağlı kazalar çoğunlukla koruyucuların çıkarılması, yetkisiz kullanım, bakım sırasında makinenin çalıştırılması ve işe uygun olmayan ekipman kullanımından kaynaklanır.",
        ],
        maddeler: [
          "Yalnızca eğitimini aldığınız ve kullanmakla görevlendirildiğiniz ekipmanı kullanın; forklift, vinç gibi ekipmanlar için gereken belgeye sahip olun.",
          "Makinenin koruyucularını, emniyet şalterlerini ve sensörlerini çıkarmayın, devre dışı bırakmayın.",
          "Kullanmadan önce ekipmanı gözle kontrol edin; arızalı ekipmanı kullanmayın, etiketleyip bildirin.",
          "Acil durdurma butonlarının yerini bilin ve önlerini kapatmayın.",
          "Dönen ve hareketli parçaların yakınında bol giysi, takı ve atkı kullanmayın; uzun saçı toplayın. Kapılma riski olan makinelerde eldiven kullanımıyla ilgili talimata uyun.",
          "Bakım, onarım ve temizlikten önce makineyi durdurun, enerjisini kesin, kilitleyin ve etiketleyin.",
          "Kaldırma ekipmanları ve basınçlı kaplar gibi ekipmanların periyodik kontrolleri yetkili kişilerce yapılır; kontrol süresi geçmiş ekipmanı kullanmayın.",
          "El aletlerini amacına uygun kullanın; sapı kırık, ağzı bozuk aletlerle çalışmayın.",
        ],
      },
      {
        baslik: "Ekranlı araçlarla çalışma",
        metin: [
          "Bilgisayar ve benzeri ekranlı araçlarla uzun süre çalışmak göz yorgunluğu, baş ağrısı, boyun, sırt ve bilek ağrılarına yol açabilir. Mevzuata göre ekranlı araçlarla çalışma, düzenli aralar verilerek veya başka işlerle dönüşümlü yapılacak şekilde planlanır; çalışanlara göz ve görme muayenesi yaptırılır.",
        ],
        maddeler: [
          "Ekranı, üst kenarı göz hizasında veya biraz altında ve yaklaşık bir kol boyu uzaklıkta konumlandırın.",
          "Ekranı pencereye dik yerleştirerek yansıma ve parlamayı önleyin.",
          "Sırtınızı sandalyeye dayayın; ayaklarınız yere veya ayak desteğine tam bassın, dirsekleriniz yaklaşık dik açıda olsun.",
          "Klavye ve fareyi önünüzde, bileklerinizi bükmeden kullanabileceğiniz şekilde yerleştirin.",
          "Sık sık kısa molalar verin, uzağa bakarak gözlerinizi dinlendirin ve gerinme hareketleri yapın.",
        ],
      },
      {
        baslik: "Elektrik tehlikeleri",
        metin: [
          "Elektrik akımının vücuttan geçmesi kas kasılmalarına, solunumun durmasına, kalp ritim bozukluklarına ve yanıklara yol açabilir; kasılma nedeniyle kişi akım kaynağını bırakamayabilir. Etkinin ağırlığı; akımın şiddetine, vücutta izlediği yola ve temas süresine bağlıdır. Elektrik ayrıca yangınların sık görülen nedenlerindendir.",
          "Elektrik tesisatına yalnızca yetkili ve ehil kişiler müdahale eder. Elektrik çarpmasına karşı tesisatta topraklama ve kaçak akım rölesi bulunmalıdır; hayat koruma amaçlı kaçak akım rölelerinde açma akımı genellikle 30 mA'dır.",
        ],
        maddeler: [
          "Hasarlı kablo, fiş ve prizleri kullanmayın; bantla geçici onarım yapmayın, bildirin.",
          "Islak elle ya da ıslak zeminde elektrikli cihazlara dokunmayın.",
          "Prizleri çoklu uzatmalarla aşırı yüklemeyin; kabloları kapı aralarından ve geçiş yollarından geçirmeyin.",
          "Elektrik panolarını kapalı ve kilitli tutun; önlerine malzeme koymayın.",
          "Fişi kablodan çekerek değil, fişten tutarak çıkarın.",
          "Yüksek gerilim hatlarına ve kopmuş tellere yaklaşmayın.",
          "Elektrik çarpmasında önce akımı kesin; kesemiyorsanız kuru tahta gibi yalıtkan bir cisimle teması ayırın, yaralıya çıplak elle dokunmayın ve 112'yi arayın.",
        ],
      },
    ],
    onemli: [
      "Koruyucuları çıkarmak yasaktır; arızalı ekipmanı etiketleyip bildirin.",
      "Bakım öncesi: durdur, enerjiyi kes, kilitle, etiketle.",
      "Elektrik tesisatına yalnızca yetkili kişiler müdahale eder.",
      "Ekranın üst kenarı göz hizasında veya biraz altında, yaklaşık bir kol boyu uzakta olmalıdır.",
    ],
    sorular: [
      {
        soru: "Bir makinenin bakımına başlamadan önce yapılması gereken nedir?",
        secenekler: [
          "Makineyi çalışırken hızlıca temizlemek",
          "Makineyi durdurup enerjisini kesmek, kilitlemek ve etiketlemek",
          "Koruyucuları söküp yanına koymak",
          "Yalnızca amire haber vermek",
        ],
        dogru: 1,
        aciklama: "Bakım sırasında makinenin yanlışlıkla çalıştırılmasını önlemek için enerji kesilir, kilitlenir ve etiketlenir.",
      },
      {
        soru: "Kullandığınız uzatma kablosunun yalıtımında yırtık fark ettiniz. Doğru davranış hangisidir?",
        secenekler: [
          "Bantla sarıp kullanmaya devam etmek",
          "Kullanmayı bırakıp etiketlemek ve bildirmek",
          "Kabloyu halının altına almak",
          "Islak bezle silip kullanmak",
        ],
        dogru: 1,
        aciklama: "Hasarlı kablo elektrik çarpması ve yangın riski taşır; kullanılmamalı, yetkili kişiye bildirilmelidir.",
      },
      {
        soru: "Ekranlı araçla çalışırken ekranın konumu nasıl olmalıdır?",
        secenekler: [
          "Üst kenarı göz hizasında veya biraz altında, yaklaşık bir kol boyu uzakta",
          "Göz hizasının çok üstünde",
          "Arkası pencereye dönük, tam karşısında parlak ışık olacak şekilde",
          "Gözlere 10 santimetre uzaklıkta",
        ],
        dogru: 0,
        aciklama: "Bu konum boyun ve göz zorlanmasını azaltır; ekran pencereye dik yerleştirilerek yansıma önlenir.",
      },
    ],
  },

  // 10 --------------------------------------------------------------
  {
    id: "kkd-isaretler-tahliye",
    baslik: "KKD, Güvenlik ve Sağlık İşaretleri, Tahliye ve Kurtarma",
    sure_dk: 25,
    ozet:
      "Kişisel koruyucu donanımların seçimini ve kullanımını, güvenlik ve sağlık işaretlerinin renk ve şekil anlamlarını, acil durumlarda tahliye ve kurtarma kurallarını ve güvenlik kültürünü öğreneceksiniz.",
    bolumler: [
      {
        baslik: "Kişisel koruyucu donanım (KKD)",
        metin: [
          "Kişisel koruyucu donanım; çalışanı sağlık ve güvenliğini etkileyen risklere karşı korumak için giyilen, takılan veya tutulan donanımdır. KKD, riskler kaynağında yok edilemediğinde veya toplu koruma önlemleriyle yeterince azaltılamadığında kullanılır; yani son savunma hattıdır. KKD işveren tarafından ücretsiz sağlanır; çalışan da kendisine verilen donanımı doğru kullanmak ve korumakla yükümlüdür.",
          "KKD'nin CE işareti taşıması, işe ve kişiye uygun olması gerekir. Her kullanımdan önce kontrol edin; hasarlı, kullanım süresi dolmuş veya filtresi tükenmiş donanımı kullanmayın, değiştirilmesini isteyin. KKD'ler kişiye özeldir ve temiz, uygun koşullarda saklanmalıdır. Başlıca KKD türleri:",
        ],
        maddeler: [
          "Baş koruma: Baret — düşen cisimlere ve çarpmalara karşı.",
          "Göz ve yüz koruma: Koruyucu gözlük, yüz siperi, kaynak maskesi.",
          "Kulak koruma: Kulak tıkacı ve kulaklık (manşon).",
          "Solunum koruma: Toz maskesi, filtreli yarım veya tam yüz maskesi; oksijeni yetersiz ortamlarda hava beslemeli solunum cihazları.",
          "El koruma: İşe uygun (kesilmeye, kimyasala, ısıya dayanıklı) eldivenler.",
          "Ayak koruma: Çelik burunlu, kaymaz tabanlı iş ayakkabısı veya çizme.",
          "Vücut koruma: İş elbisesi, önlük, yüksek görünürlüklü (reflektörlü) yelek.",
          "Yüksekte çalışma: Tam vücut emniyet kemeri, şok emicili bağlantı halatı ve uygun ankraj noktası.",
        ],
      },
      {
        baslik: "Güvenlik ve sağlık işaretleri",
        metin: [
          "Güvenlik ve sağlık işaretleri, renk ve şekilleriyle tehlikeleri ve uyulması gereken kuralları dil bilmeye gerek bırakmadan anlatır. Renklerin ve şekillerin anlamları şöyledir:",
        ],
        maddeler: [
          "Kırmızı — Yasak, tehlike ve yangınla mücadele: Yasaklayıcı işaretler beyaz zemin üzerinde kırmızı çerçeveli ve çapraz çizgili dairedir (ör. “Sigara içilmez”). Yangın söndürücü, yangın dolabı gibi yangınla mücadele ekipmanlarının işaretleri kırmızı zemin üzerine beyaz semboldür. Kırmızı ayrıca dur, acil durdurma ve tahliye gibi tehlike durumlarını ifade eder.",
          "Sarı (veya turuncu) — Uyarı: Sarı zemin üzerinde siyah kenarlı üçgendir; “Dikkat, yüksek gerilim”, “Dikkat, kaygan zemin” gibi tehlikelere karşı uyarır.",
          "Mavi — Emredici (zorunluluk): Mavi zemin üzerinde beyaz sembollü dairedir; “Baret takınız”, “Kulak koruyucu kullanınız” gibi belirli bir davranışı zorunlu kılar.",
          "Yeşil — Acil kaçış ve ilk yardım: Yeşil zemin üzerinde beyaz sembollü dikdörtgen veya karedir; acil çıkışları, kaçış yönlerini, ilk yardım dolabını ve toplanma alanını gösterir. Güvenli durumu da ifade eder.",
        ],
      },
      {
        baslik: "Tahliye ve kurtarma",
        metin: [
          "Her işyerinde yangın, deprem, patlama, kimyasal yayılım gibi acil durumlar için hazırlanmış bir acil durum planı bulunur. Planda acil durum ekipleri, tahliye yolları, toplanma alanı ve iletişim bilgileri yer alır. Tahliye krokileri görünür yerlere asılır ve planın işe yaradığını sınamak için tatbikatlar yapılır. Çalışanlar, görevli oldukları ekibi ve bulundukları yerden en yakın çıkışa giden yolu bilmelidir. Tahliye sırasında:",
        ],
        maddeler: [
          "Alarmı duyduğunuzda sakin olun; çalıştığınız makineyi güvenli şekilde durdurun ve vakit kaybetmeden tahliyeye başlayın.",
          "Eşyalarınızı toplamak için zaman kaybetmeyin; asansör kullanmayın.",
          "Yeşil kaçış işaretlerini izleyin; koşmadan ve itişmeden ilerleyin.",
          "Yardıma ihtiyacı olanlara (engelli, yaralı, ziyaretçi) destek olun.",
          "Toplanma alanına gidin, yoklamaya katılın ve izin verilmeden binaya geri dönmeyin.",
          "Kurtarma işlerini yalnızca bu konuda eğitim almış ve görevlendirilmiş ekipler yapar; kapalı alan veya göçük gibi durumlarda donanımsız kurtarma girişimi yeni kazazedelere yol açar.",
        ],
      },
      {
        baslik: "Güvenlik kültürü",
        metin: [
          "Güvenlik kültürü; işyerinde herkesin güvenliği bir değer olarak benimsemesi, kimse görmese de kurallara uyması ve tehlikeleri çekinmeden bildirebilmesidir. “Bana bir şey olmaz” düşüncesi kazaların en önemli sebeplerinden biridir. Güvensiz bir durum veya davranış gördüğünüzde durdurun, düzeltin ya da bildirin. Unutmayın: İş sağlığı ve güvenliği işin bir parçasıdır, işe eklenen ayrı bir yük değildir.",
        ],
      },
    ],
    onemli: [
      "KKD son savunma hattıdır; ücretsiz sağlanır, doğru kullanmak çalışanın yükümlülüğüdür.",
      "Kırmızı yasak ve yangın, sarı uyarı, mavi zorunluluk, yeşil acil kaçış ve ilk yardım.",
      "Tahliyede asansör kullanılmaz; toplanma alanında yoklamaya katılın.",
      "Kurtarmayı yalnızca eğitimli ve görevli ekipler yapar.",
    ],
    sorular: [
      {
        soru: "Mavi zemin üzerinde beyaz sembollü, daire biçimli işaret ne anlatır?",
        secenekler: ["Yasak", "Uyarı", "Zorunluluk (emredici)", "Acil çıkış"],
        dogru: 2,
        aciklama: "Mavi daire emredici işarettir; “Baret takınız” gibi belirli bir davranışı zorunlu kılar.",
      },
      {
        soru: "Acil çıkış yönünü gösteren işaretler hangi renktedir?",
        secenekler: ["Kırmızı", "Sarı", "Mavi", "Yeşil"],
        dogru: 3,
        aciklama: "Acil kaçış ve ilk yardım işaretleri yeşil zemin üzerine beyaz semboldür.",
      },
      {
        soru: "Kişisel koruyucu donanım için hangisi doğrudur?",
        secenekler: [
          "Toplu koruma önlemlerinden önce gelir",
          "Bedeli çalışanın ücretinden kesilebilir",
          "Riskler başka yollarla yeterince azaltılamadığında kullanılan son savunma hattıdır",
          "Kullanımı isteğe bağlıdır",
        ],
        dogru: 2,
        aciklama: "KKD son çaredir; işveren tarafından ücretsiz sağlanır ve doğru kullanılması çalışanın yükümlülüğüdür.",
      },
    ],
  },
];

// ---------------------------------------------------------------- Bitirme sınavı (20 soru)

const SINAV: Soru[] = [
  {
    ders: "mevzuat",
    soru: "6331 sayılı İş Sağlığı ve Güvenliği Kanunu kimlere uygulanır?",
    secenekler: [
      "Yalnızca kamu sektöründe çalışanlara",
      "Yalnızca 50'den fazla çalışanı olan işyerlerine",
      "Kamu ve özel sektördeki bütün işlere ve çırak, stajyer dâhil tüm çalışanlara",
      "Yalnızca çok tehlikeli sınıftaki işyerlerine",
    ],
    dogru: 2,
    aciklama: "Kanun, sınırlı istisnalar dışında kamu ve özel sektöre ait bütün işlere ve çırak, stajyer dâhil tüm çalışanlara uygulanır.",
  },
  {
    ders: "mevzuat",
    soru: "Az tehlikeli sınıftaki bir işyerinde temel iş sağlığı ve güvenliği eğitimi en az kaç saattir?",
    secenekler: ["4 saat", "8 saat", "12 saat", "16 saat"],
    dogru: 1,
    aciklama: "Asgari süreler az tehlikeli sınıfta 8, tehlikeli sınıfta 12, çok tehlikeli sınıfta 16 saattir.",
  },
  {
    ders: "mevzuat",
    soru: "Tehlikeli sınıftaki işyerlerinde iş sağlığı ve güvenliği eğitimi en az hangi sıklıkta tekrarlanır?",
    secenekler: ["Yılda bir", "İki yılda bir", "Üç yılda bir", "Beş yılda bir"],
    dogru: 1,
    aciklama: "Tekrar sıklığı çok tehlikeli sınıfta yılda en az bir, tehlikeli sınıfta iki yılda en az bir, az tehlikeli sınıfta üç yılda en az bir kezdir.",
  },
  {
    ders: "hak-sorumluluk",
    soru: "Ciddi ve yakın tehlikenin önlenemez olduğu bir durumda çalışan ne yapmalıdır?",
    secenekler: [
      "Kurulun toplanmasını beklemelidir",
      "İşyerini veya tehlikeli bölgeyi terk ederek belirlenen güvenli yere gitmelidir",
      "Dilekçe verip çalışmaya devam etmelidir",
      "İşverenin yazılı onayını beklemelidir",
    ],
    dogru: 1,
    aciklama: "Kanun'un 13. maddesine göre önlenemez ciddi ve yakın tehlikede çalışan işyerini veya tehlikeli bölgeyi terk ederek güvenli yere gider ve bu yüzden hak kaybına uğramaz.",
  },
  {
    ders: "hak-sorumluluk",
    soru: "Bir makinenin koruyucu kapağı işinizi yavaşlatıyor. Doğru davranış hangisidir?",
    secenekler: [
      "Kapağı çıkarıp işi hızlandırmak",
      "Kapağı yerinde bırakıp durumu amirinize veya çalışan temsilcisine bildirmek",
      "Kapağı bantla açık tutmak",
      "Makineyi başka bir çalışana devretmek",
    ],
    dogru: 1,
    aciklama: "Kanun'un 19. maddesine göre çalışanlar güvenlik donanımlarını keyfî olarak çıkaramaz ve değiştiremez; sorunlar bildirilmelidir.",
  },
  {
    ders: "hak-sorumluluk",
    soru: "İşveren, iş sağlığı ve güvenliği hizmetini bir OSGB'den alıyor. Bu durumda hangisi doğrudur?",
    secenekler: [
      "İşverenin sorumluluğu tamamen OSGB'ye geçer",
      "İşverenin sorumluluğu ortadan kalkmaz",
      "Sorumluluk çalışanlara geçer",
      "Hiç kimse sorumlu tutulamaz",
    ],
    dogru: 1,
    aciklama: "İşverenin dışarıdaki uzman kişi ve kuruluşlardan hizmet alması, işverenin sorumluluklarını ortadan kaldırmaz.",
  },
  {
    ders: "temizlik-duzen",
    soru: "Aşağıdakilerden hangisi işyeri düzeni açısından yanlış bir uygulamadır?",
    secenekler: [
      "Acil çıkış kapısının önüne geçici olarak koli istiflemek",
      "Dökülen sıvıyı hemen temizlemek",
      "Ağır malzemeleri alt raflara koymak",
      "Tehlikeli atıkları ayrı ve etiketli kaplarda toplamak",
    ],
    dogru: 0,
    aciklama: "Acil çıkışların önü, kısa süreliğine bile olsa kapatılmamalıdır; acil durumda tahliyeyi engeller.",
  },
  {
    ders: "hukuki-sonuclar",
    soru: "Aşağıdakilerden hangisi 5510 sayılı Kanun'a göre iş kazası sayılır?",
    secenekler: [
      "Çalışanın hafta sonu evinde tamirat yaparken yaralanması",
      "İşverenin sağladığı servis aracıyla işe gelirken meydana gelen kaza",
      "Yıllık izindeyken tatilde geçirilen kaza",
      "Çalışanın kendi aracıyla alışverişe giderken geçirdiği kaza",
    ],
    dogru: 1,
    aciklama: "İşverence sağlanan bir taşıtla işin yapıldığı yere gidiş gelişi sırasında meydana gelen kaza iş kazası sayılır.",
  },
  {
    ders: "hukuki-sonuclar",
    soru: "İş kazası, kazadan sonra en geç hangi süre içinde SGK'ya bildirilmelidir?",
    secenekler: ["3 iş günü", "15 gün", "1 ay", "Bildirim gerekmez"],
    dogru: 0,
    aciklama: "İşveren iş kazasını kazadan sonraki 3 iş günü içinde SGK'ya bildirir.",
  },
  {
    ders: "hukuki-sonuclar",
    soru: "İş kazası geçiren sigortalıya SGK tarafından sağlanan yardımlardan biri hangisidir?",
    secenekler: ["Kıdem tazminatı", "Geçici iş göremezlik ödeneği", "İhbar tazminatı", "Yıllık izin ücreti"],
    dogru: 1,
    aciklama: "İş kazası sonrası tedavi süresince çalışamayan sigortalıya SGK geçici iş göremezlik ödeneği öder.",
  },
  {
    ders: "meslek-hastaliklari",
    soru: "Gürültülü bir işyerinde korunmasız olarak uzun yıllar çalışmanın en tipik sonucu hangisidir?",
    secenekler: ["Kalıcı işitme kaybı", "Bruselloz", "Silikozis", "Kurşun zehirlenmesi"],
    dogru: 0,
    aciklama: "Gürültüye bağlı işitme kaybı geri dönüşü olmayan bir meslek hastalığıdır.",
  },
  {
    ders: "meslek-hastaliklari",
    soru: "Kan yoluyla bulaşan enfeksiyonlardan korunmada hangisi doğru bir uygulamadır?",
    secenekler: [
      "Kullanılmış iğnenin kapağını geri takmak",
      "Kesici-delici atıkları normal çöpe atmak",
      "Hepatit B aşısı olmak ve kesici-delici atık kutusu kullanmak",
      "Eldiveni yalnızca kirlendikten sonra giymek",
    ],
    dogru: 2,
    aciklama: "Aşılama ve kesici-delici atık kutusu kullanımı temel önlemlerdir; kullanılmış iğnenin kapağı geri takılmaz.",
  },
  {
    ders: "ilk-yardim",
    soru: "112'yi aradığınızda aşağıdakilerden hangisini yapmamalısınız?",
    secenekler: [
      "Olay yerinin açık adresini vermek",
      "Yaralı sayısını ve durumunu bildirmek",
      "Görevli söylemeden telefonu kapatmak",
      "Soruları sakin bir şekilde yanıtlamak",
    ],
    dogru: 2,
    aciklama: "Görevlinin ek sorular sorabilmesi ve yönlendirme yapabilmesi için telefon, görevli söylemeden kapatılmaz.",
  },
  {
    ders: "ilk-yardim",
    soru: "Olay yerinde ilk yardımcının ilk önceliği nedir?",
    secenekler: [
      "Yaralıyı hemen bir araca taşımak",
      "Kendi güvenliğini ve olay yerinin güvenliğini sağlamak",
      "Yaralıya su içirmek",
      "Olay yerinin fotoğrafını çekmek",
    ],
    dogru: 1,
    aciklama: "İlk adım korumadır: İlk yardımcı önce kendi güvenliğini ve olay yerinin güvenliğini sağlar, böylece kazazede sayısı artmaz.",
  },
  {
    ders: "risk-etmenleri",
    soru: "Kimyasal madde kullanımında hangisi doğrudur?",
    secenekler: [
      "Kimyasalı boş su şişesine aktarmak",
      "Etiketsiz kaptaki maddeyi koklayarak tanımaya çalışmak",
      "Kullanmadan önce etiketi ve güvenlik bilgi formunu okumak",
      "Kimyasalla çalışırken yemek yemek",
    ],
    dogru: 2,
    aciklama: "Etiket ve güvenlik bilgi formu; maddenin tehlikelerini, güvenli kullanımını, gereken KKD'yi ve ilk yardım bilgilerini gösterir.",
  },
  {
    ders: "risk-etmenleri",
    soru: "Gürültüde, kulak koruyucunun etkisi de hesaba katıldığında aşılmaması gereken günlük maruziyet sınır değeri kaçtır?",
    secenekler: ["80 dB(A)", "85 dB(A)", "87 dB(A)", "100 dB(A)"],
    dogru: 2,
    aciklama: "80 dB(A) en düşük, 85 dB(A) en yüksek maruziyet eylem değeridir; 87 dB(A) ise aşılamayacak maruziyet sınır değeridir.",
  },
  {
    ders: "yangin",
    soru: "Yanmanın gerçekleşmesi için bir arada bulunması gereken üç unsur hangisidir?",
    secenekler: ["Su, toprak ve hava", "Yanıcı madde, oksijen ve ısı", "Duman, alev ve kor", "Elektrik, gaz ve metal"],
    dogru: 1,
    aciklama: "Yangın üçgeni yanıcı madde, oksijen ve ısıdan oluşur; biri ortadan kaldırılınca yangın söner.",
  },
  {
    ders: "yangin",
    soru: "Doğal gaz ve LPG yangınları hangi yangın sınıfındadır?",
    secenekler: ["A sınıfı", "B sınıfı", "C sınıfı", "F sınıfı"],
    dogru: 2,
    aciklama: "C sınıfı gaz yangınlarıdır; doğal gaz, LPG, asetilen ve hidrojen yangınları bu sınıftadır.",
  },
  {
    ders: "ekipman-elektrik",
    soru: "Elektrik çarpmasına maruz kalan birine yardım ederken ilk adım hangisidir?",
    secenekler: [
      "Çıplak elle tutup çekmek",
      "Akımı kesmek; kesilemiyorsa kuru, yalıtkan bir cisimle teması ayırmak",
      "Üzerine su dökmek",
      "Yaralıya hemen su içirmek",
    ],
    dogru: 1,
    aciklama: "Akım kesilmeden yaralıya dokunulmaz; kesilemiyorsa kuru tahta gibi yalıtkan bir cisim kullanılır ve 112 aranır.",
  },
  {
    ders: "kkd-isaretler-tahliye",
    soru: "Sarı zemin üzerinde siyah kenarlı üçgen biçimli işaret ne anlama gelir?",
    secenekler: ["Yasak", "Uyarı (dikkat, tehlike)", "Zorunluluk", "İlk yardım"],
    dogru: 1,
    aciklama: "Sarı üçgen uyarı işaretidir; kırmızı daire yasak, mavi daire zorunluluk, yeşil dikdörtgen acil kaçış ve ilk yardım anlamına gelir.",
  },
];

// ---------------------------------------------------------------- Kurslar

export const KURSLAR: Kurs[] = [
  {
    id: "temel-isg",
    baslik: "Temel İş Sağlığı ve Güvenliği Eğitimi",
    aciklama:
      "Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında Yönetmelik'teki konu başlıklarını izleyen; mevzuat, sağlık ve teknik konuları kapsayan çevrim içi temel eğitim. Her dersin sonunda pekiştirme soruları, en sonda 20 soruluk bitirme sınavı ve katılım belgesi vardır.",
    sure_saat: 4,
    hedef_kitle: "Tüm çalışanlar, işe yeni başlayanlar, stajyerler ve iş sağlığı ve güvenliğine giriş yapmak isteyenler",
    dersler: DERSLER,
    sinav: SINAV,
    gecme_notu: 70,
  },
];

export function kursBul(id: string | null | undefined): Kurs | undefined {
  return KURSLAR.find((k) => k.id === id);
}
