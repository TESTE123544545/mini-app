import Link from "next/link";
import "../signos/signos.css";
import { articleJsonLd, faqJsonLd, FaqSection, InlineCta, RelatedLinks, SeoPage } from "@/components/SeoPage";
import { LOVE, PROSPERITY } from "@/lib/signals/compose";
import { NUMBER_KEYS, NUMBER_MEANINGS } from "@/lib/signals/numerology";
import { lifePathUrl, seoMeta, SYMBOLIC_NOTE } from "@/lib/signals/seo";
import { ZODIAC_SIGNS } from "@/lib/zodiacContent";

export const dynamic = "force-dynamic";

const TITLE = "Numerologia dos signos: como o seu signo e o seu número se combinam";
const DESCRIPTION = "Veja como cada um dos 12 signos se combina com o Caminho de Vida na numerologia: elemento, planeta regente, prosperidade e amor, e como descobrir a sua combinação.";
export const metadata = seoMeta(TITLE, DESCRIPTION, "/numerologia-dos-signos");

const FAQ = [
  { q: "Qual a relação entre signo e numerologia?", a: "São duas linguagens simbólicas diferentes. O signo vem da posição do Sol na data de nascimento; o Caminho de Vida vem da soma dessa mesma data. Lidas juntas, uma dá o estilo e a outra o tema da jornada." },
  { q: "Preciso saber a hora de nascimento?", a: "Não. O signo solar e o Caminho de Vida usam apenas a data de nascimento." },
  { q: "É uma previsão?", a: "Não. É uma ferramenta de autoconhecimento: oferece perguntas e temas para observar, sem garantir resultados." },
];

export default function SignNumerologyPage() {
  return <SeoPage crumbs={[{ name: "Numerologia dos signos", href: "/numerologia-dos-signos" }]} jsonLd={[articleJsonLd({ headline: TITLE, description: DESCRIPTION, path: "/numerologia-dos-signos", datePublished: "2026-10-05" }), faqJsonLd(FAQ)]}>
    <header className="zodiac-hero"><h1>Numerologia dos signos</h1><p>O estilo do seu signo e o tema do seu número, lidos juntos.</p></header>
    <div className="zodiac-body">
      <p className="seo-lede">O signo conta como você tende a agir. O Caminho de Vida conta qual tema a sua jornada pede. Juntos, formam uma leitura mais pessoal do que cada um sozinho. Abaixo, o estilo de cada signo para prosperidade e amor.</p>
      {ZODIAC_SIGNS.map((sign) => <section className="zodiac-section" key={sign.slug}>
        <h2>{sign.name}: {sign.element}, regido por {sign.rulingPlanet}</h2>
        <p>{sign.tagline} {PROSPERITY[sign.element]} {LOVE[sign.element]}</p>
        <p><Link href={`/signos/${sign.slug}`}>Leia tudo sobre {sign.name}</Link></p>
      </section>)}
      <InlineCta text="Quer saber a combinação exata do seu signo com o seu Caminho de Vida?"/>
      <RelatedLinks title="Os números da numerologia" links={NUMBER_KEYS.map((n) => ({ href: lifePathUrl(n), label: `${n} · ${NUMBER_MEANINGS[n].name}` }))}/>
      <FaqSection faq={FAQ}/>
      <p className="zodiac-disclaimer">{SYMBOLIC_NOTE}</p>
      <RelatedLinks title="Leia também" links={[{ href: "/numerologia", label: "Numerologia e Caminho de Vida" }, { href: "/horas-iguais", label: "Significado das horas iguais" }]}/>
    </div>
  </SeoPage>;
}
