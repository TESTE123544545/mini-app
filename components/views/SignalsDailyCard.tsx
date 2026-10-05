"use client";

import { Sparkles } from "lucide-react";
import { useSignals } from "@/components/views/SignalsView";

/** "A mensagem do seu dia" on the Home: today's date, sign, numbers and the day's focus. */
export function SignalsDailyCard({ onOpen }: { onOpen: () => void }) {
  const { data } = useSignals(null, null);
  if (!data) return null;
  const { daily } = data;
  const text = daily.full?.messages[daily.category] ?? daily.short;
  return <section className="surface-card signal-daily signal-daily--home" aria-label="A mensagem do seu dia">
    <p className="eyebrow"><Sparkles size={14} aria-hidden="true"/> A mensagem do seu dia</p>
    <p className="signal-meta"><span translate="no">{daily.sign}</span> · dia {daily.dayNumberKind} {daily.dayNumber}{daily.lifePath ? ` · Caminho de Vida ${daily.lifePath}` : ""}</p>
    <h2>{daily.title}</h2>
    <p>{text}</p>
    <button type="button" className="ghost-button" onClick={() => { onOpen(); }}>Ver meus sinais</button>
  </section>;
}
