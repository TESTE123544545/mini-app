"use client";

import { rangeProgress, treeStageFor } from "@/lib/treeStages";

/**
 * The Prosperity Tree — a single procedural SVG that grows continuously with xp
 * instead of swapping between finished illustrations. Roots, trunk, branches,
 * leaves, flowers and fruit each reveal along their own xp range (see
 * lib/treeStages.ts) using pathLength-normalized stroke-dashoffset, so every
 * curve "draws itself" smoothly regardless of its real geometric length.
 */
export function ProsperityTree({ xp, celebrating = false, goalProgress }: { xp: number; celebrating?: boolean; goalProgress?: number }) {
  const { stageIndex } = treeStageFor(xp);

  // Seed fades out gradually as roots take over, instead of vanishing before the trunk has
  // anything to show — the earlier cutoff left a dead gap with nothing visible in it.
  const seedOpacity = 1 - rangeProgress(xp, "roots", "trunk");
  const rootsReveal = rangeProgress(xp, "roots", "young_tree");
  const trunkReveal = rangeProgress(xp, "sprout", "trunk");
  const branchesA = rangeProgress(xp, "branches", "more_branches");
  const branchesB = rangeProgress(xp, "more_branches", "leaves");
  const leafPool = rangeProgress(xp, "leaves", "full_leaves");
  const flowerPool = rangeProgress(xp, "flowers", "full_flowers");
  const fruitPool = rangeProgress(xp, "fruits", "complete");
  const goldenHalo = rangeProgress(xp, "complete", "golden");
  // No global scale transform on the whole tree: shrinking the entire canvas also shrank
  // already-small primitives (the seed dot, glow) into invisibility. Growth reads instead
  // through how much of each part is actually drawn (roots/trunk dash-reveal, leaf/flower/
  // fruit pool counts), while `maturity` slowly thickens the trunk and warms the glow.
  const maturity = rangeProgress(xp, "seed", "complete");
  const sparkleGrowth = rangeProgress(xp, "seed", "golden");
  const trunkWidth = 3.5 + maturity * 8;

  const dash = (reveal: number) => ({ strokeDasharray: 100, strokeDashoffset: 100 * (1 - reveal) });

  const leaves = LEAF_POOL.map((leaf, index) => ({ ...leaf, on: leafPool >= (index + 1) / LEAF_POOL.length }));
  const flowers = FLOWER_POOL.map((flower, index) => ({ ...flower, on: flowerPool >= (index + 1) / FLOWER_POOL.length }));
  const fruits = FRUIT_POOL.map((fruit, index) => ({ ...fruit, on: fruitPool >= (index + 1) / FRUIT_POOL.length }));

  return (
    <svg
      className={`prosperity-tree-svg${celebrating ? " is-celebrating" : ""}`}
      viewBox="0 0 300 420"
      role="img"
      aria-label={`Sua árvore da prosperidade, estágio ${stageIndex + 1}`}
    >
      <defs>
        <radialGradient id="pt-glow" cx="50%" cy="62%" r="55%">
          <stop offset="0%" stopColor="#d6a640" stopOpacity={0.34 + maturity * 0.26} />
          <stop offset="100%" stopColor="#d6a640" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pt-wood" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#8a5a22" />
          <stop offset="55%" stopColor="#c7922e" />
          <stop offset="100%" stopColor="#d6a640" />
        </linearGradient>
        <radialGradient id="pt-fruit" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f3cf73" />
          <stop offset="55%" stopColor="#f2b23c" />
          <stop offset="100%" stopColor="#c7922e" />
        </radialGradient>
        {goldenHalo > 0 && (
          <radialGradient id="pt-golden-halo" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#efc463" stopOpacity={goldenHalo * 0.55} />
            <stop offset="100%" stopColor="#efc463" stopOpacity="0" />
          </radialGradient>
        )}
      </defs>

      <ellipse cx="150" cy="388" rx="85" ry="70" fill="url(#pt-glow)" />
      {goldenHalo > 0 && <circle cx="150" cy="180" r="170" fill="url(#pt-golden-halo)" />}

      <ellipse cx="150" cy="396" rx="52" ry="9" fill="#3c3428" opacity="0.2" />
      <ellipse cx="150" cy="393" rx="40" ry="6.5" fill="#3c3428" opacity="0.12" />

      <g style={{ opacity: seedOpacity, transition: "opacity 1.1s ease" }}>
        <circle cx="150" cy="382" r="9.5" fill="url(#pt-fruit)" />
        <circle cx="150" cy="382" r="18" fill="#d6a640" opacity="0.4" />
      </g>

      <g fill="none" stroke="url(#pt-wood)" strokeLinecap="round">
        {ROOT_PATHS.map((d, index) => (
          <path key={index} d={d} pathLength={100} strokeWidth={1.6} style={{ ...dash(rootsReveal), transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)" }} />
        ))}

        <path d={TRUNK_PATH} pathLength={100} strokeWidth={trunkWidth} style={{ ...dash(trunkReveal), transition: "stroke-dashoffset 1.3s cubic-bezier(.16,1,.3,1), stroke-width .9s ease" }} />

        {BRANCH_A_PATHS.map((d, index) => (
          <path key={index} d={d} pathLength={100} strokeWidth={Math.max(2, trunkWidth * 0.45)} style={{ ...dash(branchesA), transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)" }} />
        ))}
        {BRANCH_B_PATHS.map((d, index) => (
          <path key={index} d={d} pathLength={100} strokeWidth={Math.max(1.6, trunkWidth * 0.32)} style={{ ...dash(branchesB), transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)" }} />
        ))}
      </g>

      <g>
        {leaves.map((leaf, index) => (
          <ellipse
            key={index}
            cx={leaf.x}
            cy={leaf.y}
            rx="7.5"
            ry="4.5"
            fill="#5fae78"
            opacity={leaf.on ? 0.92 : 0}
            transform={`rotate(${leaf.rot} ${leaf.x} ${leaf.y}) scale(${leaf.on ? 1 : 0.4})`}
            style={{ transformOrigin: `${leaf.x}px ${leaf.y}px`, transition: "opacity .7s ease, transform .7s cubic-bezier(.16,1,.3,1)" }}
          />
        ))}
      </g>

      <g>
        {flowers.map((flower, index) => (
          <g key={index} opacity={flower.on ? 1 : 0} transform={`scale(${flower.on ? 1 : 0.3})`} style={{ transformOrigin: `${flower.x}px ${flower.y}px`, transition: "opacity .8s ease, transform .8s cubic-bezier(.16,1,.3,1)" }}>
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse key={angle} cx={flower.x} cy={flower.y} rx="3.4" ry="2" fill="#d9a0d6" opacity="0.9" transform={`rotate(${angle} ${flower.x} ${flower.y}) translate(3 0)`} />
            ))}
            <circle cx={flower.x} cy={flower.y} r="1.8" fill="#d6a640" />
          </g>
        ))}
      </g>

      <g>
        {fruits.map((fruit, index) => (
          <circle
            key={index}
            cx={fruit.x}
            cy={fruit.y}
            r="5.5"
            fill="url(#pt-fruit)"
            opacity={fruit.on ? 1 : 0}
            transform={`scale(${fruit.on ? 1 : 0.3})`}
            style={{ transformOrigin: `${fruit.x}px ${fruit.y}px`, transition: "opacity .8s ease, transform .8s cubic-bezier(.16,1,.3,1)" }}
          />
        ))}
      </g>

      <g className="prosperity-tree-sparkles" aria-hidden="true" opacity={0.3 + sparkleGrowth * 0.7}>
        {SPARKLE_POOL.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={point.r} fill="#efc463" style={{ animationDelay: `${index * 0.5}s` }} />
        ))}
      </g>

      {goalProgress !== undefined && goalProgress >= 50 && (
        <circle cx="150" cy="200" r="150" fill="none" stroke="#d9a0d6" strokeOpacity="0.25" strokeWidth="1.4" strokeDasharray="2 6" />
      )}
    </svg>
  );
}

const TRUNK_PATH = "M150,393 C146,340 154,260 149,190 C146,175 151,168 150,158";

const ROOT_PATHS = [
  "M150,390 C138,394 122,396 108,402",
  "M150,391 C142,398 132,403 122,410",
  "M150,391 C158,398 168,403 178,410",
  "M150,390 C162,394 178,396 192,402",
];

const BRANCH_A_PATHS = [
  "M150,205 C130,196 108,178 86,152",
  "M150,198 C172,188 194,172 216,148",
];

const BRANCH_B_PATHS = [
  "M150,165 C128,148 110,128 96,100",
  "M150,158 C174,142 192,122 206,96",
];

const LEAF_POOL = [
  { x: 86, y: 152, rot: -30 }, { x: 74, y: 140, rot: -55 }, { x: 96, y: 132, rot: -10 },
  { x: 216, y: 148, rot: 30 }, { x: 228, y: 138, rot: 55 }, { x: 206, y: 130, rot: 10 },
  { x: 96, y: 100, rot: -40 }, { x: 82, y: 90, rot: -70 }, { x: 108, y: 84, rot: -15 },
  { x: 206, y: 96, rot: 40 }, { x: 220, y: 86, rot: 70 }, { x: 194, y: 80, rot: 15 },
  { x: 150, y: 158, rot: 0 }, { x: 134, y: 116, rot: -25 }, { x: 166, y: 112, rot: 25 }, { x: 150, y: 78, rot: 0 },
];

const FLOWER_POOL = [
  { x: 96, y: 132 }, { x: 206, y: 130 }, { x: 108, y: 84 }, { x: 194, y: 80 }, { x: 150, y: 78 }, { x: 150, y: 112 },
];

const FRUIT_POOL = [
  { x: 88, y: 145 }, { x: 214, y: 142 }, { x: 100, y: 96 }, { x: 202, y: 92 }, { x: 150, y: 130 },
];

const SPARKLE_POOL = [
  { x: 60, y: 220, r: 1.4 }, { x: 240, y: 210, r: 1.2 }, { x: 90, y: 60, r: 1.3 },
  { x: 210, y: 55, r: 1.1 }, { x: 150, y: 40, r: 1.5 }, { x: 40, y: 320, r: 1.2 },
];
