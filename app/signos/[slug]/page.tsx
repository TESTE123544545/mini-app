import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../signos.css";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { ZODIAC_SIGNS, getZodiacSign } from "@/lib/zodiacContent";
import { brazilDayKey, getSignDaily, getSignGuide, getSignMonthly, getSignWeekly, getSkyToday, settleWithin, signSlugFromName } from "@/lib/sky";
import { DailyBlock, GuideSections, PeriodBlock, SkyBlock, formatDay, formatMonth, formatWeek } from "../LiveSections";

// The horoscope changes every day, so the page renders per request (the texts themselves are cached in D1).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sign = getZodiacSign(slug);
  if (!sign) return {};
  const title = `Horóscopo de ${sign.name} Hoje, da Semana e do Mês + Personalidade do Signo`;
  const description = `Horóscopo de ${sign.name} para hoje, ${formatDay(brazilDayKey())}: frase do dia, trabalho, amor e energia, além da semana, do mês e do céu ao vivo. ${sign.name} (${sign.dateRange}), elemento ${sign.element}, regido por ${sign.rulingPlanet}.`;
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
  const sky = signSlugFromName(sign.slug);
  if (!sky) notFound();

  const [daily, weekly, monthly, today, guide] = await Promise.all([
    settleWithin(getSignDaily(sky), 9000),
    settleWithin(getSignWeekly(sky), 9000),
    settleWithin(getSignMonthly(sky), 9000),
    settleWithin(getSkyToday(), 9000),
    settleWithin(getSignGuide(sky, {
      name: sign.name, element: sign.element, modality: sign.modality, rulingPlanet: sign.rulingPlanet, dateRange: sign.dateRange,
      overview: sign.overview.join(" "), love: sign.love, career: sign.career, growth: sign.growth, traits: sign.traits, compatibleSigns: sign.compatibleSigns,
    }), 9000),
  ]);

  const index = ZODIAC_SIGNS.findIndex((item) => item.slug === sign.slug);
  const previous = ZODIAC_SIGNS[(index - 1 + ZODIAC_SIGNS.length) % ZODIAC_SIGNS.length];
  const next = ZODIAC_SIGNS[(index + 1) % ZODIAC_SIGNS.length];
  const dayKey = brazilDayKey();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `Horóscopo de ${sign.name} hoje e personalidade do signo`,
      description: daily?.overview ?? sign.tagline,
      articleSection: "Astrologia",
      about: { "@type": "Thing", name: `Signo de ${sign.name}` },
      inLanguage: "pt-BR",
      dateModified: dayKey,
      mainEntityOfPage: `https://veiasdasintonia.com.br/signos/${sign.slug}`,
      publisher: { "@type": "Organization", name: "Veias da Sintonia", url: "https://veiasdasintonia.com.br" },
    },
    ...(guide?.faq.length ? [{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
    }] : []),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Os 12 signos", item: "https://veiasdasintonia.com.br/signos" },
        { "@type": "ListItem", position: 2, name: sign.name, item: `https://veiasdasintonia.com.br/signos/${sign.slug}` },
      ],
    },
  ];

  const jump = [
    daily && ["hoje", "Hoje"], weekly && ["semana", "Semana"], monthly && ["mes", "Mês"], today && ["ceu", "Céu agora"],
    ["personalidade", "Personalidade"], guide?.faq.length && ["perguntas", "Perguntas"],
  ].filter(Boolean) as [string, string][];

  return (
    <main className="zodiac-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="zodiac-shell">
        <nav className="zodiac-nav">
          <Link href="/">← Veias da Sintonia</Link>
          <div className="zodiac-nav-actions"><ColorModeToggle /><Link href="/" className="zodiac-pill">Começar minha jornada</Link></div>
        </nav>
        <p className="zodiac-breadcrumb"><Link href="/signos">Os 12 signos</Link> / {sign.name}</p>

        <header className="zodiac-sign-hero" data-element={sign.element}>
          <span className="zodiac-badge zodiac-badge-big"><span className="zodiac-symbol" aria-hidden="true">{`${sign.symbol}\uFE0E`}</span></span>
          <p className="zodiac-dates-line">{sign.dateRange}</p>
          <h1>Signo de {sign.name}</h1>
          <p className="zodiac-tagline">{sign.tagline}</p>
        </header>

        <div className="zodiac-facts">
          <div><span>Elemento</span><strong>{sign.element}</strong></div>
          <div><span>Modalidade</span><strong>{sign.modality}</strong></div>
          <div><span>Regente</span><strong>{sign.rulingPlanet}</strong></div>
          <div><span>Período</span><strong>{sign.dateRange}</strong></div>
        </div>

        <nav className="zodiac-jump" aria-label="Nesta página">{jump.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>

        <div className="zodiac-body">
          {daily && <section className="zodiac-section zodiac-live" id="hoje">
            <h2>Horóscopo de {sign.name} hoje</h2>
            <DailyBlock daily={daily} />
          </section>}

          {weekly && <section className="zodiac-section zodiac-live" id="semana">
            <h2>Horóscopo de {sign.name} da semana</h2>
            <p className="zodiac-date">Semana de {formatWeek(weekly.period)}</p>
            <PeriodBlock period={weekly} />
          </section>}

          {monthly && <section className="zodiac-section zodiac-live" id="mes">
            <h2>Horóscopo de {sign.name} para {formatMonth(monthly.period)}</h2>
            <PeriodBlock period={monthly} />
          </section>}

          {today && <section className="zodiac-section zodiac-live" id="ceu">
            <h2>O céu de hoje</h2>
            <SkyBlock sky={today} />
          </section>}

          {(daily || today) && <p className="zodiac-source">{(daily ?? today)?.source}. Leitura simbólica para autoconhecimento, não uma previsão.</p>}

          <section className="zodiac-section" id="personalidade">
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
                return match ? <Link key={name} href={`/signos/${match.slug}`}>{`${match.symbol}\uFE0E`} {name}</Link> : null;
              })}
            </div>
          </section>

          {guide && <GuideSections name={sign.name} guide={guide} />}
        </div>

        <div className="zodiac-cta">
          <h2>Seu signo é o ponto de partida — sua ação é o que constrói</h2>
          <p>No Veias da Sintonia, você recebe a leitura do seu signo todos os dias, transforma em pequenas ações e acompanha sua evolução numa árvore que cresce com você.</p>
          <Link href="/" className="zodiac-pill">Plantar minha árvore</Link>
        </div>

        <p className="zodiac-disclaimer">
          Astrologia é uma linguagem simbólica para autoconhecimento — não uma previsão garantida do futuro ou das finanças. O que muda sua vida são as ações que você toma.
        </p>

        <nav className="zodiac-pager" aria-label="Outros signos">
          <Link href={`/signos/${previous.slug}`}><small>Anterior</small>{`${previous.symbol}\uFE0E`} {previous.name}</Link>
          <Link href={`/signos/${next.slug}`} className="next"><small>Próximo</small>{`${next.symbol}\uFE0E`} {next.name}</Link>
        </nav>
      </div>
    </main>
  );
}
