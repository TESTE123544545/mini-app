import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";
import "./premium.css";
import { PwaRegister } from "./pwa-register";

export const metadata: Metadata = {
  title: "Use Seu Signo Para Prosperar | Veias da Sintonia",
  description: "Conheça seus padrões, cultive seus hábitos e construa sua própria árvore.",
  applicationName: "Use Seu Signo Para Prosperar",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Seu Signo",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/app-icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#071326",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {/* React hoists these into <head>; the display face loads with the first paint. */}
        <link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/cormorant-garamond-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
