import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "İsgora — İş Sağlığı ve Güvenliği App", template: "%s · İsgora" },
  description:
    "Yapay zekâ destekli 5x5 risk analizi, firma ve çalışan (İGU / İH / DSP) takibi, kasa/cari, iş sağlığı ve güvenliği uzmanlığı sınav hazırlığı, eğitimler, sınıf duyuruları, mevzuat rehberi, kaza kaydı, saha denetimi ve İSG hesaplayıcı — tek uygulamada.",
  applicationName: "İsgora",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "İsgora", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#107398",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="font-sans">{children}</body>
    </html>
  );
}
