"use client";

import { useEffect, useState } from "react";
import { Clock3, History, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";
import { DIAGNOSTIC_QUESTIONS, PROFILES, buildResult, type Answers, type DiagnosticResult as Result } from "@/lib/diagnostic";
import { DiagnosticQuestion } from "./DiagnosticQuestion";
import { DiagnosticProcessing } from "./DiagnosticProcessing";
import { DiagnosticResult } from "./DiagnosticResult";

type Stage = "intro" | "question" | "processing" | "result";

type Props = {
  /** Latest first; empty until the first diagnostic is completed. */
  results: Result[];
  profileSign?: string;
  xp: number;
  onComplete: (result: Result) => void;
  onOpenTree: () => void;
};

export function DiagnosticHome({ onStart }: { onStart: () => void }) {
  return <section className="diag-hero diag-intro">
    <span className="diag-hero__halo" aria-hidden="true"/>
    <span className="diag-intro__mark" aria-hidden="true"><Sparkles/></span>
    <p className="eyebrow">Meu diagnóstico</p>
    <h2>Descubra o que está influenciando sua prosperidade</h2>
    <p className="diag-intro__lead">Responda algumas perguntas e descubra seu momento atual, seus principais bloqueios e onde sua energia de prosperidade pode ser direcionada.</p>
    <button type="button" className="gold-button diag-intro__cta" onClick={onStart}>Começar meu diagnóstico</button>
    <p className="diag-intro__time"><Clock3 size={14}/> Leva menos de 2 minutos.</p>
    <p className="disclaimer">Uma leitura simbólica e de autoconhecimento — não é diagnóstico psicológico, médico ou financeiro.</p>
  </section>;
}

export function DiagnosticHistory({ results }: { results: Result[] }) {
  if (results.length < 2) return null;
  const format = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  return <section className="surface-card diag-history" aria-labelledby="diag-history-title">
    <div className="section-heading"><div><p className="eyebrow">Sua evolução</p><h2 id="diag-history-title">Diagnósticos anteriores</h2></div><History/></div>
    <ol>
      {results.map((item, index) => <li key={item.completedAt}>
        <span>{format(item.completedAt)}{index === 0 && <em> · atual</em>}</span>
        <strong>{PROFILES[item.profile].name}</strong>
      </li>)}
    </ol>
  </section>;
}

export function DiagnosticView({ results, profileSign, xp, onComplete, onOpenTree }: Props) {
  const latest = results[0];
  // null = "resting": show the saved result if there is one, otherwise the intro. Derived rather than
  // stored so a result that loads after mount (storage is read in an effect) still shows up.
  const [activeStage, setStage] = useState<Exclude<Stage, "intro" | "result"> | null>(null);
  const stage: Stage = activeStage ?? (latest ? "result" : "intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [showError, setShowError] = useState(false);
  const total = DIAGNOSTIC_QUESTIONS.length;
  const question = DIAGNOSTIC_QUESTIONS[index];

  useEffect(() => { window.scrollTo(0, 0); }, [stage, index]);

  useEffect(() => {
    if (stage === "result" && latest) track("diagnostic_result_viewed", { profile: latest.profile });
  }, [stage, latest]);

  function start() {
    track(latest ? "diagnostic_restarted" : "diagnostic_started");
    // The sign is already known from onboarding; suggest it, the person still confirms.
    setAnswers(profileSign ? { sign: profileSign } : {});
    setIndex(0);
    setDirection("forward");
    setShowError(false);
    setStage("question");
  }

  function select(optionId: string) {
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
    setShowError(false);
  }

  function next() {
    const selected = answers[question.id];
    if (!selected) { setShowError(true); return; }
    track("diagnostic_question_answered", { question: question.id, option: selected, step: index + 1 });
    setDirection("forward");
    if (index < total - 1) setIndex(index + 1);
    else setStage("processing");
  }

  function back() {
    setShowError(false);
    setDirection("back");
    if (index > 0) setIndex(index - 1);
    else setStage(null);
  }

  function finish() {
    const result = buildResult(answers);
    track("diagnostic_completed", { profile: result.profile, scores: result.scores });
    onComplete(result);
    setStage(null);
  }

  if (stage === "processing") return <DiagnosticProcessing onDone={finish}/>;

  if (stage === "question") {
    return <DiagnosticQuestion
      key={question.id}
      question={question}
      index={index}
      total={total}
      selected={answers[question.id]}
      direction={direction}
      showError={showError}
      suggestedOption={profileSign}
      onSelect={select}
      onContinue={next}
      onBack={back}
    />;
  }

  if (stage === "result" && latest) {
    return <div className="view-stack diag-stack">
      <DiagnosticResult result={latest} xp={xp} onOpenTree={onOpenTree} onRestart={start}/>
      <DiagnosticHistory results={results}/>
    </div>;
  }

  return <DiagnosticHome onStart={start}/>;
}
