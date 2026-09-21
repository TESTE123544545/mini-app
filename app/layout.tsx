import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Use Seu Signo Para Prosperar | Veias da Sintonia",
  description: "Conheça seus padrões, cultive seus hábitos e construa sua própria árvore.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
