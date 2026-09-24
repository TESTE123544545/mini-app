import type { Metadata } from "next";
import Link from "next/link";
import "./signos.css";
import { ZODIAC_SIGNS } from "@/lib/zodiacContent";

export const metadata: Metadata = {
  title: "Os 12 Signos do Zodíaco: Características e Personalidade",
  description: "Guia completo dos 12 signos do zodíaco — o que cada um significa, seu elemento, planeta regente e como ele se manifesta no amor, na carreira e no dia a dia.",
  alternates: { canonical: "/signos" },
  openGraph: {
    title: "Os 12 Signos do Zodíaco: Características e Personalidade",
    description: "Guia completo dos 12 signos — elemento, planeta regente, personalidade, amor, carreira e crescimento pessoal.",
    url: "/signos",
    type: "website",
  },
};

export default function ZodiacIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Os 12 Signos do Zodíaco",
    itemListElement: ZODIAC_SIGNS.map((sign, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: sign.name,
      url: `https://veiasdasintonia.com.br/signos/${sign.slug}`,
    })),
  };

  return (
    <main className="zodiac-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="zodiac-shell">
        <nav className="zodiac-nav">
          <Link href="/">← Veias da Sintonia</Link>
          <Link href="/" className="gold-button">Começar minha jornada</Link>
        </nav>

        <header className="zodiac-hero">
          <p className="eyebrow">Guia completo</p>
          <h1>Os 12 Signos do Zodíaco</h1>
          <p>Cada signo é uma lente diferente para observar como você age, ama e constrói. Escolha o seu para entender sua personalidade, seus pontos fortes e onde vale a pena prestar atenção.</p>
        </header>

        <div className="zodiac-grid">
          {ZODIAC_SIGNS.map((sign) => (
            <Link key={sign.slug} href={`/signos/${sign.slug}`} className="zodiac-card" data-element={sign.element}>
              <span className="zodiac-badge"><span className="zodiac-symbol" aria-hidden="true">{sign.symbol}</span></span>
              <h2>{sign.name}</h2>
              <p className="zodiac-dates">{sign.dateRange}</p>
            </Link>
          ))}
        </div>

        <p className="zodiac-disclaimer">
          Astrologia é uma linguagem simbólica para autoconhecimento — não uma previsão garantida do futuro. O que muda sua vida são as ações que você toma, não o signo em que nasceu.
        </p>
      </div>
    </main>
  );
}
