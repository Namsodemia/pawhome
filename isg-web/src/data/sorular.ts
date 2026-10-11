/**
 * Yerleşik İSG uzmanlığı (A/B/C) soru bankası — İSGUZEM ders sırasını izler.
 * Şema mobil uygulamadaki sorular.json ile aynıdır: Ders { sira, ad, on, son }, Soru { s, c, d } (d = doğru şık indeksi).
 * Kullanıcı kendi bankasını (sorular.json) Sınav sayfasından içe aktarabilir; o durumda bu banka devre dışı kalır.
 * Cevaplar 6331 sayılı Kanun ve ilgili yönetmeliklerin güncel hâline göre hazırlanmıştır.
 */

export type Soru = { s: string; c: string[]; d: number };
export type Ders = { sira: number; ad: string; on: Soru[]; son: Soru[] };

const q = (s: string, c: string[], d: number): Soru => ({ s, c, d });

export const DERSLER: Ders[] = [
  // ------------------------------------------------------------------ 1
  {
    sira: 1,
    ad: "Açılış, Tanışma, Programın Tanıtımı ve Ön Test Uygulaması",
    on: [
      q(
        "İş sağlığı ve güvenliğinin temel amacı aşağıdakilerden hangisidir?",
        [
          "Çalışanların sağlığını ve güvenliğini korumak, iş kazası ve meslek hastalıklarını önlemek",
          "Yalnızca üretim miktarını artırmak",
          "İşverenin vergi yükünü azaltmak",
          "Çalışma saatlerini uzatmak",
          "Sadece makinelerin bakım maliyetini düşürmek",
        ],
        0,
      ),
      q(
        "Türkiye'de iş sağlığı ve güvenliğini düzenleyen temel kanun hangisidir?",
        [
          "4857 sayılı İş Kanunu",
          "6331 sayılı İş Sağlığı ve Güvenliği Kanunu",
          "5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu",
          "6098 sayılı Türk Borçlar Kanunu",
          "2918 sayılı Karayolları Trafik Kanunu",
        ],
        1,
      ),
      q(
        "İşyerinde var olan ya da dışarıdan gelebilecek, çalışanı veya işyerini etkileyebilecek zarar veya hasar verme potansiyeline ne ad verilir?",
        ["Risk", "Ramak kala", "Tehlike", "Önleme", "Kaza"],
        2,
      ),
      q(
        "Aşağıdakilerden hangisi bir iş kazası örneğidir?",
        [
          "Çalışanın işyerinde merdivenden düşerek bileğini kırması",
          "Çalışanın evinde yemek yaparken elini kesmesi",
          "Çalışanın hafta sonu tatilinde denizde boğulma tehlikesi geçirmesi",
          "Çalışanın yıllık izindeyken grip olması",
          "Çalışanın kendi düğününde ayağını burkması",
        ],
        0,
      ),
      q(
        "Aşağıdakilerden hangisi kişisel koruyucu donanım (KKD) örneğidir?",
        ["Makine koruyucu kapağı", "Genel havalandırma sistemi", "Baret", "Yangın alarm butonu", "Acil çıkış levhası"],
        2,
      ),
    ],
    son: [
      q(
        "6331 sayılı İş Sağlığı ve Güvenliği Kanunu aşağıdaki tarihlerden hangisinde Resmî Gazete'de yayımlanmıştır?",
        ["30.06.2012", "10.06.2003", "29.12.2012", "01.01.2013", "20.06.2012"],
        0,
      ),
      q(
        "6331 sayılı Kanun'a göre işyerleri hangi tehlike sınıflarına ayrılır?",
        ["Düşük, orta, yüksek", "Az tehlikeli, tehlikeli, çok tehlikeli", "A, B, C", "Birinci, ikinci, üçüncü derece", "Güvenli, riskli, yasaklı"],
        1,
      ),
      q(
        "İş güvenliği uzmanlığı belgesi sınıflarından hangisi bütün tehlike sınıflarındaki işyerlerinde görev yapma yetkisi verir?",
        ["C sınıfı", "B sınıfı", "A sınıfı", "D sınıfı", "Teknik eleman belgesi"],
        2,
      ),
      q(
        "C sınıfı iş güvenliği uzmanlığı belgesine sahip bir uzman hangi tehlike sınıfındaki işyerlerinde görev yapabilir?",
        ["Yalnızca az tehlikeli", "Yalnızca tehlikeli", "Tehlikeli ve çok tehlikeli", "Bütün tehlike sınıfları", "Yalnızca çok tehlikeli"],
        0,
      ),
      q(
        "İşyerinde meydana gelen; çalışan, işyeri ya da iş ekipmanını zarara uğratma potansiyeli olduğu hâlde zarara uğratmayan olaya ne ad verilir?",
        ["İş kazası", "Meslek hastalığı", "Ramak kala olay", "Tehlike", "Acil durum"],
        2,
      ),
      q(
        "Tehlikeden kaynaklanacak kayıp, yaralanma ya da başka zararlı sonuç meydana gelme ihtimaline ne ad verilir?",
        ["Tehlike", "Risk", "Önleme", "Kaza", "Maruziyet"],
        1,
      ),
      q(
        "İş sağlığı ve güvenliği tedbirlerinin maliyeti ile ilgili aşağıdakilerden hangisi doğrudur?",
        [
          "Maliyet çalışanlarla yarı yarıya paylaşılır",
          "Maliyet çalışanların ücretinden kesilebilir",
          "İşveren bu maliyeti çalışanlara yansıtamaz",
          "Maliyeti SGK karşılar",
          "Maliyeti çalışan temsilcisi karşılar",
        ],
        2,
      ),
      q(
        "İş güvenliği uzmanı ve işyeri hekimlerinin işyerleriyle yaptıkları sözleşmelerin kayıt altına alındığı elektronik sistemin adı nedir?",
        ["e-Nabız", "İSG-KATİP", "MERNİS", "UYAP", "KEP"],
        1,
      ),
      q(
        "Aşağıdakilerden hangisi toplu koruma önlemine örnektir?",
        ["Kulak tıkacı", "Koruyucu gözlük", "Tam vücut emniyet kemeri", "Döşeme kenarına korkuluk yapılması", "İş eldiveni"],
        3,
      ),
      q(
        "6331 sayılı Kanun'a göre iş güvenliği uzmanı ve işyeri hekimi görevlendirme yükümlülüğü kime aittir?",
        ["İşverene", "Çalışan temsilcisine", "SGK'ya", "Belediyeye", "Çalışanlara"],
        0,
      ),
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    sira: 2,
    ad: "İş Sağlığı ve Güvenliğinin Kavram ve Kurallarının Gelişimi",
    on: [
      q(
        "1700 yılında meslek hastalıklarını anlatan 'De Morbis Artificum Diatriba' adlı eseri yazan ve 'iş hekimliğinin babası' kabul edilen bilim insanı kimdir?",
        ["Hipokrat", "Bernardino Ramazzini", "Georgius Agricola", "Paracelsus", "Percivall Pott"],
        1,
      ),
      q("Sanayi Devrimi ilk olarak hangi ülkede başlamıştır?", ["Fransa", "Almanya", "İngiltere", "Amerika Birleşik Devletleri", "İtalya"], 2),
      q(
        "Baca temizleyicilerinde görülen skrotum kanserini 1775 yılında mesleki kökenli bir hastalık olarak tanımlayan hekim kimdir?",
        ["Percivall Pott", "Bernardino Ramazzini", "Hipokrat", "Herbert Heinrich", "Yaşlı Plinius"],
        0,
      ),
      q(
        "Madencilik üzerine yazdığı 'De Re Metallica' adlı eserinde madencilerin hastalıklarından söz eden bilim insanı kimdir?",
        ["Galen", "Georgius Agricola", "Robert Owen", "Herbert Heinrich", "Frank Bird"],
        1,
      ),
      q(
        "Osmanlı döneminde Ereğli kömür havzasındaki maden işçilerinin çalışma koşullarını düzenleyen 1865 tarihli düzenleme hangisidir?",
        ["Maadin Nizamnamesi", "Dilaver Paşa Nizamnamesi", "Umumi Hıfzıssıhha Kanunu", "Tatil-i Eşgal Kanunu", "Mecelle"],
        1,
      ),
    ],
    son: [
      q("Türkiye Cumhuriyeti'nin ilk iş kanunu olan 3008 sayılı İş Kanunu hangi yıl kabul edilmiştir?", ["1923", "1930", "1936", "1950", "1971"], 2),
      q("1593 sayılı Umumi Hıfzıssıhha Kanunu hangi yıl kabul edilmiştir?", ["1924", "1930", "1936", "1946", "1961"], 1),
      q(
        "Aşağıdaki kanunlardan hangisi en yeni tarihlidir?",
        ["3008 sayılı İş Kanunu", "1475 sayılı İş Kanunu", "4857 sayılı İş Kanunu", "5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu", "6331 sayılı İş Sağlığı ve Güvenliği Kanunu"],
        4,
      ),
      q(
        "Heinrich'in kaza piramidine (1-29-300) göre 1 ağır yaralanmalı kazaya karşılık kaç adet yaralanmasız olay meydana gelir?",
        ["10", "29", "30", "300", "600"],
        3,
      ),
      q("Heinrich'e göre kazaların yaklaşık yüzde kaçı güvensiz davranışlardan kaynaklanır?", ["2", "10", "50", "88", "98"], 3),
      q(
        "Heinrich'in kazaların oluşumunu birbirini izleyen faktörlerle açıkladığı teori hangisidir?",
        ["İsviçre peyniri modeli", "Domino teorisi", "Buzdağı modeli", "Balık kılçığı modeli", "Enerji transferi teorisi"],
        1,
      ),
      q("Frank Bird'ün kaza üçgenine (1-10-30-600) göre 1 ciddi yaralanmaya karşılık kaç ramak kala olay vardır?", ["29", "30", "300", "600", "1000"], 3),
      q(
        "Tehlike ve risk kavramları ile ilgili aşağıdakilerden hangisi doğrudur?",
        [
          "Islak ve kaygan zemin bir tehlikedir; bu zeminde kayıp düşme ihtimali ise risktir",
          "Risk ve tehlike aynı anlama gelir",
          "Risk, zarar verme potansiyelinin kendisidir",
          "Tehlike ancak kaza olduktan sonra ortaya çıkar",
          "Risk yalnızca makinelerle ilgilidir",
        ],
        0,
      ),
      q(
        "İngiltere'de fabrika müfettişliği sistemini ilk kez getiren düzenleme hangisidir?",
        ["1802 Çırakların Sağlığı ve Ahlakı Yasası", "1833 Fabrikalar Yasası (Factory Act)", "1974 İşyerinde Sağlık ve Güvenlik Yasası", "1970 ABD İSG Yasası", "1919 Versay Antlaşması"],
        1,
      ),
      q(
        "Dünya Sağlık Örgütü'ne (WHO) göre 'sağlık' nasıl tanımlanır?",
        [
          "Yalnızca hastalık veya sakatlığın olmaması",
          "Bedensel, ruhsal ve sosyal yönden tam bir iyilik hâli",
          "Sadece bedensel olarak güçlü olmak",
          "Düzenli olarak muayene olmak",
          "İş göremezlik raporunun bulunmaması",
        ],
        1,
      ),
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    sira: 3,
    ad: "İş Sağlığı ve Güvenliğine Genel Bakış ve Güvenlik Kültürü",
    on: [
      q(
        "Aşağıdakilerden hangisi güvensiz davranışa örnektir?",
        ["Koruyucusu sökülmüş taşlama makinesi", "Yetersiz aydınlatma", "Çalışanın şantiyede baret takmadan çalışması", "Kaygan zemin", "Arızalı elektrik prizi"],
        2,
      ),
      q(
        "Aşağıdakilerden hangisi güvensiz duruma (koşula) örnektir?",
        ["Talimatlara uymamak", "Koruyucusu olmayan dişli mekanizması", "Yetkisiz olarak makine kullanmak", "İş başında şakalaşmak", "KKD kullanmamak"],
        1,
      ),
      q(
        "Aşağıdakilerden hangisi iş sağlığı ve güvenliğinin temel amaçları arasında yer almaz?",
        ["Çalışanları korumak", "Üretim güvenliğini sağlamak", "İşletme güvenliğini sağlamak", "Çalışanların ücretlerini belirlemek", "İş kazası ve meslek hastalıklarını önlemek"],
        3,
      ),
      q(
        "'Güvenlik kültürü' kavramı ilk kez hangi kazanın ardından Uluslararası Atom Enerjisi Ajansı (IAEA) raporlarında kullanılmıştır?",
        ["Bhopal (1984)", "Çernobil (1986)", "Seveso (1976)", "Piper Alpha (1988)", "Flixborough (1974)"],
        1,
      ),
      q(
        "Proaktif (önleyici) iş güvenliği yaklaşımı için aşağıdakilerden hangisi doğrudur?",
        [
          "Kaza olduktan sonra önlem alınır",
          "Tehlikeler kaza meydana gelmeden belirlenir ve önlem alınır",
          "Sadece kaza istatistiklerine bakılır",
          "Önlem almak yalnızca çalışanların sorumluluğundadır",
          "Yalnızca ceza uygulanır",
        ],
        1,
      ),
    ],
    son: [
      q(
        "James Reason'ın kazaları, savunma katmanlarındaki zayıflıkların (deliklerin) üst üste gelmesiyle açıkladığı model hangisidir?",
        ["Domino modeli", "İsviçre peyniri modeli", "Buzdağı modeli", "Kaza piramidi", "Hata ağacı"],
        1,
      ),
      q(
        "Hudson'ın güvenlik kültürü olgunluk merdiveninde en üst basamak hangisidir?",
        ["Patolojik", "Reaktif", "Hesapçı (bürokratik)", "Proaktif", "Üretken (yaratıcı)"],
        4,
      ),
      q(
        "Aşağıdakilerden hangisi güçlü bir güvenlik kültürünün göstergesidir?",
        [
          "Ramak kala olaylarının bildirilmesinin teşvik edilmesi",
          "Kaza bildiren çalışanların cezalandırılması",
          "Güvenliğin yalnızca uzmanın işi olarak görülmesi",
          "Üretim baskısıyla kuralların esnetilmesi",
          "Kazaların kayda geçirilmemesi",
        ],
        0,
      ),
      q(
        "İş kazalarının maliyetini anlatan 'buzdağı' modeline göre aşağıdakilerden hangisi doğrudur?",
        [
          "Doğrudan maliyetler her zaman dolaylı maliyetlerden büyüktür",
          "Görünmeyen dolaylı maliyetler genellikle doğrudan maliyetlerden çok daha fazladır",
          "Kazanın maliyeti yalnızca tedavi giderinden oluşur",
          "İş kazalarının dolaylı maliyeti yoktur",
          "Kazanın tüm maliyetini SGK karşılar",
        ],
        1,
      ),
      q(
        "Aşağıdakilerden hangisi öncü (proaktif) bir İSG performans göstergesidir?",
        ["Kayıp iş günü sayısı", "Ölümlü kaza sayısı", "Yapılan saha denetimi ve ramak kala bildirimi sayısı", "Meslek hastalığı vaka sayısı", "Ödenen tazminat tutarı"],
        2,
      ),
      q("İş sağlığı ve güvenliği yönetim sistemleri için uluslararası standart hangisidir?", ["ISO 9001", "ISO 14001", "ISO 45001", "ISO 27001", "ISO 22000"], 2),
      q("Planla – Uygula – Kontrol et – Önlem al (PUKÖ) döngüsü kimin adıyla da anılır?", ["Deming", "Heinrich", "Bird", "Reason", "Taylor"], 0),
      q(
        "Bir işyerinde güvenlik kültürünün oluşturulmasında en belirleyici unsur aşağıdakilerden hangisidir?",
        ["Üst yönetimin liderliği ve kararlılığı", "Yalnızca uyarı levhalarının sayısı", "Cezaların artırılması", "Sadece KKD dağıtılması", "Denetimlerin kaldırılması"],
        0,
      ),
      q(
        "6331 sayılı Kanun'a göre 'önleme' kavramı neyi ifade eder?",
        [
          "Kaza sonrası tazminat ödenmesini",
          "İşyerinde yürütülen işlerin bütün safhalarında İSG ile ilgili riskleri ortadan kaldırmak veya azaltmak için planlanan ve alınan tedbirlerin tümünü",
          "Yalnızca KKD dağıtımını",
          "Çalışanlara ceza verilmesini",
          "İşyerinin kapatılmasını",
        ],
        1,
      ),
      q(
        "Davranış odaklı güvenlik yaklaşımının temel odağı aşağıdakilerden hangisidir?",
        [
          "Makinelerin yenilenmesi",
          "Çalışanların güvenli ve güvensiz davranışlarının gözlemlenip geri bildirimle iyileştirilmesi",
          "Sigorta primlerinin düşürülmesi",
          "Bina tasarımı",
          "Yasal cezaların artırılması",
        ],
        1,
      ),
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    sira: 4,
    ad: "Türkiye'de ve Dünyada İş Sağlığı ve Güvenliği",
    on: [
      q("Uluslararası Çalışma Örgütü (ILO) hangi yıl kurulmuştur?", ["1919", "1932", "1945", "1948", "1957"], 0),
      q("Türkiye ILO'ya hangi yıl üye olmuştur?", ["1919", "1923", "1932", "1946", "1952"], 2),
      q("Dünya İş Sağlığı ve Güvenliği Günü her yıl hangi tarihte anılır?", ["1 Mayıs", "28 Nisan", "7 Nisan", "10 Aralık", "13 Mayıs"], 1),
      q(
        "ILO'nun karar organlarında temsil edilen üç taraf aşağıdakilerden hangisidir?",
        ["Hükümet, işveren ve işçi temsilcileri", "Hükümet, belediye ve üniversite", "İşveren, banka ve sigorta şirketi", "Sendika, baro ve tabip odası", "Bakanlık, valilik ve kaymakamlık"],
        0,
      ),
      q("13 Mayıs 2014'te 301 madencinin hayatını kaybettiği maden kazası hangi ilçede meydana gelmiştir?", ["Ermenek", "Zonguldak", "Soma", "Amasra", "Kozlu"], 2),
    ],
    son: [
      q(
        "ILO'nun 155 sayılı sözleşmesinin konusu aşağıdakilerden hangisidir?",
        ["İş Sağlığı ve Güvenliği ve Çalışma Ortamı", "İşyeri Sağlık Hizmetleri", "Yapı İşlerinde Güvenlik ve Sağlık", "Madenlerde Güvenlik ve Sağlık", "Asbest Kullanımında Güvenlik"],
        0,
      ),
      q(
        "ILO'nun 161 sayılı sözleşmesinin konusu aşağıdakilerden hangisidir?",
        ["Kimyasallar", "İşyeri Sağlık Hizmetleri", "Tarımda Güvenlik ve Sağlık", "Büyük Endüstriyel Kazaların Önlenmesi", "Çocuk İşçiliği"],
        1,
      ),
      q(
        "6331 sayılı Kanun'un hazırlanmasında esas alınan Avrupa Birliği çerçeve direktifi hangisidir?",
        ["89/391/EEC", "2006/42/EC", "2014/35/EU", "2012/18/EU", "92/57/EEC"],
        0,
      ),
      q("Avrupa İş Sağlığı ve Güvenliği Ajansı (EU-OSHA) hangi şehirdedir?", ["Brüksel", "Cenevre", "Bilbao", "Lüksemburg", "Strazburg"], 2),
      q("ILO'nun genel merkezi hangi şehirdedir?", ["New York", "Paris", "Cenevre", "Viyana", "Roma"], 2),
      q(
        "Türkiye'de işyeri ortam ölçümleri, laboratuvar analizleri ve İSG araştırmaları yapan kamu kurumu hangisidir?",
        ["İSGÜM (İş Sağlığı ve Güvenliği Araştırma ve Geliştirme Enstitüsü)", "TÜİK", "TSE", "AFAD", "TÜBİTAK"],
        0,
      ),
      q(
        "Türkiye'de iş sağlığı ve güvenliği yönünden teftiş yetkisi kime aittir?",
        ["Belediye zabıtası", "Çalışma ve Sosyal Güvenlik Bakanlığı iş müfettişleri", "Emniyet müdürlüğü", "Ticaret odası", "İşyeri hekimi"],
        1,
      ),
      q(
        "1984 yılında Hindistan'da metil izosiyanat gazı sızıntısıyla binlerce kişinin öldüğü endüstriyel kaza hangisidir?",
        ["Seveso", "Bhopal", "Çernobil", "Flixborough", "Piper Alpha"],
        1,
      ),
      q(
        "Büyük endüstriyel kazaların önlenmesine yönelik AB direktiflerine adını veren, 1976'da İtalya'da dioksin salınımıyla sonuçlanan kaza hangisidir?",
        ["Seveso", "Bhopal", "Toulouse", "Enschede", "Buncefield"],
        0,
      ),
      q("ABD'de iş sağlığı ve güvenliği alanında düzenleme ve denetim yapan federal kurum hangisidir?", ["OSHA", "HSE", "EU-OSHA", "ISO", "WHO"], 0),
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    sira: 5,
    ad: "Temel Hukuk",
    on: [
      q("Normlar hiyerarşisinde en üstte yer alan hukuk kuralı hangisidir?", ["Kanun", "Yönetmelik", "Anayasa", "Genelge", "Tebliğ"], 2),
      q(
        "Hukuk kurallarını ahlak, din ve görgü kurallarından ayıran temel özellik nedir?",
        ["Yazılı olması", "Devlet gücüyle desteklenen maddi yaptırımının bulunması", "Toplumda kabul görmesi", "Herkes tarafından bilinmesi", "Hiç değişmemesi"],
        1,
      ),
      q("Türk Medeni Kanunu'na göre kişi kaç yaşını doldurmakla ergin olur?", ["15", "16", "18", "21", "25"], 2),
      q("Aşağıdakilerden hangisi bir kamu hukuku dalıdır?", ["Borçlar hukuku", "Ceza hukuku", "Ticaret hukuku", "Aile hukuku", "Eşya hukuku"], 1),
      q("Kanunlar hangi yayın organında yayımlanır?", ["Resmî Gazete", "Bakanlık internet sitesi", "Yerel gazeteler", "TBMM tutanak dergisi", "Danıştay dergisi"], 0),
    ],
    son: [
      q("Anayasa'ya göre Cumhurbaşkanı, TBMM'ce kabul edilen kanunları kaç gün içinde yayımlar?", ["7", "10", "15", "30", "60"], 2),
      q(
        "Cumhurbaşkanlığı, bakanlıklar ve kamu tüzel kişilerinin, kanunların uygulanmasını sağlamak amacıyla çıkardığı düzenleyici işlemlere ne ad verilir?",
        ["Kanun", "Yönetmelik", "Anayasa", "Mahkeme kararı", "Örf ve âdet"],
        1,
      ),
      q(
        "Hukukun yardımcı kaynakları aşağıdakilerden hangisidir?",
        ["Anayasa ve kanunlar", "Yönetmelikler", "Yargı kararları ve bilimsel görüşler (doktrin)", "Cumhurbaşkanlığı kararnameleri", "Örf ve âdet hukuku"],
        2,
      ),
      q(
        "Türk Medeni Kanunu'na göre kişilik ne zaman başlar?",
        ["Ergin olunca", "Nüfusa kaydedilince", "Çocuğun sağ olarak tamamıyla doğduğu anda", "Okula başlayınca", "Ayırt etme gücüne sahip olunca"],
        2,
      ),
      q(
        "Türk Medeni Kanunu'na göre hak ehliyeti ile ilgili aşağıdakilerden hangisi doğrudur?",
        ["Sadece ergin kişilerin hak ehliyeti vardır", "Her insanın hak ehliyeti vardır", "Hak ehliyeti 18 yaşında başlar", "Kısıtlıların hak ehliyeti yoktur", "Tüzel kişilerin hak ehliyeti olamaz"],
        1,
      ),
      q("Aşağıdakilerden hangisi tüzel kişiliğe sahiptir?", ["Dernek", "Adi ortaklık", "Aile", "Apartman yöneticisi", "Miras ortaklığı"], 0),
      q("Aşağıdakilerden hangisi hukuki bir yaptırım değildir?", ["Ceza", "Tazminat", "Cebri icra", "İptal", "Toplum tarafından ayıplanma"], 4),
      q(
        "Anayasa'nın 'Çalışma şartları ve dinlenme hakkı' başlıklı 50. maddesine göre aşağıdakilerden hangisi doğrudur?",
        [
          "Kimse yaşına, cinsiyetine ve gücüne uygun olmayan işlerde çalıştırılamaz",
          "Dinlenme hakkı yalnızca kamu çalışanlarına aittir",
          "Küçükler her işte çalıştırılabilir",
          "Çalışma şartlarını yalnızca işveren belirler",
          "Dinlenmek bir hak değil, ayrıcalıktır",
        ],
        0,
      ),
      q(
        "Anayasa'nın 17. maddesindeki 'Herkes, yaşama, maddî ve manevî varlığını koruma ve geliştirme hakkına sahiptir' hükmü hangi başlık altında yer alır?",
        ["Mülkiyet hakkı", "Kişinin dokunulmazlığı, maddî ve manevî varlığı", "Yerleşme ve seyahat hürriyeti", "Sendika kurma hakkı", "Eğitim ve öğrenim hakkı"],
        1,
      ),
      q(
        "Türk Medeni Kanunu'na göre fiil ehliyetine sahip olmanın koşulları hangisinde doğru verilmiştir?",
        ["Ayırt etme gücüne sahip olmak, ergin olmak ve kısıtlı olmamak", "Yalnızca 18 yaşını doldurmuş olmak", "Türk vatandaşı olmak", "Yükseköğrenim mezunu olmak", "Evli olmak"],
        0,
      ),
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    sira: 6,
    ad: "İş Hukuku",
    on: [
      q("4857 sayılı İş Kanunu'na göre haftalık normal çalışma süresi en çok kaç saattir?", ["40", "42", "45", "48", "50"], 2),
      q("4857 sayılı İş Kanunu'na göre bir iş sözleşmesine dayanarak çalışan gerçek kişiye ne ad verilir?", ["İşveren", "İşveren vekili", "İşçi", "Alt işveren", "Memur"], 2),
      q("4857 sayılı İş Kanunu hangi yıl Resmî Gazete'de yayımlanmıştır?", ["1971", "1999", "2003", "2008", "2012"], 2),
      q(
        "4857 sayılı İş Kanunu'na göre hizmet süresi 1 yıldan 5 yıla kadar (5 yıl dâhil) olan işçiye verilecek yıllık ücretli izin süresi en az kaç gündür?",
        ["10", "14", "20", "26", "30"],
        1,
      ),
      q(
        "4857 sayılı İş Kanunu'na göre fazla çalışmanın her bir saati için ücret, normal saat ücretinin yüzde kaç yükseltilmesiyle ödenir?",
        ["%25", "%50", "%75", "%100", "%150"],
        1,
      ),
    ],
    son: [
      q("Hizmet süresi 15 yıl ve daha fazla olan işçiye verilecek yıllık ücretli izin süresi en az kaç gündür?", ["14", "18", "20", "24", "26"], 4),
      q(
        "18 ve daha küçük yaştaki işçilerle 50 ve daha yukarı yaştaki işçilere verilecek yıllık ücretli izin süresi en az kaç gündür?",
        ["14", "18", "20", "24", "26"],
        2,
      ),
      q("4857 sayılı İş Kanunu'na göre işçilerin gece çalışmaları kural olarak kaç saati geçemez?", ["6", "7", "7,5", "8", "11"], 2),
      q("4857 sayılı İş Kanunu'na göre bir yıldaki toplam fazla çalışma süresi en çok kaç saat olabilir?", ["180", "200", "250", "270", "300"], 3),
      q("Günlük çalışma süresi 7,5 saatten fazla olan işlerde verilmesi gereken ara dinlenmesi en az ne kadardır?", ["15 dakika", "30 dakika", "45 dakika", "1 saat", "2 saat"], 3),
      q(
        "4857 sayılı İş Kanunu'na göre iş sözleşmesine konulabilecek deneme süresi (toplu iş sözleşmeleri hariç) en çok ne kadardır?",
        ["15 gün", "1 ay", "2 ay", "4 ay", "6 ay"],
        2,
      ),
      q(
        "İşi 6 aydan az sürmüş işçinin belirsiz süreli iş sözleşmesinin feshinde uyulması gereken bildirim (ihbar) süresi ne kadardır?",
        ["1 hafta", "2 hafta", "4 hafta", "6 hafta", "8 hafta"],
        1,
      ),
      q(
        "4857 sayılı İş Kanunu'na göre kadın işçilerin tekil gebelikte doğumdan önce ve sonra çalıştırılmaması gereken toplam süre kaç haftadır?",
        ["8", "12", "16", "18", "24"],
        2,
      ),
      q("4857 sayılı İş Kanunu'na göre işçilere yedi günlük zaman dilimi içinde verilmesi gereken kesintisiz hafta tatili en az kaç saattir?", ["12", "24", "36", "48", "72"], 1),
      q(
        "Asıl işveren – alt işveren ilişkisinde asıl işveren, alt işverenin işçilerine karşı o işyeriyle ilgili yükümlülüklerden nasıl sorumludur?",
        ["Hiç sorumlu değildir", "Alt işveren ile birlikte (müteselsilen) sorumludur", "Sadece ücretlerden sorumludur", "Yalnızca yazılı sözleşme varsa sorumludur", "Sorumluluk tamamen SGK'ya geçer"],
        1,
      ),
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    sira: 7,
    ad: "6331 Sayılı İş Sağlığı ve Güvenliği Kanunu ve İlgili Mevzuat",
    on: [
      q("Aşağıdakilerden hangisi 6331 sayılı Kanun'un kapsamı dışındadır?", ["Kamu işyerleri", "Çırak ve stajyerler", "Ev hizmetleri", "Özel sektör işyerleri", "İşveren vekilleri"], 2),
      q("6331 sayılı Kanun'a göre iş kazası, kazadan sonraki kaç iş günü içinde SGK'ya bildirilmelidir?", ["1", "2", "3", "5", "10"], 2),
      q(
        "6331 sayılı Kanun'a göre İSG kurulu kurma yükümlülüğü hangi işyerleri için geçerlidir?",
        [
          "10 ve daha fazla çalışanı olan işyerleri",
          "30 ve daha fazla çalışanı olan işyerleri",
          "50 ve daha fazla çalışanı olan ve 6 aydan fazla süren sürekli işlerin yapıldığı işyerleri",
          "100 ve daha fazla çalışanı olan işyerleri",
          "Yalnızca çok tehlikeli işyerleri",
        ],
        2,
      ),
      q(
        "Kendi özel kanunlarındaki statülerine bakılmaksızın işyerinde istihdam edilen gerçek kişiye 6331 sayılı Kanun'da ne ad verilir?",
        ["İşçi", "Çalışan", "Memur", "Personel", "Görevli"],
        1,
      ),
      q("6331 sayılı Kanun'a göre risk değerlendirmesi yapmak veya yaptırmakla yükümlü olan kimdir?", ["İş güvenliği uzmanı", "İşyeri hekimi", "İşveren", "Çalışan temsilcisi", "İş müfettişi"], 2),
    ],
    son: [
      q(
        "Ciddi ve yakın tehlike ile karşı karşıya kalan çalışanın kurula, kurulun bulunmadığı işyerlerinde işverene başvurması 6331 sayılı Kanun'daki hangi hakla ilgilidir?",
        ["Grev hakkı", "Çalışmaktan kaçınma hakkı", "Fesih hakkı", "Yıllık izin hakkı", "Dilekçe hakkı"],
        1,
      ),
      q(
        "Çalışmaktan kaçınma hakkını kullanan çalışanın bu dönemdeki ücreti ve diğer hakları ile ilgili hangisi doğrudur?",
        ["Ücreti ödenmez", "Ücreti yarıya düşer", "Ücreti ve diğer hakları saklıdır", "Yıllık izninden düşülür", "Ücretsiz izinli sayılır"],
        2,
      ),
      q("6331 sayılı Kanun'a göre meslek hastalığı, işverence öğrenildiği tarihten itibaren kaç iş günü içinde SGK'ya bildirilir?", ["1", "3", "5", "10", "30"], 1),
      q("6331 sayılı Kanun'a göre sağlık hizmeti sunucuları kendilerine intikal eden iş kazalarını en geç kaç gün içinde SGK'ya bildirir?", ["3", "5", "7", "10", "15"], 3),
      q(
        "6331 sayılı Kanun'a göre çok tehlikeli sınıfta yer alan ve 10 veya daha fazla çalışanı olan işyerlerinde, uzman ve hekime ek olarak görevlendirilmesi gereken kişi hangisidir?",
        ["Çalışan temsilcisi", "Diğer sağlık personeli", "Destek elemanı", "Sivil savunma uzmanı", "İnsan kaynakları uzmanı"],
        1,
      ),
      q(
        "6331 sayılı Kanun'a göre işin durdurulduğu dönemde işverenin, işi durdurulan çalışanlara karşı yükümlülüğü nedir?",
        [
          "Ücretlerini ödemek veya ücretlerinde düşüklük olmamak üzere meslek ya da durumlarına uygun başka bir iş vermek",
          "Çalışanları ücretsiz izne çıkarmak",
          "İş sözleşmelerini feshetmek",
          "Ücretlerin yarısını ödemek",
          "Çalışanları başka bir işverene devretmek",
        ],
        0,
      ),
      q(
        "6331 sayılı Kanun'da sayılan risklerden korunma ilkeleri arasında aşağıdakilerden hangisi yer alır?",
        [
          "Kişisel korunma tedbirlerine, toplu korunma tedbirlerinden önce öncelik vermek",
          "Tehlikeli olanı, tehlikesiz veya daha az tehlikeli olanla değiştirmek",
          "Riskleri yalnızca kayıt altına almakla yetinmek",
          "Önlem maliyetini çalışanlara yansıtmak",
          "Teknik gelişmeleri dikkate almamak",
        ],
        1,
      ),
      q(
        "6331 sayılı Kanun'a göre aşağıdakilerden hangisi çalışanların yükümlülükleri arasında yer alır?",
        [
          "İşyeri hekimini görevlendirmek",
          "Risk değerlendirmesini tek başına yapmak",
          "Kendilerine sağlanan kişisel koruyucu donanımı doğru kullanmak ve korumak",
          "Acil durum planını onaylamak",
          "İSG eğitimlerinin maliyetini karşılamak",
        ],
        2,
      ),
      q(
        "İşyerlerinin tehlike sınıfı hangi esasa göre belirlenir?",
        ["İşyerindeki çalışan sayısına", "İşyerinin bulunduğu ile", "İşyerinde yürütülen asıl işin NACE (ekonomik faaliyet) koduna", "İşverenin tercihine", "İşyerinin kuruluş yılına"],
        2,
      ),
      q(
        "6331 sayılı Kanun'a göre işverenin İSG hizmetlerini dışarıdan (ör. OSGB'den) alması, işverenin sorumluluklarını nasıl etkiler?",
        ["İşvereni tüm sorumluluktan kurtarır", "Sorumluluk tamamen OSGB'ye geçer", "İşverenin sorumluluklarını ortadan kaldırmaz", "Sorumluluk yarı yarıya paylaşılır", "Sorumluluk iş müfettişine geçer"],
        2,
      ),
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    sira: 8,
    ad: "Risk Değerlendirmesi",
    on: [
      q("Risk Değerlendirmesi Yönetmeliği'ne göre çok tehlikeli sınıftaki işyerlerinde risk değerlendirmesi en geç kaç yılda bir yenilenir?", ["1", "2", "3", "4", "6"], 1),
      q("Risk Değerlendirmesi Yönetmeliği'ne göre az tehlikeli sınıftaki işyerlerinde risk değerlendirmesi en geç kaç yılda bir yenilenir?", ["2", "3", "4", "5", "6"], 4),
      q(
        "5×5 L tipi matris yönteminde risk skoru nasıl hesaplanır?",
        ["Olasılık + Şiddet", "Olasılık × Şiddet", "Olasılık × Frekans × Şiddet", "Şiddet ÷ Olasılık", "Frekans × Maliyet"],
        1,
      ),
      q(
        "Aşağıdakilerden hangisi Risk Değerlendirmesi Yönetmeliği'ne göre risk değerlendirmesi ekibinde yer almaz?",
        ["İşveren veya işveren vekili", "İş güvenliği uzmanı", "İşyeri hekimi", "Çalışan temsilcisi", "İş müfettişi"],
        4,
      ),
      q(
        "Risk kontrol tedbirlerinde ilk tercih edilmesi gereken yöntem hangisidir?",
        ["Kişisel koruyucu donanım kullanmak", "Uyarı levhası asmak", "Tehlikeyi kaynağında ortadan kaldırmak", "Eğitim vermek", "Çalışma süresini kısaltmak"],
        2,
      ),
    ],
    son: [
      q("Risk Değerlendirmesi Yönetmeliği'ne göre tehlikeli sınıftaki işyerlerinde risk değerlendirmesi en geç kaç yılda bir yenilenir?", ["1", "2", "3", "4", "6"], 3),
      q(
        "Aşağıdakilerden hangisi risk değerlendirmesinin süresi beklenmeden yenilenmesini gerektiren durumlardan biri değildir?",
        [
          "İşyerinin taşınması veya binalarda değişiklik yapılması",
          "İş kazası, meslek hastalığı veya ramak kala olay meydana gelmesi",
          "Kullanılan teknoloji, madde ve ekipmanlarda değişiklik olması",
          "İşyeri dışından kaynaklanan ve işyerini etkileyebilecek yeni bir tehlike ortaya çıkması",
          "İşyeri tabelasının yenilenmesi",
        ],
        4,
      ),
      q("5×5 L tipi matriste olasılığı 4, şiddeti 5 olarak belirlenen bir riskin skoru kaçtır?", ["9", "16", "20", "25", "45"], 2),
      q(
        "5×5 L tipi matriste risk skoru 25 olan bir risk için aşağıdakilerden hangisi doğrudur?",
        [
          "Kabul edilebilir risktir, önlem gerekmez",
          "Kabul edilemez risktir; risk azaltılıncaya kadar işe başlanmamalı veya iş derhal durdurulmalıdır",
          "Önlemler bir yıl içinde alınabilir",
          "Yalnızca kayıt altına alınması yeterlidir",
          "Sadece KKD dağıtılarak çözülür",
        ],
        1,
      ),
      q(
        "Fine-Kinney yönteminde risk değeri hangi parametrelerin çarpımıyla bulunur?",
        ["Olasılık × Şiddet", "Olasılık × Frekans × Şiddet", "Frekans × Maliyet", "Şiddet × Süre", "Olasılık × Çalışan sayısı"],
        1,
      ),
      q(
        "'Daha fazla, daha az, hiç, tersi' gibi kılavuz kelimeler kullanarak proses sapmalarını inceleyen risk analizi yöntemi hangisidir?",
        ["FMEA", "HAZOP", "Fine-Kinney", "L tipi matris", "Kontrol listesi"],
        1,
      ),
      q(
        "İstenmeyen bir tepe olaydan başlayarak bu olaya yol açabilecek nedenleri mantıksal kapılarla geriye doğru inceleyen yöntem hangisidir?",
        ["Olay Ağacı Analizi (ETA)", "Hata Ağacı Analizi (FTA)", "HAZOP", "Ön Tehlike Analizi", "5×5 matris"],
        1,
      ),
      q(
        "Risk Değerlendirmesi Yönetmeliği'ne göre risk değerlendirmesi aşamalarının doğru sıralaması hangisidir?",
        [
          "Planlama → Tehlikelerin tanımlanması → Risklerin belirlenmesi ve analizi → Kontrol tedbirlerinin kararlaştırılması → Uygulanması → İzlenmesi",
          "Kontrol tedbirleri → Planlama → Analiz → İzleme → Tanımlama",
          "İzleme → Planlama → Uygulama → Analiz → Tanımlama",
          "Analiz → Tanımlama → Planlama → İzleme → Uygulama",
          "Uygulama → Tanımlama → Planlama → Kayıt → Analiz",
        ],
        0,
      ),
      q(
        "Risk kontrol hiyerarşisinde en son başvurulması gereken önlem hangisidir?",
        ["Tehlikeyi ortadan kaldırma", "İkame (daha az tehlikeli olanla değiştirme)", "Mühendislik önlemleri", "İdari önlemler", "Kişisel koruyucu donanım"],
        4,
      ),
      q(
        "Solvent bazlı boya yerine daha az tehlikeli su bazlı boya kullanılması hangi kontrol yöntemine örnektir?",
        ["Ortadan kaldırma", "İkame", "Mühendislik kontrolü", "İdari kontrol", "Kişisel koruyucu donanım"],
        1,
      ),
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    sira: 9,
    ad: "Acil Durum Planları, Yangın ve Tahliye",
    on: [
      q(
        "Yanmanın gerçekleşmesi için gerekli üç unsur (yangın üçgeni) hangisidir?",
        ["Yanıcı madde, ısı, oksijen", "Su, ısı, karbondioksit", "Yanıcı madde, azot, su", "Oksijen, azot, hidrojen", "Isı, ışık, ses"],
        0,
      ),
      q(
        "Enerjisi kesilmemiş elektrik tesisatı yangınlarında aşağıdaki söndürücülerden hangisi kullanılmamalıdır?",
        ["Karbondioksitli (CO2) söndürücü", "Kuru kimyevi tozlu söndürücü", "Su", "Temiz gazlı söndürücü", "ABC tozlu söndürücü"],
        2,
      ),
      q("İşyerlerinde Acil Durumlar Hakkında Yönetmelik'e göre acil durum tatbikatı en az ne sıklıkla yapılmalıdır?", ["Ayda bir", "Üç ayda bir", "Altı ayda bir", "Yılda bir", "İki yılda bir"], 3),
      q("Odun, kâğıt, kumaş gibi katı maddelerin yangını hangi yangın sınıfına girer?", ["A sınıfı", "B sınıfı", "C sınıfı", "D sınıfı", "F sınıfı"], 0),
      q(
        "Acil çıkış kapıları ile ilgili hangisi doğrudur?",
        ["Kilitli tutulmalıdır", "Dışarıya doğru açılmalıdır", "Sürgülü olmalıdır", "Döner kapı olmalıdır", "İçeriye doğru açılmalıdır"],
        1,
      ),
    ],
    son: [
      q("Benzin, boya, yağ gibi yanıcı sıvıların yangını hangi yangın sınıfındadır?", ["A sınıfı", "B sınıfı", "C sınıfı", "D sınıfı", "F sınıfı"], 1),
      q("LPG, doğal gaz, asetilen gibi yanıcı gazların yangını hangi yangın sınıfındadır?", ["A sınıfı", "B sınıfı", "C sınıfı", "D sınıfı", "F sınıfı"], 2),
      q("Sodyum, potasyum, magnezyum gibi yanabilen metallerin yangını hangi yangın sınıfındadır?", ["A sınıfı", "B sınıfı", "C sınıfı", "D sınıfı", "F sınıfı"], 3),
      q("Mutfaklarda pişirme yağlarından kaynaklanan yangınlar TS EN 2 standardına göre hangi sınıftadır?", ["A sınıfı", "B sınıfı", "C sınıfı", "D sınıfı", "F sınıfı"], 4),
      q(
        "İşyerlerinde Acil Durumlar Hakkında Yönetmelik'e göre tehlikeli sınıftaki işyerlerinde yangınla mücadele için her kaç çalışana kadar bir destek elemanı görevlendirilir?",
        ["20", "30", "40", "50", "100"],
        2,
      ),
      q(
        "İşyerlerinde Acil Durumlar Hakkında Yönetmelik'e göre çok tehlikeli sınıftaki işyerlerinde arama, kurtarma ve tahliye için her kaç çalışana kadar bir destek elemanı görevlendirilir?",
        ["10", "20", "30", "40", "50"],
        2,
      ),
      q("Yangın söndürme yöntemlerinden 'boğma' hangi unsuru ortadan kaldırmaya yöneliktir?", ["Yanıcı maddeyi", "Isıyı", "Oksijeni", "Zincirleme reaksiyonu", "Işığı"], 2),
      q("Su ile yangın söndürmede esas olarak hangi etkiden yararlanılır?", ["Soğutma", "Boğma", "Zincirleme reaksiyonu kesme", "Yanıcı maddeyi uzaklaştırma", "Seyreltme"], 0),
      q("İşyerlerinde Acil Durumlar Hakkında Yönetmelik'e göre çok tehlikeli sınıftaki işyerlerinde acil durum planı en geç kaç yılda bir yenilenir?", ["1", "2", "4", "5", "6"], 1),
      q(
        "Taşınabilir yangın söndürücü kullanılırken söndürücü madde nereye yöneltilmelidir?",
        ["Alevlerin en üst noktasına", "Yangının tabanına (yanan maddenin dibine)", "Dumanın en yoğun olduğu yere", "Tavana", "Rüzgâra karşı havaya"],
        1,
      ),
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    sira: 10,
    ad: "Elektrik Güvenliği",
    on: [
      q(
        "Elektrik çarpmasına maruz kalmış bir kişiye müdahalede ilk yapılması gereken nedir?",
        [
          "Kişiyi çıplak elle hemen çekmek",
          "Elektrik akımını kesmek veya kişiyi yalıtkan bir malzemeyle kaynaktan ayırmak",
          "Üzerine su dökmek",
          "Akım kesilmeden kalp masajına başlamak",
          "Kişiyi ayağa kaldırmak",
        ],
        1,
      ),
      q("Hayat koruma amacıyla kullanılan kaçak akım koruma rölesinin açma akımı en fazla ne kadar olmalıdır?", ["10 A", "300 mA", "30 mA", "1 A", "500 mA"], 2),
      q(
        "Elektrik tesisatında topraklamanın temel amacı nedir?",
        [
          "Elektrik faturasını düşürmek",
          "Cihaz gövdelerinde oluşabilecek tehlikeli dokunma gerilimini önlemek",
          "Şebeke gerilimini artırmak",
          "Kabloları soğutmak",
          "Aydınlatma düzeyini artırmak",
        ],
        1,
      ),
      q("Elektrik panolarının önüne aşağıdakilerden hangisinin konulması gerekir?", ["Metal ızgara", "Yalıtkan paspas", "Islak bez", "Su kovası", "Ahşap merdiven"], 1),
      q(
        "Bakım-onarım öncesinde enerji kaynağının kapatılıp kilitlenmesi ve etiketlenmesi uygulamasına ne ad verilir?",
        ["Topraklama", "Kilitleme-etiketleme (LOTO)", "Kalibrasyon", "Eşpotansiyel bağlantı", "Yalıtım direnci ölçümü"],
        1,
      ),
    ],
    son: [
      q(
        "Elektrikle güvenli çalışmanın 5 altın kuralından ilki aşağıdakilerden hangisidir?",
        ["Topraklamak ve kısa devre etmek", "Gerilim olmadığını kontrol etmek", "Devreyi ayırmak (enerjiyi kesmek)", "Yakındaki gerilimli bölümleri örtmek", "İş izni almadan çalışmak"],
        2,
      ),
      q(
        "5 altın kurala göre devre ayrılıp tekrar devreye girmeye karşı emniyete alındıktan sonra yapılacak ilk adım hangisidir?",
        ["Gerilim olmadığını kontrol etmek", "Hemen çalışmaya başlamak", "Topraklamayı sökmek", "Sigortayı değiştirmek", "Devreye yeniden enerji vermek"],
        0,
      ),
      q(
        "Elektrik Kuvvetli Akım Tesisleri Yönetmeliği'ne göre etkin değeri 1000 volt ve altında olan gerilime ne ad verilir?",
        ["Yüksek gerilim", "Alçak gerilim", "Çok yüksek gerilim", "Tehlikeli gerilim", "Orta gerilim"],
        1,
      ),
      q("Yangından korunma amacıyla kullanılan kaçak akım rölelerinin açma akımı genellikle kaç mA'dir?", ["10", "30", "100", "300", "1000"], 3),
      q(
        "Elektrik çarpmasının insan vücudundaki etkisini belirleyen en önemli faktör aşağıdakilerden hangisidir?",
        ["Kablonun rengi", "Vücuttan geçen akımın şiddeti ve süresi", "Prizin markası", "Ortamın gürültü düzeyi", "Sigorta kutusunun yeri"],
        1,
      ),
      q(
        "IP koruma derecesinde (ör. IP65) ilk rakam neye karşı korumayı ifade eder?",
        ["Suya ve sıvılara", "Katı cisimlere ve toza", "Mekanik darbeye", "Yüksek sıcaklığa", "Elektromanyetik dalgalara"],
        1,
      ),
      q(
        "Parlayıcı ve patlayıcı ortamlarda statik elektrik birikmesini önlemek için alınan temel önlem hangisidir?",
        ["Ortamı ısıtmak", "Topraklama ve eşpotansiyel bağlantı yapmak", "Plastik kaplar kullanmak", "Ortam nemini sıfıra indirmek", "Daha yüksek gerilim kullanmak"],
        1,
      ),
      q("Elektrik tesisatının topraklama ölçümleri en geç ne sıklıkla yaptırılmalıdır?", ["Ayda bir", "Altı ayda bir", "Yılda bir", "İki yılda bir", "Beş yılda bir"], 2),
      q("Alternatif akımda insan için genel kabul gören tehlikeli dokunma gerilimi sınırı kaç volttur?", ["12", "24", "50", "120", "220"], 2),
      q(
        "Elektrik panoları ile ilgili aşağıdakilerden hangisi doğrudur?",
        [
          "Kapakları havalandırma için açık bırakılmalıdır",
          "Önü malzeme ile kapatılabilir",
          "Kapakları kapalı ve kilitli tutulmalı, yalnızca yetkili kişilerce açılmalıdır",
          "İçi su sıkılarak temizlenmelidir",
          "Herkes müdahale edebilir",
        ],
        2,
      ),
    ],
  },

  // ------------------------------------------------------------------ 11
  {
    sira: 11,
    ad: "Kişisel Koruyucu Donanımlar ve Güvenlik İşaretleri",
    on: [
      q(
        "Kişisel koruyucu donanımların temini ile ilgili hangisi doğrudur?",
        ["Çalışan kendi parasıyla alır", "İşveren ücretsiz olarak sağlar", "SGK dağıtır", "Bedeli ücretten kesilir", "Belediye sağlar"],
        1,
      ),
      q(
        "Kişisel koruyucu donanımın risk kontrol hiyerarşisindeki yeri nedir?",
        ["İlk başvurulacak önlemdir", "Diğer önlemlerle risk yeterince azaltılamadığında son çare olarak kullanılır", "Mühendislik önlemlerinden önce gelir", "İkame ile aynı önceliktedir", "Hiç kullanılmamalıdır"],
        1,
      ),
      q("Sağlık ve güvenlik işaretlerinde mavi renk neyi ifade eder?", ["Yasak", "Uyarı", "Zorunluluk (emredici)", "Acil çıkış", "Yangınla mücadele ekipmanı"], 2),
      q("Acil çıkış ve ilk yardım işaretlerinde kullanılan renk hangisidir?", ["Kırmızı", "Sarı", "Mavi", "Yeşil", "Turuncu"], 3),
      q("Piyasaya arz edilen kişisel koruyucu donanımların üzerinde bulunması zorunlu uygunluk işareti hangisidir?", ["TSE", "CE", "ISO", "UL", "GS"], 1),
    ],
    son: [
      q(
        "Yasaklayıcı işaretlerin şekli ve renkleri hangisidir?",
        [
          "Sarı zeminli, siyah kenarlı üçgen",
          "Beyaz zemin üzerinde kırmızı kenarlı ve kırmızı çapraz çizgili daire",
          "Mavi zeminli daire",
          "Yeşil zeminli kare",
          "Kırmızı zeminli kare",
        ],
        1,
      ),
      q(
        "Uyarı işaretlerinin şekli ve renkleri hangisidir?",
        ["Sarı zemin üzerinde siyah kenarlı üçgen", "Mavi zeminli daire", "Yeşil zeminli dikdörtgen", "Kırmızı kenarlı daire", "Beyaz zeminli kare"],
        0,
      ),
      q("Yangınla mücadele ekipmanını gösteren işaretlerde zemin rengi nedir?", ["Yeşil", "Kırmızı", "Mavi", "Sarı", "Beyaz"], 1),
      q(
        "Ölüm veya sağlık üzerinde ciddi ve geri dönüşü olmayan zarar riskine karşı kullanılan KKD'ler (ör. solunum koruyucular, yüksekten düşmeye karşı koruyucular) hangi kategoridedir?",
        ["Kategori I", "Kategori II", "Kategori III", "Kategori 0", "Kategori IV"],
        2,
      ),
      q("Toz maskelerinde (EN 149) en yüksek koruma sınıfı hangisidir?", ["FFP1", "FFP2", "FFP3", "P1", "M1"], 2),
      q(
        "Gürültü Yönetmeliği'ne göre işveren, gürültü maruziyeti hangi değere ulaştığında kişisel kulak koruyucularının kullanılmasını sağlar ve denetler?",
        ["75 dB(A)", "80 dB(A)", "85 dB(A)", "87 dB(A)", "90 dB(A)"],
        2,
      ),
      q(
        "Kişisel koruyucu donanımlar ile ilgili aşağıdakilerden hangisi doğrudur?",
        [
          "KKD'ler kural olarak kişiye özeldir",
          "Bir KKD tüm çalışanlarca ortak kullanılmalıdır",
          "Bakım ve temizliği çalışanın kendi masrafıyla yapılır",
          "KKD verildiyse başka önleme gerek yoktur",
          "CE işareti zorunlu değildir",
        ],
        0,
      ),
      q("Endüstriyel baretler için geçerli Avrupa standardı hangisidir?", ["EN 166", "EN 388", "EN 397", "EN 352", "EN 361"], 2),
      q("Tam vücut emniyet kemerleri için geçerli Avrupa standardı hangisidir?", ["EN 361", "EN 397", "EN 149", "EN ISO 20345", "EN 166"], 0),
      q(
        "Güvenlik ayakkabılarındaki burun koruyucu (çelik/kompozit burun) çalışanı esas olarak hangi tehlikeye karşı korur?",
        ["Elektrik çarpması", "Ayak parmaklarına düşen ağır cisimler ve ezilme", "Gürültü", "Toz", "Sıcak hava"],
        1,
      ),
    ],
  },

  // ------------------------------------------------------------------ 12
  {
    sira: 12,
    ad: "İş Ekipmanları ve Periyodik Kontroller",
    on: [
      q(
        "İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği'ne göre 'iş ekipmanı' nedir?",
        ["Sadece elektrikli makineler", "İşin yapılmasında kullanılan herhangi bir makine, alet, tesis ve tesisat", "Sadece kaldırma araçları", "Yalnızca KKD'ler", "Bina ve eklentiler"],
        1,
      ),
      q(
        "Forklift, vinç, caraskal gibi kaldırma ve iletme ekipmanlarının periyodik kontrolleri en geç ne sıklıkla yapılır?",
        ["Altı ayda bir", "Yılda bir", "İki yılda bir", "Üç yılda bir", "Beş yılda bir"],
        1,
      ),
      q("Makinelerdeki acil durdurma butonu hangi renktedir?", ["Yeşil", "Mavi", "Sarı zemin üzerinde kırmızı", "Siyah", "Beyaz"], 2),
      q(
        "Makinelerin hareketli parçalarına temas edilmesini önlemek için kullanılan donanım nedir?",
        ["Makine koruyucusu (muhafaza)", "Topraklama", "Sigorta", "Etiket", "Yağlama sistemi"],
        0,
      ),
      q(
        "Yük kaldırmada kullanılan iş ekipmanının üzerinde açıkça görülecek şekilde belirtilmesi gereken bilgi hangisidir?",
        ["Üretici firmanın telefon numarası", "Kaldırabileceği azami yük", "Satın alma fiyatı", "Operatörün adı", "Boya rengi"],
        1,
      ),
    ],
    son: [
      q(
        "Kompresör hava tankları ve buhar kazanları gibi basınçlı ekipmanların periyodik kontrolleri en geç ne sıklıkla yapılır?",
        ["Altı ayda bir", "Yılda bir", "İki yılda bir", "Dört yılda bir", "On yılda bir"],
        1,
      ),
      q("Asansörlerin periyodik kontrolü en geç ne sıklıkla yapılır?", ["Altı ayda bir", "Yılda bir", "İki yılda bir", "Üç yılda bir", "Beş yılda bir"], 1),
      q(
        "İş ekipmanlarının periyodik kontrollerini kim yapar?",
        [
          "Ekipmanı kullanan operatör",
          "Mevzuatta belirtilen niteliklere sahip yetkili kişiler (ilgili mühendis, tekniker vb.)",
          "İşyeri hekimi",
          "Çalışan temsilcisi",
          "Ekipmanı satan firmanın satış temsilcisi",
        ],
        1,
      ),
      q(
        "Kullanımı özel risk taşıyan iş ekipmanları (ör. forklift, vinç) ile ilgili hangisi doğrudur?",
        [
          "İşyerindeki herkes kullanabilir",
          "Yalnızca bu iş için görevlendirilmiş ve gerekli eğitimi almış çalışanlarca kullanılır",
          "Sadece işveren kullanabilir",
          "Kullanım için eğitim gerekmez",
          "Stajyerler gözetimsiz kullanabilir",
        ],
        1,
      ),
      q(
        "Bir makinenin koruyucusu bakım için sökülmüşse ne yapılmalıdır?",
        [
          "Koruyucu takılmadan makine çalıştırılabilir",
          "Koruyucu yerine takılmadan makine çalıştırılmamalıdır",
          "Koruyucu yerine uyarı levhası asmak yeterlidir",
          "Makine daha yavaş çalıştırılmalıdır",
          "Sadece deneyimli işçi çalıştırabilir",
        ],
        1,
      ),
      q(
        "Forklift kullanımı ile ilgili aşağıdakilerden hangisi doğrudur?",
        [
          "Çatallarda insan taşınabilir",
          "Yük yüksekte kaldırılmış hâlde hızlı seyredilmelidir",
          "Kapasitesinin üzerinde yük kaldırılmamalıdır",
          "Operatörün eğitim almasına gerek yoktur",
          "Yüklü forklift rampadan inerken yük önde olmalıdır",
        ],
        2,
      ),
      q(
        "Zincir, halat, sapan gibi kaldırma aksesuarları ile ilgili hangisi doğrudur?",
        [
          "Hasarlı olsa da kullanılabilir",
          "Düzenli olarak kontrol edilmeli, hasarlı olanlar kullanımdan kaldırılmalıdır",
          "Kapasite etiketine gerek yoktur",
          "Düğüm atılarak kısaltılabilir",
          "Keskin kenarlara korumasız sarılabilir",
        ],
        1,
      ),
      q(
        "Torna, matkap gibi döner parçaları olan makinelerde çalışırken aşağıdakilerden hangisi yapılmamalıdır?",
        ["Uzun saçları toplamak", "Bol giysi, kravat, yüzük gibi takılabilecek eşyalar kullanmak", "Koruyucu gözlük takmak", "Talimatlara uymak", "Çalışma alanını temiz tutmak"],
        1,
      ),
      q(
        "Kurulumu güvenlik şartlarına bağlı iş ekipmanlarının montajından sonra ve ilk kullanımdan önce kontrol edilmesinin amacı nedir?",
        [
          "Ekipmanın doğru monte edildiğini ve güvenli çalıştığını doğrulamak",
          "Satış fiyatını belirlemek",
          "Garanti süresini uzatmak",
          "Operatörün ücretini belirlemek",
          "Vergi muafiyeti almak",
        ],
        0,
      ),
      q(
        "Hidrant, yangın dolabı, sprinkler gibi yangın söndürme tesisatının periyodik kontrolleri en geç ne sıklıkla yapılır?",
        ["Altı ayda bir", "Yılda bir", "İki yılda bir", "Üç yılda bir", "Beş yılda bir"],
        1,
      ),
    ],
  },

  // ------------------------------------------------------------------ 13
  {
    sira: 13,
    ad: "Kimyasal Riskler ve Kimyasallarla Çalışma",
    on: [
      q(
        "Kimyasal maddelerin tehlikeleri, güvenli kullanımı ve ilk yardım bilgilerini içeren belgeye ne ad verilir?",
        ["Fatura", "Güvenlik Bilgi Formu (GBF / SDS)", "Garanti belgesi", "Sevk irsaliyesi", "Ürün kataloğu"],
        1,
      ),
      q("İşyerlerinde kimyasalların vücuda en sık giriş yolu hangisidir?", ["Solunum", "Sindirim", "Göz", "Kulak", "Saç"], 0),
      q(
        "SEA (CLP) Yönetmeliği'ne göre kimyasal tehlike piktogramları nasıl gösterilir?",
        ["Mavi zeminli daire", "Kırmızı çerçeveli, beyaz zeminli, köşesi üzerine oturan kare (eşkenar dörtgen)", "Yeşil zeminli kare", "Sarı zeminli üçgen", "Siyah zeminli daire"],
        1,
      ),
      q(
        "Kimyasalların depolanmasıyla ilgili hangisi doğrudur?",
        [
          "Asitler ve bazlar yan yana depolanmalıdır",
          "Birbiriyle tehlikeli tepkimeye girebilecek (uyumsuz) kimyasallar ayrı depolanmalıdır",
          "Etiketsiz kaplar kullanılabilir",
          "Kimyasallar boş gıda kaplarına aktarılabilir",
          "Depo havalandırılmamalıdır",
        ],
        1,
      ),
      q(
        "Kimyasallarla çalışılan alanlarda aşağıdakilerden hangisi yasaktır?",
        ["KKD kullanmak", "Yemek yemek, içmek ve sigara içmek", "Etiketleri okumak", "Havalandırmayı çalıştırmak", "Ellerini yıkamak"],
        1,
      ),
    ],
    son: [
      q("Güvenlik Bilgi Formu kaç bölümden oluşur?", ["8", "10", "12", "16", "20"], 3),
      q(
        "SEA (CLP) Yönetmeliği'ne göre etiketlerde kullanılan iki uyarı kelimesi hangisidir?",
        ["Tehlike ve Dikkat", "Yasak ve Zorunlu", "Ölümcül ve Zararsız", "Kırmızı ve Sarı", "Acil ve Normal"],
        0,
      ),
      q("Kimyasal etiketlerindeki 'H' ifadeleri neyi belirtir?", ["Önlem ifadelerini", "Zararlılık (tehlike) ifadelerini", "Üretim tarihini", "Raf ömrünü", "Fiyat bilgisini"], 1),
      q("Kimyasal etiketlerindeki 'P' ifadeleri neyi belirtir?", ["Önlem ifadelerini", "Zararlılık ifadelerini", "Parti numarasını", "Paketleme şeklini", "Piktogram sayısını"], 0),
      q("Asbest maruziyetiyle ilişkili meslek hastalığı aşağıdakilerden hangisidir?", ["Silikozis", "Mezotelyoma", "Bisinozis", "Saturnizm", "Kurşun koliği"], 1),
      q("Kristal silika (kuvars) tozuna uzun süre maruziyet sonucu oluşan meslek hastalığı hangisidir?", ["Asbestozis", "Silikozis", "Bisinozis", "Antrakoz", "Siderozis"], 1),
      q("Kurşun zehirlenmesine verilen ad hangisidir?", ["Merkürializm", "Saturnizm", "Siderozis", "Silikozis", "Bagassozis"], 1),
      q(
        "Kimyasal maruziyeti kaynağında kontrol etmeye yönelik en etkili mühendislik önlemlerinden biri hangisidir?",
        ["Pencere açarak genel havalandırma", "Lokal (yerel) egzoz havalandırması", "Uyarı levhası asmak", "Çalışma süresini uzatmak", "Toz maskesi dağıtmak"],
        1,
      ),
      q("Kısa süreli maruziyet sınır değeri (STEL) hangi süre için tanımlanır?", ["1 dakika", "15 dakika", "1 saat", "8 saat", "40 saat"], 1),
      q(
        "Benzene uzun süreli maruziyetin neden olduğu en önemli sağlık sorunu hangisidir?",
        ["İşitme kaybı", "Kan hastalıkları ve lösemi", "Karpal tünel sendromu", "Beyaz parmak hastalığı", "Kaynakçı gözü"],
        1,
      ),
    ],
  },

  // ------------------------------------------------------------------ 14
  {
    sira: 14,
    ad: "Fiziksel Risk Etmenleri: Gürültü, Titreşim, Aydınlatma ve Termal Konfor",
    on: [
      q("Gürültü düzeyini ifade etmek için kullanılan birim hangisidir?", ["Lüks", "Desibel (dB)", "Hertz", "Pascal", "Watt"], 1),
      q("Aydınlatma şiddetinin (aydınlık düzeyinin) birimi hangisidir?", ["Lümen", "Lüks (lx)", "Kandela", "Desibel", "Kelvin"], 1),
      q("Gürültüye uzun süre maruziyetin en tipik sağlık etkisi nedir?", ["Görme kaybı", "Kalıcı işitme kaybı", "Cilt yanığı", "Kemik kırığı", "Saç dökülmesi"], 1),
      q(
        "Gürültüyle mücadelede ilk tercih edilmesi gereken yöntem hangisidir?",
        ["Kulak tıkacı dağıtmak", "Gürültüyü kaynağında azaltmak", "Çalışanları sözlü uyarmak", "Ortamda müzik açmak", "Çalışma süresini uzatmak"],
        1,
      ),
      q(
        "Aşağıdakilerden hangisi termal konforu etkileyen ortam parametrelerinden biri değildir?",
        ["Hava sıcaklığı", "Bağıl nem", "Hava akım hızı", "Işınım (radyant) sıcaklığı", "Ortamdaki gürültü düzeyi"],
        4,
      ),
    ],
    son: [
      q("Gürültü Yönetmeliği'ne göre günlük maruziyet sınır değeri kaç dB(A)'dır?", ["80", "85", "87", "90", "95"], 2),
      q("Gürültü Yönetmeliği'ne göre en düşük maruziyet eylem değeri kaç dB(A)'dır?", ["75", "80", "85", "87", "90"], 1),
      q(
        "Gürültü Yönetmeliği'ne göre çalışanın maruziyetinin sınır değeri (87 dB(A)) aşıp aşmadığı belirlenirken hangisi dikkate alınır?",
        ["Kişisel kulak koruyucunun koruyucu etkisi", "Çalışanın yaşı", "İşyerinin büyüklüğü", "Mevsim", "Vardiya sayısı"],
        0,
      ),
      q("Titreşim Yönetmeliği'ne göre el-kol titreşimi için günlük (8 saatlik) maruziyet sınır değeri kaç m/s²'dir?", ["0,5", "1,15", "2,5", "5", "10"], 3),
      q("Titreşim Yönetmeliği'ne göre bütün vücut titreşimi için günlük (8 saatlik) maruziyet sınır değeri kaç m/s²'dir?", ["0,5", "1,15", "2,5", "5", "10"], 1),
      q(
        "El-kol titreşimine uzun süre maruz kalan çalışanlarda görülen 'beyaz parmak' hastalığı hangi tabloyla ilişkilidir?",
        ["Titreşime bağlı Raynaud fenomeni", "Tetik parmak", "Gut", "Romatoid artrit", "Skolyoz"],
        0,
      ),
      q("Sıcak ortamlarda ısı stresinin değerlendirilmesinde kullanılan indeks hangisidir?", ["WBGT (Yaş Termometre Küre Sıcaklığı)", "NIOSH kaldırma indeksi", "REBA", "pH", "Lüks"], 0),
      q("Aşağıdakilerden hangisi iyonlaştırıcı radyasyondur?", ["Kızılötesi (IR) ışınım", "Mikrodalga", "Görünür ışık", "X ışını", "Radyo dalgası"], 3),
      q(
        "Kaynak arkından yayılan ultraviyole ışınlara korunmasız maruz kalan gözde görülen ağrılı iltihaplanmaya ne ad verilir?",
        ["Kaynakçı gözü (fotokeratit)", "Glokom", "Şaşılık", "Renk körlüğü", "Miyopi"],
        0,
      ),
      q("Gürültüye bağlı işitme kaybı odyogramda tipik olarak hangi frekans civarında çentik şeklinde başlar?", ["250 Hz", "500 Hz", "1000 Hz", "4000 Hz", "8000 Hz"], 3),
    ],
  },

  // ------------------------------------------------------------------ 15
  {
    sira: 15,
    ad: "Ergonomi ve Ekranlı Araçlarla Çalışma",
    on: [
      q(
        "Ergonominin temel amacı aşağıdakilerden hangisidir?",
        ["İşi ve iş ortamını insana uygun hâle getirmek", "İnsanı makineye uydurmak", "Çalışma süresini uzatmak", "Yalnızca mobilya tasarlamak", "Ücretleri belirlemek"],
        0,
      ),
      q(
        "Yük kaldırırken doğru vücut pozisyonu hangisidir?",
        [
          "Dizler düz, bel bükülü",
          "Dizler bükülü, sırt dik, yük vücuda yakın",
          "Yük vücuttan uzakta tutulmalı",
          "Gövde döndürülerek kaldırılmalı",
          "Tek elle ve ani hareketle kaldırılmalı",
        ],
        1,
      ),
      q(
        "El bileğinde median sinirin sıkışmasıyla ortaya çıkan ve tekrarlı el-bilek hareketleriyle ilişkili rahatsızlık hangisidir?",
        ["Tenisçi dirseği", "Karpal tünel sendromu", "Bel fıtığı", "Varis", "Menisküs yırtığı"],
        1,
      ),
      q("İnsan vücudunun boyutlarını ölçen ve işyeri tasarımında kullanılan bilim dalı hangisidir?", ["Antropometri", "Toksikoloji", "Epidemiyoloji", "Akustik", "Hidrolik"], 0),
      q(
        "Ekranlı araçlarla çalışmada monitörün konumu ile ilgili hangisi doğrudur?",
        [
          "Ekranın üst kenarı göz hizasında veya biraz altında olmalıdır",
          "Ekran göz hizasının çok üstünde olmalıdır",
          "Ekran, arkasında parlak pencere kalacak şekilde konmalıdır",
          "Ekran yüze 20 cm mesafede olmalıdır",
          "Ekran yandan bakılacak şekilde konmalıdır",
        ],
        0,
      ),
    ],
    son: [
      q(
        "Ekranlı Araçlarla Çalışmalarda Sağlık ve Güvenlik Önlemleri Hakkında Yönetmelik'e göre çalışanların günlük çalışma süresinin her saati için en az kaç dakika ekranlı araçla çalışma dışında başka işler yapması veya ara vermesi sağlanır?",
        ["5", "10", "15", "20", "30"],
        1,
      ),
      q(
        "Ekranlı araçlarla çalışanların göz ve görme muayeneleri ile ilgili hangisi doğrudur?",
        [
          "Hiç yapılmaz",
          "İşe başlamadan önce, düzenli aralıklarla ve görme bozukluğu şikâyetinde yapılır",
          "Sadece emeklilikte yapılır",
          "Çalışan kendi masrafıyla yaptırır",
          "Yalnızca 50 yaş üstündekilere yapılır",
        ],
        1,
      ),
      q("Çalışma duruşlarının (postür) analizinde kullanılan ergonomik risk değerlendirme yöntemlerinden biri hangisidir?", ["HAZOP", "REBA", "FTA", "Fine-Kinney", "FMEA"], 1),
      q("NIOSH kaldırma denkleminde ideal koşullar için kabul edilen yük sabiti kaç kg'dır?", ["15", "20", "23", "25", "30"], 2),
      q(
        "Elle Taşıma İşleri Yönetmeliği'ne göre işverenin öncelikli yükümlülüğü hangisidir?",
        [
          "İşi, yüklerin elle taşınmasını gerektirmeyecek şekilde düzenlemek veya mekanik yardımcılar sağlamak",
          "Tüm yükleri tek bir çalışana taşıtmak",
          "Bel korsesi kullanımını tek önlem olarak uygulamak",
          "Yükün ağırlığı hakkında bilgi vermemek",
          "Taşıma işlerini gece yaptırmak",
        ],
        0,
      ),
      q(
        "Tekrarlayan hareketler, zorlayıcı duruşlar ve aşırı güç kullanımı sonucu ortaya çıkan rahatsızlıklara genel olarak ne ad verilir?",
        ["Kas-iskelet sistemi rahatsızlıkları", "Bulaşıcı hastalıklar", "Zehirlenmeler", "Alerjiler", "Pnömokonyozlar"],
        0,
      ),
      q(
        "Dirseğin dış yan tarafındaki tendonların aşırı kullanıma bağlı iltihabına ne ad verilir?",
        ["Lateral epikondilit (tenisçi dirseği)", "Karpal tünel sendromu", "Bursit", "Tetik parmak", "Skolyoz"],
        0,
      ),
      q(
        "Ekranlı araçla çalışırken klavye kullanımında önerilen pozisyon hangisidir?",
        ["Dirsekler yaklaşık 90° açıda, bilekler düz", "Bilekler yukarı bükülü", "Omuzlar kalkık", "Kollar tamamen gergin", "Klavye göğüs hizasında"],
        0,
      ),
      q(
        "Vardiyalı ve gece çalışmasının çalışanlar üzerindeki en belirgin etkisi hangisidir?",
        ["Biyolojik ritmin (sirkadiyen ritim) bozulması", "Boy uzaması", "İşitmenin güçlenmesi", "Göz renginin değişmesi", "Kas kütlesinin artması"],
        0,
      ),
    ],
  },

  // ------------------------------------------------------------------ 16
  {
    sira: 16,
    ad: "Yüksekte Çalışma ve Yapı İşleri",
    on: [
      q("Yüksekte çalışmada toplu koruma önlemine örnek hangisidir?", ["Tam vücut emniyet kemeri", "Korkuluk ve güvenlik ağı", "Baret", "Kaymaz ayakkabı", "İş eldiveni"], 1),
      q(
        "Yüksekte çalışmada düşmeyi durdurmak için kullanılan kişisel koruyucu donanım hangisidir?",
        ["Bel kemeri", "Tam vücut emniyet kemeri", "Reflektif yelek", "Kulak koruyucu", "Toz maskesi"],
        1,
      ),
      q(
        "Seyyar el merdiveni kullanımıyla ilgili doğru uygulama hangisidir?",
        [
          "Merdiven yaklaşık 75° açıyla (4'e 1 oranında) yerleştirilmelidir",
          "Merdiven duvara tam dik (90°) dayanmalıdır",
          "Merdivenin en üst basamağında çalışılmalıdır",
          "Merdivene aynı anda iki kişi çıkmalıdır",
          "Basamağı kırık merdiven dikkatli kullanılabilir",
        ],
        0,
      ),
      q(
        "Emniyet kemerinin bağlanacağı ankraj noktası için hangisi doğrudur?",
        [
          "Herhangi bir boruya bağlanabilir",
          "Yeterli dayanıma sahip, mümkünse çalışanın üst seviyesindeki güvenli bir noktaya bağlanmalıdır",
          "Ayak seviyesinin altına bağlanmalıdır",
          "Seyyar merdivene bağlanmalıdır",
          "Elektrik kablosuna bağlanabilir",
        ],
        1,
      ),
      q(
        "Kazı çalışmalarında göçük riskine karşı alınan temel önlem hangisidir?",
        ["Şev verilmesi veya iksa (destek) yapılması", "Kazının hızlı yapılması", "Kazı kenarına malzeme istiflenmesi", "Gece çalışılması", "Kazı içine su verilmesi"],
        0,
      ),
    ],
    son: [
      q(
        "Yapı İşlerinde İş Sağlığı ve Güvenliği Yönetmeliği'ne göre korkuluk sistemlerinde ana korkuluğun yüksekliği en az ne kadar olmalıdır?",
        ["50 cm", "60 cm", "75 cm", "100 cm", "150 cm"],
        3,
      ),
      q(
        "Korkuluk sistemlerinde malzeme ve aletlerin aşağı düşmesini önlemek için zemin seviyesine konulan levhaya ne ad verilir?",
        ["Ara korkuluk", "Topuk levhası (tekmelik)", "Ankraj", "Konsol", "Dikme"],
        1,
      ),
      q(
        "Düşme sonrası emniyet kemerinde asılı kalan çalışanda kısa sürede gelişebilen hayati tehlikeye ne ad verilir?",
        ["Askıda kalma travması (asılı kalma sendromu)", "Vurgun", "Hipotermi", "Isı çarpması", "Tetanoz"],
        0,
      ),
      q(
        "Düşme durdurma sistemlerinde düşme anındaki darbe kuvvetini azaltan bileşen hangisidir?",
        ["Enerji sönümleyici (şok emici)", "Karabina", "Baret çene kayışı", "Topuk levhası", "Ara korkuluk"],
        0,
      ),
      q(
        "Genel güvenlik kuralı olarak, erişim için kullanılan seyyar merdivenin üst ucu çıkılacak seviyeyi en az ne kadar geçmelidir?",
        ["10 cm", "30 cm", "1 m", "3 m", "5 m"],
        2,
      ),
      q(
        "Kırılgan çatı malzemeleri (ışıklık, eski tip oluklu levha vb.) üzerinde çalışırken alınması gereken önlem hangisidir?",
        [
          "Malzemenin doğrudan üzerine basılarak yürünmesi",
          "Yük dağıtıcı yürüme yolları, güvenlik ağı ve korkuluk gibi önlemlerin alınması",
          "Hızlı yürünmesi",
          "Yalnızca baret takılması",
          "Islak hâldeyken çalışılması",
        ],
        1,
      ),
      q(
        "İskelelerle ilgili hangisi doğrudur?",
        [
          "Kurulum ve sökümü yetkin bir kişinin gözetiminde yapılmalı, kullanıma uygunluğu kontrol edilmelidir",
          "Her çalışan istediği gibi değiştirebilir",
          "Korkuluk gerekmez",
          "Taban plakası gereksizdir",
          "Kontrol etiketi gerekmez",
        ],
        0,
      ),
      q(
        "Kazı kenarına malzeme veya hafriyat yığılması neden sakıncalıdır?",
        ["Kazı kenarında ek yük oluşturarak göçük riskini artırır", "Görüntü kirliliği yaratır", "Gürültüyü artırır", "Aydınlatmayı bozar", "Hiçbir sakıncası yoktur"],
        0,
      ),
      q(
        "Yapı işlerinde sağlık ve güvenlik planının amacı nedir?",
        [
          "Şantiyede uygulanacak İSG kurallarını ve önlemlerini iş başlamadan belirlemek",
          "Şantiye maliyetini hesaplamak",
          "Mimari projeyi çizmek",
          "Satış sözleşmesi hazırlamak",
          "Vergi beyannamesi hazırlamak",
        ],
        0,
      ),
      q(
        "Yüksekte çalışacak çalışanın sağlık durumu ile ilgili hangisi doğrudur?",
        [
          "Yüksekte çalışmaya uygun olduğu sağlık gözetimiyle belgelenmelidir",
          "Sağlık durumu önemli değildir",
          "Baş dönmesi şikâyeti olanlar da çalışabilir",
          "Sadece göz muayenesi yeterlidir",
          "Rapor yalnızca çalışan isterse alınır",
        ],
        0,
      ),
    ],
  },

  // ------------------------------------------------------------------ 17
  {
    sira: 17,
    ad: "İş Kazaları, Meslek Hastalıkları ve Kaza Araştırması",
    on: [
      q(
        "Kaza araştırmasının temel amacı nedir?",
        ["Suçlu bulup cezalandırmak", "Kök nedenleri belirleyip benzer kazaların tekrarını önlemek", "Sigorta primini artırmak", "Kazayı kayıt dışı bırakmak", "Sadece tutanak düzenlemek"],
        1,
      ),
      q(
        "Bir sorunun kök nedenine ulaşmak için art arda 'neden?' sorusunun sorulduğu yöntem hangisidir?",
        ["5 Neden (5 Why) analizi", "SWOT analizi", "ABC analizi", "Pareto analizi", "Beyin fırtınası"],
        0,
      ),
      q(
        "Sebep-sonuç ilişkisini insan, makine, yöntem, malzeme gibi başlıklar altında gösteren 'balık kılçığı' diyagramının diğer adı nedir?",
        ["Gantt diyagramı", "Ishikawa diyagramı", "Pareto diyagramı", "Akış şeması", "Venn şeması"],
        1,
      ),
      q(
        "5510 sayılı Kanun'a göre iş kazası ve meslek hastalığı sigortası primini kim öder?",
        ["Tamamını çalışan öder", "Tamamını işveren öder", "Devlet öder", "Yarısını çalışan, yarısını işveren öder", "Belediye öder"],
        1,
      ),
      q(
        "İş kazası sonrasında kaza yerinde öncelikle yapılması gereken hangisidir?",
        ["Kaza yerini hemen temizlemek", "Ortamı güvenli hâle getirip yaralıya ilk yardım sağlamak ve 112'yi aramak", "Basına açıklama yapmak", "İşe kaldığı yerden devam etmek", "Tanıkları evlerine göndermek"],
        1,
      ),
    ],
    son: [
      q(
        "5510 sayılı Kanun'a göre aşağıdakilerden hangisi iş kazası sayılmaz?",
        [
          "Sigortalının işyerinde bulunduğu sırada meydana gelen kaza",
          "İşverence sağlanan servis aracıyla işe gelirken meydana gelen kaza",
          "Görevli olarak işyeri dışına gönderilen sigortalının asıl işini yapmaksızın geçen zamanda geçirdiği kaza",
          "Emziren kadın sigortalının çocuğuna süt vermek için ayrılan sürede geçirdiği kaza",
          "Sigortalının hafta tatilinde kendi aracıyla tatile giderken geçirdiği trafik kazası",
        ],
        4,
      ),
      q(
        "Kaza sıklık hızı (1.000.000 çalışma saati esasına göre) nasıl hesaplanır?",
        [
          "Kaza sayısı × 1.000.000 / Toplam çalışma saati",
          "Kayıp gün sayısı × 1000 / Çalışan sayısı",
          "Kaza sayısı / Çalışan sayısı",
          "Toplam çalışma saati / Kaza sayısı",
          "Kayıp gün sayısı / Kaza sayısı",
        ],
        0,
      ),
      q(
        "Bir işyerinde bir yılda toplam 1.000.000 saat çalışılmış ve 8 iş kazası meydana gelmiştir. Kaza sıklık hızı (1.000.000 saat esasına göre) kaçtır?",
        ["0,8", "8", "80", "800", "8000"],
        1,
      ),
      q(
        "Kaza ağırlık hızı (1000 çalışma saati esasına göre) nasıl hesaplanır?",
        [
          "Kayıp iş günü sayısı × 1000 / Toplam çalışma saati",
          "Kaza sayısı × 1000 / Çalışan sayısı",
          "Kayıp gün sayısı / Kaza sayısı",
          "Kaza sayısı × 1.000.000 / Toplam çalışma saati",
          "Toplam çalışma saati / Kayıp gün sayısı",
        ],
        0,
      ),
      q(
        "5510 sayılı Kanun'a göre meslek hastalığı nasıl tanımlanır?",
        [
          "Sigortalının çalıştığı veya yaptığı işin niteliğinden dolayı tekrarlanan bir sebeple veya işin yürütüm şartları yüzünden uğradığı geçici veya sürekli hastalık, bedensel veya ruhsal engellilik hâlleri",
          "İşyerinde ani olarak meydana gelen yaralanma",
          "Çalışanın evinde geçirdiği hastalık",
          "Sadece bulaşıcı hastalıklar",
          "Yaşa bağlı olarak gelişen hastalıklar",
        ],
        0,
      ),
      q(
        "Sosyal Sigorta İşlemleri Yönetmeliği'ndeki meslek hastalıkları listesinde 'C' grubu hangi hastalıkları kapsar?",
        [
          "Kimyasal maddelerle olan meslek hastalıkları",
          "Mesleki cilt hastalıkları",
          "Pnömokonyozlar ve diğer mesleki solunum sistemi hastalıkları",
          "Mesleki bulaşıcı hastalıklar",
          "Fizik etkenlerle olan meslek hastalıkları",
        ],
        2,
      ),
      q(
        "5510 sayılı Kanun'a göre sürekli iş göremezlik geliri bağlanabilmesi için sigortalının meslekte kazanma gücünü en az yüzde kaç kaybetmiş olması gerekir?",
        ["%5", "%10", "%25", "%50", "%60"],
        1,
      ),
      q(
        "5510 sayılı Kanun'a göre işverenin iş kazasını bildirimi ile ilgili hangisi doğrudur?",
        [
          "Kolluk kuvvetlerine derhal, SGK'ya en geç kazadan sonraki 3 iş günü içinde bildirilir",
          "Yalnızca ölümlü kazalar bildirilir",
          "Bir ay içinde bildirilmesi yeterlidir",
          "Yalnızca çalışan isterse bildirilir",
          "Bildirim zorunlu değildir",
        ],
        0,
      ),
      q(
        "Ramak kala olaylarının kayıt altına alınıp incelenmesinin en önemli faydası nedir?",
        [
          "Kaza meydana gelmeden tehlikeleri fark edip önlem alma fırsatı sağlaması",
          "Çalışanların cezalandırılmasını kolaylaştırması",
          "Sigorta primlerini artırması",
          "Hiçbir faydası yoktur",
          "Sadece istatistik oluşturması",
        ],
        0,
      ),
      q(
        "Meslek hastalıklarında 'yükümlülük süresi' neyi ifade eder?",
        [
          "Sigortalının meslek hastalığına neden olan işinden fiilen ayrıldığı tarih ile hastalığın ortaya çıktığı tarih arasında geçebilecek en uzun süreyi",
          "Sigortalının işe başladığı tarihi",
          "Hastalığın tedavi süresini",
          "İşverenin bildirim süresini",
          "Sağlık raporunun geçerlilik süresini",
        ],
        0,
      ),
    ],
  },

  // ------------------------------------------------------------------ 18
  {
    sira: 18,
    ad: "İlk Yardım",
    on: [
      q(
        "İlk yardımın temel uygulamaları (KBK) hangisidir?",
        ["Koruma, Bildirme, Kurtarma", "Kontrol, Bekleme, Kaçma", "Kayıt, Bildirim, Kapatma", "Koşma, Bağırma, Kaçma", "Kurtarma, Bekleme, Kontrol"],
        0,
      ),
      q("Türkiye'de acil sağlık yardımı için aranması gereken numara hangisidir?", ["110", "112", "155", "156", "177"], 1),
      q(
        "İlk yardım ile ilgili aşağıdakilerden hangisi doğrudur?",
        [
          "İlaç kullanılarak yapılan tedavidir",
          "Sağlık görevlileri gelene kadar olay yerinde, mevcut araç-gereçlerle yapılan ilaçsız uygulamalardır",
          "Sadece doktorların yapabileceği müdahaledir",
          "Hastanede yapılan cerrahi işlemdir",
          "Yalnızca ambulans içinde yapılan tedavidir",
        ],
        1,
      ),
      q(
        "Bilinci kapalı, solunumu olan ve travma şüphesi bulunmayan bir yaralıya hangi pozisyon verilir?",
        ["Sırtüstü düz yatış", "Koma (derlenme / yan yatış) pozisyonu", "Oturur pozisyon", "Yüzüstü yatış", "Ayakta tutma"],
        1,
      ),
      q(
        "İlk yardımcının olay yerinde ilk dikkat etmesi gereken husus nedir?",
        ["Kendi can güvenliğini ve olay yeri güvenliğini sağlamak", "Yaralıyı hemen hareket ettirmek", "Fotoğraf çekmek", "Yaralıya su içirmek", "Etrafta kalabalık toplamak"],
        0,
      ),
    ],
    son: [
      q("Yetişkinlerde temel yaşam desteğinde göğüs basısı ile suni solunum oranı nasıl olmalıdır?", ["15:2", "30:2", "5:1", "30:1", "10:2"], 1),
      q("Yetişkinlerde göğüs basısı dakikada kaç bası hızında uygulanmalıdır?", ["40–60", "60–80", "100–120", "140–160", "180–200"], 2),
      q("Yetişkinlerde göğüs basısı derinliği ne kadar olmalıdır?", ["1–2 cm", "2–3 cm", "5–6 cm", "8–10 cm", "10–12 cm"], 2),
      q(
        "Dış kanamalarda ilk uygulanması gereken yöntem hangisidir?",
        ["Turnike uygulamak", "Kanayan yere doğrudan baskı uygulamak", "Yaraya toz veya kahve dökmek", "Yarayı yıkayıp açık bırakmak", "Yaralıyı yürütmek"],
        1,
      ),
      q(
        "Burun kanamasında doğru ilk yardım uygulaması hangisidir?",
        [
          "Baş geriye yatırılır",
          "Baş hafifçe öne eğilir ve burun kanatları birkaç dakika sıkıştırılır",
          "Yaralı sırtüstü yatırılır",
          "Buruna pamuk sıkıca tıkanıp bırakılır",
          "Buruna sıcak uygulama yapılır",
        ],
        1,
      ),
      q(
        "Isı ile oluşan yanıklarda ilk yardım olarak yapılması gereken hangisidir?",
        [
          "Yanık bölgeye diş macunu veya yoğurt sürmek",
          "Yanık bölgeyi tazyiksiz soğuk (çeşme) suyla soğutmak",
          "Su kabarcıklarını patlatmak",
          "Yanığın üzerine doğrudan buz koymak",
          "Yanığa yapışmış giysileri zorla çıkarmak",
        ],
        1,
      ),
      q(
        "Yabancı cisimle tam hava yolu tıkanıklığı yaşayan (konuşamayan, öksüremeyen) bilinci açık yetişkine uygulanan yöntem hangisidir?",
        ["Sırta vuru ve karına bası (Heimlich manevrası)", "Kalp masajı", "Su içirmek", "Ağza parmakla körlemesine müdahale", "Yatırıp beklemek"],
        0,
      ),
      q(
        "Kırık şüphesi olan bir uzvun tespitinde (sabitlemede) hangisi doğrudur?",
        [
          "Kırık kemik yerine oturtulmaya çalışılır",
          "Kırık bölgenin bir üst ve bir alt eklemini içine alacak şekilde sabitleme yapılır",
          "Uzuv sürekli hareket ettirilir",
          "Yalnızca kırık noktası sıkıca sarılır",
          "Kırık bölgeye sıcak uygulama yapılır",
        ],
        1,
      ),
      q("İlk Yardım Yönetmeliği'ne göre ilk yardımcı belgesi kaç yıl geçerlidir?", ["1", "2", "3", "5", "10"], 2),
      q("İlk Yardım Yönetmeliği'ne göre tehlikeli sınıftaki işyerlerinde her kaç çalışan için bir ilk yardımcı bulundurulmalıdır?", ["10", "15", "20", "30", "50"], 1),
    ],
  },

  // ------------------------------------------------------------------ 19
  {
    sira: 19,
    ad: "İSG Kurulları, Çalışan Temsilcisi ve Çalışan Katılımı",
    on: [
      q("İSG kurulunun başkanı kimdir?", ["İş güvenliği uzmanı", "İşveren veya işveren vekili", "İşyeri hekimi", "Çalışan temsilcisi", "İnsan kaynakları sorumlusu"], 1),
      q("İSG kurulunun sekreteri kimdir?", ["İş güvenliği uzmanı", "İşyeri hekimi", "Çalışan temsilcisi", "Muhasebe sorumlusu", "Formen"], 0),
      q("6331 sayılı Kanun'a göre 2–50 çalışanı olan bir işyerinde kaç çalışan temsilcisi görevlendirilir?", ["1", "2", "3", "4", "5"], 0),
      q("Çok tehlikeli sınıftaki işyerlerinde İSG kurulu en az ne sıklıkla toplanır?", ["Haftada bir", "Ayda bir", "İki ayda bir", "Üç ayda bir", "Altı ayda bir"], 1),
      q(
        "Çalışan temsilcisi nasıl belirlenir?",
        [
          "İşveren doğrudan atar, seçim yapılmaz",
          "Çalışanlar arasında seçimle; seçimle belirlenemezse işverence atanır",
          "SGK tarafından atanır",
          "İş müfettişi belirler",
          "En kıdemli çalışan kendiliğinden temsilci olur",
        ],
        1,
      ),
    ],
    son: [
      q("6331 sayılı Kanun'a göre 101–500 çalışanı olan bir işyerinde kaç çalışan temsilcisi görevlendirilir?", ["1", "2", "3", "4", "5"], 2),
      q("6331 sayılı Kanun'a göre 2001 ve üzeri çalışanı olan işyerlerinde kaç çalışan temsilcisi görevlendirilir?", ["3", "4", "5", "6", "8"], 3),
      q("Tehlikeli sınıftaki işyerlerinde İSG kurulu en az ne sıklıkla toplanır?", ["Ayda bir", "İki ayda bir", "Üç ayda bir", "Altı ayda bir", "Yılda bir"], 1),
      q("Az tehlikeli sınıftaki işyerlerinde İSG kurulu en az ne sıklıkla toplanır?", ["Ayda bir", "İki ayda bir", "Üç ayda bir", "Altı ayda bir", "Yılda bir"], 2),
      q(
        "Birden fazla çalışan temsilcisi bulunan işyerlerinde temsilciler arasından seçimle belirlenen kişiye ne ad verilir?",
        ["Baş temsilci", "Kurul başkanı", "İşveren vekili", "Destek elemanı", "Kurul sekreteri"],
        0,
      ),
      q(
        "İşyerinde yetkili sendika bulunması hâlinde çalışan temsilciliği ile ilgili hangisi doğrudur?",
        [
          "Sendika temsilcileri çalışan temsilcisi olamaz",
          "İşyeri sendika temsilcileri çalışan temsilcisi olarak da görev yapar",
          "Çalışan temsilcisi seçimi yapılamaz",
          "Temsilciyi SGK atar",
          "Temsilci sayısı yarıya düşer",
        ],
        1,
      ),
      q(
        "Çalışan temsilcisinin hakları ile ilgili hangisi doğrudur?",
        [
          "Görevini yerine getirmesi nedeniyle haklarında herhangi bir kısıtlama veya ayrımcılık yapılamaz",
          "Görevi nedeniyle ücretinden kesinti yapılır",
          "Temsilcilik süresince izin kullanamaz",
          "İşveren temsilciyi görevi nedeniyle cezalandırabilir",
          "Kurul toplantılarına katılamaz",
        ],
        0,
      ),
      q(
        "Aşağıdakilerden hangisi İSG kurulunun üyeleri arasında yer almaz?",
        ["İşyeri hekimi", "Çalışan temsilcisi", "İnsan kaynakları / personel işleri sorumlusu", "Formen, ustabaşı veya usta", "İş müfettişi"],
        4,
      ),
      q(
        "6331 sayılı Kanun'a göre ciddi ve yakın tehlike ile karşılaşan çalışan, kurul bulunan işyerlerinde nereye başvurur?",
        ["İş mahkemesine", "İSG kuruluna", "SGK il müdürlüğüne", "Belediyeye", "Notere"],
        1,
      ),
      q(
        "6331 sayılı Kanun'a göre işveren, İSG konularında görüş alma ve katılımı sağlama yükümlülüğünü kimlere karşı yerine getirir?",
        ["Çalışanlara veya çalışan temsilcilerine", "Yalnızca müşterilere", "Tedarikçilere", "Rakip firmalara", "Belediye meclisine"],
        0,
      ),
    ],
  },

  // ------------------------------------------------------------------ 20
  {
    sira: 20,
    ad: "Çalışanların İş Sağlığı ve Güvenliği Eğitimleri",
    on: [
      q(
        "Çalışanların İSG eğitimlerinin maliyeti kim tarafından karşılanır?",
        ["Çalışan", "İşveren; maliyet çalışanlara yansıtılamaz", "SGK", "Çalışan ve işveren birlikte", "Eğitimi veren kişi"],
        1,
      ),
      q(
        "6331 sayılı Kanun'a göre İSG eğitimlerinde geçen süre ile ilgili hangisi doğrudur?",
        ["Çalışma süresinden sayılır", "Ücretsiz izinden düşülür", "Yıllık izinden düşülür", "Hafta tatilinde yapılmak zorundadır", "Mesai dışında ve ücretsiz yapılır"],
        0,
      ),
      q("Az tehlikeli sınıftaki işyerlerinde çalışanlara verilecek İSG eğitimi en az kaç saattir?", ["4", "8", "12", "16", "24"], 1),
      q("Çok tehlikeli sınıftaki işyerlerinde çalışanlara verilecek İSG eğitimi en az kaç saattir?", ["8", "12", "16", "20", "24"], 2),
      q(
        "Çalışanlara temel İSG eğitimi ne zaman verilmelidir?",
        ["İşe başlamadan önce", "İşe başladıktan bir yıl sonra", "Yalnızca kaza olduğunda", "Emekliliğe yakın", "Sadece çalışan talep ederse"],
        0,
      ),
    ],
    son: [
      q("Tehlikeli sınıftaki işyerlerinde çalışanlara verilecek İSG eğitimi en az kaç saattir?", ["8", "10", "12", "16", "20"], 2),
      q("Tehlikeli sınıftaki işyerlerinde çalışan İSG eğitimleri en az ne sıklıkla tekrarlanır?", ["Yılda bir", "İki yılda bir", "Üç yılda bir", "Dört yılda bir", "Beş yılda bir"], 1),
      q("Az tehlikeli sınıftaki işyerlerinde çalışan İSG eğitimleri en az ne sıklıkla tekrarlanır?", ["Yılda bir", "İki yılda bir", "Üç yılda bir", "Dört yılda bir", "Altı yılda bir"], 2),
      q("Çok tehlikeli sınıftaki işyerlerinde çalışan İSG eğitimleri en az ne sıklıkla tekrarlanır?", ["Yılda bir", "İki yılda bir", "Üç yılda bir", "Dört yılda bir", "Beş yılda bir"], 0),
      q(
        "Herhangi bir sebeple 6 aydan fazla işten uzak kalan çalışana işe yeniden başlamadan önce hangi eğitim verilir?",
        ["Bilgi yenileme eğitimi", "Hiçbir eğitim verilmez", "Yalnızca kurum tanıtımı", "Sürücü eğitimi", "Yabancı dil eğitimi"],
        0,
      ),
      q(
        "6331 sayılı Kanun'a göre eğitim süresinin haftalık çalışma süresini aşması hâlinde bu süreler nasıl değerlendirilir?",
        ["Ücretsiz kabul edilir", "Fazla sürelerle çalışma veya fazla çalışma olarak değerlendirilir", "Yıllık izinden düşülür", "Gönüllü çalışma sayılır", "Bir sonraki haftadan düşülür"],
        1,
      ),
      q(
        "Çalışanlara verilen İSG eğitimlerinin belgelenmesi ile ilgili hangisi doğrudur?",
        [
          "Eğitim sonunda katılımcılara eğitim belgesi düzenlenir",
          "Herhangi bir belge düzenlenmez",
          "Belgeyi çalışan kendisi hazırlar",
          "Sözlü bildirim yeterlidir",
          "Belge yalnızca kazadan sonra düzenlenir",
        ],
        0,
      ),
      q(
        "İş kazası veya meslek hastalığı sonrasında işe dönen çalışana ne yapılır?",
        [
          "Olayın sebepleri ve korunma yolları hakkında ilave eğitim verilir",
          "İşten çıkarılır",
          "Ücretinden kesinti yapılır",
          "Hiçbir işlem yapılmaz",
          "Eğitimsiz olarak aynı işe başlatılır",
        ],
        0,
      ),
      q(
        "6331 sayılı Kanun'a göre mesleki eğitim alma zorunluluğu bulunan tehlikeli ve çok tehlikeli işlerle ilgili hangisi doğrudur?",
        [
          "Yapacakları işle ilgili mesleki eğitim aldığını belgeleyemeyenler bu işlerde çalıştırılamaz",
          "Mesleki eğitim belgesi aranmaz",
          "Belgeyi işveren kendi düzenler",
          "Belge yalnızca yöneticiler için gereklidir",
          "Belge işe başladıktan beş yıl sonra alınır",
        ],
        0,
      ),
    ],
  },

  // ------------------------------------------------------------------ 21
  {
    sira: 21,
    ad: "Sağlık Gözetimi ve İşyeri Hekimliği",
    on: [
      q(
        "6331 sayılı Kanun'a göre tehlikeli ve çok tehlikeli sınıftaki işlerde çalışacaklar hangi belge olmadan işe başlatılamaz?",
        ["Diploma", "Yapacakları işe uygun olduklarını belirten sağlık raporu", "Adli sicil kaydı", "Yerleşim yeri belgesi", "Askerlik durum belgesi"],
        1,
      ),
      q(
        "Sağlık gözetimi kapsamında yapılan muayenelerin maliyeti kim tarafından karşılanır?",
        ["Çalışan", "İşveren; maliyet çalışana yansıtılamaz", "SGK", "Çalışan temsilcisi", "Yarı yarıya çalışan ve işveren"],
        1,
      ),
      q(
        "Gürültülü işlerde çalışanların işitme düzeylerini izlemek için yapılan test hangisidir?",
        ["Spirometri", "Odyometri", "Elektrokardiyografi", "Göz muayenesi", "Akciğer grafisi"],
        1,
      ),
      q(
        "Tozlu ortamlarda çalışanların akciğer fonksiyonlarını değerlendirmek için kullanılan test hangisidir?",
        ["Odyometri", "Solunum fonksiyon testi (spirometri)", "Göz tansiyonu ölçümü", "Kan şekeri ölçümü", "İşitme testi"],
        1,
      ),
      q("Az tehlikeli sınıftaki işyerlerinde çalışanların periyodik sağlık muayenesi en geç kaç yılda bir yapılır?", ["1", "2", "3", "4", "5"], 4),
    ],
    son: [
      q("Tehlikeli sınıftaki işyerlerinde çalışanların periyodik sağlık muayenesi en geç kaç yılda bir yapılır?", ["1", "2", "3", "4", "5"], 2),
      q(
        "Çok tehlikeli sınıftaki işyerlerinde çalışanların periyodik sağlık muayenesi en geç ne sıklıkla yapılır?",
        ["Yılda bir", "İki yılda bir", "Üç yılda bir", "Dört yılda bir", "Beş yılda bir"],
        0,
      ),
      q("İşyeri hekiminin tehlikeli sınıftaki bir işyerinde çalışan başına ayda ayırması gereken asgari süre kaç dakikadır?", ["5", "10", "15", "20", "40"], 1),
      q("İşyeri hekiminin çok tehlikeli sınıftaki bir işyerinde çalışan başına ayda ayırması gereken asgari süre kaç dakikadır?", ["5", "10", "15", "20", "40"], 2),
      q("İş güvenliği uzmanının az tehlikeli sınıftaki bir işyerinde çalışan başına ayda ayırması gereken asgari süre kaç dakikadır?", ["5", "10", "15", "20", "40"], 1),
      q("İş güvenliği uzmanının çok tehlikeli sınıftaki bir işyerinde çalışan başına ayda ayırması gereken asgari süre kaç dakikadır?", ["10", "15", "20", "30", "40"], 4),
      q(
        "6331 sayılı Kanun'a göre işveren, çalışanların sağlık muayenelerini hangi durumlarda yaptırmak zorundadır?",
        [
          "İşe girişte, iş değişikliğinde, iş kazası/meslek hastalığı veya sağlık nedeniyle tekrarlanan işten uzaklaşmalardan sonra işe dönüşte talep edilmesi hâlinde ve işin devamı süresince düzenli aralıklarla",
          "Sadece emeklilikte",
          "Yalnızca işten ayrılırken",
          "Sadece yıllık izin dönüşünde",
          "Hiçbir durumda zorunlu değildir",
        ],
        0,
      ),
      q(
        "Sağlık gözetimi kapsamında elde edilen çalışan sağlık bilgileri ile ilgili hangisi doğrudur?",
        ["Gizli tutulur; özel hayatın gizliliği ve kişinin onuru korunur", "İşyeri panosuna asılır", "Tüm çalışanlarla paylaşılır", "İnternette yayımlanır", "Müşterilere gönderilir"],
        0,
      ),
      q(
        "Çok tehlikeli sınıftaki işyerlerinde çalışan sayısı en az kaç olduğunda tam süreli işyeri hekimi görevlendirilmesi gerekir?",
        ["250", "500", "750", "1000", "2000"],
        2,
      ),
      q(
        "Tehlikeli sınıftaki işyerlerinde çalışan sayısı en az kaç olduğunda tam süreli iş güvenliği uzmanı görevlendirilmesi gerekir?",
        ["250", "500", "750", "1000", "2000"],
        1,
      ),
    ],
  },
];

export const TOPLAM_SORU = DERSLER.reduce((a, d) => a + d.on.length + d.son.length, 0);
