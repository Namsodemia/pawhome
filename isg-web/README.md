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
| Ayarlar | `/app/ayarlar` | API anahtarı, model ve düşünme düzeyi, kasalar, kategoriler, JSON yedek / geri yükleme, örnek veri |

Ctrl/⌘ + K ile her yerden hızlı arama ve gezinme açılır.

## Mimari (cPanel / PHP + SQLite)

- **Arayüz:** Next.js statik dışa aktarım (`npm run build` → `out/`). Sunucuda Node gerekmez.
- **Sunucu:** `public/api/index.php` (API + Claude vekili) ve `public/giris.php` (giriş / ilk kurulum). Derlemede `out/` içine kopyalanır.
- **Veritabanı:** SQLite. İlk açılışta `data/` klasöründe rastgele adlı bir `.sqlite` dosyası ve `data/config.local.php` oluşur. Her modülün kendi tablosu vardır (`hareketler`, `kursiyerler`, `risk_maddeleri`, …); kayıtlar mobil uygulamadaki alan adlarıyla JSON olarak tutulur.
- **Giriş:** İlk ziyarette yönetici hesabı oluşturulur (`api/config.php` içindeki `setup_code` doluysa kurulum kodu sorulur). Oturum 30 gün geçerli, HMAC imzalı çerezle tutulur; 15 dakikada 8 hatalı denemede IP geçici olarak engellenir.
- **Güvenlik:** `data/`, `api/_lib.php`, `api/config.php` ve `.sqlite` dosyaları `.htaccess` ile dışarıya kapalı; veri yazan istekler özel bir başlık ister (CSRF koruması).
- **Senkronizasyon:** Uygulama açılışta verileri sunucudan alır, her değişiklikten sonra yalnızca değişen tabloları gönderir; iki sekme/cihaz aynı anda yazarsa sürüm çakışması algılanıp sayfa güncel veriyle yenilenir. Sağ üstte "Kaydedildi / Kaydediliyor…" göstergesi vardır.

## Yapay zekâ (Claude)

Varsayılan model **Claude Opus 5.5**; Ayarlar'dan Sonnet 5.5 veya Haiku 5.5 seçilebilir. Anahtar **Ayarlar → Yapay Zekâ**'dan bir kez girilir, sunucudaki veritabanında saklanır ve tüm cihazlarda geçerli olur. İstekler giriş yapmış kullanıcı için `/api/anthropic/…` vekili (PHP cURL) üzerinden gider. İsterseniz anahtarı `api/config.php` içindeki `anthropic_api_key` alanına da yazabilirsiniz.

## cPanel'e yükleme

1. `npm install && npm run build` → `out/` klasörü oluşur (hazır paket: `out/` içeriğinin zip'i).
2. cPanel → **Dosya Yöneticisi** → alan adının **Document Root** klasörü (ör. `isgora.com/`).
3. Zip'i yükleyin → sağ tık → **Extract**. `index.html`, `giris.php`, `api/`, `_next/`, `.htaccess` doğrudan bu klasörde olmalı.
4. `https://alanadiniz/giris.php` → yönetici hesabını oluşturun.
5. SSL aktif olunca `.htaccess` içindeki HTTPS yönlendirme satırlarının başındaki `#` işaretlerini kaldırın.

Gereksinimler: PHP 7.3+ (8.x önerilir), `pdo_sqlite` ve `curl` eklentileri (cPanel → Select PHP Version), `data/` klasörüne yazma izni.

**Güncelleme:** Yeni zip'i aynı klasöre açmanız yeterli; `data/` içindeki veritabanı ve `config.local.php` pakette olmadığı için korunur.

**Şifre sıfırlama:** Dosya Yöneticisi'nde `data/` klasörüne `SIFRE-SIFIRLA` adlı boş bir dosya oluşturup `giris.php?sifirla=1` adresini açın.

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
