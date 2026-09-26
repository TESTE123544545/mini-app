"use client";

import { treeStageFor } from "@/lib/treeStages";

/**
 * The Prosperity Tree — one procedural SVG that grows continuously with xp: a seed in a dark
 * ceramic pot, a green sprout with its first leaves, a young plant, a tapered trunk turning to
 * wood, then a layered canopy that fills out, blossoms, bears golden fruit and finally turns gold.
 * Every size is interpolated from xp (see GROWTH below), so there is no dead stage where nothing
 * visible changes, and the whole drawing stays inside its 300×420 box.
 */

/** [xp, value] keyframes, read with linear interpolation. Thresholds match lib/treeStages.ts. */
type Keys = readonly (readonly [number, number])[];
function at(keys: Keys, xp: number) {
  if (xp <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [x1, y1] = keys[i];
    const [x0, y0] = keys[i - 1];
    if (xp <= x1) return y0 + ((y1 - y0) * (xp - x0)) / (x1 - x0);
  }
  return keys[keys.length - 1][1];
}

const GROWTH = {
  height: [[0, 0], [10, 7], [25, 26], [50, 60], [100, 92], [200, 112], [500, 126], [1000, 136], [3000, 146]],
  baseWidth: [[0, 2.2], [25, 2.8], [50, 4], [100, 9], [200, 13], [500, 17], [1000, 20], [3000, 24]],
  seed: [[0, 1], [10, 1], [30, 0]],
  wood: [[60, 0], [160, 1]],
  youngLeaves: [[12, 0], [25, 2], [50, 3], [75, 5], [100, 6]],
  youngFade: [[110, 1], [200, 0]],
  canopy: [[100, 0], [130, 0.36], [200, 0.5], [350, 0.64], [500, 0.76], [750, 0.9], [1000, 1]],
  branches: [[200, 0], [350, 1]],
  flowers: [[1000, 0], [1500, 1]],
  fruits: [[2000, 0], [3000, 1]],
  golden: [[3000, 0], [5000, 1]],
  glow: [[0, 0.35], [1000, 0.75], [5000, 1]],
} satisfies Record<string, Keys>;

const SOIL_Y = 336;
const CX = 150;

type Point = { x: number; y: number };

/** The stem's centre line: a gentle curve from the soil to its tip. */
function stemPoint(height: number, t: number): Point {
  const p0 = { x: CX, y: SOIL_Y };
  const p1 = { x: CX - 4, y: SOIL_Y - height * 0.55 };
  const p2 = { x: CX + 3, y: SOIL_Y - height };
  const u = 1 - t;
  return { x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y };
}

/** A filled, tapered outline around the stem's centre line — reads as wood, not as a pen stroke. */
function taperedStem(height: number, baseWidth: number) {
  const topWidth = Math.max(1.2, baseWidth * 0.34);
  const left: Point[] = [];
  const right: Point[] = [];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = stemPoint(height, t);
    const next = stemPoint(height, Math.min(1, t + 0.01));
    const prev = stemPoint(height, Math.max(0, t - 0.01));
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    // Flare a little at the base, like a real trunk meeting the ground.
    const w = (baseWidth + (topWidth - baseWidth) * t + (t < 0.12 ? (0.12 - t) * baseWidth * 2.2 : 0)) / 2;
    left.push({ x: p.x - (dy / len) * w, y: p.y + (dx / len) * w });
    right.push({ x: p.x + (dy / len) * w, y: p.y - (dx / len) * w });
  }
  const pts = [...left, ...right.reverse()];
  return `M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L")} Z`;
}

/** A pointed leaf of length L lying along +x from the origin. */
const leafPath = (L: number) => `M0,0 C${L * 0.28},${-L * 0.4} ${L * 0.74},${-L * 0.34} ${L},0 C${L * 0.74},${L * 0.34} ${L * 0.28},${L * 0.4} 0,0 Z`;

/** Leaves on the young stem: [position along the stem, side, angle]. The first two are the cotyledons. */
const YOUNG_LEAVES: readonly (readonly [number, -1 | 1, number])[] = [
  [1, -1, 28], [1, 1, 28], [0.66, 1, 34], [0.58, -1, 30], [0.4, 1, 38], [0.34, -1, 34],
];

/** Canopy clusters in canopy units (radius 1): x, y, r, layer (0 back → 2 front). Revealed in order. */
const CLUSTERS: readonly (readonly [number, number, number, 0 | 1 | 2])[] = [
  [0, -0.05, 0.56, 0], [-0.46, 0.12, 0.44, 0], [0.48, 0.1, 0.44, 0], [0, -0.48, 0.46, 0],
  [-0.62, -0.18, 0.34, 1], [0.62, -0.2, 0.34, 1], [-0.28, -0.3, 0.4, 1], [0.3, -0.34, 0.4, 1], [0, 0.22, 0.42, 1],
  [-0.78, 0.1, 0.26, 1], [0.78, 0.08, 0.26, 1], [-0.12, -0.72, 0.28, 2], [0.24, -0.66, 0.24, 2],
  [-0.4, -0.52, 0.24, 2], [0.5, -0.5, 0.22, 2], [-0.2, 0.02, 0.3, 2], [0.26, -0.06, 0.28, 2],
];
const LAYER_FILL = ["url(#pt-leaf-back)", "url(#pt-leaf-mid)", "url(#pt-leaf-front)"];
const FLOWERS: readonly (readonly [number, number])[] = [[-0.5, -0.1], [0.46, -0.28], [-0.1, -0.62], [0.2, 0.1], [-0.72, 0.18], [0.7, 0.02], [0.08, -0.34], [-0.34, -0.46]];
const FRUITS: readonly (readonly [number, number])[] = [[-0.36, 0.24], [0.4, 0.2], [-0.62, -0.02], [0.6, -0.1], [0.02, 0.34], [-0.18, -0.2], [0.26, -0.44]];
const SPARKLES: readonly (readonly [number, number, number])[] = [[56, 120, 5], [246, 92, 4], [214, 228, 3.5], [78, 238, 3.5], [150, 22, 4.5], [30, 180, 3]];

const sparklePath = (x: number, y: number, s: number) => `M${x},${y - s} L${x + s * 0.28},${y - s * 0.28} L${x + s},${y} L${x + s * 0.28},${y + s * 0.28} L${x},${y + s} L${x - s * 0.28},${y + s * 0.28} L${x - s},${y} L${x - s * 0.28},${y - s * 0.28} Z`;
const smooth = "d .9s cubic-bezier(.16,1,.3,1), opacity .8s ease, transform .9s cubic-bezier(.16,1,.3,1)";

export function ProsperityTree({ xp, celebrating = false, goalProgress }: { xp: number; celebrating?: boolean; goalProgress?: number }) {
  const { stageIndex } = treeStageFor(xp);
  const height = at(GROWTH.height, xp);
  const baseWidth = at(GROWTH.baseWidth, xp);
  const seed = at(GROWTH.seed, xp);
  const wood = at(GROWTH.wood, xp);
  const youngCount = at(GROWTH.youngLeaves, xp);
  const youngFade = at(GROWTH.youngFade, xp);
  const canopy = at(GROWTH.canopy, xp);
  const branches = at(GROWTH.branches, xp);
  const flowers = at(GROWTH.flowers, xp);
  const fruits = at(GROWTH.fruits, xp);
  const golden = at(GROWTH.golden, xp);
  const glow = at(GROWTH.glow, xp);

  const stem = height > 0.5 ? taperedStem(height, baseWidth) : "";
  const tip = stemPoint(height, 1);
  const R = 112 * canopy;
  // The crown sits low on the trunk so the tree reads as a tree, not a lollipop.
  const crown = { x: tip.x, y: tip.y - R * 0.12 };
  const leafLength = 10 + Math.min(1, xp / 100) * 9;
  const visibleClusters = Math.round(CLUSTERS.length * Math.min(1, canopy / 0.9));

  return (
    <svg
      className={`prosperity-tree-svg${celebrating ? " is-celebrating" : ""}`}
      viewBox="0 0 300 420"
      role="img"
      aria-label={`Sua árvore da prosperidade, estágio ${stageIndex + 1}`}
    >
      <defs>
        <radialGradient id="pt-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e0a53a" stopOpacity={0.42 * glow} />
          <stop offset="60%" stopColor="#e0a53a" stopOpacity={0.12 * glow} />
          <stop offset="100%" stopColor="#e0a53a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pt-floor" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a140d" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#1a140d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pt-pot" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b342d" />
          <stop offset="28%" stopColor="#2a2520" />
          <stop offset="70%" stopColor="#171411" />
          <stop offset="100%" stopColor="#221e1a" />
        </linearGradient>
        <linearGradient id="pt-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a4138" />
          <stop offset="100%" stopColor="#221d18" />
        </linearGradient>
        <radialGradient id="pt-soil" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#5a3c22" />
          <stop offset="100%" stopColor="#2c1d10" />
        </radialGradient>
        <linearGradient id="pt-stem-green" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#4d8a4f" />
          <stop offset="100%" stopColor="#7cc27a" />
        </linearGradient>
        <linearGradient id="pt-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5c3a1d" />
          <stop offset="45%" stopColor="#8a5a2d" />
          <stop offset="100%" stopColor="#4a2e16" />
        </linearGradient>
        <linearGradient id="pt-leaf" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3f8a4f" />
          <stop offset="100%" stopColor="#7cc47e" />
        </linearGradient>
        <radialGradient id="pt-leaf-back" cx="40%" cy="35%" r="70%"><stop offset="0%" stopColor="#4f9660" /><stop offset="100%" stopColor="#2f6a41" /></radialGradient>
        <radialGradient id="pt-leaf-mid" cx="38%" cy="30%" r="70%"><stop offset="0%" stopColor="#6cb577" /><stop offset="100%" stopColor="#3f8250" /></radialGradient>
        <radialGradient id="pt-leaf-front" cx="35%" cy="28%" r="70%"><stop offset="0%" stopColor="#95d28f" /><stop offset="100%" stopColor="#56a063" /></radialGradient>
        <radialGradient id="pt-gold-leaf" cx="35%" cy="28%" r="70%"><stop offset="0%" stopColor="#f6d67a" /><stop offset="100%" stopColor="#c48a26" /></radialGradient>
        <radialGradient id="pt-fruit" cx="34%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#fff0b8" />
          <stop offset="45%" stopColor="#f2b93c" />
          <stop offset="100%" stopColor="#b77818" />
        </radialGradient>
        <radialGradient id="pt-seed" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f7d98a" />
          <stop offset="100%" stopColor="#b98326" />
        </radialGradient>
      </defs>

      {/* Studio light behind the plant, growing warmer as it matures. */}
      <ellipse cx={CX} cy={canopy > 0 ? crown.y + 20 : SOIL_Y - 50} rx={canopy > 0 ? 150 : 110} ry={canopy > 0 ? 150 : 110} fill="url(#pt-glow)" style={{ transition: smooth }} />

      {/* Pot, soil and floor shadow — the one dark object in the scene. */}
      <ellipse cx={CX} cy="404" rx="96" ry="12" fill="url(#pt-floor)" />
      <path d="M92,344 L208,344 L196,398 Q150,408 104,398 Z" fill="url(#pt-pot)" />
      <path d="M100,352 L102,392" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="5" strokeLinecap="round" />
      <rect x="84" y="330" width="132" height="16" rx="8" fill="url(#pt-rim)" />
      <path d="M92,331.5 L208,331.5" stroke="#e0a53a" strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round" />
      <ellipse cx={CX} cy="336" rx="56" ry="5.5" fill="url(#pt-soil)" />

      {/* The seed rests on the soil until the sprout takes over. */}
      <g opacity={seed} style={{ transition: "opacity 1s ease" }}>
        <ellipse cx={CX} cy={SOIL_Y - 4} rx="8.5" ry="6.4" fill="url(#pt-seed)" />
        <ellipse cx={CX - 2.4} cy={SOIL_Y - 6.4} rx="2.4" ry="1.5" fill="#fff5d6" opacity="0.8" />
      </g>

      {/* Branches reach into the canopy; drawn first so leaves overlap them. */}
      {branches > 0 && <g stroke="url(#pt-wood)" strokeLinecap="round" fill="none" opacity={Math.min(1, branches * 1.4)}>
        {[[-0.62, 0.02], [0.62, -0.04], [0.06, -0.5], [-0.34, -0.36], [0.36, -0.4]].map(([bx, by], index) => {
          const from = stemPoint(height, 0.78 + index * 0.04);
          const to = { x: crown.x + bx * R * branches, y: crown.y + by * R * branches };
          return <path key={index} d={`M${from.x.toFixed(1)},${from.y.toFixed(1)} Q${((from.x + to.x) / 2).toFixed(1)},${(from.y - 6).toFixed(1)} ${to.x.toFixed(1)},${to.y.toFixed(1)}`} strokeWidth={Math.max(1.4, baseWidth * (index < 3 ? 0.42 : 0.28))} style={{ transition: smooth }} />;
        })}
      </g>}

      {/* Stem: green while young, turning to wood as it thickens. */}
      {stem && <>
        <path d={stem} fill="url(#pt-stem-green)" opacity={1 - wood} style={{ transition: smooth }} />
        <path d={stem} fill="url(#pt-wood)" opacity={wood} style={{ transition: smooth }} />
      </>}

      {/* First leaves on the young stem; they give way to the canopy. */}
      {youngFade > 0 && height > 4 && <g opacity={youngFade} style={{ transition: "opacity .8s ease" }}>
        {YOUNG_LEAVES.map(([t, side, angle], index) => {
          const shown = youngCount >= index + 1 ? 1 : youngCount > index ? youngCount - index : 0;
          const p = stemPoint(height, t);
          const L = leafLength * (index < 2 ? 1 : 1.12) * (0.4 + shown * 0.6);
          const rotation = side < 0 ? 180 + angle : -angle;
          return <g key={index} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${rotation})`} opacity={shown} style={{ transition: smooth }}>
            <path d={leafPath(L)} fill="url(#pt-leaf)" />
            <path d={`M1,0 L${(L * 0.86).toFixed(1)},0`} stroke="#2f6a41" strokeOpacity="0.45" strokeWidth="0.8" strokeLinecap="round" />
          </g>;
        })}
      </g>}

      {/* Canopy: clusters fill in back to front, then flowers, fruit and a golden crown. */}
      {canopy > 0 && <g>
        {CLUSTERS.map(([x, y, r, layer], index) => {
          const on = index < visibleClusters;
          return <circle key={index} cx={(crown.x + x * R).toFixed(1)} cy={(crown.y + y * R).toFixed(1)} r={(r * R * (on ? 1 : 0.2)).toFixed(1)} fill={LAYER_FILL[layer]} opacity={on ? 1 : 0} style={{ transition: "r .9s cubic-bezier(.16,1,.3,1), cx .9s cubic-bezier(.16,1,.3,1), cy .9s cubic-bezier(.16,1,.3,1), opacity .8s ease" }} />;
        })}
        {golden > 0 && CLUSTERS.map(([x, y, r], index) => index < visibleClusters && (
          <circle key={`g${index}`} cx={(crown.x + x * R).toFixed(1)} cy={(crown.y + y * R).toFixed(1)} r={(r * R).toFixed(1)} fill="url(#pt-gold-leaf)" opacity={golden * 0.85} />
        ))}
        {canopy > 0.5 && [[-0.36, -0.58, 0.07], [0.12, -0.8, 0.06], [0.44, -0.6, 0.05], [-0.62, -0.26, 0.05]].map(([x, y, r], index) => (
          <circle key={`h${index}`} cx={crown.x + x * R} cy={crown.y + y * R} r={r * R} fill="#ffffff" opacity={0.16 * canopy} />
        ))}
      </g>}

      {flowers > 0 && <g>
        {FLOWERS.map(([x, y], index) => {
          const on = flowers >= (index + 1) / FLOWERS.length;
          const fx = crown.x + x * R;
          const fy = crown.y + y * R;
          return <g key={index} opacity={on ? 1 : 0} transform={`translate(${fx.toFixed(1)} ${fy.toFixed(1)}) scale(${on ? 1 : 0.3})`} style={{ transition: smooth }}>
            {[0, 72, 144, 216, 288].map((angle) => <ellipse key={angle} cx="0" cy="-3.6" rx="2.6" ry="3.6" fill="#fbe4f2" transform={`rotate(${angle})`} />)}
            <circle r="2" fill="#e0a53a" />
          </g>;
        })}
      </g>}

      {fruits > 0 && <g>
        {FRUITS.map(([x, y], index) => {
          const on = fruits >= (index + 1) / FRUITS.length;
          const fx = crown.x + x * R;
          const fy = crown.y + y * R;
          return <g key={index} opacity={on ? 1 : 0} transform={`translate(${fx.toFixed(1)} ${fy.toFixed(1)}) scale(${on ? 1 : 0.3})`} style={{ transition: smooth }}>
            <path d="M0,-6 Q1.5,-9 4,-10" stroke="#5c3a1d" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <circle r="6.4" fill="url(#pt-fruit)" />
            <ellipse cx="-2.2" cy="-2.4" rx="1.8" ry="1.2" fill="#ffffff" opacity="0.7" />
          </g>;
        })}
      </g>}

      <g className="prosperity-tree-sparkles" aria-hidden="true" opacity={0.25 + glow * 0.6}>
        {SPARKLES.map(([x, y, s], index) => <path key={index} d={sparklePath(x, y, s)} fill="#e8b75a" style={{ animationDelay: `${index * 0.5}s` }} />)}
      </g>

      {goalProgress !== undefined && goalProgress >= 50 && canopy > 0 && (
        <circle cx={crown.x} cy={crown.y} r={R * 1.18} fill="none" stroke="#d9a0d6" strokeOpacity="0.3" strokeWidth="1.2" strokeDasharray="2 6" />
      )}
    </svg>
  );
}
