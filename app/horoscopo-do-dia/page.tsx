import type { Metadata } from "next";
import Link from "next/link";
import "../signos/signos.css";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { BrandLockup } from "@/components/BrandLockup";
import { SeoFooter } from "@/components/SeoPage";
import { ZODIAC_SIGNS } from "@/lib/zodiacContent";
import { brazilDayKey, getSignDaily, getSkyToday, settleWithin, signSlugFromName } from "@/lib/sky";
import { formatDay, formatDayShort } from "../signos/LiveSections";

/** "Horóscopo do dia": today's reading for all twelve signs, each linking to its own daily page. */
export const dynamic = "force-dynamic";

const SITE = "https://veiasdasintonia.com.br";

export async function generateMetadata(): Promise<Metadata> {
  const day = brazilDayKey();
  const title = `Horóscopo do Dia de Hoje — Todos os Signos, ${formatDayShort(day)}`;
  const description = `Horóscopo do dia de hoje, ${formatDay(day)}, para os 12 signos: Áries, Touro, Gêmeos, Câncer, Leão, Virgem, Libra, Escorpião, Sagitário, Capricórnio, Aquário e Peixes. Frase do dia, amor, trabalho e energia.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/horoscopo-do-dia" },
    openGraph: { images: ["/og-image.jpg"], title, description, url: "/horoscopo-do-dia", type: "website" },
  };
}

export default async function DailyHoroscopeIndex() {
  const [sky, ...dailies] = await Promise.all([
    settleWithin(getSkyToday(), 9000),
    ...ZODIAC_SIGNS.map((sign) => {
      const slug = signSlugFromName(sign.slug);
      return slug ? settleWithin(getSignDaily(slug), 9000) : Promise.resolve(null);
    }),
  ]);
  const day = brazilDayKey();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Horóscopo do dia — ${formatDayShort(day)}`,
    itemListElement: ZODIAC_SIGNS.map((sign, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `Horóscopo do dia de ${sign.name}`,
      url: `${SITE}/horoscopo-do-dia/${sign.slug}`,
    })),
  };

  return (
    <main className="zodiac-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="zodiac-shell">
        <nav className="zodiac-nav">
          <Link href="/" aria-label="Veias da Sintonia — início"><BrandLockup/></Link>
          <div className="zodiac-nav-actions"><ColorModeToggle /><Link href="/" className="zodiac-pill">Começar minha jornada</Link></div>
        </nav>

        <header className="zodiac-hero">
          <h1>Horóscopo do dia</h1>
          <p className="zodiac-date"><time dateTime={day}>{formatDay(day)}</time></p>
          <p>A leitura de hoje para cada um dos 12 signos: a frase do dia, o trabalho, o amor e a energia. Escolha o seu signo.</p>
        </header>

        <div className="zodiac-grid">
          {ZODIAC_SIGNS.map((sign, index) => {
            const daily = dailies[index];
            return (
              <Link key={sign.slug} href={`/horoscopo-do-dia/${sign.slug}`} className="zodiac-card" data-element={sign.element}>
                <span className="zodiac-badge"><span className="zodiac-symbol" aria-hidden="true">{`${sign.symbol}︎`}</span></span>
                <h2>{sign.name}</h2>
                <p className="zodiac-dates">{sign.dateRange}</p>
                {daily && <p className="zodiac-card-phrase">{daily.tip}</p>}
                <span className="zodiac-card-more">Horóscopo de {sign.name} hoje →</span>
              </Link>
            );
          })}
        </div>

        {sky && <section className="zodiac-section zodiac-live zodiac-index-sky">
          <h2>A Lua hoje</h2>
          <p className="zodiac-moonline"><strong>Lua em {sky.moon.sign}</strong> · {sky.moon.illumination}% iluminada</p>
          <p>{sky.moon.text}</p>
          <p><Link href="/signos">Veja o céu completo e o guia dos 12 signos →</Link></p>
        </section>}

        <SeoFooter/>
      </div>
      <Link href="/" className="seo-sticky-cta">Fazer meu diagnóstico gratuito</Link>
    </main>
  );
}
