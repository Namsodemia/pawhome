# İsgora Web — İş Sağlığı ve Güvenliği App

İsgora mobil uygulamasının (Expo / React Native) web sürümü. Aynı modüller, aynı iş kuralları ve aynı marka; telefonda, tablette ve masaüstünde çalışan, Vercel'e hazır bir Next.js uygulaması.

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

## Veriler nerede?

Mobil uygulamadaki çevrimdışı SQLite'ın karşılığı olarak tüm kayıtlar **tarayıcının IndexedDB'sinde** tutulur; sunucuya veri yazılmaz. Cihaz değiştirirken Ayarlar → **Yedeği indir (JSON)** / **Yedekten geri yükle** kullanın.

## Yapay zekâ (Claude)

Varsayılan model **Claude Opus 5.5** (`claude-opus-5-5`); Ayarlar'dan Sonnet 5.5 veya Haiku 5.5 seçilebilir. İki çalışma biçimi vardır:

1. **Kendi anahtarınız:** Ayarlar → Yapay Zekâ'ya Anthropic API anahtarınızı girin. İstekler doğrudan tarayıcınızdan Anthropic'e gider, anahtar yalnızca o tarayıcıda saklanır.
2. **Sunucu anahtarı:** Vercel'de `ANTHROPIC_API_KEY` tanımlarsanız kullanıcılar anahtar girmeden kullanabilir. İstekler `/api/anthropic` vekil rotasından geçer. Siteyi herkese açık yayınlıyorsanız `APP_ACCESS_CODE` da tanımlayın; kullanıcılar Ayarlar'a bu kodu girmeden sunucu anahtarını kullanamaz.

## Vercel'e yükleme

Bu klasör (`isg-web/`) bağımsız bir Next.js projesidir ve depo kökündeki PawHome projesinden ayrıdır.

1. https://vercel.com/new adresinde **Import Git Repository** → `Namsodemia/pawhome` deposunu seçin.
2. **Root Directory** olarak `isg-web` seçin (önemli). Framework otomatik olarak *Next.js* algılanır; build komutu `next build`.
3. (İsteğe bağlı) **Environment Variables**:
   - `ANTHROPIC_API_KEY` — sunucu anahtarı
   - `APP_ACCESS_CODE` — sunucu anahtarını korumak için erişim kodu
4. **Deploy**. Dal olarak bu çalışmanın dalını (veya birleştirildikten sonra `main`'i) seçin.

Komut satırından:

```bash
cd isg-web
npx vercel            # ilk kez: projeyi bağlar ve önizleme yükler
npx vercel --prod     # canlıya alır
```

## Yerelde çalıştırma

```bash
cd isg-web
npm install
npm run dev        # http://localhost:3000
npm run build      # üretim derlemesi
npm run typecheck  # tip kontrolü
npm run lint
```

## Yapı

```
src/
  app/
    page.tsx               tanıtım sayfası
    app/                   uygulama (/app/*) — her modül kendi klasöründe
    api/anthropic/[...path] Claude vekil rotası (sunucu anahtarı için)
    api/ai-status          sunucu anahtarı tanımlı mı?
  components/              ui.tsx (ortak bileşenler), feedback.tsx (bildirim/onay), shell/
  lib/
    store.ts               zustand + IndexedDB; tüm tablolar ve iş kuralları
    types.ts, format.ts, risk.ts, nav.ts, print.ts
    ai/                    client.ts, risk.ts, riskRunner.ts, assistant.ts
    export/                risk-excel.ts, risk-pdf.ts
  data/                    mevzuat, denetim şablonları, soru bankası
```
