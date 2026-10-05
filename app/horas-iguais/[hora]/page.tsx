import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import "../../signos/signos.css";
import { articleJsonLd, faqJsonLd, FaqSection, InlineCta, RelatedLinks, SeoPage } from "@/components/SeoPage";
import { EQUAL_HOURS } from "@/lib/signals/hours";
import { NUMBER_MEANINGS, reduce } from "@/lib/signals/numerology";
import { LOVE, PROSPERITY } from "@/lib/signals/compose";
import { hourFromSlug, hourPath, lifePathUrl, seoMeta, SYMBOLIC_NOTE } from "@/lib/signals/seo";

/** /horas-iguais/11-11 … one page per equal hour (24). Cached at the edge like the other public pages. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ hora: string }> }): Promise<Metadata> {
  const hour = hourFromSlug((await params).hora);
  if (!hour) return {};
  return seoMeta(`${hour.time}: significado da hora igual`, `O que significa ver ${hour.time}? Interpretação simbólica da hora igual ${hour.time}: ${hour.keywords.join(", ")}, na numerologia, na prosperidade, no amor e no seu momento.`, hourPath(hour.time));
}

export default async function EqualHourPage({ params }: { params: Promise<{ hora: string }> }) {
  const hour = hourFromSlug((await params).hora);
  if (!hour) notFound();
  const path = hourPath(hour.time);
  const index = EQUAL_HOURS.indexOf(hour);
  const prev = EQUAL_HOURS[(index + 23) % 24], next = EQUAL_HOURS[(index + 1) % 24];
  const hh = Number(hour.time.slice(0, 2));
  const meaning = hour.number === 0 ? null : NUMBER_MEANINGS[hour.number];
  const how = hh === 0 ? "O zero marca o ponto de partida do relógio." : hh < 10 ? `A hora repete o número ${hh}.` : `${hh} se reduz a ${reduce(hh)} (${String(hh).split("").join(" + ")}${reduce(hh) === hh ? ", um número mestre" : ""}).`;
  const faq = [
    { q: `O que significa ver ${hour.time}?`, a: hour.essence },
    { q: `${hour.time} é um sinal de amor?`, a: `${hour.love} É uma leitura simbólica, não uma previsão.` },
    { q: `E se eu vejo ${hour.time} no relógio com frequência?`, a: `${hour.moment} Reparar nas horas é um convite à atenção, e o sentido é o que você dá a ele.` },
    { q: `${hour.time} traz prosperidade?`, a: `${hour.prosperity} Nenhuma hora garante resultados: o que muda a vida é o passo que você dá.` },
  ];
  const description = `Significado simbólico da hora igual ${hour.time}: ${hour.essence}`;

  return <SeoPage
    crumbs={[{ name: "Horas iguais", href: "/horas-iguais" }, { name: hour.time, href: path }]}
    jsonLd={[articleJsonLd({ headline: `${hour.time}: significado da hora igual`, description, path, datePublished: "2026-10-05" }), faqJsonLd(faq)]}
  >
    <header className="zodiac-hero">
      <h1>{hour.time}: significado da hora igual</h1>
      <p>{hour.title} · {hour.keywords.join(", ")}</p>
    </header>
    <div className="zodiac-body">
      <p className="seo-lede">{hour.essence}</p>
      <section className="zodiac-section">
        <h2>{hour.time} na numerologia</h2>
        <p>{how} {meaning ? `Na numerologia, o ${hour.number} é ${meaning.name.toLowerCase()}: ${meaning.essence}` : "Na numerologia, o zero fala de tudo que ainda é possível."}</p>
        {meaning && <p><Link href={lifePathUrl(hour.number as number)}>Veja o significado completo do número {hour.number}</Link>.</p>}
      </section>
      <section className="zodiac-section"><h2>{hour.time} e a prosperidade</h2><p>{hour.prosperity}</p></section>
      <InlineCta text={`Quer saber o que ${hour.time} significa para o seu signo e a sua data de nascimento?`}/>
      <section className="zodiac-section"><h2>{hour.time} no amor</h2><p>{hour.love}</p></section>
      <section className="zodiac-section"><h2>O que fazer ao ver {hour.time}</h2><p>{hour.moment}</p></section>
      <section className="zodiac-section">
        <h2>{hour.time} para cada elemento</h2>
        {(["Fogo", "Terra", "Ar", "Água"] as const).map((element) => <p key={element}><strong>Signos de {element}:</strong> {PROSPERITY[element]} {LOVE[element]}</p>)}
      </section>
      <FaqSection faq={faq}/>
      <p className="zodiac-disclaimer">{SYMBOLIC_NOTE}</p>
      <RelatedLinks title="Outras horas iguais" links={[{ href: hourPath(prev.time), label: `${prev.time} · ${prev.title}` }, { href: hourPath(next.time), label: `${next.time} · ${next.title}` }, { href: "/horas-iguais", label: "Todas as horas iguais" }, { href: "/numerologia", label: "Numerologia e Caminho de Vida" }]}/>
    </div>
  </SeoPage>;
}
