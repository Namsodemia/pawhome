import { dirname } from "path";
import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PHP + SQLite paylaşımlı hosting için statik çıktı (out/). Sunucu tarafı public/api ve public/giris.php'de.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Depo kökünde ayrı bir proje (PawHome) olduğu için kökü bu klasöre sabitle
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Lint ayrı çalıştırılır (npm run lint); tip hataları build'i yine durdurur.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
