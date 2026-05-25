# PawHome (Next.js)

Tek codebase, dört hedef:

1. **Web sitesi** (pazarlama) → `/`, `/features`, `/pricing`, `/about`, `/blog`, `/blog/[slug]`, `/sss`, `/contact`
2. **Mobil PWA** (giriş gerektirir) → `/app/*`
3. **Admin CMS** (sadece admin rolü) → `/admin/*`
4. **iOS + Android app** → Capacitor ile aynı Next.js sunucusunu WebView'da gösterir

PHP versiyonundan **Next.js 15 + TypeScript + Prisma + NextAuth v5** kurgusuna çevrilmiş + genişletilmiş.

## Özellikler

### Web (Public)
- Landing page (hero, telefon mockup, özellikler, testimonial, CTA)
- Özellikler, Fiyatlandırma, Hakkımızda, SSS, İletişim sayfaları
- **Blog** — DB'den çekiyor, dinamik `/blog/[slug]` detay sayfaları, ISR (5dk cache), Markdown render
- Responsive: mobil, tablet, desktop

### App (Authenticated, `/app/*`)
- E-posta/şifre ile kayıt + giriş (NextAuth v5 + bcrypt)
- Evcil hayvan profili, sağlık/enerji skorları
- Hatırlatıcılar (aşı, mama, yürüyüş, vet randevusu) — **tamamlandı butonu çalışıyor**
- **Forum** — gerçek beğeni (toggle, optimistic) + yorum sistemi (liste + ekle)
- VetAI sohbet (OpenAI **gpt-4o-mini** veya Google **Gemini 2.5 Flash**, server-side proxy)
- Klinik bulucu — **gerçek interaktif harita** (react-leaflet + OpenStreetMap), pin'ler, popup, geolokasyon
- Bildirim tercihleri + **Web Push** (VAPID, service worker)

### Admin CMS (`/admin/*`, role=admin)
- Dashboard: stat kartları, son aktiviteler
- Kullanıcı yönetimi (rol değiştir, ban, sil)
- Evcil hayvanlar (liste, sil)
- Forum moderasyonu (sabitle, soft/hard delete, restore)
- Klinikler CRUD (lat/lng, durum, puan)
- Blog CRUD (markdown editor, draft/published, otomatik slug)
- İletişim mesajları (status workflow: yeni → okundu → yanıtlandı)

### Mobile (Capacitor)
- iOS + Android native shell
- Aynı Next.js backend'i WebView üzerinden kullanır
- Detay: [MOBILE.md](MOBILE.md)

## Stack

- Next.js 15 (App Router, RSC, Server Actions)
- TypeScript
- Tailwind CSS 3 + Typography plugin
- Prisma 5 + MySQL
- NextAuth v5 (Auth.js) — JWT session
- OpenAI gpt-4o-mini **veya** Google Gemini 2.5 Flash
- react-leaflet + Leaflet (OpenStreetMap)
- web-push (VAPID Web Push)
- Zod, bcryptjs
- Capacitor 8 (iOS + Android)

## Kurulum

```bash
# 1. Bağımlılıklar
npm install

# 2. .env'i oluştur (cp .env.example .env)
# Aşağıdaki değerleri doldur:
#   DATABASE_URL    — MySQL connection string
#   AUTH_SECRET     — openssl rand -base64 32 ile üret
#   OPENAI_API_KEY  — VetAI için (opsiyonel)
#   GEMINI_API_KEY  — alternatif AI provider (opsiyonel)
#   NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY — push için

# 3. Veritabanı şemasını oluştur
npx prisma db push

# 4. Demo veriyi yükle
npm run db:seed
# Demo giriş: demo@pawhome.app  / demo1234
# Admin giriş: admin@pawhome.app / admin1234

# 5. Çalıştır
npm run dev
```

Tarayıcı → http://localhost:3000

## URL Yapısı

| URL | Erişim | Ne |
|---|---|---|
| `/` | Public | Landing page |
| `/features`, `/pricing`, `/about`, `/sss`, `/contact` | Public | Pazarlama sayfaları |
| `/blog` | Public | Blog listesi (DB'den) |
| `/blog/[slug]` | Public | Blog detay (Markdown render, ISR) |
| `/login`, `/register` | Public | Auth (giriş yapılmışsa /app'e redirect) |
| `/logout` | Public | Oturumu sonlandır |
| `/app` | Auth | Ana dashboard |
| `/app/profil`, `/app/hesap`, `/app/planlar` | Auth | Profil ve hatırlatıcılar |
| `/app/forum` | Auth | Topluluk (beğeni + yorum) |
| `/app/klinikler` | Auth | Gerçek harita + klinik listesi |
| `/app/vet-ai` | Auth | AI sohbet |
| `/app/bildirimler` | Auth | Push bildirim aboneliği |
| `/app/abonelik`, `/app/yardim`, `/app/sozlesmeler` | Auth | Yardımcı sayfalar |
| `/admin` | Admin | Dashboard |
| `/admin/users`, `/admin/pets`, `/admin/forum` | Admin | Moderasyon |
| `/admin/clinics`, `/admin/clinics/new`, `/admin/clinics/[id]` | Admin | Klinik CRUD |
| `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]` | Admin | Blog CRUD |
| `/admin/contacts` | Admin | İletişim mesajları |
| `/api/auth/[...nextauth]` | Public | NextAuth handlers |
| `/api/pets`, `/api/reminders`, `/api/posts`, `/api/notifications`, `/api/vet-ai` | Auth | App API |
| `/api/posts/[id]/like`, `/api/posts/[id]/comments` | Auth | Forum etkileşim |
| `/api/push/subscribe`, `/api/push/test` | Auth | Push subscription |

## Dizin Yapısı

```
src/
├── app/
│   ├── (marketing)/         # public website (no auth)
│   │   ├── layout.tsx       # nav + footer
│   │   ├── page.tsx         # landing
│   │   ├── features/, pricing/, about/, sss/, contact/
│   │   └── blog/
│   │       ├── page.tsx     # list from DB
│   │       └── [slug]/page.tsx  # detail with markdown
│   ├── (auth)/              # login, register, logout
│   ├── app/                 # authenticated app (URL: /app/*)
│   │   ├── layout.tsx, page.tsx
│   │   ├── profil/, hesap/, planlar/, forum/, klinikler/, vet-ai/, chat/
│   │   └── ...
│   ├── admin/               # admin CMS (URL: /admin/*)
│   │   ├── layout.tsx       # role guard + sidebar
│   │   ├── page.tsx         # dashboard
│   │   ├── users/, pets/, forum/, clinics/, blog/, contacts/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── pets/, reminders/, posts/, notifications/, vet-ai/
│   │   ├── posts/[id]/like/, posts/[id]/comments/
│   │   └── push/subscribe/, push/test/
│   ├── layout.tsx, loading.tsx, globals.css
├── auth.ts, auth.config.ts  # NextAuth
├── middleware.ts            # auth-aware redirect
├── components/              # shared (Logo, Preloader, BottomNav, modals, ClinicMap, ForumPostCard, AdminSidebar, PushSubscribe...)
├── lib/
│   ├── prisma.ts            # singleton client
│   ├── utils.ts             # formatDateTR, avatar, Haversine, sessionUserId
│   ├── admin.ts             # requireAdmin()
│   └── push.ts              # sendPushToUser, sendPushToAll
├── types/next-auth.d.ts
prisma/
├── schema.prisma            # User, Pet, Reminder, ForumPost, ForumComment, ForumLike, Clinic, BlogPost, ContactMessage, PushSubscription
└── seed.ts
public/
├── logo-icon.png, logo-icon-white.png, logo.png  # paw logo variants
├── sw.js                    # Web Push service worker
capacitor.config.ts
```

## Güvenlik Notları

- **API key'ler:** OpenAI / Gemini sadece server-side `.env`'de, client'a gönderilmez. `/api/vet-ai` proxy.
- **DB credentials:** `.env` içinde.
- **Şifreler:** `bcryptjs` ile hashleniyor.
- **Auth:** Middleware `/app/*`, `/admin/*` ve API'lerin auth gerektirenlerini kontrol eder.
- **Admin:** `requireAdmin()` helper her admin sayfasında ve action'da kontrol eder.

## Atlanan Özellikler

Kullanıcı isteği üzerine atlanan iki özellik:

- **Stripe / ödeme entegrasyonu** — `/app/abonelik` UI placeholder
- **İletişim formu e-posta gönderimi** — Mesajlar DB'ye kaydediliyor, admin `/admin/contacts`'tan görüyor, ama otomatik e-posta gönderimi (Resend/Postmark) entegre değil. `mailto:` linki ile manuel yanıtlanır.

## Yararlı Komutlar

```bash
npm run dev              # geliştirme sunucusu
npm run build            # production build
npm run start            # prod sunucusu
npm run prisma:studio    # DB'yi UI ile gör
npx prisma db push       # şema sync
npm run db:seed          # demo veri

# Mobile
npx cap sync             # web → iOS+Android
npx cap open ios         # Xcode'da aç
npx cap open android     # Android Studio'da aç
```
