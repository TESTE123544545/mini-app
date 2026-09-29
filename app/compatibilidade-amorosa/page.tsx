import type { Metadata } from "next";
import Link from "next/link";
import "../signos/signos.css";
import { CompatPicker } from "@/components/CompatPicker";
import { articleJsonLd, FaqSection, faqJsonLd, InlineCta, SeoPage } from "@/components/SeoPage";
import { compatLevel, orderedPair, pairSlug } from "@/lib/compat";
import { ZODIAC_SIGNS } from "@/lib/zodiacContent";

/** Pillar page: the compatibility test, how elements combine, and every pairing of the zodiac. */

const TITLE = "Compatibilidade Amorosa dos Signos: Teste e Todas as Combinações";
const DESCRIPTION = "Faça o teste de compatibilidade amorosa entre signos e veja quais signos combinam no amor, com a leitura dos elementos Fogo, Terra, Ar e Água e as 78 combinações do zodíaco.";

export const metadata: Metadata = {
  title: { absolute: `${TITLE} | Veias da Sintonia` },
  description: DESCRIPTION,
  alternates: { canonical: "/compatibilidade-amorosa" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/compatibilidade-amorosa", type: "article" },
};

const FAQ = [
  { q: "Quais signos combinam no amor?", a: "Pela leitura dos elementos, signos do mesmo elemento tendem a ter sintonia alta (Fogo com Fogo, Água com Água), e os elementos complementares se completam: Fogo com Ar e Terra com Água. Mas qualquer combinação pode dar certo quando existe diálogo e respeito ao jeito do outro." },
  { q: "Qual é o signo mais compatível com o meu?", a: "Normalmente são os signos do seu próprio elemento e do elemento complementar. Use o teste acima para ver a leitura completa da sua combinação, com o que flui fácil e o que pede mais cuidado." },
  { q: "Compatibilidade de signos é garantia de relacionamento?", a: "Não. A astrologia é uma linguagem simbólica de autoconhecimento: ela ajuda a entender diferenças de ritmo e de necessidades, mas quem constrói a relação são as escolhas e o cuidado de cada dia." },
  { q: "Como funciona a compatibilidade pelos elementos?", a: "Cada signo pertence a um elemento: Fogo (entusiasmo e ação), Terra (segurança e constância), Ar (ideias e conversa) e Água (emoção e intimidade). Elementos iguais se entendem com facilidade, complementares se completam e os demais pedem mais adaptação — e costumam ensinar mais." },
  { q: "O ascendente e a Lua influenciam a compatibilidade?", a: "Sim. O signo solar é só o começo: no mapa astral, a Lua (emoções), Vênus (afeto) e o ascendente (jeito de se apresentar) também contam muito para entender como duas pessoas se relacionam." },
];

const ELEMENTS = [
  { name: "Fogo", signs: "Áries, Leão e Sagitário", text: "Paixão, iniciativa e intensidade. Se dá bem com o Ar, que alimenta a chama com ideias e movimento." },
  { name: "Terra", signs: "Touro, Virgem e Capricórnio", text: "Segurança, presença e construção. Se completa com a Água, que traz afeto e profundidade ao que é concreto." },
  { name: "Ar", signs: "Gêmeos, Libra e Aquário", text: "Conversa, leveza e liberdade. Combina com o Fogo, que transforma ideias em ação." },
  { name: "Água", signs: "Câncer, Escorpião e Peixes", text: "Emoção, intuição e intimidade. Encontra na Terra o chão firme para sentir com segurança." },
];

export default function CompatibilityIndex() {
  const signs = ZODIAC_SIGNS.map(({ slug, name, symbol }) => ({ slug, name, symbol }));
  return <SeoPage
    crumbs={[{ name: "Compatibilidade amorosa", href: "/compatibilidade-amorosa" }]}
    jsonLd={[articleJsonLd({ headline: "Compatibilidade amorosa dos signos", description: DESCRIPTION, path: "/compatibilidade-amorosa" }), faqJsonLd(FAQ)]}
  >
    <header className="zodiac-hero">
      <h1>Compatibilidade amorosa dos signos</h1>
      <p>Escolha dois signos e veja a leitura completa da combinação: onde a relação flui, onde pede cuidado e como fazer dar certo.</p>
    </header>
    <CompatPicker signs={signs}/>
    <div className="zodiac-body">
      <section className="zodiac-section">
        <h2>Como a compatibilidade entre signos funciona</h2>
        <p>Na astrologia, a compatibilidade amorosa começa pelos elementos. Cada signo carrega o jeito de um elemento — e é esse jeito que aparece no dia a dia de um casal: no ritmo, na forma de demonstrar afeto, no que cada um precisa para se sentir seguro.</p>
        <p>Elementos iguais costumam se entender quase sem palavras. Elementos complementares se completam: um oferece o que falta ao outro. Os demais pedem mais tradução — e, por isso mesmo, costumam ser as relações que mais fazem crescer.</p>
        <div className="compat-elements">{ELEMENTS.map((element) => <div key={element.name}><strong>{element.name}</strong><small>{element.signs}</small><p>{element.text}</p></div>)}</div>
        <InlineCta text="Mais do que o signo, o seu momento conta."/>
      </section>
      <section className="zodiac-section">
        <h2>Todas as combinações do zodíaco</h2>
        <p>Toque em um par para ler a compatibilidade completa no amor, na amizade e no trabalho.</p>
        <div className="compat-table-wrap">
          <table className="compat-table">
            <thead><tr><th scope="col"><span className="sr-only">Signo</span></th>{ZODIAC_SIGNS.map((sign) => <th scope="col" key={sign.slug} title={sign.name}>{`${sign.symbol}︎`}</th>)}</tr></thead>
            <tbody>{ZODIAC_SIGNS.map((row) => <tr key={row.slug}>
              <th scope="row">{`${row.symbol}︎`} {row.name}</th>
              {ZODIAC_SIGNS.map((col) => {
                const [a, b] = orderedPair(row, col);
                const level = compatLevel(a, b);
                return <td key={col.slug} data-level={level.label}><Link href={`/compatibilidade/${pairSlug(a, b)}`} title={`${row.name} e ${col.name}: ${level.label}`} aria-label={`${row.name} e ${col.name}: ${level.label}`}>{level.label === "Sintonia alta" || level.label === "Espelho" ? "●" : level.label === "Sintonia boa" ? "◐" : "○"}</Link></td>;
              })}
            </tr>)}</tbody>
          </table>
        </div>
        <p className="compat-legend">● sintonia alta · ◐ sintonia boa · ○ sintonia de aprendizado</p>
      </section>
      <section className="zodiac-section">
        <h2>Combinações por signo</h2>
        <div className="compat-by-sign">{ZODIAC_SIGNS.map((sign) => <div key={sign.slug}>
          <h3>{`${sign.symbol}︎`} {sign.name}</h3>
          <p>{sign.compatibleSigns.map((name, index) => {
            const other = ZODIAC_SIGNS.find((item) => item.name === name);
            return other ? <span key={name}>{index > 0 && ", "}<Link href={`/compatibilidade/${pairSlug(sign, other)}`}>{name}</Link></span> : null;
          })} · <Link href={`/signos/${sign.slug}/no-amor`}>{sign.name} no amor</Link></p>
        </div>)}</div>
      </section>
      <FaqSection faq={FAQ}/>
    </div>
  </SeoPage>;
}
