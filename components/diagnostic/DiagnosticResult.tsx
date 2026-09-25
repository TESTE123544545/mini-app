"use client";

import { useEffect, useRef } from "react";
import { Compass, Flame, Gem, RotateCcw, Sprout, Zap } from "lucide-react";
import { ProsperityTree } from "@/components/ProsperityTree";
import { DIMENSIONS, PROFILES, TREE_FOCUS, TREE_OPENING, followUpLabel, interpret, optionLabel, type DiagnosticResult as Result, type Dimension, type ProfileId } from "@/lib/diagnostic";

const dimensionIcon: Record<Dimension, React.ReactNode> = {
  prosperidade: <Gem/>, movimento: <Zap/>, clareza: <Compass/>, confianca: <Flame/>, constancia: <Sprout/>,
};

export function DiagnosticScore({ dimension, value, highlight }: { dimension: Dimension; value: number; highlight?: "strength" | "attention" }) {
  const meta = DIMENSIONS.find((item) => item.id === dimension)!;
  return <div className={`diag-score ${highlight ? `is-${highlight}` : ""}`}>
    <span className="diag-score__icon" aria-hidden="true">{dimensionIcon[dimension]}</span>
    <div className="diag-score__body">
      <div className="diag-score__head">
        <strong>{meta.label}</strong>
        {highlight && <em>{highlight === "strength" ? "sua força" : "ponto de atenção"}</em>}
        <b>{value}%</b>
      </div>
      <div className="diag-score__track" role="meter" aria-label={meta.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-valuetext={`${value} de 100 — ${meta.description}`}>
        <i style={{ width: `${value}%` }}/>
      </div>
      <small>{meta.description}</small>
    </div>
  </div>;
}

export function ProsperityProfile({ profileId }: { profileId: ProfileId }) {
  const profile = PROFILES[profileId];
  return <div className="diag-profile">
    <p className="eyebrow">Seu perfil de prosperidade</p>
    <h3>{profile.name}</h3>
    <p className="diag-profile__tagline">{profile.tagline}</p>
    <p>{profile.description}</p>
  </div>;
}

export function DiagnosticResult({ result, xp, onOpenTree, onRestart }: { result: Result; xp: number; onOpenTree: () => void; onRestart: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { summary, strength, attention } = interpret(result.scores);
  const focus = TREE_FOCUS[attention];

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [result.completedAt]);

  return <div className="diag-result">
    <section className="diag-hero diag-result__hero">
      <span className="diag-hero__halo" aria-hidden="true"/>
      <p className="eyebrow">Seu diagnóstico está pronto</p>
      <h2 ref={headingRef} tabIndex={-1}>{result.sign}, encontramos alguns pontos importantes no seu momento atual.</h2>
      <p className="diag-result__area">Área que você quer transformar: <strong>{[optionLabel("area", result.area), followUpLabel("area", result.answers)].filter(Boolean).join(" · ")}</strong></p>
      <ProsperityProfile profileId={result.profile}/>
    </section>

    <section className="surface-card diag-scores" aria-labelledby="diag-scores-title">
      <div className="section-heading"><div><p className="eyebrow">Suas cinco dimensões</p><h2 id="diag-scores-title">Onde está sua energia hoje</h2></div></div>
      <div className="diag-scores__list">
        {DIMENSIONS.map((item) => <DiagnosticScore key={item.id} dimension={item.id} value={result.scores[item.id]} highlight={item.id === strength ? "strength" : item.id === attention ? "attention" : undefined}/>)}
      </div>
    </section>

    <section className="surface-card diag-reading">
      <p className="eyebrow">Interpretação</p>
      <p className="diag-reading__lead">{summary}</p>
      <p className="disclaimer">Dentro da proposta simbólica do Veias da Sintonia, isso não significa que seu caminho esteja definido. O diagnóstico é uma ferramenta de reflexão sobre o seu momento atual — não é uma avaliação psicológica, médica ou financeira, e seu signo não determina seu futuro.</p>
    </section>

    <section className="diag-bridge" aria-labelledby="diag-bridge-title">
      <p className="eyebrow">Próxima etapa</p>
      <h2 id="diag-bridge-title">Agora que você conhece seu momento, é hora de descobrir onde sua prosperidade começa.</h2>
      <div className="diag-bridge__tree" aria-hidden="true">
        <span className="diag-bridge__glow"/>
        <ProsperityTree xp={xp}/>
      </div>
      <p className="diag-bridge__lead">Seu diagnóstico revelou seu ponto de partida.</p>
      <p className="diag-bridge__focus"><strong>{TREE_OPENING[strength]}</strong> {focus.message}</p>
      <button type="button" className="gold-button diag-bridge__cta" onClick={onOpenTree}>Descobrir minha Árvore da Prosperidade</button>
    </section>

    <button type="button" className="ghost-button diag-restart" onClick={onRestart}><RotateCcw size={15}/> Refazer diagnóstico</button>
  </div>;
}
