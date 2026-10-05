import Link from "next/link";
import "../signos/signos.css";
import { articleJsonLd, faqJsonLd, FaqSection, InlineCta, RelatedLinks, SeoPage } from "@/components/SeoPage";
import { EQUAL_HOURS } from "@/lib/signals/hours";
import { hourPath, seoMeta, SYMBOLIC_NOTE } from "@/lib/signals/seo";

export const dynamic = "force-dynamic";

const TITLE = "Horas iguais: o significado de 11:11, 22:22 e todas as outras";
const DESCRIPTION = "Significado das 24 horas iguais, de 00:00 a 23:23: numerologia, símbolo, prosperidade e amor de cada uma. Descubra o que a hora que você viu pode dizer sobre o seu momento.";
export const metadata = seoMeta(TITLE, DESCRIPTION, "/horas-iguais");

const FAQ = [
  { q: "O que são horas iguais?", a: "São os horários em que a hora e o minuto se repetem, como 11:11, 15:15 ou 22:22. Na numerologia e na leitura simbólica, cada uma carrega um número e um tema para reflexão." },
  { q: "Por que eu vejo sempre a mesma hora?", a: "Uma explicação simples é a atenção seletiva: quando uma hora ganha significado para você, você passa a notá-la mais. Simbolicamente, ela vira um lembrete para parar e perceber o que você estava pensando naquele instante." },
  { q: "Horas iguais são uma previsão?", a: "Não. É uma linguagem simbólica para reflexão e entretenimento. Nenhuma hora prevê o futuro nem garante resultados." },
  { q: "Como saber o que a hora significa para o meu signo?", a: "No app Veias da Sintonia, a aba Sinais detecta a hora igual do momento e combina a hora, o seu signo e a sua numerologia numa leitura personalizada." },
];

export default function EqualHoursPage() {
  return <SeoPage crumbs={[{ name: "Horas iguais", href: "/horas-iguais" }]} jsonLd={[articleJsonLd({ headline: TITLE, description: DESCRIPTION, path: "/horas-iguais", datePublished: "2026-10-05" }), faqJsonLd(FAQ)]}>
    <header className="zodiac-hero"><h1>Horas iguais: o significado de cada uma</h1><p>As 24 horas em que hora e minuto se repetem, lidas pela numerologia e pelo simbolismo.</p></header>
    <div className="zodiac-body">
      <p className="seo-lede">Ver 11:11 ou 22:22 no relógio chama a atenção de muita gente. Aqui você encontra o significado simbólico das 24 horas iguais, do recomeço do 00:00 à liberdade do 23:23, sempre como um convite à reflexão, nunca como promessa.</p>
      <section className="zodiac-section">
        <h2>As 24 horas iguais</h2>
        <div className="zodiac-compat">{EQUAL_HOURS.map((hour) => <Link key={hour.time} href={hourPath(hour.time)}>{hour.time} · {hour.title}</Link>)}</div>
      </section>
      <InlineCta text="Quer saber o que a hora de agora significa para o seu signo?"/>
      <section className="zodiac-section">
        <h2>Como ler uma hora igual</h2>
        <p>Cada hora é lida por um número, como a soma de seus dígitos na numerologia, e por um tema. O 11:11 e o 22:22 trazem números mestres (11 e 22), que a numerologia associa à intuição e à construção. As demais seguem os números de 1 a 9.</p>
        <p>O sentido de verdade vem do contexto: o que você pensava, sentia ou decidia quando viu a hora. Por isso a leitura mais útil combina a hora com o seu signo e o seu número pessoal.</p>
      </section>
      <FaqSection faq={FAQ}/>
      <p className="zodiac-disclaimer">{SYMBOLIC_NOTE}</p>
      <RelatedLinks title="Leia também" links={[{ href: "/numerologia", label: "Numerologia e Caminho de Vida" }, { href: "/numerologia-dos-signos", label: "Numerologia dos signos" }, { href: "/signos", label: "Os 12 signos" }]}/>
    </div>
  </SeoPage>;
}
