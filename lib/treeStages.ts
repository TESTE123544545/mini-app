/**
 * Single source of truth for how the Prosperity Tree grows with XP.
 * Adjust `minXP` here to retune pacing — nothing else needs to change.
 */
export type TreeStage = { id: string; minXP: number; name: string; note: string };

export const TREE_STAGES: readonly TreeStage[] = [
  { id: "seed", minXP: 0, name: "Semente", note: "A intenção foi plantada." },
  { id: "roots", minXP: 10, name: "Raízes", note: "Os primeiros hábitos ganharam sustentação." },
  { id: "sprout", minXP: 25, name: "Broto", note: "O primeiro broto rompeu a terra." },
  { id: "young_tree", minXP: 50, name: "Muda", note: "Uma muda pequena, já em pé sozinha." },
  { id: "trunk", minXP: 100, name: "Tronco", note: "O tronco ganhou firmeza." },
  { id: "branches", minXP: 200, name: "Galhos", note: "Os primeiros galhos se abriram." },
  { id: "more_branches", minXP: 350, name: "Novos Galhos", note: "Novos galhos se estenderam." },
  { id: "leaves", minXP: 500, name: "Folhas", note: "As folhas surgiram." },
  { id: "full_leaves", minXP: 750, name: "Copa Cheia", note: "Sua copa está mais cheia." },
  { id: "flowers", minXP: 1000, name: "Florescimento", note: "As primeiras flores desabrocharam." },
  { id: "full_flowers", minXP: 1500, name: "Árvore Florida", note: "Uma árvore grande e florida." },
  { id: "fruits", minXP: 2000, name: "Frutificação", note: "Os primeiros frutos surgiram." },
  { id: "complete", minXP: 3000, name: "Árvore da Prosperidade", note: "Sua árvore está completa." },
  { id: "golden", minXP: 5000, name: "Árvore Dourada", note: "O estado máximo — a jornada já não depende de empolgação." },
];

function stageMinXP(id: string) {
  return TREE_STAGES.find((item) => item.id === id)?.minXP ?? 0;
}

export function treeStageFor(xp: number) {
  let index = 0;
  for (let i = 0; i < TREE_STAGES.length; i++) if (xp >= TREE_STAGES[i].minXP) index = i;
  const stage = TREE_STAGES[index];
  const next = TREE_STAGES[index + 1] ?? null;
  const stageProgress = next ? Math.min(1, Math.max(0, (xp - stage.minXP) / (next.minXP - stage.minXP))) : 1;
  return { stage, stageIndex: index, next, stageProgress };
}

/** 0 below `fromId`'s threshold, 1 at or above `toId`'s, smooth in between. */
export function rangeProgress(xp: number, fromId: string, toId: string) {
  const from = stageMinXP(fromId);
  const to = stageMinXP(toId);
  if (to <= from) return xp >= to ? 1 : 0;
  return Math.min(1, Math.max(0, (xp - from) / (to - from)));
}

export type TreePartHotspot = { key: string; name: string; note: string; unlockedAt: number; x: number; y: number };

/** Tap targets overlaid on the tree — position as a percentage of the tree stage box. */
export const TREE_PART_HOTSPOTS: readonly TreePartHotspot[] = [
  { key: "raizes", name: "Raízes", unlockedAt: stageMinXP("roots"), x: 50, y: 90, note: "Seus hábitos e aquilo que você cuida mesmo sem plateia. Crescem a cada ritual concluído." },
  { key: "tronco", name: "Tronco", unlockedAt: stageMinXP("trunk"), x: 50, y: 64, note: "Sua constância. É o que segura o peso das metas quando a motivação não aparece." },
  { key: "galhos", name: "Galhos", unlockedAt: stageMinXP("branches"), x: 50, y: 44, note: "As missões que você concluiu. Cada uma abriu espaço para um galho novo." },
  { key: "folhas", name: "Folhas", unlockedAt: stageMinXP("leaves"), x: 32, y: 34, note: "Sua presença diária. Aparecem quando você volta, mesmo fazendo pouco." },
  { key: "flores", name: "Flores", unlockedAt: stageMinXP("flowers"), x: 66, y: 26, note: "Suas sequências de dias seguidos. Um sinal raro de constância." },
  { key: "frutos", name: "Frutos", unlockedAt: stageMinXP("fruits"), x: 50, y: 20, note: "Metas concluídas. Ficam na árvore para sempre, como registro do que você terminou." },
  { key: "copa", name: "Copa Dourada", unlockedAt: stageMinXP("golden"), x: 50, y: 10, note: "O estágio em que a jornada já não depende de empolgação. É o topo da sua evolução visível." },
];
