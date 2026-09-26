import type { SignDaily, SignGuide, SignPeriod, SkyToday } from "@/lib/sky";

/** Server-rendered live blocks for the public sign pages, so search engines read the day's text. */

const TZ = "America/Sao_Paulo";
const atNoon = (iso: string) => new Date(`${iso}T12:00:00Z`);
export const formatDay = (iso: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(atNoon(iso));
const formatShort = (iso: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" }).format(atNoon(iso));
export function formatWeek(startIso: string) {
  const end = atNoon(startIso);
  end.setUTCDate(end.getUTCDate() + 6);
  const month = (date: Date) => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, month: "long" }).format(date);
  const start = atNoon(startIso);
  return start.getUTCMonth() === end.getUTCMonth()
    ? `${start.getUTCDate()} a ${end.getUTCDate()} de ${month(end)}`
    : `${start.getUTCDate()} de ${month(start)} a ${end.getUTCDate()} de ${month(end)}`;
}
export const formatMonth = (yearMonth: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, month: "long", year: "numeric" }).format(atNoon(`${yearMonth}-15`));
const moonPhaseName = (phase: string, illumination: number) => (illumination >= 98 ? "Lua Cheia" : illumination <= 2 ? "Lua Nova" : phase);

export function DailyBlock({ daily }: { daily: SignDaily }) {
  return <>
    <p className="zodiac-date">{formatDay(daily.date)}</p>
    <blockquote className="zodiac-phrase"><span>Frase do dia</span><p>{daily.tip}</p></blockquote>
    <p>{daily.overview}</p>
    <dl className="zodiac-areas">
      <div><dt>Trabalho e metas</dt><dd>{daily.work}</dd></div>
      <div><dt>Amor e relações</dt><dd>{daily.relationships}</dd></div>
      <div><dt>Energia e humor</dt><dd>{daily.energy}</dd></div>
    </dl>
  </>;
}

export function PeriodBlock({ period }: { period: SignPeriod }) {
  return <>
    <p>{period.summary}</p>
    {period.focus && <p>{period.focus}</p>}
    {period.tip && <p className="zodiac-tip"><strong>Conselho:</strong> {period.tip}</p>}
    {period.keyDates.length > 0 && <ol className="zodiac-keydates">
      {period.keyDates.map((item) => <li key={`${item.date}-${item.title}`}><time dateTime={item.date}>{formatShort(item.date)}</time><div><strong>{item.title}</strong><span>{item.text}</span></div></li>)}
    </ol>}
  </>;
}

export function SkyBlock({ sky, compact = false }: { sky: SkyToday; compact?: boolean }) {
  return <>
    <p className="zodiac-moonline"><strong>Lua em {sky.moon.sign}</strong> · {moonPhaseName(sky.moon.phase, sky.moon.illumination)}, {sky.moon.illumination}% iluminada</p>
    <p>{sky.moon.text}</p>
    {!compact && <>
      <h3>{sky.transit.title}</h3>
      <p>{sky.transit.text}</p>
    </>}
    <ul className="zodiac-planets" aria-label="Posição dos planetas hoje">
      {sky.planets.map((planet) => <li key={planet.name}><span>{planet.name}</span><strong>{planet.sign} {planet.degree}°</strong>{planet.retrograde && <em title="Retrógrado">R</em>}</li>)}
    </ul>
    {sky.events.length > 0 && <>
      <h3>Próximos eventos do céu</h3>
      <ol className="zodiac-keydates">
        {sky.events.slice(0, compact ? 4 : 7).map((event) => <li key={`${event.date}-${event.title}`}><time dateTime={event.date}>{formatShort(event.date)}</time><div><strong>{event.title}</strong><span>{event.meaning}</span></div></li>)}
      </ol>
    </>}
  </>;
}

export function GuideSections({ name, guide }: { name: string; guide: SignGuide }) {
  return <>
    {guide.habits.length > 0 && <section className="zodiac-section" id="habitos">
      <h2>Hábitos para {name} transformar força em constância</h2>
      <ul className="zodiac-habits">{guide.habits.map((habit) => <li key={habit}>{habit}</li>)}</ul>
    </section>}
    {guide.rising && <section className="zodiac-section">
      <h2>{name} no ascendente</h2>
      <p>{guide.rising}</p>
    </section>}
    {guide.relating && <section className="zodiac-section">
      <h2>Como conviver bem com {name}</h2>
      <p>{guide.relating}</p>
    </section>}
    {guide.faq.length > 0 && <section className="zodiac-section" id="perguntas">
      <h2>Perguntas frequentes sobre {name}</h2>
      <div className="zodiac-faq">
        {guide.faq.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}
      </div>
    </section>}
  </>;
}
