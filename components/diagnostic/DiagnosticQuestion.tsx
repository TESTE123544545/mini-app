"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import type { DiagnosticQuestion as Question } from "@/lib/diagnostic";

export function DiagnosticProgress({ current, total }: { current: number; total: number }) {
  const percent = Math.round((current / total) * 100);
  return <div className="diag-progress">
    <div className="diag-progress__label"><span>Pergunta {current} de {total}</span><span aria-hidden="true">{percent}%</span></div>
    <div className="diag-progress__track" role="progressbar" aria-label="Progresso do diagnóstico" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} aria-valuetext={`Pergunta ${current} de ${total}`}>
      <i style={{ width: `${percent}%` }}/>
    </div>
  </div>;
}

type Props = {
  question: Question;
  index: number;
  total: number;
  selected?: string;
  direction: "forward" | "back";
  showError: boolean;
  suggestedOption?: string;
  onSelect: (optionId: string) => void;
  onContinue: () => void;
  onBack: () => void;
};

export function DiagnosticQuestion({ question, index, total, selected, direction, showError, suggestedOption, onSelect, onContinue, onBack }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const titleId = `diag-q-${question.id}`;
  const isLast = index === total - 1;

  // Move focus to the new question so screen readers announce it after every step.
  useEffect(() => { titleRef.current?.focus({ preventScroll: true }); }, [question.id]);

  // Radio-group keyboard pattern: arrows move and select, like native radio buttons.
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(groupRef.current?.querySelectorAll<HTMLButtonElement>("[role=radio]") ?? []);
    const currentIndex = Math.max(0, buttons.findIndex((button) => button === document.activeElement));
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const next = buttons[(currentIndex + step + buttons.length) % buttons.length];
    next?.focus();
    if (next?.dataset.option) onSelect(next.dataset.option);
  }

  const focusable = selected ?? question.options[0]?.id;

  return <section className="diag-question" data-direction={direction} key={question.id}>
    <div className="diag-question__top">
      <button type="button" className="diag-back" onClick={onBack}><ArrowLeft size={16}/> Voltar</button>
    </div>
    <DiagnosticProgress current={index + 1} total={total}/>
    <h2 id={titleId} ref={titleRef} tabIndex={-1}>{question.title}</h2>
    {question.helper && <p className="diag-question__helper">{question.helper}</p>}
    {suggestedOption && question.id === "sign" && <p className="diag-question__hint">Pelo seu cadastro, seu signo é <strong>{suggestedOption}</strong>. Confirme ou escolha outro.</p>}
    <div ref={groupRef} className={`diag-options ${question.layout === "grid" ? "is-grid" : ""}`} role="radiogroup" aria-labelledby={titleId} aria-describedby={showError ? `${titleId}-error` : undefined} onKeyDown={onKeyDown}>
      {question.options.map((option) => {
        const checked = selected === option.id;
        return <button
          type="button"
          role="radio"
          aria-checked={checked}
          tabIndex={option.id === focusable ? 0 : -1}
          key={option.id}
          data-option={option.id}
          className={`diag-option ${checked ? "is-selected" : ""}`}
          onClick={() => onSelect(option.id)}
        >
          {option.hint && <span className="diag-option__glyph" aria-hidden="true">{option.hint}</span>}
          <span className="diag-option__label">{option.label}</span>
          <span className="diag-option__check" aria-hidden="true">{checked && <Check/>}</span>
        </button>;
      })}
    </div>
    <p className="diag-error" id={`${titleId}-error`} role="alert">{showError ? "Escolha uma opção para continuar." : ""}</p>
    <button type="button" className="gold-button diag-continue" onClick={onContinue} aria-disabled={!selected}>
      {isLast ? "Ver meu diagnóstico" : "Continuar"} <ChevronRight size={18}/>
    </button>
  </section>;
}
