# PawHome Mobil (iOS + Android)

Mevcut Next.js sitesini Capacitor ile WebView'a saran iOS/Android uygulaması.

## Mimari

```
┌──────────────┐         ┌────────────────────┐
│  iOS/Android │  HTTPS  │  Next.js sunucu    │
│  Capacitor   │ ───────▶│  (geliştirme: Mac) │
│  (WebView)   │         │  (prod: vercel vs) │
└──────────────┘         └────────────────────┘
```

`capacitor.config.ts` içindeki `server.url` neresi gösteriyorsa WebView orayı yükler.

## Geliştirme — Aynı WiFi'de Mac + Telefon

1. **Mac'te dev server'ı başlat:**
   ```bash
   npm run dev
   ```

2. **Mac'inin LAN IP'sini öğren:**
   ```bash
   ipconfig getifaddr en0
   # örn: 192.168.1.6
   ```

3. **`capacitor.config.ts` içindeki `server.url`'i güncelle** (IP değiştiyse).

4. **Capacitor'a değişiklikleri yansıt:**
   ```bash
   npx cap sync
   ```

5. **iOS için (sadece Mac'te):**
   ```bash
   npx cap open ios
   # Xcode açılır → cihazını seç → ▶ Run
   ```
   İlk açılışta Xcode'da `App` target'ına gidip Signing & Capabilities sekmesinde Team seç.

6. **Android için:**
   ```bash
   npx cap open android
   # Android Studio açılır → emulator/cihaz seç → ▶ Run
   ```
   Android Studio'nun ilk syncini bitirmesini bekle (5-10 dk).

7. **Telefon Mac'le aynı WiFi'de olmalı.** Telefon WebView Mac'teki `http://192.168.1.6:3000` adresini açar; Mac'teki Next.js sunucusu canlı çalışmaya devam eder, kod değişikliklerin hot reload ile anında telefona yansır.

## Üretim — Backend'i Deploy Et, Mobile App Buna Bağlansın

1. Next.js'i bir yere deploy et (Vercel, Railway, Render, kendi sunucun vs). Diyelim `https://api.pawhome.app` oldu.

2. `capacitor.config.ts` güncelle:
   ```ts
   server: {
     url: "https://api.pawhome.app",
     // cleartext'i kaldır, artık HTTPS
   }
   ```

3. Sync ve build:
   ```bash
   npx cap sync
   npx cap open ios       # iOS için Xcode → Archive → App Store Connect
   npx cap open android   # Android Studio → Build → Generate Signed Bundle (.aab)
   ```

## Önemli Notlar

- **iOS Gereksinimleri:** Xcode 15+, CocoaPods (`brew install cocoapods`), Apple Developer hesabı (App Store dağıtımı için, simulator/cihaz testi için ücretsiz).
- **Android Gereksinimleri:** Android Studio (Jetpack), Android SDK, JDK 17+.
- **Cleartext (HTTP):** Geliştirme sırasında `cleartext: true` aktif. Üretimde mutlaka HTTPS'e geç ve bu satırı sil.
- **NextAuth Cookies:** WebView kendi çerez deposunu kullanır, oturum bilgisi telefonda kalır. HTTPS olmayan ortamda `secure: true` çerezler set edilemez — geliştirme için HTTP yeterli.
- **App ID:** `com.pawhome.app` olarak ayarlı. Değiştirmek istersen `capacitor.config.ts` `appId`'yi değiştir + `npx cap sync`.
- **Push, Kamera, Konum vs.:** Capacitor plugin sistemiyle eklenir (örn. `@capacitor/geolocation`). Klinikler sayfası şu an tarayıcı geolocation API'sini kullanıyor; mobilde de WebView üzerinden çalışır.

## Hızlı Komutlar

```bash
npx cap sync                  # tüm platformları config + assetlerle güncelle
npx cap sync ios              # sadece iOS
npx cap sync android          # sadece Android
npx cap run ios               # CLI'dan iOS Simulator'da çalıştır
npx cap run android           # CLI'dan Android emulator'da çalıştır
npx cap open ios              # Xcode'da aç
npx cap open android          # Android Studio'da aç
```

## Sorun Giderme

- **"Web app loads with white screen on iOS"** — `cleartext: true` eksik veya yanlış IP. Mac'te `npm run dev` çalıştığından emin ol, IP'yi `ipconfig getifaddr en0` ile doğrula.
- **"Build fails on Android with SDK error"** — Android Studio → SDK Manager'dan Android 14 (API 34) ve build-tools 34.0.0+ indir.
- **"Pod install fails on iOS"** — `cd ios/App && pod install --repo-update`
- **"Sign in not working"** — NextAuth cookie'leri için `secure: false` (HTTP'de). `.env`'de `NEXTAUTH_URL` Mac LAN IP'sine bakmalı: `NEXTAUTH_URL=http://192.168.1.6:3000`
