import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Use Seu Signo Para Prosperar | Signos & Astrologia",
    short_name: "Seu Signo",
    description:
      "Descubra seus padrões astrológicos, consulte previsões dos 12 signos, acompanhe fases da lua em tempo real e cultive sua Árvore da Prosperidade.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#e9e7e3",
    theme_color: "#e9e7e3",
    lang: "pt-BR",
    categories: ["lifestyle", "productivity", "utilities"],
    icons: [
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
