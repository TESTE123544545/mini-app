import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import "../../../signos/signos.css";
import { articleJsonLd, faqJsonLd, FaqSection, InlineCta, RelatedLinks, SeoPage } from "@/components/SeoPage";
import { combo } from "@/lib/signals/compose";
import { EQUAL_HOURS } from "@/lib/signals/hours";
import { NUMBER_KEYS, NUMBER_MEANINGS, type NumKey } from "@/lib/signals/numerology";
import { hourPath, lifePathUrl, seoMeta, SYMBOLIC_NOTE } from "@/lib/signals/seo";
import { ZODIAC_SIGNS } from "@/lib/zodiacContent";

/** /numerologia/caminho-de-vida/7 … one page per number (1-9, 11, 22, 33). */
export const dynamic = "force-dynamic";

const parse = (value: string) => { const n = Number(value); return (NUMBER_KEYS as readonly number[]).includes(n) && String(n) === value ? (n as NumKey) : null; };

export async function generateMetadata({ params }: { params: Promise<{ numero: string }> }): Promise<Metadata> {
  const n = parse((await params).numero);
  if (!n) return {};
  const m = NUMBER_MEANINGS[n];
  return seoMeta(`Caminho de Vida ${n}: ${m.name}, significado no amor e na carreira`, `Caminho de Vida ${n} na numerologia: ${m.keyword}. Veja a personalidade, o amor, a carreira, os desafios e o conselho de quem tem o número ${n}.`, lifePathUrl(n));
}

export default async function LifePathPage({ params }: { params: Promise<{ numero: string }> }) {
  const n = parse((await params).numero);
  if (!n) notFound();
  const m = NUMBER_MEANINGS[n];
  const path = lifePathUrl(n);
  const hours = EQUAL_HOURS.filter((hour) => hour.number === n);
  const faq = [
    { q: `O que significa o Caminho de Vida ${n}?`, a: m.essence },
    { q: `Como é o Caminho de Vida ${n} no amor?`, a: m.love },
    { q: `Quais carreiras combinam com o Caminho de Vida ${n}?`, a: m.work },
    { q: `Qual é o maior desafio do Caminho de Vida ${n}?`, a: m.challenge },
  ];
  const description = `Caminho de Vida ${n} (${m.name}): ${m.essence}`;

  return <SeoPage
    crumbs={[{ name: "Numerologia", href: "/numerologia" }, { name: `Caminho de Vida ${n}`, href: path }]}
    jsonLd={[articleJsonLd({ headline: `Caminho de Vida ${n}: ${m.name}`, description, path, datePublished: "2026-10-05" }), faqJsonLd(faq)]}
  >
    <header className="zodiac-hero"><h1>Caminho de Vida {n}: {m.name}</h1><p>{m.keyword}</p></header>
    <div className="zodiac-body">
      <p className="seo-lede">{m.essence}</p>
      <section className="zodiac-section"><h2>Pontos fortes do número {n}</h2><p>{m.strengths.join(", ")}.</p></section>
      <section className="zodiac-section"><h2>O número {n} no amor</h2><p>{m.love}</p></section>
      <InlineCta text="Quer descobrir o seu Caminho de Vida e o que ele significa com o seu signo?"/>
      <section className="zodiac-section"><h2>O número {n} no trabalho</h2><p>{m.work}</p></section>
      <section className="zodiac-section"><h2>Desafio e conselho</h2><p>{m.challenge}</p><p><strong>Conselho:</strong> {m.advice}</p></section>
      <section className="zodiac-section">
        <h2>Caminho de Vida {n} em cada signo</h2>
        {ZODIAC_SIGNS.map((sign) => <p key={sign.slug}><Link href={`/signos/${sign.slug}`}><strong>{sign.name}</strong></Link>: {combo(sign.name, n)?.lead}</p>)}
      </section>
      {hours.length > 0 && <RelatedLinks title={`Horas iguais ligadas ao número ${n}`} links={hours.map((hour) => ({ href: hourPath(hour.time), label: `${hour.time} · ${hour.title}` }))}/>}
      <FaqSection faq={faq}/>
      <p className="zodiac-disclaimer">{SYMBOLIC_NOTE}</p>
      <RelatedLinks title="Outros números" links={NUMBER_KEYS.filter((other) => other !== n).map((other) => ({ href: lifePathUrl(other), label: `${other} · ${NUMBER_MEANINGS[other].name}` }))}/>
    </div>
  </SeoPage>;
}
