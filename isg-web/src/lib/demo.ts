import type { Data } from "./store";
import type { Analysis, Kursiyer, Olay, RiskRow, Trx, Uye, Mesaj, Denetim, Cevap, HazardClass, Muayene, MuayeneSonuc, MuayeneTur } from "./types";
import { nowIso } from "./format";
import { sonrakiTarih } from "./muayene";

/** YYYY-MM-DD + n ay − 1 gün (ör. 12 aylık sözleşmenin bitişi) */
function addMonths(iso: string, n: number): string {
  const [y, m, dd] = iso.split("-").map(Number);
  const d = new Date(y, m - 1 + n, dd - 1);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Siteyi ilk açan biri her modülü dolu görebilsin diye örnek veri.
 * Mevcut verinin üstüne eklenir; id'ler ortak sayaçtan devam eder.
 * Dönen kursiyerIds (Müşteri Takip firmaları) için çağıran taraf kasa senkronunu çalıştırır.
 */
export function buildDemoData(cur: Data): { data: Data; kursiyerIds: number[] } {
  let seq = cur.seq;
  const id = () => ++seq;
  const d: Data = JSON.parse(JSON.stringify(cur));

  // kasalar
  const ensureKasa = (title: string) => {
    const k = d.kasalar.find((x) => x.title === title && x.is_active);
    if (k) return k.id;
    const nid = id();
    d.kasalar.push({ id: nid, title, is_active: true });
    return nid;
  };
  const sirket = d.kasalar.find((k) => k.is_active)?.id ?? ensureKasa("Şirket / Kasa");
  const yasin = ensureKasa("Yasin");
  const fatih = ensureKasa("Fatih");
  const cat = (type: "gelir" | "gider", name: string) => d.categories.find((c) => c.type === type && c.name === name)?.id ?? null;

  // son 6 ay gelir / gider hareketleri
  const manual: Array<[number, "gelir" | "gider", number, string, string, number]> = [
    [150, "gelir", 42000, "OSGB Hizmet Geliri", "Demirel Otomotiv aylık OSGB hizmeti", sirket],
    [146, "gider", 18500, "Kira", "Ofis kirası", sirket],
    [140, "gider", 3200, "Kırtasiye", "Sertifika baskı ve kırtasiye", yasin],
    [120, "gelir", 42000, "OSGB Hizmet Geliri", "Demirel Otomotiv aylık OSGB hizmeti", sirket],
    [116, "gider", 18500, "Kira", "Ofis kirası", sirket],
    [101, "gelir", 15000, "Risk Analizi Geliri", "Lezzet Durağı risk değerlendirmesi", fatih],
    [92, "gelir", 42000, "OSGB Hizmet Geliri", "Demirel Otomotiv aylık OSGB hizmeti", sirket],
    [88, "gider", 18500, "Kira", "Ofis kirası", sirket],
    [80, "gider", 6400, "Reklam", "Sosyal medya reklamı", yasin],
    [62, "gelir", 42000, "OSGB Hizmet Geliri", "Demirel Otomotiv aylık OSGB hizmeti", sirket],
    [58, "gider", 18500, "Kira", "Ofis kirası", sirket],
    [55, "gider", 24000, "Personel Maaş", "Eğitmen ödemesi", sirket],
    [44, "gelir", 9500, "Eğitim Geliri", "Temel İSG eğitimi — Akdeniz İnşaat (12 kişi)", fatih],
    [32, "gelir", 42000, "OSGB Hizmet Geliri", "Demirel Otomotiv aylık OSGB hizmeti", sirket],
    [28, "gider", 18500, "Kira", "Ofis kirası", sirket],
    [21, "gider", 2750, "Ulaşım / Yakıt", "Saha denetimi yakıt", fatih],
    [12, "gider", 7800, "Vergi / SGK", "SGK primi", sirket],
    [6, "gelir", 12000, "Risk Analizi Geliri", "Akdeniz İnşaat şantiye risk analizi", yasin],
    [3, "gider", 1500, "Kırtasiye", "Kırtasiye gideri", yasin],
  ];
  for (const [ago, type, amount, catName, description, kasa_id] of manual) {
    const t: Trx = {
      id: id(),
      trx_date: daysAgo(ago),
      type,
      kasa_id,
      category_id: cat(type, catName),
      payment_method: type === "gelir" ? "banka" : "nakit",
      description,
      amount,
      ref_type: "manual",
      ref_id: null,
      created_at: nowIso(),
    };
    d.transactions.push(t);
  }

  // müşteri firmalar (Müşteri Takip — "kursiyerler" koleksiyonu; tahsilatlar kasa senkronuyla gelir olarak yansır)
  type FirmaSpec = {
    ad: string;
    vkn: string;
    yetkili: string;
    phone: string;
    email: string;
    city: string;
    adres: string;
    hizmet: string;
    donem: string;
    tehlike: HazardClass;
    calisan: number;
    nace: string;
    sgk: string;
    total: number;
    cash: number;
    bank: number;
    kasa: number;
    ago: number;
    /** sözleşme süresi (ay); 0 = tek seferlik hizmet */
    ay: number;
    plasiyer: string;
    notes: string;
  };
  const firmaSpec: FirmaSpec[] = [
    {
      ad: "Demirel Otomotiv San. Tic. Ltd. Şti.",
      vkn: "2840512398",
      yetkili: "Kemal Demirel",
      phone: "0532 412 18 90",
      email: "info@demirelotomotiv.com.tr",
      city: "Mersin / Yenişehir",
      adres: "Sanayi Sitesi 3. Blok No: 14",
      hizmet: "İSG Hizmeti",
      donem: "2026 yıllık",
      tehlike: "TEHLİKELİ",
      calisan: 34,
      nace: "45.20.01",
      sgk: "4.4520.01.01.1048231.033.01.47",
      total: 96000,
      cash: 0,
      bank: 48000,
      kasa: sirket,
      ago: 40,
      ay: 12,
      plasiyer: "Yasin",
      notes: "Aylık 8.000 ₺; fatura her ayın 5'inde kesilir.",
    },
    {
      ad: "Akdeniz İnşaat Taahhüt A.Ş.",
      vkn: "0130457721",
      yetkili: "Serdar Akın",
      phone: "0541 220 34 11",
      email: "isg@akdenizinsaat.com.tr",
      city: "Adana / Seyhan",
      adres: "Turhan Cemal Beriker Blv. No: 210 Kat: 4",
      hizmet: "İSG Hizmeti",
      donem: "2026 yıllık",
      tehlike: "ÇOK TEHLİKELİ",
      calisan: 85,
      nace: "41.20.01",
      sgk: "4.4120.01.01.1093317.001.01.83",
      total: 180000,
      cash: 0,
      bank: 90000,
      kasa: sirket,
      ago: 35,
      ay: 12,
      plasiyer: "",
      notes: "Şantiye 2 için ayrıca haftalık saha denetimi.",
    },
    {
      ad: "Lezzet Durağı Restoran",
      vkn: "5210983346",
      yetkili: "Hülya Arslan",
      phone: "0505 881 72 03",
      email: "",
      city: "Mersin / Mezitli",
      adres: "Kuyuluk Mah. 1203 Sok. No: 7",
      hizmet: "Risk Analizi",
      donem: "Ekim 2026",
      tehlike: "AZ TEHLİKELİ",
      calisan: 9,
      nace: "56.10.01",
      sgk: "",
      total: 15000,
      cash: 15000,
      bank: 0,
      kasa: fatih,
      ago: 30,
      ay: 0,
      plasiyer: "",
      notes: "",
    },
    {
      ad: "Çukurova Tekstil San. A.Ş.",
      vkn: "2310774105",
      yetkili: "Murat Çelik",
      phone: "0553 610 45 27",
      email: "insankaynaklari@cukurovatekstil.com.tr",
      city: "Adana / Yüreğir",
      adres: "Hacı Sabancı OSB 6. Cad. No: 3",
      hizmet: "Eğitim",
      donem: "Kasım 2026",
      tehlike: "TEHLİKELİ",
      calisan: 120,
      nace: "13.20.01",
      sgk: "4.1320.01.01.1120045.002.01.25",
      total: 36000,
      cash: 0,
      bank: 18000,
      kasa: sirket,
      ago: 26,
      ay: 0,
      plasiyer: "Yasin",
      notes: "Temel İSG eğitimi — 4 grup, 120 kişi.",
    },
    {
      ad: "Mavi Lojistik Depolama Ltd. Şti.",
      vkn: "6120339872",
      yetkili: "Gökhan Yurt",
      phone: "0536 902 11 64",
      email: "operasyon@mavilojistik.com.tr",
      city: "Mersin / Akdeniz",
      adres: "Serbest Bölge 2. Cad. Depo 11",
      hizmet: "İSG Hizmeti",
      donem: "2026 yıllık",
      tehlike: "TEHLİKELİ",
      calisan: 48,
      nace: "52.10.02",
      sgk: "",
      total: 72000,
      cash: 0,
      bank: 72000,
      kasa: sirket,
      ago: 20,
      ay: 12,
      plasiyer: "",
      notes: "",
    },
    {
      ad: "Toros Plastik Ambalaj San. Ltd. Şti.",
      vkn: "8450126637",
      yetkili: "Ebru Kılıç",
      phone: "0544 337 80 52",
      email: "",
      city: "Mersin / Tarsus",
      adres: "Tarsus OSB 2. Kısım No: 18",
      hizmet: "Periyodik Muayene",
      donem: "Aralık 2026",
      tehlike: "TEHLİKELİ",
      calisan: 26,
      nace: "22.22.01",
      sgk: "",
      total: 12500,
      cash: 12500,
      bank: 0,
      kasa: fatih,
      ago: 14,
      ay: 0,
      plasiyer: "Yasin",
      notes: "Forklift ve kompresör periyodik kontrolleri.",
    },
    {
      ad: "Ege Mali Müşavirlik",
      vkn: "3290548810",
      yetkili: "Tolga Ege",
      phone: "0507 118 49 36",
      email: "tolga@egemusavirlik.com",
      city: "Adana / Çukurova",
      adres: "Turgut Özal Blv. No: 54 D: 6",
      hizmet: "İSG Hizmeti",
      donem: "2026 yıllık",
      tehlike: "AZ TEHLİKELİ",
      calisan: 8,
      nace: "69.20.01",
      sgk: "",
      total: 9600,
      cash: 0,
      bank: 0,
      kasa: yasin,
      ago: 9,
      ay: 12,
      plasiyer: "",
      notes: "",
    },
    {
      ad: "Kuzey Metal Kaynak San. Tic.",
      vkn: "5630091144",
      yetkili: "Emre Kuzey",
      phone: "0542 775 63 08",
      email: "",
      city: "Adana / Sarıçam",
      adres: "Küçük Sanayi Sitesi 14. Sok. No: 9",
      hizmet: "İSG Hizmeti",
      donem: "2026 yıllık",
      tehlike: "ÇOK TEHLİKELİ",
      calisan: 22,
      nace: "25.11.01",
      sgk: "",
      total: 54000,
      cash: 9000,
      bank: 0,
      kasa: yasin,
      ago: 4,
      ay: 12,
      plasiyer: "Yasin",
      notes: "",
    },
  ];
  const kursiyerIds: number[] = [];
  for (const f of firmaSpec) {
    const baslangic = daysAgo(f.ago);
    const k: Kursiyer = {
      id: id(),
      full_name: f.ad,
      tc: f.vkn,
      phone: f.phone,
      email: f.email,
      city: f.city,
      group_name: f.hizmet,
      list_no: f.donem,
      total_amount: f.total,
      cash_amount: f.cash,
      bank_amount: f.bank,
      remaining_amount: Math.max(0, f.total - f.cash - f.bank),
      kasa_id: f.kasa,
      plasiyer: f.plasiyer,
      notes: f.notes,
      invoice_issue_date: baslangic,
      is_active: true,
      created_at: nowIso(),
      yetkili: f.yetkili,
      tehlike_sinifi: f.tehlike,
      calisan_sayisi: f.calisan,
      nace_kodu: f.nace,
      sgk_sicil: f.sgk,
      adres: f.adres,
      sozlesme_bitis: f.ay ? addMonths(baslangic, f.ay) : "",
      igu_id: null,
      ih_id: null,
      dsp_id: null,
    };
    d.kursiyerler.push(k);
    kursiyerIds.push(k.id);
  }

  // örnek risk analizi
  const aid = id();
  const analysis: Analysis = {
    id: aid,
    title: "Lezzet Durağı Restoran",
    nace_code: "56.10.01",
    sector_name: "Lokanta / restoran işletmeciliği",
    hazard_class: "AZ TEHLİKELİ",
    hazard_auto: false,
    description:
      "120 m² salon, açık mutfak, fritöz ve LPG'li ocaklar, soğuk hava deposu, bodrumda kuru gıda deposu. 9 çalışan (aşçı, garson, bulaşıkçı, kasiyer), iki vardiya. Paket servis için 2 motosiklet.",
    item_count: 12,
    activity_desc: "Restoranda yemek hazırlama, pişirme, servis, bulaşık ve depolama faaliyetleri yürütülmektedir.",
    personnel: "Aşçı, aşçı yardımcısı, garson, bulaşıkçı, kasiyer, motokurye",
    employer_label: "İşveren / Restoran İşletmecisi",
    sektor_uygulama:
      "1) Fritöz ve ocak çevresi: K sınıfı yangın söndürücü ve yangın battaniyesi bulundurulacak. 2) LPG tesisatı: gaz kaçak dedektörü ve otomatik kesme vanası yıllık kontrol ettirilecek. 3) Soğuk hava deposu: kapının içeriden açılabilir olduğu her vardiyada kontrol edilecek. 4) Islak zemin: kaymaz paspas ve uyarı levhası kullanılacak. 5) Motokurye: kask, dizlik ve yansıtıcı yelek zorunlu tutulacak.",
    status: "hazir",
    analysis_date: daysAgo(101),
    created_at: nowIso(),
  };
  d.analyses.push(analysis);
  const rows: Array<[string, string, string, string, number, number, string, string]> = [
    ["Mutfak", "Fritözde kızartma yapılması", "Sıçrayan kızgın yağ ve sıcak yüzeyler", "Yanık ve haşlanma", 4, 3, "Fritöz çevresine sıçrama siperi takılacak; ısıya dayanıklı eldiven ve önlük kullandırılacak.", "İŞVEREN"],
    ["Mutfak", "LPG'li ocaklarla pişirme", "LPG hortum ve bağlantılarında kaçak", "Yangın, patlama ve ölüm", 2, 5, "Gaz kaçak dedektörü ve otomatik kesme vanası takılacak; hortumlar yılda bir yenilenecek.", "İŞVEREN"],
    ["Mutfak", "Bıçakla doğrama yapılması", "Keskin bıçaklar ve kesme ekipmanları", "Kesik ve uzuv yaralanması", 4, 2, "Kesilmeye dirençli eldiven verilecek; bıçaklar manyetik askıda saklanacak.", "USTA BAŞI"],
    ["Mutfak", "Zeminin yıkanması", "Islak ve yağlı zemin", "Kayarak düşme, kırık ve incinme", 4, 3, "Kaymaz zemin paspası serilecek; ıslak zemin uyarı levhası kullanılacak.", "İŞVEREN"],
    ["Soğuk Hava Deposu", "Depoya malzeme giriş çıkışı", "İçeriden açılamayan depo kapısı", "Soğukta mahsur kalma ve donma", 2, 5, "Kapıya içeriden açma mekanizması ve alarm butonu takılacak.", "TEKNİK SORUMLU"],
    ["Depo", "Rafa ağır malzeme yerleştirilmesi", "Sabitlenmemiş yüksek raflar", "Devrilen raf altında kalma", 2, 4, "Raflar duvara sabitlenecek; ağır malzemeler alt raflara konulacak.", "İŞVEREN"],
    ["Depo", "Bodrum merdiveninde yük taşıma", "Korkuluksuz ve dik merdiven", "Merdivenden düşme", 3, 4, "Merdivene korkuluk ve kaymaz bant takılacak; yük taşıma arabası temin edilecek.", "İŞVEREN"],
    ["Bulaşıkhane", "Kimyasal deterjan kullanımı", "Etiketsiz ve aktarılmış temizlik kimyasalları", "Cilt ve göz tahrişi", 3, 3, "Kimyasallar orijinal kabında, etiketli saklanacak; GBF'ler erişilebilir tutulacak.", "İSG UZMANI"],
    ["Salon", "Sıcak tabak servisi", "Kalabalık salonda dar geçişler", "Çarpışma, düşme ve yanık", 3, 2, "Masa yerleşimi geçişler en az 90 cm olacak şekilde düzenlenecek.", "İŞVEREN"],
    ["Elektrik", "Elektrikli mutfak cihazlarının kullanımı", "Topraklaması olmayan prizler ve hasarlı kablolar", "Elektrik çarpması", 2, 5, "Tesisat yıllık kontrol ettirilecek; kaçak akım rölesi takılacak.", "TEKNİK SORUMLU"],
    ["Paket Servis", "Motosikletle paket teslimatı", "Trafikte hızlı ve dikkatsiz sürüş", "Trafik kazası, ağır yaralanma ve ölüm", 3, 5, "Kask, dizlik ve yansıtıcı yelek zorunlu tutulacak; teslimat süresi baskısı kaldırılacak.", "İŞVEREN"],
    ["Genel", "Acil durumlara hazırlık", "Acil çıkışın malzemeyle kapatılması", "Yangında tahliye edilememe", 2, 5, "Acil çıkış yolları sürekli açık tutulacak; yılda bir tahliye tatbikatı yapılacak.", "İŞVEREN"],
  ];
  rows.forEach(([bolum, faaliyet, tehlike, risk, o, s, onlem, sorumlu], i) => {
    const r: RiskRow = { id: id(), analysis_id: aid, sort_no: i + 1, bolum, faaliyet, tehlike, risk, o, s, onlem, sorumlu };
    d.riskRows.push(r);
  });

  // olaylar
  const olaylar: Array<Omit<Olay, "id" | "created_at">> = [
    {
      tur: "kaza",
      tarih: daysAgo(1),
      saat: "14:20",
      isyeri: "Akdeniz İnşaat — Şantiye 2",
      yer: "B blok 3. kat döşeme",
      kisi: "Hasan K. (kalıpçı)",
      aciklama: "Kalıp sökümü sırasında düşen kereste parçası çalışanın omzuna çarptı.",
      yaralanma: "Sol omuzda ezilme, 3 gün istirahat",
      kok_neden: "Söküm alanı şeritle kapatılmamış; üst katta malzeme istifi kenara yakın.",
      onlem: "Söküm alanında güvenlik şeridi ve uyarı levhası zorunlu; kenar istifi yasaklandı.",
      sgk_bildirildi: false,
      kayip_gun: 3,
    },
    {
      tur: "ramak_kala",
      tarih: daysAgo(9),
      saat: "10:05",
      isyeri: "Demirel Otomotiv",
      yer: "Lift alanı",
      kisi: "Usta Mustafa D.",
      aciklama: "Lift kilit pimi takılmadan araç altına girildi; fark edilip çıkıldı.",
      yaralanma: "",
      kok_neden: "Kilit pimi kontrolü talimatta yok.",
      onlem: "Lift başına kontrol listesi asıldı; çalışanlara eğitim verildi.",
      sgk_bildirildi: false,
      kayip_gun: 0,
    },
    {
      tur: "tehlikeli_durum",
      tarih: daysAgo(16),
      saat: "16:40",
      isyeri: "Lezzet Durağı Restoran",
      yer: "Bodrum depo merdiveni",
      kisi: "",
      aciklama: "Merdiven basamaklarında kaymaz bantlar kopmuş.",
      yaralanma: "",
      kok_neden: "Periyodik kontrol yapılmıyor.",
      onlem: "Bantlar yenilendi; aylık kontrol listesine eklendi.",
      sgk_bildirildi: false,
      kayip_gun: 0,
    },
  ];
  for (const o of olaylar) d.olaylar.push({ ...o, id: id(), created_at: nowIso() });

  // denetim (Genel İşyeri Denetimi — 20 madde)
  const cevaplar: Record<number, Cevap> = {};
  for (let i = 0; i < 20; i++) cevaplar[i] = [3, 9, 15].includes(i) ? "uygunsuz" : i === 18 ? "na" : "uygun";
  const den: Denetim = {
    id: id(),
    isyeri: "Demirel Otomotiv San. Tic. Ltd. Şti.",
    tarih: daysAgo(7),
    sablon: "genel",
    cevaplar,
    notlar: "Yangın söndürücülerin 2 adedinin dolum tarihi geçmiş. Uyarı levhaları eksik.",
    puan: Math.round((16 * 100) / 19),
    created_at: nowIso(),
  };
  d.denetimler.push(den);

  // sınıf + üyeler + mesajlar
  const sid = id();
  d.siniflar.push({ id: sid, ad: "A Sınıfı · Aralık 2026", aciklama: "Hafta sonu grubu", renk: "#0E7C86", created_at: nowIso() });
  const uyeler: Array<[string, string]> = [
    ["Ayşe Yılmaz", "905324121890"],
    ["Mehmet Kaya", "905412203411"],
    ["Zeynep Demir", "905058817203"],
    ["Burak Şahin", "905536104527"],
  ];
  for (const [ad, telefon] of uyeler) {
    const u: Uye = { id: id(), sinif_id: sid, ad, telefon, not_: "", kursiyer_id: null, created_at: nowIso() };
    d.uyeler.push(u);
  }
  const mesajlar: Array<[string, Mesaj["kanal"], number]> = [
    ["Merhaba, cumartesi dersimiz 09:30'da Zoom üzerinden başlayacak. Bağlantı sabah paylaşılacak.", "whatsapp", 4],
    ["Ödev: 6331 sayılı Kanun'un 4. maddesini (işverenin genel yükümlülüğü) özetleyiniz.", "not", 0],
  ];
  for (const [metin, kanal, alici] of mesajlar) d.mesajlar.push({ id: id(), sinif_id: sid, metin, kanal, alici_sayisi: alici, created_at: nowIso() });

  // periyodik muayene (işyeri hekimi) — gecikmiş, yaklaşan ve güncel karışık; sonraki tarih tehlike sınıfı periyodundan
  const DEMIREL = "Demirel Otomotiv San. Tic. Ltd. Şti.";
  const AKDENIZ = "Akdeniz İnşaat — Şantiye 2";
  const LEZZET = "Lezzet Durağı Restoran";
  const muayeneSpec: Array<[string, string, string, HazardClass, MuayeneTur, number, MuayeneSonuc, string[], string]> = [
    // çalışan, işyeri, görev, tehlike sınıfı, tür, kaç gün önce, sonuç, tetkikler, notlar
    ["Hasan Koç", AKDENIZ, "Kalıpçı", "ÇOK TEHLİKELİ", "periyodik", 392, "calisabilir", ["Odyometri", "SFT (solunum fonksiyon testi)", "Akciğer grafisi", "Tam kan sayımı"], ""],
    ["İbrahim Yıldız", AKDENIZ, "İskele montajcısı (yüksekte çalışma)", "ÇOK TEHLİKELİ", "periyodik", 352, "calisabilir", ["Göz muayenesi", "EKG", "Tam kan sayımı", "Psikoteknik"], "Yüksekte çalışmasına engel bir durum saptanmadı."],
    ["Ramazan Aksoy", AKDENIZ, "Kaynakçı", "ÇOK TEHLİKELİ", "ise_giris", 40, "calisabilir", ["SFT (solunum fonksiyon testi)", "Akciğer grafisi", "Göz muayenesi", "Tetanoz aşısı"], ""],
    ["Gökhan Er", AKDENIZ, "Vinç operatörü", "ÇOK TEHLİKELİ", "gorev_degisikligi", 20, "calisamaz", ["EKG", "Göz muayenesi", "Psikoteknik", "Biyokimya"], "Kan basıncı kontrol altında değil (170/105 mmHg). Tedavisi düzenlenip yeniden değerlendirilene kadar vinç operatörlüğü yapamaz."],
    ["Mustafa Demir", DEMIREL, "Boyacı (boya kabini)", "TEHLİKELİ", "periyodik", 1110, "kisitli", ["SFT (solunum fonksiyon testi)", "Akciğer grafisi", "Tam kan sayımı", "Biyokimya"], "SFT'de hafif obstrüksiyon. Boya kabininde yalnızca tam yüz gaz maskesiyle çalışabilir; 6 ay sonra kontrol SFT."],
    ["Serkan Uçar", DEMIREL, "Akü ve oto elektrik ustası", "TEHLİKELİ", "periyodik", 1078, "calisabilir", ["Kan kurşun düzeyi", "Tam kan sayımı", "Biyokimya", "Odyometri"], ""],
    ["Mustafa Doğan", DEMIREL, "Lift / mekanik ustası", "TEHLİKELİ", "ise_donus", 60, "kisitli", ["Tam kan sayımı"], "Bel fıtığı ameliyatı sonrası işe dönüş. 3 ay süreyle 15 kg üzeri yük kaldırmamalı."],
    ["Emine Kurt", LEZZET, "Aşçı", "AZ TEHLİKELİ", "ise_giris", 2230, "calisabilir", ["Tam kan sayımı", "Hepatit markerları"], ""],
    ["Emine Kurt", LEZZET, "Aşçı", "AZ TEHLİKELİ", "periyodik", 400, "calisabilir", ["Tam kan sayımı", "Hepatit markerları"], ""],
    ["Yusuf Arslan", LEZZET, "Motokurye", "AZ TEHLİKELİ", "ise_giris", 1815, "calisabilir", ["Göz muayenesi", "Psikoteknik"], ""],
  ];
  if (!Array.isArray(d.muayeneler)) d.muayeneler = []; // eski yedeklerde koleksiyon olmayabilir
  for (const [calisan, isyeri, gorev, hazard_class, tur, ago, sonuc, tetkikler, notlar] of muayeneSpec) {
    const tarih = daysAgo(ago);
    const m: Muayene = {
      id: id(),
      calisan,
      tc: "",
      isyeri,
      gorev,
      hazard_class,
      tur,
      tarih,
      sonraki: sonrakiTarih(tarih, hazard_class),
      sonuc,
      tetkikler,
      notlar,
      created_at: nowIso(),
    };
    d.muayeneler.push(m);
  }

  d.seq = seq;
  return { data: d, kursiyerIds };
}
