import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../signos.css";
import { ArticleBody, articleJsonLd, faqJsonLd, InlineCta, RelatedLinks, SeoPage } from "@/components/SeoPage";
import { getSignArticle, SIGN_TOPICS, type SignTopic } from "@/lib/articles";
import { pairSlug } from "@/lib/compat";
import { getZodiacSign, ZODIAC_SIGNS, type ZodiacSign } from "@/lib/zodiacContent";

/** /signos/<signo>/no-amor · /e-dinheiro · /personalidade — long evergreen articles (lib/articles.ts). */
export const dynamic = "force-dynamic";

const COPY: Record<SignTopic, (name: string) => { title: string; h1: string; description: string; crumb: string; cta: string }> = {
  "no-amor": (n) => ({ title: `${n} no Amor: Como Ama, o Que Busca e Com Quem Combina`, h1: `${n} no amor`, description: `Como ${n} ama, o que procura num relacionamento, sinais de paixão, pontos de atenção e com quem combina. Guia completo e sem clichês do signo de ${n} no amor.`, crumb: "No amor", cta: `Quer entender como ${n} aparece nos seus relacionamentos?` }),
  "e-dinheiro": (n) => ({ title: `${n} e o Dinheiro: Carreira, Forças e Hábitos de Prosperidade`, h1: `${n} e o dinheiro`, description: `Como ${n} lida com dinheiro e carreira: forças, armadilhas e hábitos de prosperidade para o signo de ${n}. Astrologia como autoconhecimento, sem promessas.`, crumb: "E o dinheiro", cta: `Quer descobrir o que influencia a sua prosperidade?` }),
  personalidade: (n) => ({ title: `Personalidade de ${n}: Características, Qualidades e Defeitos`, h1: `Personalidade de ${n}`, description: `Características do signo de ${n}: qualidades, defeitos, ${n} no trabalho, na amizade e na família, e como crescer. Guia completo da personalidade de ${n}.`, crumb: "Personalidade", cta: `Quer ver o seu retrato completo, além do signo?` }),
};

function parse(slug: string, topic: string): { sign: ZodiacSign; topic: SignTopic } | null {
  const sign = getZodiacSign(slug);
  const known = SIGN_TOPICS.find((item) => item.slug === topic);
  return sign && known ? { sign, topic: known.slug } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; topic: string }> }): Promise<Metadata> {
  const { slug, topic } = await params;
  const found = parse(slug, topic);
  if (!found) return {};
  const copy = COPY[found.topic](found.sign.name);
  const path = `/signos/${found.sign.slug}/${found.topic}`;
  return { title: { absolute: `${copy.title} | Veias da Sintonia` }, description: copy.description, alternates: { canonical: path }, openGraph: { title: copy.title, description: copy.description, url: path, type: "article" } };
}

/** The sign's own short text for this topic, shown until the long article exists. */
function Fallback({ sign, topic }: { sign: ZodiacSign; topic: SignTopic }) {
  const body = topic === "no-amor" ? [sign.love] : topic === "e-dinheiro" ? [sign.career, sign.growth] : [...sign.overview, sign.howTheyAct];
  return <section className="zodiac-section">{body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<InlineCta/></section>;
}

export default async function SignTopicPage({ params }: { params: Promise<{ slug: string; topic: string }> }) {
  const { slug, topic } = await params;
  const found = parse(slug, topic);
  if (!found) notFound();
  const { sign } = found;
  const copy = COPY[found.topic](sign.name);
  const path = `/signos/${sign.slug}/${found.topic}`;
  const article = await getSignArticle(sign, found.topic);
  const compatible = sign.compatibleSigns.map((name) => ZODIAC_SIGNS.find((item) => item.name === name)).filter(Boolean) as ZodiacSign[];

  return <SeoPage
    crumbs={[{ name: "Signos", href: "/signos" }, { name: sign.name, href: `/signos/${sign.slug}` }, { name: copy.crumb, href: path }]}
    jsonLd={[articleJsonLd({ headline: copy.h1, description: copy.description, path }), ...(article?.faq.length ? [faqJsonLd(article.faq)] : [])]}
  >
    <header className="zodiac-sign-hero" data-element={sign.element}>
      <span className="zodiac-badge zodiac-badge-big"><span className="zodiac-symbol" aria-hidden="true">{`${sign.symbol}︎`}</span></span>
      <p className="zodiac-dates-line">{sign.dateRange} · {sign.element} · regido por {sign.rulingPlanet}</p>
      <h1>{copy.h1}</h1>
      <p className="zodiac-tagline">{sign.tagline}</p>
    </header>
    <div className="zodiac-body">
      {article ? <ArticleBody article={article} ctaText={copy.cta}/> : <Fallback sign={sign} topic={found.topic}/>}
      <RelatedLinks title={`Mais sobre ${sign.name}`} links={[
        ...SIGN_TOPICS.filter((item) => item.slug !== found.topic).map((item) => ({ href: `/signos/${sign.slug}/${item.slug}`, label: `${sign.name} ${item.label}` })),
        { href: `/horoscopo-do-dia/${sign.slug}`, label: `Horóscopo do dia de ${sign.name}` },
        { href: `/signos/${sign.slug}`, label: `Guia completo de ${sign.name}` },
      ]}/>
      {compatible.length > 0 && <RelatedLinks title={`${sign.name} combina com`} links={compatible.map((other) => ({ href: `/compatibilidade/${pairSlug(sign, other)}`, label: `${sign.name} e ${other.name}` }))}/>}
    </div>
  </SeoPage>;
}
