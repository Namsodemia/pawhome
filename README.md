# PawHome (Next.js)

Tek codebase, üç hedef:

1. **Web sitesi** (pazarlama) → `/`, `/features`, `/pricing`, `/about`, `/blog`, `/sss`, `/contact`
2. **Mobil PWA** (giriş gerektirir) → `/app/*`
3. **iOS + Android app** → Capacitor ile aynı Next.js sunucusunu WebView'da gösterir

PHP versiyonundan **Next.js 15 + TypeScript + Prisma + NextAuth v5** kurgusuna çevrilmiş hali.

## Özellikler

### Web (Public)
- Landing page (hero, özellikler, sosyal kanıt, CTA)
- Özellikler, Fiyatlandırma, Hakkımızda, Blog, SSS, İletişim sayfaları
- Responsive: mobil, tablet, desktop

### App (Authenticated, `/app/*`)
- E-posta/şifre ile kayıt + giriş (NextAuth v5 + bcrypt)
- Evcil hayvan profili, sağlık/enerji skorları
- Hatırlatıcılar (aşı, mama, yürüyüş, vet randevusu)
- Forum/topluluk (kategori bazlı paylaşım)
- VetAI sohbet (OpenAI **gpt-4o-mini**, server-side proxy)
- Klinik listesi (geolokasyon + Haversine mesafe)
- Bildirim tercihleri
- Abonelik sayfası (UI)

### Mobile (Capacitor)
- iOS + Android native shell
- Aynı Next.js backend'i kullanır
- Detay: [MOBILE.md](MOBILE.md)

## Stack

- Next.js 15 (App Router, RSC, Server Actions)
- TypeScript
- Tailwind CSS 3
- Prisma 5 + MySQL
- NextAuth v5 (Auth.js) — JWT session
- OpenAI API (gpt-4o-mini)
- Zod (validation)
- bcryptjs
- Capacitor 8 (iOS + Android)

## Kurulum

```bash
# 1. Bağımlılıklar
npm install

# 2. .env'i oluştur (cp .env.example .env)
# Aşağıdaki değerleri doldur:
#   DATABASE_URL  — MySQL connection string
#   AUTH_SECRET   — openssl rand -base64 32 ile üret
#   OPENAI_API_KEY — VetAI için
#   OPENAI_MODEL   — default: gpt-4o-mini

# 3. Veritabanı şemasını oluştur
npx prisma migrate dev --name init

# 4. (Opsiyonel) Demo veriyi yükle
npm run db:seed
# Demo giriş: demo@pawhome.app / demo1234

# 5. Çalıştır
npm run dev
```

Tarayıcı → http://localhost:3000

## URL Yapısı

| URL | Erişim | Ne |
|---|---|---|
| `/` | Public | Landing page |
| `/features`, `/pricing`, `/about`, `/blog`, `/sss`, `/contact` | Public | Pazarlama sayfaları |
| `/login`, `/register` | Public | Auth (giriş yapılmışsa /app'e redirect) |
| `/logout` | Public | Oturumu sonlandır, /login'e redirect |
| `/app` | Auth | Ana dashboard (eski index.php) |
| `/app/profil` | Auth | Profil sayfası |
| `/app/hesap` | Auth | Hesap ayarları |
| `/app/planlar` | Auth | Tüm hatırlatıcılar |
| `/app/forum` | Auth | Topluluk |
| `/app/klinikler` | Auth | Klinik bulucu |
| `/app/vet-ai` | Auth | VetAI sohbet |
| `/app/chat` | Auth | → /app/vet-ai (redirect) |
| `/app/abonelik`, `/app/bildirimler`, `/app/yardim`, `/app/sozlesmeler` | Auth | Yardımcı sayfalar |
| `/api/auth/[...nextauth]` | Public | NextAuth handlers |
| `/api/pets`, `/api/reminders`, `/api/posts`, `/api/notifications`, `/api/vet-ai` | Auth | App API endpoints |

Korumalı route'lara giriş yapmadan erişilirse otomatik `/login`'e yönlendirilir (`middleware.ts`).

## Dizin Yapısı

```
src/
├── app/
│   ├── (marketing)/         # public website (no auth)
│   │   ├── layout.tsx       # nav + footer
│   │   ├── page.tsx         # landing
│   │   ├── features/
│   │   ├── pricing/
│   │   ├── about/
│   │   ├── blog/
│   │   ├── sss/
│   │   └── contact/
│   ├── (auth)/              # login, register, logout
│   ├── app/                 # authenticated app (URL: /app/*)
│   │   ├── layout.tsx       # auth check + bottom nav
│   │   ├── page.tsx         # dashboard (/app)
│   │   ├── profil/, hesap/, planlar/, forum/, klinikler/, vet-ai/, chat/, ...
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── pets/, reminders/, posts/, notifications/, vet-ai/
│   ├── layout.tsx           # root html
│   └── globals.css
├── auth.ts                  # NextAuth full config (Prisma+bcrypt)
├── auth.config.ts           # edge-safe minimal config (middleware)
├── middleware.ts            # auth-aware redirect
├── components/              # shared
│   ├── MarketingNav.tsx, MarketingFooter.tsx
│   ├── BottomNav.tsx
│   ├── AddPetModal.tsx, AddReminderModal.tsx, AddPostModal.tsx
│   └── HomeActions.tsx, LocationButton.tsx
├── lib/
│   ├── prisma.ts            # singleton client
│   └── utils.ts             # formatDateTR, avatar, Haversine, sessionUserId
├── types/
│   └── next-auth.d.ts       # session type augmentation
prisma/
├── schema.prisma            # User, Pet, Reminder, ForumPost, Clinic
└── seed.ts                  # demo data
capacitor.config.ts          # iOS+Android config
```

## Güvenlik Notları (PHP'den taşırken düzeltildi)

- **OpenAI API key:** Sadece server-side `.env` içinde, asla client'a gönderilmez. `/api/vet-ai` proxy yapar.
- **DB credentials:** `.env` içinde, kod içinde yok.
- **Şifreler:** `bcryptjs` ile hashleniyor.
- **Auth:** Middleware her korumalı route'u kontrol eder.

## Eksik / Mock Kalanlar

- Forum `likes` ve `comments` sayaçları varsayılan 0 — beğeni/yorum yazma sistemi yok.
- Abonelik / Stripe entegrasyonu yok (UI placeholder).
- Blog sayfaları statik veri — gerçek CMS bağlanmadı.
- İletişim formu sadece console.log ediyor — gerçek e-posta gönderimi (Resend/Postmark) bağlanmadı.
- Hatırlatıcı "tamamlandı" butonu — `PATCH /api/reminders` endpoint'i hazır ama UI bağlantısı yok.
- Push bildirimleri yok (eklemek için web push veya FCM gerekir).

## Yararlı Komutlar

```bash
npm run dev              # geliştirme sunucusu
npm run build            # production build
npm run start            # prod sunucusu
npm run prisma:studio    # DB'yi UI ile gör
npm run prisma:migrate   # yeni migration
npm run db:seed          # demo veri

# Mobile
npx cap sync             # web değişikliklerini iOS+Android'e yansıt
npx cap open ios         # Xcode'da aç
npx cap open android     # Android Studio'da aç
```
