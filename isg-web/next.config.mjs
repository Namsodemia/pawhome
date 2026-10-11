/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint ayrı çalıştırılır (npm run lint); tip hataları build'i yine durdurur.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
