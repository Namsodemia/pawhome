# İsgora Web — İş Sağlığı ve Güvenliği App

İsgora mobil uygulamasının (Expo / React Native) web sürümü. Aynı modüller, aynı iş kuralları ve aynı marka; telefonda, tablette ve masaüstünde çalışır. Paylaşımlı cPanel hosting'de **PHP + SQLite** ile çalışacak şekilde paketlenir.

## Modüller

| Modül | Adres | Öne çıkanlar |
|---|---|---|
| Ana Sayfa | `/app` | Net kasa, bu ay gelir/gider, alacak, uyarılar, hızlı işlemler, modül kartları, 6 aylık gelir/gider grafiği, risk seviyesi dağılımı |
| Risk Analizi | `/app/risk` | Yapay zekâ ile 5x5 L tipi matris (plan → bölüm bölüm üretim → sektöre özel uygulama), kaldığı yerden devam, 5x5 ısı haritası, madde düzenleme + "AI ile güçlendir", 4 sayfalı Excel ve PDF |
| Kasa / Cari | `/app/kasa` | Çoklu kasa, gelir/gider kategorileri, ay ve tür filtresi, arama, Excel'e aktarım |
| Müşteri Takip | `/app/musteri` | **Firmalar:** sözleşme/tahsilat/kalan, tehlike sınıfı, çalışan sayısı, SGK sicil, NACE, atanan İGU/İH/DSP; kasaya otomatik ve çift kayıtsız yansıma, Excel/CSV içe aktarma. **Çalışanlar:** OSGB'nin İGU / işyeri hekimi / DSP hesapları (e-posta + şifre), aktif/pasif, şifre yenileme |
| Sınıflar | `/app/siniflar` | Liste yapıştırarak üye ekleme (numara ayrıştırma), WhatsApp sırası / toplu SMS duyurusu, **katılım kodu**: öğrenciler kodla sınıfa katılır, duyuruları uygulamada görür |
| Sınıfım | `/app/sinifim` | Öğrenci: katılım koduyla sınıfa girme, kurumun duyuruları |
| Eğitimler | `/app/egitim` | Temel İş Sağlığı ve Güvenliği Eğitimi: dersler, pekiştirme soruları, 20 soruluk bitirme sınavı, yazdırılabilir katılım belgesi |
| Sınav Hazırlık | `/app/sinav` | Ders bazında ön/son test, 25–50 soruluk deneme, süre, cevap anahtarı, geçme notu 70; kendi `sorular.json` bankanızı içe aktarma |
| İsgora Asistan | `/app/asistan` | Canlı veriyi görür, mevzuat sorularını yanıtlar; kasa hareketi / firma / tahsilat kayıtlarını **onayınızla** girer. Kendi anahtarı olmayan her hesaba 4 ücretsiz soru |
| Mevzuat Rehberi | `/app/mevzuat` | 6331 ve yönetmeliklerden saha özeti, arama |
| Kaza / Ramak Kala | `/app/kaza` | Olay kaydı, kök neden, SGK 3 iş günü son gün takibi, tutanak yazdırma |
| Saha Denetimi | `/app/denetim` | 4 kontrol listesi şablonu, uygunluk puanı, PDF rapor |
| İSG Hesaplayıcı | `/app/hesap` | Uzman/hekim/DSP süresi, temsilci, ilk yardımcı, destek elemanı, KSH/KAH, hızlı 5x5 skor |
| Periyodik Muayene | `/app/muayene` | İşyeri hekimi için işe giriş / periyodik muayene takibi, tehlike sınıfına göre otomatik sonraki muayene tarihi, geciken / yaklaşan listesi |
| Ayarlar | `/app/ayarlar` | API anahtarı, model ve düşünme düzeyi, kasalar, kategoriler, JSON yedek / geri yükleme, örnek veri |

Ctrl/⌘ + K ile her yerden hızlı arama ve gezinme açılır.

## Roller

Kayıt ekranında (`/giris.php?kayit=1`) rol seçilir; ana sayfa, menüler, mobil alt sekmeler ve asistan role göre hazırlanır. Her kullanıcının verisi kendine aittir; rol Ayarlar'dan değiştirilebilir (OSGB'nin açtığı çalışan hesaplarında rol OSGB'ye aittir).

| Rol | Kayıtta sorulanlar (* zorunlu) | Açık modüller |
|---|---|---|
| OSGB / Eğitim Kurumu | Kurum adı*, yetki belgesi no, vergi no, adres | Hepsi (risk, kasa, müşteri/çalışanlar, sınıflar, sınav, eğitimler, asistan, mevzuat, kaza, denetim, hesaplayıcı, muayene) |
| İş Sağlığı ve Güvenliği Uzmanı (İGU) | Çalıştığı firma / OSGB*, uzmanlık sınıfı (A/B/C)*, belge no, deneyim | Risk, denetim, kaza, eğitimler, mevzuat, hesaplayıcı, asistan |
| İşyeri Hekimi (İH) | Kurum / OSGB / hastane, belge no, uzmanlık alanı | Periyodik muayene, kaza / meslek hastalığı, risk, eğitimler, mevzuat, hesaplayıcı, asistan |
| Diğer Sağlık Personeli (DSP) | Meslek*, kurum, belge no | Periyodik muayene, kaza, risk, eğitimler, mevzuat, hesaplayıcı, asistan |
| Öğrenci / Uzman Adayı | Eğitim aldığı eğitim kurumu*, hedef sınav*, bölüm, sınıf katılım kodu | Sınav hazırlık, Sınıfım, eğitimler, mevzuat, hesaplayıcı, asistan |

Tüm rollerde ad soyad*, e-posta*, cep telefonu*, il* (ilçe isteğe bağlı), şifre* ve kişisel veri onayı* istenir. Kayıttan sonra e-postaya **6 haneli doğrulama kodu (OTP)** gider; kod girilmeden hesap açılmaz. Giriş sayfasında "E-postaya gelen kodla giriş" ve "Şifremi unuttum" (kodla şifre yenileme) da vardır.

**OSGB çalışanları:** OSGB, Müşteri Takip → Çalışanlar'dan İGU / İH / DSP için e-posta + şifreli hesap açar (e-postası doğrulanmış sayılır, kişiye bilgilendirme e-postası gider; şifre gönderilmez). Firmalara atanan çalışan, kendi ana sayfasında "Atandığınız firmalar" kartını görür. OSGB hesabı pasifleştirebilir, şifre yenileyebilir ya da hesabı tüm verisiyle silebilir. OSGB kendi Claude anahtarını kaydetmişse çalışanları da onu sınırsız kullanır.

**Sınıfa katılım:** OSGB sınıf ekranında katılım kodu üretir ve davet bağlantısını (`/giris.php?kayit=1&rol=ogrenci&sinif=KOD`) paylaşır. Öğrenci kayıt olurken ya da Sınıfım sayfasından kodu girer; OSGB'nin o sınıfa gönderdiği mesajları duyuru olarak görür.

İlk açılan hesap yöneticidir; kayıtları `api/config.php` içindeki `kayit_acik` (aç/kapa) ve `kayit_kodu` (davet kodu) ile sınırlayabilirsiniz.

## Mimari (cPanel / PHP + SQLite)

- **Arayüz:** Next.js statik dışa aktarım (`npm run build` → `out/`). Sunucuda Node gerekmez.
- **Sunucu:** `public/api/index.php` (API + Claude vekili) ve `public/giris.php` (giriş / ilk kurulum). Derlemede `out/` içine kopyalanır.
- **Veritabanı:** SQLite. İlk açılışta `data/` klasöründe rastgele adlı bir `.sqlite` dosyası ve `data/config.local.php` oluşur. Her modülün kendi tablosu vardır (`hareketler`, `kursiyerler`, `risk_maddeleri`, `muayeneler`, …); her satır `kullanici_id` ile sahibine bağlıdır, alanlar mobil uygulamadaki adlarla JSON olarak tutulur. Eski tek kullanıcılı veritabanı ilk açılışta otomatik taşınır.
- **Giriş / kayıt:** E-posta + şifre, e-posta doğrulama kodu (OTP, 10 dk geçerli, kod başına 5 deneme, 60 sn'de bir yeniden gönderim, adres başına saatte 6 e-posta). İlk hesap yönetici olur (`setup_code` doluysa kod sorulur; e-posta doğrulaması istenmez). Oturum 30 gün geçerli, HMAC imzalı çerezle tutulur; 15 dakikada 8 hatalı girişte ve saatte 5'ten fazla kayıtta IP geçici olarak engellenir.
- **E-posta:** Varsayılan olarak PHP `mail()` (cPanel'de hazır). Gönderen adresi `mail_from` (boşsa `no-reply@alanadiniz`); cPanel → E-posta Hesapları'ndan bu adresi açmanız teslim oranını artırır. İsterseniz `api/config.php` içinde `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass` ile SMTP kullanılır.
- **Güvenlik:** `data/`, `api/_lib.php`, `api/config.php` ve `.sqlite` dosyaları `.htaccess` ile dışarıya kapalı; veri yazan istekler özel bir başlık ister (CSRF koruması).
- **Senkronizasyon:** Uygulama açılışta verileri sunucudan alır, her değişiklikten sonra yalnızca değişen tabloları gönderir; iki sekme/cihaz aynı anda yazarsa sürüm çakışması algılanıp sayfa güncel veriyle yenilenir. Sağ üstte "Kaydedildi / Kaydediliyor…" göstergesi vardır.

## Yapay zekâ (Claude)

Varsayılan model **Claude Opus 5.5**; Ayarlar'dan Sonnet 5.5 veya Haiku 5.5 seçilebilir. İstekler giriş yapmış kullanıcı için `/api/anthropic/…` vekili (PHP cURL) üzerinden gider.

- **Ücretsiz deneme:** Yönetici, **Ayarlar → Yapay Zekâ → Ortak API anahtarı**'na bir anahtar girer (ya da `api/config.php` → `anthropic_api_key`). Kendi anahtarı olmayan her kullanıcı bu anahtarla **4 soru** sorar (`ucretsiz_ai_sorgu` ile değiştirilebilir). Anahtar bir çalışma alanına bağlı değilse `anthropic_workspace_id` doldurulmalıdır. Asistana sorulan bir soru, araç turlarıyla birlikte tek sorgu sayılır; başarısız istekler sayılmaz. Yönetici sınırsızdır.
- **Kendi anahtarı:** Kullanıcı **Ayarlar → Yapay Zekâ**'dan anahtarını bir kez girer; sunucuda o kullanıcıya bağlı saklanır, tüm cihazlarında sınırsız geçerli olur.

## cPanel'e yükleme

1. `npm install && npm run build && npm run package` → `isgora-site.zip` (dosyalar 644, klasörler 755 izinli).
2. cPanel → **Dosya Yöneticisi** → alan adının **Document Root** klasörü (ör. `isgora.com/`).
3. Zip'i yükleyin → sağ tık → **Extract**. `index.html`, `giris.php`, `api/`, `_next/`, `.htaccess` doğrudan bu klasörde olmalı.
4. `https://alanadiniz/giris.php` → ilk hesabı (yönetici) oluşturun. Diğer kullanıcılar `giris.php?kayit=1` adresinden rol seçerek kayıt olur.
5. SSL aktif olunca `.htaccess` içindeki HTTPS yönlendirme satırlarının başındaki `#` işaretlerini kaldırın.

Gereksinimler: PHP 7.3+ (8.x önerilir), `pdo_sqlite` ve `curl` eklentileri (cPanel → Select PHP Version), `data/` klasörüne yazma izni.

**Güncelleme:** Yeni zip'i aynı klasöre açmanız yeterli; `data/` içindeki veritabanı ve `config.local.php` pakette olmadığı için korunur.

**Şifre sıfırlama:** Herkes giriş sayfasındaki "Şifremi unuttum" ile e-postaya gelen kodla şifresini yeniler. E-posta çalışmıyorsa (yönetici için): Dosya Yöneticisi'nde `data/` klasörüne `SIFRE-SIFIRLA` adlı boş bir dosya oluşturup `giris.php?sifirla=1` adresini açın.

## Yerelde çalıştırma

```bash
cd isg-web
npm install
npm run dev        # http://localhost:3000 (PHP olmadan: veriler tarayıcıda, "yerel mod")
npm run build      # out/ — cPanel'e yüklenecek klasör
php -S 127.0.0.1:8080 -t out   # PHP arka ucuyla yerel deneme (Apache yönlendirmeleri hariç)
npm run typecheck  # tip kontrolü
npm run lint
```

## Yapı

```
src/
  app/
    page.tsx               tanıtım sayfası
    app/                   uygulama (/app/*) — her modül kendi klasöründe
  components/              ui.tsx (ortak bileşenler), feedback.tsx (bildirim/onay), shell/
  lib/
    store.ts               zustand; tüm tablolar ve iş kuralları
    sync.ts                PHP/SQLite sunucusuyla senkronizasyon
    api.ts                 kullanıcılar arası işlemler: OSGB çalışanları, atamalar, sınıf katılımı, ortak AI anahtarı
    roles.ts               roller, rol başına modüller ve profil alanları
    types.ts, format.ts, risk.ts, nav.ts, print.ts
    ai/                    client.ts, risk.ts, riskRunner.ts, assistant.ts
    export/                risk-excel.ts, risk-pdf.ts
  data/                    mevzuat, denetim şablonları, soru bankası, eğitim içeriği (egitim.ts)
public/
  api/index.php, api/_lib.php, api/config.php   PHP API + SQLite
  giris.php                giriş / ilk kurulum
  .htaccess                güvenlik, yönlendirme, önbellek
```
