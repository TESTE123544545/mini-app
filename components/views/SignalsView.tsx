"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Clock3, Coins, Compass, Heart, Hash, LockKeyhole, Sparkles } from "lucide-react";
import { localDayKey } from "@/lib/daily";
import { EQUAL_HOURS, equalHourOf, nextEqualHour } from "@/lib/signals/hours";
import { track } from "@/lib/analytics";
import type { DailyMessage, HourReading, NumerologyProfile } from "@/lib/signals/compose";

export type SignalsData = {
  premium: boolean; sign: string; hasBirthDate: boolean;
  daily: DailyMessage; hour: HourReading | null; numerology: NumerologyProfile;
  combo: null | { title: string; lead: string; sections: { h: string; t: string }[] };
  history: { time: string; dayKey: string }[]; historyHidden: boolean;
};

/** Fetches /api/signals; `time` also saves that equal hour to the user's history. */
export function useSignals(time: string | null, birth: string | null) {
  const [data, setData] = useState<SignalsData | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    const query = new URLSearchParams({ day: localDayKey() });
    if (time) query.set("time", time);
    if (birth) query.set("birth", birth);
    fetch(`/api/signals?${query}`, { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() as Promise<SignalsData> : Promise.reject(new Error("signals"))))
      .then((next) => { if (live) { setData(next); setFailed(false); } })
      .catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [time, birth]);
  return { data, failed };
}

const label = (n: number | null) => (n === null ? "—" : String(n));
const when = (dayKey: string) => (dayKey === localDayKey() ? "hoje" : dayKey.split("-").reverse().slice(0, 2).join("/"));

function Unlock({ text, reason, openPaywall, children }: { text: string; reason: string; openPaywall: (reason: string) => void; children?: React.ReactNode }) {
  return <div className="signal-lock">
    <LockKeyhole size={16} aria-hidden="true"/>
    <p>{children}</p>
    <button type="button" className="gold-button" onClick={() => { track("signal_upsell_clicked", { reason }); openPaywall(reason); }}>{text}</button>
  </div>;
}

export function SignalsView({ openPaywall, navigate }: { openPaywall: (reason: string) => void; navigate: (view: "profile") => void }) {
  const [now, setNow] = useState(() => new Date());
  const [picked, setPicked] = useState<string | null>(() => equalHourOf(new Date()));
  const [birth, setBirth] = useState<string | null>(null);
  const { data, failed } = useSignals(picked, birth);

  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 20_000); return () => clearInterval(timer); }, []);
  // The first time the tab opens on an equal hour (11:11…), that hour is opened for the user.
  useEffect(() => { if (picked) track("signal_hour_detected", { time: picked }); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once, on mount

  const open = useCallback((time: string, from: string) => { setPicked(time); track("signal_hour_opened", { time, from }); }, []);
  const equal = equalHourOf(now);
  const next = nextEqualHour(now);
  const hour = data?.hour ?? null;
  const premium = Boolean(data?.premium);
  const clock = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return <div className="view-stack signals-view">
    <section className="surface-card signal-now">
      <p className="eyebrow">Sinais do Universo</p>
      <div className="signal-clock" aria-live="polite">{clock}</div>
      {equal
        ? <p>É uma <strong>hora igual</strong>. {picked === equal ? "Seu sinal está logo abaixo." : <button type="button" className="ghost-button" onClick={() => open(equal, "agora")}>Ver o que {equal} significa</button>}</p>
        : <p>Próxima hora igual: <strong>{next.time}</strong>, em {next.minutes >= 60 ? `${Math.floor(next.minutes / 60)} h ${next.minutes % 60} min` : `${next.minutes} min`}.</p>}
      <div className="signal-grid" role="group" aria-label="Escolha uma hora igual">
        {EQUAL_HOURS.map((item) => <button type="button" key={item.time} aria-pressed={picked === item.time} className={item.time === equal ? "is-now" : ""} onClick={() => open(item.time, "grade")}>{item.time}</button>)}
      </div>
    </section>

    {failed && !data && <section className="surface-card"><p>Não foi possível carregar seus sinais agora. Tente novamente em instantes.</p></section>}

    {picked && !hour && !failed && <section className="surface-card signal-skeleton" aria-busy="true"><span/><span/><span/></section>}

    {hour && <section className="surface-card signal-hour" aria-labelledby="signal-hour-title">
      <p className="eyebrow"><Clock3 size={14} aria-hidden="true"/> {hour.time} · número {hour.number.label}</p>
      <h2 id="signal-hour-title">{hour.title}</h2>
      <div className="signal-tags">{hour.keywords.map((word) => <b key={word}>{word}</b>)}</div>
      <p>{hour.essence}</p>
      <p className="signal-short">{hour.short}</p>
      {hour.full ? <div className="signal-full">
        <article><h3><Sparkles size={15} aria-hidden="true"/> Para o seu signo</h3><p>{hour.full.sign}</p></article>
        <article><h3><Hash size={15} aria-hidden="true"/> Numerologia</h3><p>{hour.full.numerology}</p></article>
        <article><h3><Coins size={15} aria-hidden="true"/> Prosperidade</h3><p>{hour.full.prosperity}</p></article>
        <article><h3><Heart size={15} aria-hidden="true"/> Amor</h3><p>{hour.full.love}</p></article>
        <article><h3><Compass size={15} aria-hidden="true"/> Seu momento</h3><p>{hour.full.moment}</p></article>
      </div>
        : <Unlock text="Desbloquear minha interpretação completa" reason="signals_hour" openPaywall={openPaywall}>Há mais neste sinal para {data?.sign}: a leitura com o seu signo, sua numerologia, prosperidade, amor e o seu momento.</Unlock>}
      <p className="signal-note">Interpretação simbólica, para reflexão e entretenimento. Não é previsão nem promessa.</p>
    </section>}

    {data && <section className="surface-card signal-daily">
      <p className="eyebrow">A mensagem do seu dia</p>
      <h2>{data.daily.title}</h2>
      <p className="signal-meta"><span translate="no">{data.daily.sign}</span> · dia {data.daily.dayNumberKind} {data.daily.dayNumber}{data.daily.lifePath ? ` · Caminho de Vida ${data.daily.lifePath}` : ""}</p>
      {!data.daily.full && <p>{data.daily.short}</p>}
      {data.daily.full
        ? <div className="signal-full">{(["prosperidade", "amor", "momento"] as const).map((key) => <article key={key}><h3>{key === "prosperidade" ? "Prosperidade" : key === "amor" ? "Amor" : "Momento pessoal"}</h3><p>{data.daily.full!.messages[key]}</p></article>)}<article><h3>Dica do dia</h3><p>{data.daily.full.tip}</p></article></div>
        : <Unlock text="Ativar minha experiência personalizada" reason="signals_daily" openPaywall={openPaywall}>Receba a mensagem completa de hoje: prosperidade, amor e seu momento pessoal.</Unlock>}
    </section>}

    {data && <section className="surface-card signal-numerology">
      <p className="eyebrow">Minha numerologia</p>
      {!data.hasBirthDate ? <div className="signal-birth"><p>Para calcular seus números, informe sua data de nascimento.</p>
        <label>Data de nascimento<input type="date" max={localDayKey()} onChange={(event) => { if (event.target.value) { setBirth(event.target.value); track("signal_birth_added"); } }}/></label>
        <button type="button" className="ghost-button" onClick={() => navigate("profile")}>Ou atualizar no perfil</button></div>
        : <>
          {data.numerology.lifePath && <article className="signal-path"><span>{data.numerology.lifePath.value}</span><div><h3>Caminho de Vida · {data.numerology.lifePath.name}</h3><p>{data.numerology.lifePath.essence}</p></div></article>}
          {premium ? <>
            <div className="signal-numbers">
              <div><b>{label(data.numerology.destiny)}</b><span>Destino</span></div>
              <div><b>{label(data.numerology.personality)}</b><span>Personalidade</span></div>
              <div><b>{label(data.numerology.soul)}</b><span>Alma</span></div>
            </div>
            {data.numerology.cycles && <ul className="signal-cycles">
              <li><b>Ano pessoal {data.numerology.cycles.year}</b> {data.numerology.cycles.yearText}</li>
              <li><b>Mês pessoal {data.numerology.cycles.month}</b> {data.numerology.cycles.monthText}</li>
              <li><b>Dia pessoal {data.numerology.cycles.day}</b> {data.numerology.cycles.dayText}</li>
            </ul>}
          </> : <Unlock text="Descobrir o que esse sinal significa para mim" reason="signals_numerology" openPaywall={openPaywall}>Destino, Personalidade, Alma e seus ciclos pessoais de ano, mês e dia.</Unlock>}
        </>}
    </section>}

    {data?.hasBirthDate && <section className="surface-card signal-combo">
      <p className="eyebrow">Sua combinação energética</p>
      {data.combo ? <>
        <h2>{data.combo.title}</h2><p>{data.combo.lead}</p>
        <div className="signal-full">{data.combo.sections.map((section) => <article key={section.h}><h3>{section.h}</h3><p>{section.t}</p></article>)}</div>
      </> : <>
        <h2><span translate="no">{data.sign}</span> + o seu Caminho de Vida {data.numerology.lifePath?.value}</h2>
        <Unlock text="Desbloquear minha interpretação completa" reason="signals_combo" openPaywall={openPaywall}>Personalidade, prosperidade, amor, carreira, desafios, potenciais e o conselho do momento para essa combinação.</Unlock>
      </>}
    </section>}

    {data && <section className="surface-card signal-history">
      <p className="eyebrow">Meus sinais</p>
      {data.history.length === 0 ? <p>Os sinais que você abrir ficam guardados aqui para rever depois.</p>
        : <ul>{data.history.map((item) => <li key={`${item.dayKey}-${item.time}`}><button type="button" onClick={() => open(item.time, "historico")}><b>{item.time}</b> <span>{when(item.dayKey)}</span></button></li>)}</ul>}
      {data.historyHidden && <Unlock text="Ver meu histórico completo" reason="signals_history" openPaywall={openPaywall}>Há mais sinais guardados no seu histórico.</Unlock>}
    </section>}

    <nav className="signal-links" aria-label="Saiba mais">
      <Link href="/horas-iguais">Significado das horas iguais</Link>
      <Link href="/numerologia">Numerologia e Caminho de Vida</Link>
    </nav>
  </div>;
}
