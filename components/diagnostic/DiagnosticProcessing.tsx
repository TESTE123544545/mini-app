"use client";

import { useEffect, useState } from "react";

const STEPS = ["Analisando suas respostas…", "Identificando seus principais padrões…", "Preparando seu mapa de prosperidade…"];
const STEP_MS = 1100;

/** A short, deliberate pause between the last answer and the result — about 3.3s in total. */
export function DiagnosticProcessing({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, index) => window.setTimeout(() => {
      if (index < STEPS.length - 1) setStep(index + 1);
      else onDone();
    }, STEP_MS * (index + 1)));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  // onDone is stable for the lifetime of this screen; restarting the timers on re-render would stall it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <section className="diag-processing" aria-busy="true">
    <div className="diag-processing__orb" aria-hidden="true">
      <span className="diag-processing__ring"/>
      <span className="diag-processing__core"/>
      <span className="diag-processing__dust"><i/><i/><i/><i/><i/><i/></span>
    </div>
    <p className="eyebrow">Meu diagnóstico</p>
    <p className="diag-processing__message" role="status" aria-live="polite" key={step}>{STEPS[step]}</p>
    <div className="diag-processing__steps" aria-hidden="true">{STEPS.map((_, index) => <i key={index} className={index <= step ? "is-on" : ""}/>)}</div>
  </section>;
}
