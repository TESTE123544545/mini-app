"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findGuide, type GuideSection } from "@/lib/library";
import { SIGNS, getSignByName, type SignData } from "@/lib/signs";

/** The per-sign guide is built from the sign data, starting with the reader's own sign. */
function signSections(sign: SignData, full: boolean): GuideSection[] {
  const base: GuideSection[] = [
    { heading: `${sign.glyph} ${sign.name} · ${sign.archetype}`, paragraphs: [sign.wealthMindset] },
    { heading: "Forças para usar a seu favor", bullets: [...sign.strengths] },
    { heading: "Pontos de atenção", bullets: [...sign.blindSpots] },
    { heading: "Antídoto prático", paragraphs: [sign.antidote] },
  ];
  if (!full) return base;
  return [
    ...base,
    { heading: "Carreira e negócios", bullets: [`Áreas com afinidade: ${sign.careerAndBusiness.bestFields.join(", ")}.`, sign.careerAndBusiness.leadershipStyle, sign.careerAndBusiness.negotiationPower] },
    { heading: `Ritual: ${sign.prosperityRitual.title} (${sign.prosperityRitual.duration})`, paragraphs: [sign.prosperityRitual.practice] },
    { heading: "Mantra", paragraphs: [`“${sign.prosperityMantra}”`] },
  ];
}

export function LibraryReader({ guideId, sign, onClose }: { guideId: string | null; sign: string; onClose: () => void }) {
  const guide = findGuide(guideId);
  const mine = getSignByName(sign);
  const sections = guide?.id === "sign-strategies"
    ? [...signSections(mine, true), ...SIGNS.filter((item) => item.id !== mine.id).flatMap((item) => signSections(item, false).slice(0, 1).concat({ heading: "", bullets: [item.antidote] }))]
    : guide?.sections ?? [];

  return <Dialog open={guide !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="goal-dialog library-reader">
      <DialogHeader>
        <DialogTitle>{guide?.title}</DialogTitle>
        <DialogDescription>{guide?.id === "sign-strategies" ? `Começando pelo seu signo, ${mine.name}. Leitura simbólica, não uma previsão.` : guide?.subtitle}</DialogDescription>
      </DialogHeader>
      <div className="library-reader__body">
        {sections.map((section, index) => <section key={index}>
          {section.heading && <h3>{section.heading}</h3>}
          {section.paragraphs?.map((text, paragraph) => <p key={paragraph}>{text}</p>)}
          {section.bullets && <ul>{section.bullets.map((text, bullet) => <li key={bullet}>{text}</li>)}</ul>}
        </section>)}
      </div>
    </DialogContent>
  </Dialog>;
}
