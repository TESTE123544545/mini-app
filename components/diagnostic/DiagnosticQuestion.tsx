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
  /** Answer to the selected option's follow-up, if it has one. */
  detail?: string;
  direction: "forward" | "back";
  /** Which validation message to show under the options, if any. */
  error: "option" | "detail" | null;
  suggestedOption?: string;
  onSelect: (optionId: string) => void;
  onSelectDetail: (detailId: string) => void;
  onContinue: () => void;
  onBack: () => void;
};

/** Radio-group keyboard pattern: arrows move and select, like native radio buttons. */
function arrowNavigation(selector: string, onPick: (id: string) => void) {
  return (event: React.KeyboardEvent<HTMLElement>) => {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(selector));
    const currentIndex = Math.max(0, buttons.findIndex((button) => button === document.activeElement));
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const next = buttons[(currentIndex + step + buttons.length) % buttons.length];
    next?.focus();
    if (next?.dataset.option) onPick(next.dataset.option);
  };
}

export function DiagnosticQuestion({ question, index, total, selected, detail, direction, error, suggestedOption, onSelect, onSelectDetail, onContinue, onBack }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `diag-q-${question.id}`;
  const isLast = index === total - 1;
  const followUp = question.options.find((option) => option.id === selected)?.followUp;

  // Move focus to the new question so screen readers announce it after every step.
  useEffect(() => { titleRef.current?.focus({ preventScroll: true }); }, [question.id]);

  // When a choice opens its detail panel, bring the panel into view (the last options sit near the fold).
  useEffect(() => {
    if (!followUp) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => panelRef.current?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" }), 180);
    return () => window.clearTimeout(timer);
  }, [followUp, selected]);

  const focusable = selected ?? question.options[0]?.id;
  const detailFocusable = detail ?? followUp?.options[0]?.id;
  const errorText = error === "option" ? "Escolha uma opção para continuar." : error === "detail" ? "Escolha também uma das opções logo abaixo para continuar." : "";

  return <section className="diag-question" data-direction={direction} key={question.id}>
    <div className="diag-question__top">
      <button type="button" className="diag-back" onClick={onBack}><ArrowLeft size={16}/> Voltar</button>
    </div>
    <DiagnosticProgress current={index + 1} total={total}/>
    <h2 id={titleId} ref={titleRef} tabIndex={-1}>{question.title}</h2>
    {question.helper && <p className="diag-question__helper">{question.helper}</p>}
    {suggestedOption && question.id === "sign" && <p className="diag-question__hint">Pelo seu cadastro, seu signo é <strong>{suggestedOption}</strong>. Confirme ou escolha outro.</p>}
    <div className={`diag-options ${question.layout === "grid" ? "is-grid" : ""}`} role="radiogroup" aria-labelledby={titleId} aria-describedby={errorText ? `${titleId}-error` : undefined} onKeyDown={arrowNavigation("[data-level=main]", onSelect)}>
      {question.options.map((option) => {
        const checked = selected === option.id;
        const detailTitleId = `${titleId}-${option.id}-detail`;
        return <div className="diag-option-slot" key={option.id}>
          <button
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={option.id === focusable ? 0 : -1}
            data-option={option.id}
            data-level="main"
            className={`diag-option ${checked ? "is-selected" : ""}`}
            onClick={() => onSelect(option.id)}
          >
            {option.hint && <span className="diag-option__glyph" aria-hidden="true">{option.hint}</span>}
            <span className="diag-option__label">{option.label}</span>
            <span className="diag-option__check" aria-hidden="true">{checked && <Check/>}</span>
          </button>
          {checked && option.followUp && <div ref={panelRef} className="diag-followup">
            <p className="diag-followup__title" id={detailTitleId}>{option.followUp.title}</p>
            <div className="diag-followup__options" role="radiogroup" aria-labelledby={detailTitleId} onKeyDown={arrowNavigation("[data-level=detail]", onSelectDetail)}>
              {option.followUp.options.map((item) => {
                const picked = detail === item.id;
                return <button
                  type="button"
                  role="radio"
                  aria-checked={picked}
                  tabIndex={item.id === detailFocusable ? 0 : -1}
                  key={item.id}
                  data-option={item.id}
                  data-level="detail"
                  className={`diag-chip ${picked ? "is-selected" : ""}`}
                  onClick={() => onSelectDetail(item.id)}
                >
                  <span className="diag-chip__dot" aria-hidden="true">{picked && <Check/>}</span>
                  <span>{item.label}</span>
                </button>;
              })}
            </div>
          </div>}
        </div>;
      })}
    </div>
    <p className="diag-error" id={`${titleId}-error`} role="alert">{errorText}</p>
    <button type="button" className="gold-button diag-continue" onClick={onContinue} aria-disabled={!selected || (Boolean(followUp) && !detail)}>
      {isLast ? "Ver meu diagnóstico" : "Continuar"} <ChevronRight size={18}/>
    </button>
  </section>;
}
