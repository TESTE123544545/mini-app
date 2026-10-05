import Link from "next/link";
import "../signos/signos.css";
import { articleJsonLd, faqJsonLd, FaqSection, InlineCta, RelatedLinks, SeoPage } from "@/components/SeoPage";
import { NUMBER_KEYS, NUMBER_MEANINGS, lifePath } from "@/lib/signals/numerology";
import { lifePathUrl, seoMeta, SYMBOLIC_NOTE } from "@/lib/signals/seo";

export const dynamic = "force-dynamic";

const TITLE = "Numerologia: como calcular o seu Caminho de Vida e o que cada número significa";
const DESCRIPTION = "Aprenda a calcular o Caminho de Vida, o Destino, a Alma e a Personalidade na numerologia pitagórica e veja o significado de cada número, de 1 a 9 e os mestres 11, 22 e 33.";
export const metadata = seoMeta(TITLE, DESCRIPTION, "/numerologia");

const EXAMPLE = "1990-03-15";
const FAQ = [
  { q: "O que é o Caminho de Vida?", a: "É o número calculado a partir da sua data de nascimento. Na numerologia, ele descreve o tema central da sua jornada: o que você tende a aprender e desenvolver ao longo da vida." },
  { q: "Como calcular o Caminho de Vida?", a: `Reduza dia, mês e ano a um dígito cada, some os três resultados e reduza de novo. Exemplo: ${EXAMPLE.split("-").reverse().join("/")} dá ${lifePath(EXAMPLE)}. Se o resultado for 11, 22 ou 33, ele é mantido como número mestre.` },
  { q: "O que são números mestres?", a: "São o 11, o 22 e o 33. A numerologia não os reduz, e os associa a uma intensidade maior: intuição (11), construção (22) e cuidado com o coletivo (33)." },
  { q: "Numerologia prevê o futuro?", a: "Não. É uma linguagem simbólica para autoconhecimento e reflexão. Ela sugere temas para observar, não resultados garantidos." },
];

export default function NumerologyPage() {
  return <SeoPage crumbs={[{ name: "Numerologia", href: "/numerologia" }]} jsonLd={[articleJsonLd({ headline: TITLE, description: DESCRIPTION, path: "/numerologia", datePublished: "2026-10-05" }), faqJsonLd(FAQ)]}>
    <header className="zodiac-hero"><h1>Numerologia: seus números e o que eles dizem</h1><p>O Caminho de Vida, o Destino, a Alma e a Personalidade, explicados de forma simples.</p></header>
    <div className="zodiac-body">
      <p className="seo-lede">A numerologia pitagórica lê a vida por meio de números calculados a partir da sua data de nascimento e do seu nome. Aqui você aprende a calcular os principais e a entender o que cada um sugere, sempre como uma ferramenta de autoconhecimento.</p>
      <section className="zodiac-section">
        <h2>Como calcular o Caminho de Vida</h2>
        <p>Reduza o dia, o mês e o ano de nascimento a um só dígito, some os três e reduza o resultado. Por exemplo, para {EXAMPLE.split("-").reverse().join("/")}: o dia 15 vira 6 (1 + 5), o mês 3 continua 3, o ano 1990 vira 1 (1 + 9 + 9 + 0 = 19, 1 + 9 = 10, 1 + 0 = 1). Somando, 6 + 3 + 1 = 10, que vira {lifePath(EXAMPLE)}. Os números 11, 22 e 33 não são reduzidos.</p>
      </section>
      <section className="zodiac-section">
        <h2>Os principais números</h2>
        <p><strong>Caminho de Vida:</strong> o tema central da sua jornada, vindo da data de nascimento.</p>
        <p><strong>Destino (ou Expressão):</strong> o que você tende a desenvolver e entregar ao mundo, somando todas as letras do seu nome.</p>
        <p><strong>Alma:</strong> o que você deseja por dentro, somando as vogais do nome.</p>
        <p><strong>Personalidade:</strong> como as pessoas costumam percebê-lo, somando as consoantes.</p>
        <p><strong>Ano, mês e dia pessoal:</strong> os ciclos do momento, de 1 a 9, que mudam o foco do período.</p>
      </section>
      <InlineCta text="Quer ver todos os seus números calculados, sem fazer conta?"/>
      <section className="zodiac-section">
        <h2>O significado de cada número</h2>
        <div className="zodiac-compat">{NUMBER_KEYS.map((n) => <Link key={n} href={lifePathUrl(n)}>{n} · {NUMBER_MEANINGS[n].name}</Link>)}</div>
      </section>
      <FaqSection faq={FAQ}/>
      <p className="zodiac-disclaimer">{SYMBOLIC_NOTE}</p>
      <RelatedLinks title="Leia também" links={[{ href: "/numerologia-dos-signos", label: "Numerologia dos signos" }, { href: "/horas-iguais", label: "Significado das horas iguais" }, { href: "/signos", label: "Os 12 signos" }]}/>
    </div>
  </SeoPage>;
}
