import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";
import "./premium.css";
import "./diagnostic.css";
import "./studio.css";
import "./entry.css";
import "./dark.css";
import "./celestial.css";
import "./i18n.css";
import "./ads.css";
import "./signals.css";
import { PwaRegister } from "./pwa-register";
import { headers } from "next/headers";
import { COLOR_MODE_BOOT } from "@/lib/colorModeBoot";
import { LANG_BOOT } from "@/lib/i18n";
import { I18n } from "@/components/I18n";
import { Ads } from "@/components/Ads";

export const metadata: Metadata = {
  metadataBase: new URL("https://veiasdasintonia.com.br"),
  // Ties the site to the AdSense account (one of the ownership checks); it does not show any ad by itself.
  other: { "google-adsense-account": "ca-pub-2475304135325161" },
  title: {
    default: "Use Seu Signo Para Prosperar | Signos, Astrologia e Prosperidade",
    template: "%s | Use Seu Signo Para Prosperar",
  },
  description:
    "Descubra como seu signo do zodíaco lida com dinheiro, negócios e prosperidade. Consulte previsões diárias, fases da lua em tempo real, arquétipos planetários e cultive sua Árvore da Prosperidade.",
  applicationName: "Use Seu Signo Para Prosperar",
  keywords: [
    "signos",
    "astrologia",
    "signos do zodíaco",
    "horóscopo da prosperidade",
    "prosperidade financeira",
    "fases da lua hoje",
    "astrologia e dinheiro",
    "carreira e signos",
    "áries",
    "touro",
    "gêmeos",
    "câncer",
    "leão",
    "virgem",
    "libra",
    "escorpião",
    "sagitário",
    "capricórnio",
    "aquário",
    "peixes",
    "árvore da prosperidade",
    "hábitos de abundância",
    "desenvolvimento pessoal",
  ],
  authors: [{ name: "Veias da Sintonia" }],
  creator: "Veias da Sintonia",
  publisher: "Veias da Sintonia",
  category: "lifestyle",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Use Seu Signo Para Prosperar | Signos, Astrologia e Prosperidade",
    description:
      "Conheça os padrões do seu signo, ciclos lunares em tempo real e transforme sua rotina com hábitos diários de prosperidade.",
    url: "https://veiasdasintonia.com.br",
    siteName: "Use Seu Signo Para Prosperar",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Veias da Sintonia — use seu signo para prosperar: a Árvore da Vida dourada no astrolábio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Use Seu Signo Para Prosperar | Signos & Astrologia",
    description:
      "Horóscopo de prosperidade, perfil financeiro dos 12 signos e ciclos lunares em tempo real.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Seu Signo",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070f24",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The per-request CSP nonce set by proxy.ts; without it the inline script below would be blocked.
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  // proxy.ts sets this for pages without a session: visitors and crawlers get the script in the HTML. A signed-in
  // browser gets it from components/Ads.tsx only if the account is not Premium.
  const showAds = requestHeaders.get("x-ads") === "1";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Use Seu Signo Para Prosperar",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "All",
    description:
      "Aplicativo de autoconhecimento astrológico e hábitos de prosperidade financeira baseado nos 12 signos do zodíaco e fases lunares.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
    },
  };

  return (
    <html lang="pt-BR" data-mode="dark" suppressHydrationWarning>
      <head>
        {/* Applies the saved light/dark choice before the first paint. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: COLOR_MODE_BOOT }} />
        {/* Picks the saved or browser language (lang, dir) before the first paint. */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: LANG_BOOT }} />
        {showAds && <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2475304135325161" crossOrigin="anonymous" nonce={nonce} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {/* React hoists these into <head>; the display face loads with the first paint. */}
        <link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/cinzel-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {children}
        <PwaRegister />
        <I18n />
        <Ads />
      </body>
    </html>
  );
}
