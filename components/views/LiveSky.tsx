"use client";

import { useEffect, useState } from "react";
import { Moon, Orbit, Sparkles } from "lucide-react";
import type { SignDaily, SkyToday } from "@/lib/sky";

type SkyPayload = { sky: SkyToday | null; sign: SignDaily | null };

/** One request per sign per visit; switching tabs or signs back and forth reuses it. */
const memo = new Map<string, Promise<SkyPayload>>();
function loadSky(sign: string): Promise<SkyPayload> {
  const key = sign || "_";
  let pending = memo.get(key);
  if (!pending) {
    pending = fetch(`/api/sky${sign ? `?sign=${encodeURIComponent(sign)}` : ""}`)
      .then((response) => (response.ok ? (response.json() as Promise<SkyPayload>) : { sky: null, sign: null }))
      .catch(() => ({ sky: null, sign: null }));
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

function LivePill() {
  return <span className="live-pill"><i aria-hidden="true"/>Ao vivo</span>;
}

/** Today's horoscope for one sign, with its tip as the phrase of the day. */
export function SignDayCard({ sign }: { sign: string }) {
  const data = useSky(sign);
  if (data && !data.sign) return null;
  const day = data?.sign;
  return <section className="surface-card live-sign-card" aria-busy={!day}>
    <div className="live-head"><h2>O dia de {sign}</h2><LivePill/></div>
    {day ? <>
      <blockquote className="live-phrase"><Sparkles aria-hidden="true"/><p>{day.tip}</p></blockquote>
      <p className="live-lead">{day.overview}</p>
      <dl className="live-areas">
        <div><dt>Trabalho e metas</dt><dd>{day.work}</dd></div>
        <div><dt>Relações</dt><dd>{day.relationships}</dd></div>
        <div><dt>Energia</dt><dd>{day.energy}</dd></div>
      </dl>
      <p className="live-source">{day.source}. Leitura simbólica, não uma previsão.</p>
    </> : <div className="live-skeleton" aria-label="Carregando o céu de hoje"><span/><span/><span/></div>}
  </section>;
}

/** The real sky today: Moon, planets, the day's climate and what is coming. */
export function LiveSkyCard() {
  const data = useSky("");
  if (data && !data.sky) return null;
  const sky = data?.sky;
  return <section className="surface-card live-sky-card" aria-busy={!sky}>
    <div className="live-head"><h2>O céu agora</h2><LivePill/></div>
    {sky ? <>
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
      <p className="live-source">{sky.source}.</p>
    </> : <div className="live-skeleton" aria-label="Carregando o céu de hoje"><span/><span/><span/></div>}
  </section>;
}
