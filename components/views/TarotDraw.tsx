"use client";

import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { track } from "@/lib/analytics";
import { localDayKey } from "@/lib/daily";
import { MAJOR_ARCANA, readDraw, saveDraw, type DailyDraw } from "@/lib/oracles";

const STORAGE_KEY = "vds-tarot";

/**
 * Carta do dia — a daily Premium ritual in "12 Signos". One of the 22 major arcana, drawn once per
 * day and turned face up, read as a reflection plus one small action.
 */
export function TarotDraw({ isPremium, openPaywall, sign }: { isPremium: boolean; openPaywall: (reason: string) => void; sign: string }) {
  const day = localDayKey();
  const [draw, setDraw] = useState<DailyDraw | null>(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const saved = readDraw(STORAGE_KEY, day);
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraw(saved);
    setFlipped(true);
  }, [day]);

  function reveal() {
    if (!isPremium) { openPaywall("tarot"); return; }
    if (draw) return;
    const index = crypto.getRandomValues(new Uint32Array(1))[0] % MAJOR_ARCANA.length;
    const next = { day, index };
    saveDraw(STORAGE_KEY, next);
    setDraw(next);
    setFlipped(true);
    track("tarot_drawn", { card: MAJOR_ARCANA[index].number });
  }

  const card = draw ? MAJOR_ARCANA[draw.index] : null;

  return <section className={`surface-card tarot-draw ${isPremium ? "" : "is-locked"}`}>
    <div className="section-heading">
      <div><p className="eyebrow">Ritual diário · Premium</p><h2>Tarô: sua carta do dia</h2></div>
      {!isPremium && <LockKeyhole size={18} aria-hidden="true"/>}
    </div>
    <p className="detail-narrative">Uma carta dos 22 Arcanos Maiores por dia, lida para o seu momento de {sign}.</p>

    <button type="button" className={`tarot-card ${flipped ? "is-flipped" : ""}`} onClick={reveal} disabled={Boolean(draw)} aria-label={card ? `Sua carta: ${card.name}` : isPremium ? "Virar a carta do dia" : "Desbloquear o tarô"}>
      <span className="tarot-card__inner">
        <span className="tarot-card__face tarot-card__back" aria-hidden="true">
          <span className="tarot-card__ornament">✦</span>
          <small>{isPremium ? "Toque para virar" : "Premium"}</small>
        </span>
        <span className="tarot-card__face tarot-card__front" aria-hidden="true">
          {card && <>
            <span className="tarot-card__roman">{card.roman}</span>
            <span className="tarot-card__name">{card.name}</span>
            <span className="tarot-card__keyword">{card.keyword}</span>
          </>}
        </span>
      </span>
    </button>

    {card
      ? <div className="tarot-draw__result" role="status">
          <p className="tarot-draw__message">{card.message}</p>
          <p className="fortune-wheel__action"><strong>Ação de hoje:</strong> {card.action}</p>
          <p className="disclaimer">Leitura simbólica para reflexão, não uma previsão. Uma nova carta amanhã.</p>
        </div>
      : !isPremium && <button type="button" className="gold-button fortune-wheel__cta" onClick={() => openPaywall("tarot")}><LockKeyhole size={16}/> Desbloquear o Tarô</button>}
  </section>;
}
