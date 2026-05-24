import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "pw-primary": "#2563EB",
        "pw-secondary": "#22C55E",
        "pw-soft": "#F5F3FF",
        "pw-dark": "#020617",
        "pw-surface": "#F8FAFC",
        "pw-accent": "#F97316",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
