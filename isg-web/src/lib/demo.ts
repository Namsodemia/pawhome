import type { Data } from "./store";
import type { Analysis, Kursiyer, Olay, RiskRow, Trx, Uye, Mesaj, Denetim, Cevap } from "./types";
import { nowIso } from "./format";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Siteyi ilk açan biri her modülü dolu görebilsin diye örnek veri.
 * Mevcut verinin üstüne eklenir; id'ler ortak sayaçtan devam eder.
 * Dönen kursiyerIds için çağıran taraf kasa senkronunu çalıştırır.
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

  // kursiyerler (tahsilatlar kasa senkronuyla gelir olarak yansır)
  const kursiyerSpec: Array<[string, string, string, number, number, number, number, number]> = [
    // ad, telefon, grup, toplam, nakit, banka, kasa, günönce
    ["Ayşe Yılmaz", "0532 412 18 90", "A Sınıfı İSG Uzmanlığı", 18000, 6000, 6000, yasin, 40],
    ["Mehmet Kaya", "0541 220 34 11", "A Sınıfı İSG Uzmanlığı", 18000, 0, 18000, sirket, 35],
    ["Zeynep Demir", "0505 881 72 03", "B Sınıfı İSG Uzmanlığı", 14000, 4000, 0, fatih, 30],
    ["Burak Şahin", "0553 610 45 27", "C Sınıfı İSG Uzmanlığı", 11000, 0, 5500, sirket, 26],
    ["Elif Arslan", "0536 902 11 64", "İşyeri Hekimliği", 22000, 0, 22000, sirket, 20],
    ["Can Öztürk", "0544 337 80 52", "Temel İlk Yardım", 2500, 2500, 0, fatih, 14],
    ["Selin Aydın", "0507 118 49 36", "Hijyen Eğitimi", 1200, 0, 0, yasin, 9],
    ["Emre Çelik", "0542 775 63 08", "DSP (Diğer Sağlık Personeli)", 9000, 3000, 0, yasin, 4],
  ];
  const kursiyerIds: number[] = [];
  kursiyerSpec.forEach(([full_name, phone, group_name, total, cash, bank, kasa_id, ago], i) => {
    const k: Kursiyer = {
      id: id(),
      full_name,
      tc: "",
      phone,
      email: "",
      city: i % 2 ? "Adana / Seyhan" : "Mersin / Yenişehir",
      group_name,
      list_no: "Aralık 2026",
      total_amount: total,
      cash_amount: cash,
      bank_amount: bank,
      remaining_amount: Math.max(0, total - cash - bank),
      kasa_id,
      plasiyer: i % 3 === 0 ? "Yasin" : "",
      notes: "",
      invoice_issue_date: daysAgo(ago),
      is_active: true,
      created_at: nowIso(),
    };
    d.kursiyerler.push(k);
    kursiyerIds.push(k.id);
  });

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

  d.seq = seq;
  return { data: d, kursiyerIds };
}
