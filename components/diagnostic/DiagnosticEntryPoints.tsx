"use client";

import { ChevronRight, Sparkles, TreeDeciduous } from "lucide-react";
import { PROFILES, TREE_FOCUS, TREE_OPENING, interpret, type DiagnosticResult } from "@/lib/diagnostic";

/** Home: an invitation before the first diagnostic, then "Seu momento" + the way back to the tree. */
export function DiagnosticHomeCards({ result, onOpenDiagnostic, onOpenTree }: { result?: DiagnosticResult; onOpenDiagnostic: () => void; onOpenTree: () => void }) {
  if (!result) {
    return <button type="button" className="diag-entry diag-entry--invite" onClick={onOpenDiagnostic}>
      <span className="diag-entry__icon" aria-hidden="true"><Sparkles/></span>
      <span className="diag-entry__copy"><small>Meu diagnóstico · menos de 2 minutos</small><strong>Descubra o que está influenciando sua prosperidade</strong></span>
      <ChevronRight aria-hidden="true"/>
    </button>;
  }
  const { attention } = interpret(result.scores);
  return <section className="diag-entry-pair" aria-label="Seu diagnóstico">
    <button type="button" className="diag-entry" onClick={onOpenDiagnostic}>
      <span className="diag-entry__icon" aria-hidden="true"><Sparkles/></span>
      <span className="diag-entry__copy"><small>Seu momento · {PROFILES[result.profile].name}</small><strong>Seu diagnóstico está pronto.</strong><em>Ver meu diagnóstico&nbsp;→</em></span>
    </button>
    <button type="button" className="diag-entry" onClick={onOpenTree}>
      <span className="diag-entry__icon" aria-hidden="true"><TreeDeciduous/></span>
      <span className="diag-entry__copy"><small>Minha Árvore da Prosperidade</small><strong>{TREE_FOCUS[attention].message}</strong><em>Continuar minha jornada&nbsp;→</em></span>
    </button>
  </section>;
}

/** Tree: the diagnostic names which part of the existing tree to tend first. */
export function DiagnosticTreeFocus({ result, onOpenDiagnostic }: { result?: DiagnosticResult; onOpenDiagnostic: () => void }) {
  if (!result) {
    return <button type="button" className="diag-entry diag-entry--invite" onClick={onOpenDiagnostic}>
      <span className="diag-entry__icon" aria-hidden="true"><Sparkles/></span>
      <span className="diag-entry__copy"><small>Meu diagnóstico</small><strong>Descubra por onde a sua árvore começa</strong></span>
      <ChevronRight aria-hidden="true"/>
    </button>;
  }
  const { strength, attention } = interpret(result.scores);
  const focus = TREE_FOCUS[attention];
  return <section className="surface-card diag-tree-focus">
    <p className="eyebrow">Seu ponto de partida · {PROFILES[result.profile].name}</p>
    <h2>{TREE_OPENING[strength]}</h2>
    <p>{focus.message}</p>
    <div className="diag-tree-focus__part"><span>Parte em foco</span><strong>{focus.part}</strong></div>
    <p className="diag-tree-focus__practice">{focus.practice}</p>
    <button type="button" className="ghost-button" onClick={onOpenDiagnostic}>Ver meu diagnóstico</button>
  </section>;
}
