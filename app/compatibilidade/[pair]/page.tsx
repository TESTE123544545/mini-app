import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import "../../signos/signos.css";
import { ArticleBody, articleJsonLd, faqJsonLd, InlineCta, RelatedLinks, SeoPage } from "@/components/SeoPage";
import { getCompatArticle } from "@/lib/articles";
import { compatLevel, orderedPair, pairSlug, parsePair } from "@/lib/compat";
import { ZODIAC_SIGNS, type ZodiacSign } from "@/lib/zodiacContent";

/** /compatibilidade/<signo>-<signo>: one page per pair (78), in zodiac order; the reverse order redirects. */
export const dynamic = "force-dynamic";

const pairName = (a: ZodiacSign, b: ZodiacSign) => (a.slug === b.slug ? `${a.name} com ${a.name}` : `${a.name} e ${b.name}`);

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const parsed = parsePair((await params).pair);
  if (!parsed) return {};
  const [a, b] = orderedPair(...parsed);
  const name = pairName(a, b);
  const title = `${name}: Compatibilidade no Amor, Amizade e Trabalho`;
  const description = `${name} combinam? Veja a compatibilidade amorosa entre ${name}: sintonia dos elementos ${a.element} e ${b.element}, desafios do casal e dicas para a relação dar certo.`;
  const path = `/compatibilidade/${pairSlug(a, b)}`;
  return { title: { absolute: `${title} | Veias da Sintonia` }, description, alternates: { canonical: path }, openGraph: { title, description, url: path, type: "article" } };
}

export default async function CompatibilityPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const parsed = parsePair(pair);
  if (!parsed) notFound();
  const canonical = pairSlug(...parsed);
  if (canonical !== pair) permanentRedirect(`/compatibilidade/${canonical}`);
  const [a, b] = orderedPair(...parsed);
  const name = pairName(a, b);
  const level = compatLevel(a, b);
  const path = `/compatibilidade/${canonical}`;
  const article = await getCompatArticle(a, b);
  const description = `Compatibilidade amorosa entre ${name}: ${level.summary}`;

  return <SeoPage
    crumbs={[{ name: "Compatibilidade amorosa", href: "/compatibilidade-amorosa" }, { name, href: path }]}
    jsonLd={[articleJsonLd({ headline: `${name}: compatibilidade no amor`, description, path }), ...(article?.faq.length ? [faqJsonLd(article.faq)] : [])]}
  >
    <header className="zodiac-hero compat-hero">
      <p className="compat-symbols" aria-hidden="true">{`${a.symbol}︎`} <span>+</span> {`${b.symbol}︎`}</p>
      <h1>{name}: compatibilidade no amor</h1>
      <p className="compat-level"><strong>{level.label}</strong> · {a.element} + {b.element}</p>
      <p>{level.summary}</p>
    </header>
    <div className="zodiac-body">
      {article ? <ArticleBody article={article} ctaText="Quer entender o que o seu momento pede numa relação?"/> : <section className="zodiac-section">
        <h2>{a.name} no amor</h2><p>{a.love}</p>
        {a.slug !== b.slug && <><h2>{b.name} no amor</h2><p>{b.love}</p></>}
        <InlineCta text="Quer entender o que o seu momento pede numa relação?"/>
      </section>}
      <RelatedLinks title="Leia também" links={[
        { href: `/signos/${a.slug}/no-amor`, label: `${a.name} no amor` },
        ...(a.slug !== b.slug ? [{ href: `/signos/${b.slug}/no-amor`, label: `${b.name} no amor` }] : []),
        { href: `/horoscopo-do-dia/${a.slug}`, label: `Horóscopo do dia de ${a.name}` },
        ...(a.slug !== b.slug ? [{ href: `/horoscopo-do-dia/${b.slug}`, label: `Horóscopo do dia de ${b.name}` }] : []),
        { href: "/compatibilidade-amorosa", label: "Teste de compatibilidade" },
      ]}/>
      <RelatedLinks title={`Outras combinações de ${a.name}`} links={ZODIAC_SIGNS.filter((other) => other.slug !== b.slug).map((other) => ({ href: `/compatibilidade/${pairSlug(a, other)}`, label: pairName(...orderedPair(a, other)) }))}/>
    </div>
  </SeoPage>;
}
