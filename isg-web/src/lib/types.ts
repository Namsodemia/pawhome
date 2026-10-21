// İsgora veri modeli — mobil uygulamadaki SQLite şemasının birebir web karşılığı.

export type TrxType = "gelir" | "gider";
export type PayMethod = "nakit" | "banka" | "kart";

export interface Kasa {
  id: number;
  title: string;
  is_active: boolean;
}

export interface Category {
  id: number;
  type: TrxType;
  name: string;
}

export interface Trx {
  id: number;
  trx_date: string; // YYYY-MM-DD
  type: TrxType;
  kasa_id: number | null;
  category_id: number | null;
  payment_method: PayMethod;
  description: string;
  amount: number;
  /** 'manual' elle girilen; 'kursiyer' kursiyer tahsilatından otomatik (çift kayıt engeli) */
  ref_type: "manual" | "kursiyer";
  ref_id: number | null;
  created_at: string;
}

export interface Kursiyer {
  id: number;
  full_name: string;
  tc: string;
  phone: string;
  email: string;
  city: string;
  group_name: string;
  list_no: string;
  total_amount: number;
  cash_amount: number;
  bank_amount: number;
  remaining_amount: number;
  kasa_id: number | null;
  plasiyer: string;
  notes: string;
  invoice_issue_date: string;
  is_active: boolean;
  created_at: string;
  // ---- Firma bilgileri (Müşteri Takip firma bazlıdır; eski kayıtlarda bu alanlar yoktur) ----
  /** Firmada görüşülen yetkili kişi */
  yetkili?: string;
  tehlike_sinifi?: HazardClass | "";
  calisan_sayisi?: number;
  nace_kodu?: string;
  sgk_sicil?: string;
  adres?: string;
  /** Hizmet sözleşmesinin bitiş tarihi (YYYY-MM-DD) */
  sozlesme_bitis?: string;
  /** Firmaya atanan OSGB çalışanları (kullanıcı id — bkz. ?r=ekip) */
  igu_id?: number | null;
  ih_id?: number | null;
  dsp_id?: number | null;
}
export type KursiyerInput = Omit<Kursiyer, "id" | "is_active" | "created_at">;
/** Müşteri Takip'teki kayıtlar artık firmadır; veri modeli geriye dönük uyum için "kursiyerler" koleksiyonunda kalır. */
export type Firma = Kursiyer;
export type FirmaInput = KursiyerInput;

export type HazardClass = "AZ TEHLİKELİ" | "TEHLİKELİ" | "ÇOK TEHLİKELİ";
export type AnalysisStatus = "taslak" | "uretiliyor" | "hazir";

export interface Analysis {
  id: number;
  title: string;
  nace_code: string;
  sector_name: string;
  hazard_class: HazardClass;
  /** Kullanıcı formda "Otomatik belirle" seçtiyse true — plan adımında AI belirler */
  hazard_auto: boolean;
  description: string;
  item_count: number;
  activity_desc: string;
  personnel: string;
  employer_label: string;
  sektor_uygulama: string;
  status: AnalysisStatus;
  analysis_date: string;
  created_at: string;
  /** Üretimin yapay zekâ sorgu kimliği: yarım kalan üretimi tamamlamak yeni hak harcamaz */
  sorgu_id?: string;
}

export interface RiskRow {
  id: number;
  analysis_id: number;
  sort_no: number;
  bolum: string;
  faaliyet: string;
  tehlike: string;
  risk: string;
  o: number; // olasılık 1-5
  s: number; // şiddet 1-5
  onlem: string;
  sorumlu: string;
}
export type RiskRowInput = Omit<RiskRow, "id" | "analysis_id" | "sort_no">;

export type SinavTur = "on" | "son" | "hepsi" | "karisik";
export interface SinavSonuc {
  id: number;
  ders_sira: number | null;
  tur: SinavTur;
  dogru: number;
  toplam: number;
  sure_sn: number;
  created_at: string;
}

export type OlayTur = "kaza" | "ramak_kala" | "tehlikeli_durum" | "meslek_hastaligi";
export interface Olay {
  id: number;
  tur: OlayTur;
  tarih: string;
  saat: string;
  isyeri: string;
  yer: string;
  kisi: string;
  aciklama: string;
  yaralanma: string;
  kok_neden: string;
  onlem: string;
  sgk_bildirildi: boolean;
  kayip_gun: number;
  created_at: string;
}
export type OlayInput = Omit<Olay, "id" | "created_at">;

export type Cevap = "uygun" | "uygunsuz" | "na";
export interface Denetim {
  id: number;
  isyeri: string;
  tarih: string;
  sablon: string;
  cevaplar: Record<number, Cevap>;
  notlar: string;
  puan: number;
  created_at: string;
}
export type DenetimInput = Omit<Denetim, "id" | "created_at">;

export interface Sinif {
  id: number;
  ad: string;
  aciklama: string;
  renk: string;
  created_at: string;
}
export interface Uye {
  id: number;
  sinif_id: number;
  ad: string;
  /** normalize edilmiş: 905xxxxxxxxx */
  telefon: string | null;
  not_: string;
  kursiyer_id: number | null;
  created_at: string;
}
export type MesajKanal = "whatsapp" | "sms" | "not";
export interface Mesaj {
  id: number;
  sinif_id: number;
  metin: string;
  kanal: MesajKanal;
  alici_sayisi: number;
  created_at: string;
}

/** İşyeri hekimi — sağlık gözetimi (periyodik muayene) kaydı */
export type MuayeneTur = "ise_giris" | "periyodik" | "ise_donus" | "gorev_degisikligi";
export type MuayeneSonuc = "calisabilir" | "kisitli" | "calisamaz";
export interface Muayene {
  id: number;
  calisan: string;
  tc: string;
  isyeri: string;
  gorev: string;
  hazard_class: HazardClass;
  tur: MuayeneTur;
  tarih: string; // muayene tarihi
  sonraki: string; // bir sonraki periyodik muayene tarihi
  sonuc: MuayeneSonuc;
  tetkikler: string[];
  notlar: string;
  created_at: string;
}
export type MuayeneInput = Omit<Muayene, "id" | "created_at">;

/** Eğitim modülü — kullanıcının bir kurstaki ilerlemesi (kurs başına tek kayıt) */
export interface EgitimKayit {
  id: number;
  kurs_id: string;
  /** Tamamlanan ders kimlikleri */
  tamamlanan: string[];
  /** Son bitirme sınavı puanı (0–100) */
  sinav_puan: number | null;
  /** Bitirme sınavını geçtiği an — sertifika tarihi */
  basarili_at: string | null;
  sertifika_no: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMsg {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export type ModelId = "claude-opus-5-5" | "claude-sonnet-5-5" | "claude-haiku-5-5";
export type Effort = "low" | "medium" | "high";

export interface Settings {
  model: ModelId;
  effort: Effort;
  /** Raporlarda görünen firma / OSGB adı */
  firma: string;
}
