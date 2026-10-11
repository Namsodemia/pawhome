import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "İSGO — İş Sağlığı ve Güvenliği App", template: "%s · İSGO" },
  description:
    "Yapay zekâ destekli 5x5 risk analizi, kasa/cari, kursiyer takibi, İSG uzmanlığı sınav hazırlığı, sınıf mesajlaşma, mevzuat rehberi, kaza kaydı, saha denetimi ve İSG hesaplayıcı — tek uygulamada.",
  applicationName: "İSGO",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "İSGO", statusBarStyle: "default" },
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
