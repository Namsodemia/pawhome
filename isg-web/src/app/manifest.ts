import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "İsgora — İş Sağlığı ve Güvenliği App",
    short_name: "İsgora",
    description: "İSG süper uygulaması: risk analizi, kasa, kursiyer, sınav, sınıflar ve saha araçları.",
    start_url: "/app",
    display: "standalone",
    background_color: "#F4F7F9",
    theme_color: "#107398",
    lang: "tr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
