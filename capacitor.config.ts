import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pawhome.app",
  appName: "PawHome",
  // Capacitor needs a webDir even when using live server. Folder is created at sync time.
  webDir: "out-mobile",
  server: {
    // GELİŞTİRME: aynı WiFi'deki telefon Mac'teki Next.js dev server'a bağlansın.
    // Mac'inin IP'si değişirse buradan güncelle.
    url: "http://192.168.1.6:3000",
    cleartext: true,
  },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
