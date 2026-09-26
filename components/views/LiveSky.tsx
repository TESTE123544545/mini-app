"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MessageCircle, Moon, Orbit, Sparkles } from "lucide-react";
import type { SignDaily, SignPeriod, SkyToday } from "@/lib/sky";
import { SIGNS } from "@/lib/signs";

type SkyPayload = { sky: SkyToday | null; sign: SignDaily | null; week: SignPeriod | null; month: SignPeriod | null };
const EMPTY: SkyPayload = { sky: null, sign: null, week: null, month: null };

/** One request per sign per visit; switching tabs or signs back and forth reuses it. */
const memo = new Map<string, Promise<SkyPayload>>();
function loadSky(sign: string): Promise<SkyPayload> {
  const key = sign || "_";
  let pending = memo.get(key);
  if (!pending) {
    pending = fetch(`/api/sky${sign ? `?sign=${encodeURIComponent(sign)}` : ""}`)
      .then((response) => (response.ok ? (response.json() as Promise<SkyPayload>) : EMPTY))
      .catch(() => EMPTY);
    pending.then((data) => { if (!data.sky && !data.sign) memo.delete(key); });
    memo.set(key, pending);
  }
  return pending;
}

function useSky(sign: string) {
  const [state, setState] = useState<{ key: string; data: SkyPayload | null }>({ key: "", data: null });
  useEffect(() => {
    let alive = true;
    loadSky(sign).then((data) => { if (alive) setState({ key: sign, data }); });
    return () => { alive = false; };
  }, [sign]);
  return state.key === sign ? state.data : null;
}

/** The source names the phase a little before the exact moment; at the extremes, trust the light. */
const moonPhaseName = (phase: string, illumination: number) => (illumination >= 98 ? "Lua Cheia" : illumination <= 2 ? "Lua Nova" : phase);
const shortDate = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");
const TZ = "America/Sao_Paulo";
const todayLabel = () => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date());
const monthLabel = (yearMonth: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, month: "long" }).format(new Date(`${yearMonth}-15T12:00:00Z`));

function LivePill() {
  return <span className="live-pill"><i aria-hidden="true"/>Ao vivo</span>;
}

function Skeleton() {
  return <div className="live-skeleton" aria-label="Carregando o céu de hoje"><span/><span/><span/></div>;
}

function DayBody({ day }: { day: SignDaily }) {
  return <>
    <blockquote className="live-phrase"><Sparkles aria-hidden="true"/><div><span>Frase do dia</span><p>{day.tip}</p></div></blockquote>
    <p className="live-lead">{day.overview}</p>
    <dl className="live-areas">
      <div><dt>Trabalho e metas</dt><dd>{day.work}</dd></div>
      <div><dt>Amor e relações</dt><dd>{day.relationships}</dd></div>
      <div><dt>Energia e humor</dt><dd>{day.energy}</dd></div>
    </dl>
  </>;
}

function PeriodBody({ period }: { period: SignPeriod }) {
  return <>
    <p className="live-lead">{period.summary}</p>
    {period.focus && <p className="live-body">{period.focus}</p>}
    {period.tip && <p className="live-tip"><strong>Conselho:</strong> {period.tip}</p>}
    {period.keyDates.length > 0 && <ol className="live-events">
      {period.keyDates.map((item) => <li key={`${item.date}-${item.title}`}><time dateTime={item.date}>{shortDate(item.date)}</time><div><strong>{item.title}</strong><span>{item.text}</span></div></li>)}
    </ol>}
  </>;
}

function SkyBody({ sky }: { sky: SkyToday }) {
  return <>
    <div className="live-moon">
      <Moon aria-hidden="true"/>
      <div><strong>Lua em {sky.moon.sign}</strong><span>{moonPhaseName(sky.moon.phase, sky.moon.illumination)} · {sky.moon.illumination}% iluminada</span></div>
    </div>
    <p className="live-lead">{sky.moon.text}</p>
    <h3 className="live-subtitle">{sky.transit.title}</h3>
    <p className="live-body">{sky.transit.text}</p>
    <ul className="live-planets" aria-label="Posição dos planetas hoje">
      {sky.planets.map((planet) => <li key={planet.name}><span>{planet.name}</span><strong>{planet.sign} {planet.degree}°</strong>{planet.retrograde && <em title="Retrógrado">R</em>}</li>)}
    </ul>
    {sky.events.length > 0 && <>
      <h3 className="live-subtitle"><Orbit aria-hidden="true"/> Próximos eventos do céu</h3>
      <ol className="live-events">
        {sky.events.map((event) => <li key={`${event.date}-${event.title}`}><time dateTime={event.date}>{shortDate(event.date)}</time><div><strong>{event.title}</strong><span>{event.meaning}</span></div></li>)}
      </ol>
    </>}
  </>;
}

/** Today's horoscope for one sign, with its tip as the phrase of the day. */
export function SignDayCard({ sign }: { sign: string }) {
  const data = useSky(sign);
  if (data && !data.sign) return null;
  return <section className="surface-card live-sign-card" aria-busy={!data?.sign}>
    <div className="live-head"><h2>O dia de {sign}</h2><LivePill/></div>
    {data?.sign ? <><DayBody day={data.sign}/><p className="live-source">{data.sign.source}. Leitura simbólica, não uma previsão.</p></> : <Skeleton/>}
  </section>;
}

/** The real sky today: Moon, planets, the day's climate and what is coming. */
export function LiveSkyCard() {
  const data = useSky("");
  if (data && !data.sky) return null;
  return <section className="surface-card live-sky-card" aria-busy={!data?.sky}>
    <div className="live-head"><h2>O céu agora</h2><LivePill/></div>
    {data?.sky ? <><SkyBody sky={data.sky}/><p className="live-source">{data.sky.source}.</p></> : <Skeleton/>}
  </section>;
}

const ASK_PROMPTS = ["Como vai ser meu dia hoje?", "O que o céu de hoje pede de mim?", "Me dá uma frase para hoje"];
type Period = "dia" | "semana" | "mes";

/**
 * "Hoje ao vivo": the first thing in the Signs tab — pick any sign, read its day, week and month,
 * ask the AI how your day will go, and see the sky right now.
 */
export function LiveTodayTab({ userSign, askSintonia }: { userSign: string; askSintonia: (prompt: string) => void }) {
  const [sign, setSign] = useState(userSign || SIGNS[0].name);
  const [period, setPeriod] = useState<Period>("dia");
  const data = useSky(sign);
  const isOwn = sign === userSign;
  const signRow = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  function updateEdges() {
    const row = signRow.current;
    if (!row) return;
    setEdges({ start: row.scrollLeft <= 2, end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 2 });
  }

  function scrollSigns(direction: 1 | -1) {
    const row = signRow.current;
    if (!row) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * row.clientWidth * 0.7, behavior: reduceMotion ? "auto" : "smooth" });
  }

  // Open the sign row on the person's own sign, without scrolling the page.
  useEffect(() => {
    const row = signRow.current;
    const chip = row?.querySelector<HTMLElement>("[aria-selected=true]");
    if (row && chip) row.scrollLeft = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, []);

  return <>
    <section className="surface-card live-hero">
      <div className="live-head"><h2>Horóscopo de hoje</h2><LivePill/></div>
      <p className="live-date">{todayLabel()}</p>
      <div className={`live-signs-carousel ${edges.start ? "at-start" : ""} ${edges.end ? "at-end" : ""}`}>
      <button type="button" className="live-signs-arrow is-prev" onClick={() => scrollSigns(-1)} disabled={edges.start} aria-label="Ver signos anteriores"><ChevronLeft aria-hidden="true"/></button>
      <div className="live-signs" ref={signRow} role="tablist" aria-label="Escolha o signo" onScroll={updateEdges}>
        {SIGNS.map((item) => <button type="button" role="tab" key={item.id} aria-selected={item.name === sign} className={item.name === userSign ? "is-own" : ""} onClick={() => setSign(item.name)}>
          <span aria-hidden="true">{`${item.glyph}︎`}</span>{item.name}
        </button>)}
      </div>
      <button type="button" className="live-signs-arrow is-next" onClick={() => scrollSigns(1)} disabled={edges.end} aria-label="Ver próximos signos"><ChevronRight aria-hidden="true"/></button>
      </div>
      <div className="live-periods" role="tablist" aria-label="Período">
        {([["dia", "Hoje"], ["semana", "Semana"], ["mes", "Mês"]] as [Period, string][]).map(([value, label]) => <button type="button" role="tab" key={value} aria-selected={period === value} onClick={() => setPeriod(value)}>{label}</button>)}
      </div>

      <h3 className="live-sign-title">{isOwn ? `Seu signo · ${sign}` : sign}{period === "semana" && " · esta semana"}{period === "mes" && data?.month && ` · ${monthLabel(data.month.period)}`}</h3>
      {!data ? <Skeleton/>
        : period === "dia" ? (data.sign ? <DayBody day={data.sign}/> : <p className="live-body">A leitura de hoje ainda está sendo preparada. Tente de novo em alguns instantes.</p>)
        : period === "semana" ? (data.week ? <PeriodBody period={data.week}/> : <p className="live-body">A leitura da semana ainda está sendo preparada.</p>)
        : (data.month ? <PeriodBody period={data.month}/> : <p className="live-body">A leitura do mês ainda está sendo preparada.</p>)}
      <p className="live-source">Céu calculado pela CosmyDay (Swiss Ephemeris) · texto adaptado pelo Veias da Sintonia. Leitura simbólica, não uma previsão.</p>
    </section>

    <section className="surface-card live-ask">
      <span className="live-ask__icon"><MessageCircle aria-hidden="true"/></span>
      <h2>Como vai ser o seu dia?</h2>
      <p>A Sintonia, a IA do app, cruza o céu de hoje com o seu signo e o seu objetivo e te dá uma dica só sua.</p>
      <div className="live-ask__prompts">
        {ASK_PROMPTS.map((prompt) => <button type="button" key={prompt} onClick={() => askSintonia(prompt)}>{prompt}</button>)}
      </div>
    </section>

    <LiveSkyCard/>

    <p className="live-more"><CalendarDays aria-hidden="true"/> <a href={`/signos/${SIGNS.find((item) => item.name === sign)?.id ?? ""}`}>Ver a página completa de {sign}</a></p>
  </>;
}
