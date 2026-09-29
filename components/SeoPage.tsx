import Link from "next/link";
import { BrandLockup } from "@/components/BrandLockup";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import type { Article } from "@/lib/openrouter";

/**
 * The frame every public SEO page shares: brand bar, visual breadcrumbs (+ BreadcrumbList JSON-LD),
 * the call to the free diagnostic (inline, end of page and a sticky bar on phones), the
 * entertainment/self-knowledge disclaimer and the footer links.
 */

const SITE = "https://veiasdasintonia.com.br";
export type Crumb = { name: string; href: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: `${SITE}${crumb.href}` })),
  };
}

export function faqJsonLd(faq: { q: string; a: string }[]) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) };
}

export function articleJsonLd({ headline, description, path, datePublished = "2026-09-28" }: { headline: string; description: string; path: string; datePublished?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    inLanguage: "pt-BR",
    datePublished,
    dateModified: datePublished,
    image: `${SITE}/og-image.jpg`,
    author: { "@type": "Organization", name: "Veias da Sintonia", url: SITE },
    publisher: { "@type": "Organization", name: "Veias da Sintonia", url: SITE, logo: { "@type": "ImageObject", url: `${SITE}/app-icon-512.png` } },
    mainEntityOfPage: `${SITE}${path}`,
  };
}

export function SeoPage({ crumbs, jsonLd, children }: { crumbs: Crumb[]; jsonLd: object[]; children: React.ReactNode }) {
  const all = [{ name: "Início", href: "/" }, ...crumbs];
  return <main className="zodiac-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([...jsonLd, breadcrumbJsonLd(all)]) }}/>
    <div className="zodiac-shell">
      <nav className="zodiac-nav">
        <Link href="/" aria-label="Veias da Sintonia — início"><BrandLockup/></Link>
        <div className="zodiac-nav-actions"><ColorModeToggle/><Link href="/" className="zodiac-pill">Diagnóstico grátis</Link></div>
      </nav>
      <nav className="zodiac-breadcrumb" aria-label="Você está em">
        {all.map((crumb, index) => <span key={crumb.href}>{index > 0 && " / "}{index < all.length - 1 ? <Link href={crumb.href}>{crumb.name}</Link> : <span aria-current="page">{crumb.name}</span>}</span>)}
      </nav>
      {children}
      <EndCta/>
      <SeoFooter/>
    </div>
    <Link href="/" className="seo-sticky-cta">Fazer meu diagnóstico gratuito</Link>
  </main>;
}

export function InlineCta({ text = "Quer saber como isso aparece na sua vida?" }: { text?: string }) {
  return <aside className="seo-inline-cta">
    <p>{text} <strong>Faça o diagnóstico gratuito</strong> — leva menos de 2 minutos.</p>
    <Link href="/" className="zodiac-pill">Fazer diagnóstico</Link>
  </aside>;
}

function EndCta() {
  return <div className="zodiac-cta">
    <h2>Seu signo é o ponto de partida — sua ação é o que constrói</h2>
    <p>No Veias da Sintonia você faz o diagnóstico gratuito e, ao criar sua conta, experimenta o Premium completo por 3 dias: leitura diária do seu signo, conversa com a IA e a Árvore da Prosperidade.</p>
    <Link href="/" className="zodiac-pill">Começar grátis</Link>
  </div>;
}

export function SeoFooter() {
  return <footer className="seo-footer">
    <p className="zodiac-disclaimer">Conteúdo para entretenimento e autoconhecimento. Astrologia é uma linguagem simbólica — não uma previsão garantida e não substitui aconselhamento profissional (psicológico, médico, jurídico ou financeiro).</p>
    <nav aria-label="Mais conteúdo">
      <Link href="/horoscopo-do-dia">Horóscopo do dia</Link>
      <Link href="/signos">Os 12 signos</Link>
      <Link href="/compatibilidade-amorosa">Compatibilidade amorosa</Link>
      <Link href="/astrologia-e-dinheiro">Astrologia e dinheiro</Link>
      <Link href="/privacidade">Privacidade</Link>
      <Link href="/termos">Termos de uso</Link>
    </nav>
    <p className="seo-footer__brand">© Veias da Sintonia · <a href="https://www.instagram.com/veiasdasintonia/" rel="noopener">@veiasdasintonia</a></p>
  </footer>;
}

/** An AI-written article (lib/articles.ts): intro, sections with an inline CTA after the second, visible FAQ. */
export function ArticleBody({ article, ctaText }: { article: Article; ctaText?: string }) {
  return <>
    {article.intro.map((paragraph, index) => <p key={index} className="seo-lede">{paragraph}</p>)}
    {article.sections.map((section, index) => <section className="zodiac-section" key={section.h2}>
      <h2>{section.h2}</h2>
      {section.paragraphs.map((paragraph, key) => <p key={key}>{paragraph}</p>)}
      {index === 1 && <InlineCta text={ctaText}/>}
    </section>)}
    <FaqSection faq={article.faq}/>
  </>;
}

export function FaqSection({ faq, title = "Perguntas frequentes" }: { faq: { q: string; a: string }[]; title?: string }) {
  if (!faq.length) return null;
  return <section className="zodiac-section" id="perguntas">
    <h2>{title}</h2>
    <div className="zodiac-faq">{faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
  </section>;
}

export function RelatedLinks({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return <section className="zodiac-section">
    <h2>{title}</h2>
    <div className="zodiac-compat">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>
  </section>;
}
