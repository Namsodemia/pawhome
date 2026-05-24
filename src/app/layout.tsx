import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Paw Club AI",
  description: "Evcil dostun için akıllı asistan",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans text-slate-800">
        {children}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
