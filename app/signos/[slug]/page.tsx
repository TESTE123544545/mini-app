import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../signos.css";
import { ZODIAC_SIGNS, getZodiacSign } from "@/lib/zodiacContent";

export function generateStaticParams() {
  return ZODIAC_SIGNS.map((sign) => ({ slug: sign.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sign = getZodiacSign(slug);
  if (!sign) return {};
  const title = `Signo de ${sign.name}: Características, Personalidade e Como Ele Age na Sua Vida`;
  const description = `${sign.name} (${sign.dateRange}): elemento ${sign.element}, regido por ${sign.rulingPlanet}. Descubra a personalidade, o amor, a carreira e os pontos de crescimento de quem nasceu sob esse signo.`;
  return {
    title,
    description,
    alternates: { canonical: `/signos/${sign.slug}` },
    openGraph: { title, description, url: `/signos/${sign.slug}`, type: "article" },
  };
}

export default async function ZodiacSignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sign = getZodiacSign(slug);
  if (!sign) notFound();

  const index = ZODIAC_SIGNS.findIndex((item) => item.slug === sign.slug);
  const previous = ZODIAC_SIGNS[(index - 1 + ZODIAC_SIGNS.length) % ZODIAC_SIGNS.length];
  const next = ZODIAC_SIGNS[(index + 1) % ZODIAC_SIGNS.length];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Signo de ${sign.name}: características e personalidade`,
    description: sign.tagline,
    articleSection: "Astrologia",
    about: { "@type": "Thing", name: `Signo de ${sign.name}` },
    inLanguage: "pt-BR",
  };

  return (
    <main className="zodiac-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="zodiac-shell">
        <nav className="zodiac-nav">
          <Link href="/">← Veias da Sintonia</Link>
          <Link href="/" className="gold-button">Começar minha jornada</Link>
        </nav>
        <p className="zodiac-breadcrumb"><Link href="/signos">Os 12 signos</Link> / {sign.name}</p>

        <header className="zodiac-sign-hero" data-element={sign.element}>
          <span className="zodiac-badge zodiac-badge-big"><span className="zodiac-symbol" aria-hidden="true">{sign.symbol}</span></span>
          <p className="eyebrow">{sign.dateRange}</p>
          <h1>Signo de {sign.name}</h1>
          <p className="zodiac-tagline">{sign.tagline}</p>
        </header>

        <div className="zodiac-facts">
          <div><span>Elemento</span><strong>{sign.element}</strong></div>
          <div><span>Modalidade</span><strong>{sign.modality}</strong></div>
          <div><span>Regente</span><strong>{sign.rulingPlanet}</strong></div>
          <div><span>Período</span><strong>{sign.dateRange}</strong></div>
        </div>

        <div className="zodiac-body">
          <section className="zodiac-section">
            <h2>Quem é {sign.name}</h2>
            {sign.overview.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          </section>

          <section className="zodiac-section">
            <h2>Como {sign.name} age na vida</h2>
            <p>{sign.howTheyAct}</p>
          </section>

          <section className="zodiac-section">
            <h2>{sign.name} no amor</h2>
            <p>{sign.love}</p>
          </section>

          <section className="zodiac-section">
            <h2>{sign.name} na carreira e no dinheiro</h2>
            <p>{sign.career}</p>
          </section>

          <section className="zodiac-section">
            <h2>Onde {sign.name} pode crescer</h2>
            <p>{sign.growth}</p>
          </section>

          <section className="zodiac-section">
            <h2>Características principais</h2>
            <div className="zodiac-traits">{sign.traits.map((trait) => <span key={trait}>{trait}</span>)}</div>
          </section>

          <section className="zodiac-section">
            <h2>Combina bem com</h2>
            <div className="zodiac-compat">
              {sign.compatibleSigns.map((name) => {
                const match = ZODIAC_SIGNS.find((item) => item.name === name);
                return match ? <Link key={name} href={`/signos/${match.slug}`}>{match.symbol} {name}</Link> : null;
              })}
            </div>
          </section>
        </div>

        <div className="zodiac-cta">
          <h2>Seu signo é o ponto de partida — sua ação é o que constrói</h2>
          <p>No Veias da Sintonia, você transforma o autoconhecimento do seu signo em pequenas ações diárias e acompanha sua evolução numa árvore que cresce com você.</p>
          <Link href="/" className="gold-button">Plantar minha árvore</Link>
        </div>

        <p className="zodiac-disclaimer">
          Astrologia é uma linguagem simbólica para autoconhecimento — não uma previsão garantida do futuro ou das finanças. O que muda sua vida são as ações que você toma.
        </p>

        <nav className="zodiac-pager" aria-label="Outros signos">
          <Link href={`/signos/${previous.slug}`}><small>Anterior</small>{previous.symbol} {previous.name}</Link>
          <Link href={`/signos/${next.slug}`} className="next"><small>Próximo</small>{next.symbol} {next.name}</Link>
        </nav>
      </div>
    </main>
  );
}
