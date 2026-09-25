"use client";

import { useEffect, useRef, useState } from "react";
import { LockKeyhole, RotateCw } from "lucide-react";
import { track } from "@/lib/analytics";
import { localDayKey } from "@/lib/daily";
import { WHEEL_HOUSES, readDraw, saveDraw, type DailyDraw } from "@/lib/oracles";

const STORAGE_KEY = "vds-wheel";
const SEGMENT = 360 / WHEEL_HOUSES.length;
const SPIN_MS = 3800;
const CX = 150;
const CY = 150;

const point = (radius: number, degrees: number) => {
  const radians = (degrees * Math.PI) / 180;
  return [CX + radius * Math.sin(radians), CY - radius * Math.cos(radians)] as const;
};

function segmentPath(index: number) {
  const [x0, y0] = point(140, index * SEGMENT - SEGMENT / 2);
  const [x1, y1] = point(140, index * SEGMENT + SEGMENT / 2);
  return `M${CX},${CY} L${x0.toFixed(2)},${y0.toFixed(2)} A140,140 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z`;
}

/** Rotation that brings house `index` under the pointer at the top, after a few full turns. */
const landingRotation = (index: number, turns = 5) => turns * 360 - index * SEGMENT;

/**
 * Roda da Fortuna — a daily Premium ritual in "Astrologia & Céu". One spin per day lands on one of
 * the twelve houses and offers a theme, a reflection and one small action. No prizes, no odds.
 */
export function FortuneWheel({ isPremium, openPaywall }: { isPremium: boolean; openPaywall: (reason: string) => void }) {
  const day = localDayKey();
  const [draw, setDraw] = useState<DailyDraw | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const pending = useRef<DailyDraw | null>(null);

  // A spin already made today is shown as it landed.
  useEffect(() => {
    const saved = readDraw(STORAGE_KEY, day);
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraw(saved);
    setRotation(landingRotation(saved.index, 0));
  }, [day]);

  function spin() {
    if (!isPremium) { openPaywall("wheel"); return; }
    if (draw || spinning) return;
    const index = crypto.getRandomValues(new Uint32Array(1))[0] % WHEEL_HOUSES.length;
    pending.current = { day, index };
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setSpinning(true);
    setRotation(landingRotation(index));
    track("wheel_spun", { house: WHEEL_HOUSES[index].house });
    // transitionend can be skipped (reduced motion, app sent to background mid-spin): settle by time too.
    window.setTimeout(finish, reduceMotion ? 0 : SPIN_MS + 250);
  }

  function finish() {
    if (!pending.current) return;
    saveDraw(STORAGE_KEY, pending.current);
    setDraw(pending.current);
    pending.current = null;
    setSpinning(false);
  }

  const result = draw ? WHEEL_HOUSES[draw.index] : null;

  return <section className={`surface-card fortune-wheel ${isPremium ? "" : "is-locked"}`}>
    <div className="section-heading">
      <div><p className="eyebrow">Ritual diário · Premium</p><h2>Roda da Fortuna</h2></div>
      {!isPremium && <LockKeyhole size={18} aria-hidden="true"/>}
    </div>
    <p className="detail-narrative">Gire uma vez por dia e descubra qual casa do céu ilumina o seu momento — com uma reflexão e uma ação para hoje.</p>

    <div className="fortune-wheel__stage">
      <span className="fortune-wheel__pointer" aria-hidden="true"/>
      <svg
        className="fortune-wheel__disc"
        viewBox="0 0 300 300"
        role="img"
        aria-label={result ? `A roda parou na Casa ${result.house}: ${result.theme}` : "Roda com as doze casas astrológicas"}
        style={{ transform: `rotate(${rotation}deg)`, transitionDuration: spinning ? `${SPIN_MS}ms` : "0ms" }}
        onTransitionEnd={finish}
      >
        <defs>
          <radialGradient id="wheel-hub" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="#f6e3ac"/><stop offset="1" stopColor="#b6862c"/></radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r="146" fill="#050f34" stroke="#e9cd7b" strokeWidth="2"/>
        {WHEEL_HOUSES.map((house, index) => <g key={house.house}>
          <path d={segmentPath(index)} fill={index % 2 ? "#0c2360" : "#132f78"} stroke="#e9cd7b66" strokeWidth="1"/>
          <g transform={`rotate(${index * SEGMENT} ${CX} ${CY})`}>
            <text x={CX} y={CY - 104} textAnchor="middle" dominantBaseline="middle" className="fortune-wheel__glyph">{house.glyph}</text>
            <text x={CX} y={CY - 76} textAnchor="middle" dominantBaseline="middle" className="fortune-wheel__num">{house.house}</text>
          </g>
        </g>)}
        <circle cx={CX} cy={CY} r="46" fill="#07143e" stroke="#e9cd7b" strokeWidth="2"/>
        <circle cx={CX} cy={CY} r="30" fill="url(#wheel-hub)"/>
        <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" className="fortune-wheel__hub">✦</text>
      </svg>
    </div>

    {result
      ? <div className="fortune-wheel__result" role="status">
          <p className="eyebrow">Casa {result.house} · {result.theme}</p>
          <p className="fortune-wheel__message">{result.message}</p>
          <p className="fortune-wheel__action"><strong>Ação de hoje:</strong> {result.action}</p>
          <p className="disclaimer">Leitura simbólica para reflexão. Volte amanhã para um novo giro.</p>
        </div>
      : <button type="button" className="gold-button fortune-wheel__cta" onClick={spin} disabled={spinning}>
          {isPremium ? <><RotateCw size={18}/> {spinning ? "Girando…" : "Girar a roda"}</> : <><LockKeyhole size={16}/> Desbloquear a Roda da Fortuna</>}
        </button>}
  </section>;
}
