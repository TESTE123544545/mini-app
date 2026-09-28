import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../../signos/signos.css";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { BrandLockup } from "@/components/BrandLockup";
import { ZODIAC_SIGNS, getZodiacSign } from "@/lib/zodiacContent";
import { brazilDayKey, getSignDaily, getSkyToday, settleWithin, signSlugFromName } from "@/lib/sky";
import { formatDay, formatDayShort } from "../../signos/LiveSections";

/**
 * "Horóscopo do dia de <signo>": one page per sign built for exactly that search — the day's
 * reading, with the date in the title, rendered on the server so crawlers read today's text.
 */
export const dynamic = "force-dynamic";

const SITE = "https://veiasdasintonia.com.br";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sign = getZodiacSign(slug);
  if (!sign) return {};
  const day = brazilDayKey();
  const title = `Horóscopo do Dia de ${sign.name} — Hoje, ${formatDayShort(day)}`;
  const description = `Horóscopo do dia de ${sign.name} para hoje, ${formatDay(day)}: a frase do dia, trabalho e metas, amor e relações, energia e humor, e a Lua de hoje. Atualizado todos os dias.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/horoscopo-do-dia/${sign.slug}` },
    openGraph: { title, description, url: `/horoscopo-do-dia/${sign.slug}`, type: "article", publishedTime: `${day}T00:00:00-03:00` },
  };
}

export default async function DailyHoroscopePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sign = getZodiacSign(slug);
  if (!sign) notFound();
  const sky = signSlugFromName(sign.slug);
  if (!sky) notFound();

  const [daily, today] = await Promise.all([settleWithin(getSignDaily(sky), 9000), settleWithin(getSkyToday(), 9000)]);
  const day = daily?.date ?? brazilDayKey();
  const url = `${SITE}/horoscopo-do-dia/${sign.slug}`;

  const faq = daily ? [
    { q: `Qual é o horóscopo de ${sign.name} hoje?`, a: daily.overview },
    { q: `Qual é a frase do dia para ${sign.name}?`, a: daily.tip },
    { q: `Como está ${sign.name} no amor hoje?`, a: daily.relationships },
    { q: `Como está ${sign.name} no trabalho hoje?`, a: daily.work },
    { q: `Quando o horóscopo do dia de ${sign.name} é atualizado?`, a: "Todos os dias, logo depois da meia-noite no horário de Brasília, com o céu calculado pela CosmyDay (Swiss Ephemeris)." },
  ] : [];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `Horóscopo do dia de ${sign.name} — ${formatDayShort(day)}`,
      description: daily?.overview ?? sign.tagline,
      articleSection: "Horóscopo do dia",
      about: { "@type": "Thing", name: `Signo de ${sign.name}` },
      inLanguage: "pt-BR",
      datePublished: `${day}T00:00:00-03:00`,
      dateModified: `${day}T00:00:00-03:00`,
      author: { "@type": "Organization", name: "Veias da Sintonia", url: SITE },
      publisher: { "@type": "Organization", name: "Veias da Sintonia", url: SITE, logo: { "@type": "ImageObject", url: `${SITE}/app-icon-512.png` } },
      mainEntityOfPage: url,
    },
    ...(faq.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
    }] : []),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Horóscopo do dia", item: `${SITE}/horoscopo-do-dia` },
        { "@type": "ListItem", position: 2, name: sign.name, item: url },
      ],
    },
  ];

  return (
    <main className="zodiac-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="zodiac-shell">
        <nav className="zodiac-nav">
          <Link href="/" aria-label="Veias da Sintonia — início"><BrandLockup/></Link>
          <div className="zodiac-nav-actions"><ColorModeToggle /><Link href="/" className="zodiac-pill">Começar minha jornada</Link></div>
        </nav>
        <p className="zodiac-breadcrumb"><Link href="/horoscopo-do-dia">Horóscopo do dia</Link> / {sign.name}</p>

        <header className="zodiac-sign-hero" data-element={sign.element}>
          <span className="zodiac-badge zodiac-badge-big"><span className="zodiac-symbol" aria-hidden="true">{`${sign.symbol}︎`}</span></span>
          <p className="zodiac-dates-line"><time dateTime={day}>{formatDay(day)}</time></p>
          <h1>Horóscopo do dia de {sign.name}</h1>
          <p className="zodiac-tagline">{sign.dateRange} · elemento {sign.element} · regido por {sign.rulingPlanet}</p>
        </header>

        <div className="zodiac-body">
          {daily ? <>
            <section className="zodiac-section zodiac-live" id="hoje">
              <h2>Horóscopo de {sign.name} hoje</h2>
              <blockquote className="zodiac-phrase"><span>Frase do dia de {sign.name}</span><p>{daily.tip}</p></blockquote>
              <p>{daily.overview}</p>
            </section>
            <section className="zodiac-section">
              <h2>{sign.name} hoje no trabalho e nas metas</h2>
              <p>{daily.work}</p>
            </section>
            <section className="zodiac-section">
              <h2>{sign.name} hoje no amor e nas relações</h2>
              <p>{daily.relationships}</p>
            </section>
            <section className="zodiac-section">
              <h2>Energia e humor de {sign.name} hoje</h2>
              <p>{daily.energy}</p>
            </section>
          </> : <section className="zodiac-section zodiac-live" id="hoje">
            <h2>Horóscopo de {sign.name} hoje</h2>
            <p>A leitura de hoje está sendo preparada. Volte em alguns instantes — enquanto isso, veja a <Link href={`/signos/${sign.slug}#semana`}>semana de {sign.name}</Link>.</p>
          </section>}

          {today && <section className="zodiac-section zodiac-live">
            <h2>A Lua hoje</h2>
            <p className="zodiac-moonline"><strong>Lua em {today.moon.sign}</strong> · {today.moon.illumination}% iluminada</p>
            <p>{today.moon.text}</p>
          </section>}

          {daily && <p className="zodiac-source">{daily.source}. Leitura simbólica para autoconhecimento, não uma previsão.</p>}

          <section className="zodiac-section">
            <h2>Mais sobre {sign.name}</h2>
            <div className="zodiac-compat">
              <Link href={`/signos/${sign.slug}#semana`}>Horóscopo da semana</Link>
              <Link href={`/signos/${sign.slug}#mes`}>Horóscopo do mês</Link>
              <Link href={`/signos/${sign.slug}#personalidade`}>Personalidade de {sign.name}</Link>
            </div>
          </section>

          {faq.length > 0 && <section className="zodiac-section" id="perguntas">
            <h2>Perguntas sobre {sign.name} hoje</h2>
            <div className="zodiac-faq">
              {faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}
            </div>
          </section>}

          <section className="zodiac-section">
            <h2>Horóscopo do dia dos outros signos</h2>
            <div className="zodiac-compat">
              {ZODIAC_SIGNS.filter((item) => item.slug !== sign.slug).map((item) => <Link key={item.slug} href={`/horoscopo-do-dia/${item.slug}`}>{`${item.symbol}︎`} {item.name}</Link>)}
            </div>
          </section>
        </div>

        <div className="zodiac-cta">
          <h2>Receba o horóscopo de {sign.name} todo dia — e transforme em ação</h2>
          <p>No Veias da Sintonia, a leitura do seu signo vira uma pequena missão por dia, e sua evolução aparece numa árvore que cresce com você.</p>
          <Link href="/" className="zodiac-pill">Plantar minha árvore</Link>
        </div>

        <p className="zodiac-disclaimer">
          Astrologia é uma linguagem simbólica para autoconhecimento — não uma previsão garantida do futuro ou das finanças. O que muda sua vida são as ações que você toma.
        </p>
      </div>
    </main>
  );
}
