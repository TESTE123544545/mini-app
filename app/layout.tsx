import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";
import "./premium.css";
import "./diagnostic.css";
import { PwaRegister } from "./pwa-register";

export const metadata: Metadata = {
  metadataBase: new URL("https://veiasdasintonia.com.br"),
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
        url: "/app-icon-512.png",
        width: 512,
        height: 512,
        alt: "Use Seu Signo Para Prosperar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Use Seu Signo Para Prosperar | Signos & Astrologia",
    description:
      "Horóscopo de prosperidade, perfil financeiro dos 12 signos e ciclos lunares em tempo real.",
    images: ["/app-icon-512.png"],
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
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
