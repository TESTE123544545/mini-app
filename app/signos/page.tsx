import type { Metadata } from "next";
import Link from "next/link";
import "./signos.css";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { ZODIAC_SIGNS } from "@/lib/zodiacContent";
import { brazilDayKey, getSignDaily, getSkyToday, settleWithin, signSlugFromName } from "@/lib/sky";
import { SkyBlock, formatDay } from "./LiveSections";

// The day's phrases change daily, so the page renders per request (the texts are cached in D1).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Horóscopo de Hoje dos 12 Signos: Frase do Dia e Céu ao Vivo",
  description: "Horóscopo de hoje para os 12 signos do zodíaco: a frase do dia de cada signo, a Lua e os planetas ao vivo e os próximos eventos do céu. Guia completo de personalidade, amor e carreira de cada signo.",
  alternates: { canonical: "/signos" },
  openGraph: {
    title: "Horóscopo de Hoje dos 12 Signos: Frase do Dia e Céu ao Vivo",
    description: "A frase do dia de cada signo, a Lua e os planetas ao vivo e o guia completo dos 12 signos.",
    url: "/signos",
    type: "website",
  },
};

export default async function ZodiacIndexPage() {
  const [sky, ...dailies] = await Promise.all([
    settleWithin(getSkyToday(), 9000),
    ...ZODIAC_SIGNS.map((sign) => {
      const slug = signSlugFromName(sign.slug);
      return slug ? settleWithin(getSignDaily(slug), 9000) : Promise.resolve(null);
    }),
  ]);
  const dayKey = brazilDayKey();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Horóscopo de hoje dos 12 signos",
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
          <div className="zodiac-nav-actions"><ColorModeToggle /><Link href="/" className="zodiac-pill">Começar minha jornada</Link></div>
        </nav>

        <header className="zodiac-hero">
          <h1>Horóscopo de hoje dos 12 signos</h1>
          <p className="zodiac-date">{formatDay(dayKey)}</p>
          <p>A frase do dia de cada signo, o céu ao vivo e um guia completo para você entender sua personalidade, seus pontos fortes e onde vale a pena prestar atenção.</p>
        </header>

        <div className="zodiac-grid">
          {ZODIAC_SIGNS.map((sign, index) => {
            const daily = dailies[index];
            return (
              <Link key={sign.slug} href={`/signos/${sign.slug}`} className="zodiac-card" data-element={sign.element}>
                <span className="zodiac-badge"><span className="zodiac-symbol" aria-hidden="true">{`${sign.symbol}\uFE0E`}</span></span>
                <h2>{sign.name}</h2>
                <p className="zodiac-dates">{sign.dateRange}</p>
                {daily && <p className="zodiac-card-phrase">{daily.tip}</p>}
                <span className="zodiac-card-more">Ver horóscopo completo →</span>
              </Link>
            );
          })}
        </div>

        {sky && <section className="zodiac-section zodiac-live zodiac-index-sky">
          <h2>O céu de hoje</h2>
          <SkyBlock sky={sky} compact />
          <p className="zodiac-source">{sky.source}.</p>
        </section>}

        <p className="zodiac-disclaimer">
          Astrologia é uma linguagem simbólica para autoconhecimento — não uma previsão garantida do futuro. O que muda sua vida são as ações que você toma, não o signo em que nasceu.
        </p>
      </div>
    </main>
  );
}
