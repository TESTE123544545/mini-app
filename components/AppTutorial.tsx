"use client";

import { useState } from "react";
import { BookOpen, ChevronRight, Leaf, Sparkles, Telescope } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SLIDES = [
  { icon: <Telescope aria-hidden="true"/>, title: "Comece pelo diagnóstico", text: "Em poucos minutos você descobre o seu momento. A aba Momento guarda o resultado." },
  { icon: <Sparkles aria-hidden="true"/>, title: "Seu signo, todo dia", text: "Em Signos, você lê o dia do seu signo, a frase do dia e o céu ao vivo." },
  { icon: <Leaf aria-hidden="true"/>, title: "Ações fazem a árvore crescer", text: "Missão do dia, ritual de 3 minutos e metas rendem XP e fazem a sua Árvore da Prosperidade crescer." },
  { icon: <BookOpen aria-hidden="true"/>, title: "Reflita e converse", text: "No Diário você registra o dia, e a IA conversa com você a qualquer hora. Seu Premium completo está liberado por 3 dias." },
];

const key = (email: string) => `vds-tutorial:${email.toLowerCase()}`;

/** Marks a brand-new account so the tutorial shows once, the first time it enters the app. */
export function queueTutorial(email: string) {
  try { localStorage.setItem(key(email), "pending"); } catch { /* private mode: the tutorial is simply skipped */ }
}

function isPending(email: string) {
  try { return localStorage.getItem(key(email)) === "pending"; } catch { return false; }
}

/** First-run tutorial. Shown once per new account; skipping or finishing both mark it as seen. */
export function AppTutorial({ email }: { email: string }) {
  const [open, setOpen] = useState(() => isPending(email));
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  function close() {
    try { localStorage.setItem(key(email), "done"); } catch { /* ignore */ }
    setOpen(false);
  }

  return <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
    <DialogContent className="goal-dialog tutorial-dialog">
      <DialogHeader>
        <div className="tutorial-icon">{slide.icon}</div>
        <DialogTitle>{slide.title}</DialogTitle>
        <DialogDescription>{slide.text}</DialogDescription>
      </DialogHeader>
      <div className="tutorial-dots" aria-hidden="true">{SLIDES.map((item, position) => <i key={item.title} className={position === index ? "is-current" : ""}/>)}</div>
      <button type="button" className="gold-button" onClick={() => (last ? close() : setIndex(index + 1))}>{last ? "Começar" : <>Próximo <ChevronRight/></>}</button>
      {!last && <button type="button" className="tutorial-skip" onClick={close}>Pular tutorial</button>}
    </DialogContent>
  </Dialog>;
}
