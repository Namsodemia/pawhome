import type { Config } from "tailwindcss";

// İsgora marka renkleri (logodan örneklenmiş — mobil uygulamadaki src/theme.ts ile aynı)
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#1E3145", deep: "#142236", panel: "#24405A", line: "#33516D" },
        brand: {
          green: "#5CBD7D",
          greenDeep: "#3AA466",
          blue: "#107398",
          blueBright: "#1B8ECF",
          teal: "#0B6F7B",
          mint: "#8FE0C2",
        },
        soft: { green: "#E6F5EC", blue: "#E4F1F8", orange: "#FDE8D8", danger: "#FDE7EB", warn: "#FFF4D6", violet: "#EEEBFD" },
        orange: { DEFAULT: "#F4772E" },
        ink: "#1E3145",
        text: "#2A3A4C",
        muted: "#6E7C8C",
        line: "#E6EBF0",
        paper: "#F4F7F9",
        danger: "#D6334C",
        success: "#2E9E5B",
        warn: "#B7791F",
        violet: "#6C5CE7",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: { xl2: "22px", xl3: "28px" },
      boxShadow: {
        card: "0 6px 16px -6px rgba(30,49,69,0.10), 0 1px 2px rgba(30,49,69,0.04)",
        fab: "0 10px 24px -6px rgba(16,115,152,0.45)",
        bar: "0 10px 30px -8px rgba(30,49,69,0.18)",
        pop: "0 24px 60px -12px rgba(20,34,54,0.35)",
      },
      backgroundImage: {
        brand: "linear-gradient(135deg, #5CBD7D 0%, #107398 100%)",
        brandDark: "linear-gradient(135deg, #107398 0%, #1E3145 100%)",
        brandSoft: "linear-gradient(135deg, #E6F5EC 0%, #E4F1F8 100%)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "pop-in": { from: { opacity: "0", transform: "scale(.96)" }, to: { opacity: "1", transform: "scale(1)" } },
        shimmer: { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
      },
      animation: {
        "fade-in": "fade-in .18s ease-out",
        "slide-up": "slide-up .24s cubic-bezier(.2,.8,.2,1)",
        "pop-in": "pop-in .18s cubic-bezier(.2,.8,.2,1)",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
