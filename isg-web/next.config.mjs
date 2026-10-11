import { dirname } from "path";
import { fileURLToPath } from "url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Depo kökünde ayrı bir proje (PawHome) olduğu için izleme kökünü bu klasöre sabitle
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Lint ayrı çalıştırılır (npm run lint); tip hataları build'i yine durdurur.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
