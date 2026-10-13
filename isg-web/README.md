# İsgora Web — İş Sağlığı ve Güvenliği App

İsgora mobil uygulamasının (Expo / React Native) web sürümü. Aynı modüller, aynı iş kuralları ve aynı marka; telefonda, tablette ve masaüstünde çalışır. Paylaşımlı cPanel hosting'de **PHP + SQLite** ile çalışacak şekilde paketlenir.

## Modüller

| Modül | Adres | Öne çıkanlar |
|---|---|---|
| Ana Sayfa | `/app` | Net kasa, bu ay gelir/gider, alacak, uyarılar, hızlı işlemler, modül kartları, 6 aylık gelir/gider grafiği, risk seviyesi dağılımı |
| Risk Analizi | `/app/risk` | Yapay zekâ ile 5x5 L tipi matris (plan → bölüm bölüm üretim → sektöre özel uygulama), kaldığı yerden devam, 5x5 ısı haritası, madde düzenleme + "AI ile güçlendir", 4 sayfalı Excel ve PDF |
| Kasa / Cari | `/app/kasa` | Çoklu kasa, gelir/gider kategorileri, ay ve tür filtresi, arama, Excel'e aktarım |
| Müşteri Takip | `/app/musteri` | Kursiyer sözleşme/tahsilat/kalan, hızlı tahsilat, kasaya otomatik ve çift kayıtsız yansıma, Excel/CSV içe aktarma, WhatsApp/arama |
| Sınıflar | `/app/siniflar` | Liste yapıştırarak üye ekleme (numara ayrıştırma), Müşteri Takip'ten aktarma, WhatsApp sırası / toplu SMS duyurusu |
| Sınav Hazırlık | `/app/sinav` | Ders bazında ön/son test, 25–50 soruluk deneme, süre, cevap anahtarı, geçme notu 70; kendi `sorular.json` bankanızı içe aktarma |
| İsgora Asistan | `/app/asistan` | Canlı veriyi görür, mevzuat sorularını yanıtlar; kasa hareketi / kursiyer / tahsilat kayıtlarını **onayınızla** girer |
| Mevzuat Rehberi | `/app/mevzuat` | 6331 ve yönetmeliklerden saha özeti, arama |
| Kaza / Ramak Kala | `/app/kaza` | Olay kaydı, kök neden, SGK 3 iş günü son gün takibi, tutanak yazdırma |
| Saha Denetimi | `/app/denetim` | 4 kontrol listesi şablonu, uygunluk puanı, PDF rapor |
| İSG Hesaplayıcı | `/app/hesap` | Uzman/hekim/DSP süresi, temsilci, ilk yardımcı, destek elemanı, KSH/KAH, hızlı 5x5 skor |
| Periyodik Muayene | `/app/muayene` | İşyeri hekimi için işe giriş / periyodik muayene takibi, tehlike sınıfına göre otomatik sonraki muayene tarihi, geciken / yaklaşan listesi |
| Ayarlar | `/app/ayarlar` | API anahtarı, model ve düşünme düzeyi, kasalar, kategoriler, JSON yedek / geri yükleme, örnek veri |

Ctrl/⌘ + K ile her yerden hızlı arama ve gezinme açılır.

## Roller

Kayıt ekranında (`/giris.php?kayit=1`) rol seçilir; ana sayfa, menüler, mobil alt sekmeler ve asistan role göre hazırlanır. Her kullanıcının verisi kendine aittir; rol Ayarlar'dan değiştirilebilir.

| Rol | Kayıtta sorulanlar | Açık modüller |
|---|---|---|
| OSGB / Eğitim Kurumu | Kurum adı*, il | Hepsi (risk, kasa, müşteri, sınıflar, sınav, asistan, mevzuat, kaza, denetim, hesaplayıcı, muayene) |
| İş Güvenliği Uzmanı | Uzmanlık sınıfı (A/B/C), firma, il | Risk, denetim, kaza, mevzuat, hesaplayıcı, asistan |
| İşyeri Hekimi / Doktor | Kurum / hastane, il | Periyodik muayene, kaza / meslek hastalığı, risk, mevzuat, hesaplayıcı, asistan |
| Öğrenci / Uzman Adayı | Hedef sınav, sınav tarihi, kurs | Sınav hazırlık, mevzuat, hesaplayıcı, asistan |

Asistan: OSGB rolünde kasa/kursiyer kaydı giren araçlarla (onaylı) çalışır; uzman, hekim ve öğrenci rollerinde kendi verilerini gören uzman / öğretmen asistanıdır. İlk açılan hesap yöneticidir; kayıtları `api/config.php` içindeki `kayit_acik` (aç/kapa) ve `kayit_kodu` (davet kodu) ile sınırlayabilirsiniz.

## Mimari (cPanel / PHP + SQLite)

- **Arayüz:** Next.js statik dışa aktarım (`npm run build` → `out/`). Sunucuda Node gerekmez.
- **Sunucu:** `public/api/index.php` (API + Claude vekili) ve `public/giris.php` (giriş / ilk kurulum). Derlemede `out/` içine kopyalanır.
- **Veritabanı:** SQLite. İlk açılışta `data/` klasöründe rastgele adlı bir `.sqlite` dosyası ve `data/config.local.php` oluşur. Her modülün kendi tablosu vardır (`hareketler`, `kursiyerler`, `risk_maddeleri`, `muayeneler`, …); her satır `kullanici_id` ile sahibine bağlıdır, alanlar mobil uygulamadaki adlarla JSON olarak tutulur. Eski tek kullanıcılı veritabanı ilk açılışta otomatik taşınır.
- **Giriş / kayıt:** E-posta + şifre. İlk hesap yönetici olur (`setup_code` doluysa kod sorulur). Oturum 30 gün geçerli, HMAC imzalı çerezle tutulur; 15 dakikada 8 hatalı girişte ve saatte 5'ten fazla kayıtta IP geçici olarak engellenir.
- **Güvenlik:** `data/`, `api/_lib.php`, `api/config.php` ve `.sqlite` dosyaları `.htaccess` ile dışarıya kapalı; veri yazan istekler özel bir başlık ister (CSRF koruması).
- **Senkronizasyon:** Uygulama açılışta verileri sunucudan alır, her değişiklikten sonra yalnızca değişen tabloları gönderir; iki sekme/cihaz aynı anda yazarsa sürüm çakışması algılanıp sayfa güncel veriyle yenilenir. Sağ üstte "Kaydedildi / Kaydediliyor…" göstergesi vardır.

## Yapay zekâ (Claude)

Varsayılan model **Claude Opus 5.5**; Ayarlar'dan Sonnet 5.5 veya Haiku 5.5 seçilebilir. Her kullanıcı kendi anahtarını **Ayarlar → Yapay Zekâ**'dan bir kez girer; anahtar sunucudaki veritabanında o kullanıcıya bağlı saklanır ve tüm cihazlarında geçerli olur. `api/config.php` içindeki `anthropic_api_key` doldurulursa anahtarı olmayan tüm kullanıcılar bu ortak anahtarı kullanır. İstekler giriş yapmış kullanıcı için `/api/anthropic/…` vekili (PHP cURL) üzerinden gider. İsterseniz anahtarı `api/config.php` içindeki `anthropic_api_key` alanına da yazabilirsiniz.

## cPanel'e yükleme

1. `npm install && npm run build && npm run package` → `isgora-site.zip` (dosyalar 644, klasörler 755 izinli).
2. cPanel → **Dosya Yöneticisi** → alan adının **Document Root** klasörü (ör. `isgora.com/`).
3. Zip'i yükleyin → sağ tık → **Extract**. `index.html`, `giris.php`, `api/`, `_next/`, `.htaccess` doğrudan bu klasörde olmalı.
4. `https://alanadiniz/giris.php` → ilk hesabı (yönetici) oluşturun. Diğer kullanıcılar `giris.php?kayit=1` adresinden rol seçerek kayıt olur.
5. SSL aktif olunca `.htaccess` içindeki HTTPS yönlendirme satırlarının başındaki `#` işaretlerini kaldırın.

Gereksinimler: PHP 7.3+ (8.x önerilir), `pdo_sqlite` ve `curl` eklentileri (cPanel → Select PHP Version), `data/` klasörüne yazma izni.

**Güncelleme:** Yeni zip'i aynı klasöre açmanız yeterli; `data/` içindeki veritabanı ve `config.local.php` pakette olmadığı için korunur.

**Şifre sıfırlama (yönetici):** Dosya Yöneticisi'nde `data/` klasörüne `SIFRE-SIFIRLA` adlı boş bir dosya oluşturup `giris.php?sifirla=1` adresini açın.

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
    types.ts, format.ts, risk.ts, nav.ts, print.ts
    ai/                    client.ts, risk.ts, riskRunner.ts, assistant.ts
    export/                risk-excel.ts, risk-pdf.ts
  data/                    mevzuat, denetim şablonları, soru bankası
public/
  api/index.php, api/_lib.php, api/config.php   PHP API + SQLite
  giris.php                giriş / ilk kurulum
  .htaccess                güvenlik, yönlendirme, önbellek
```
