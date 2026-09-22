import { daysSince, parseBrDate } from "./daily";

export type JourneySnapshot = {
  xp: number;
  level: number;
  streak: number;
  entries: { date: string; answers: string[] }[];
  goals: { title: string; category: string; progress: number }[];
};

export type Achievement = {
  key: string;
  name: string;
  icon: "sprout" | "anchor" | "flame" | "apple" | "shield" | "orbit" | "crown";
  hint: string;
  story: string;
  reward: string;
  reached: (snapshot: JourneySnapshot) => boolean;
  progress: (snapshot: JourneySnapshot) => { current: number; target: number };
  /**
   * XP bonus for unlocking this achievement, when it makes sense to grant one.
   * Achievements measured directly in xp/level omit this — crediting XP for
   * reaching an XP threshold is a feedback loop that cascades into several
   * more thresholds in the same instant, so those are rewarded with the
   * badge and tree stage alone.
   */
  xpBonus?: number;
};

const completedGoals = (snapshot: JourneySnapshot) => snapshot.goals.filter((goal) => goal.progress === 100).length;

export const achievements: readonly Achievement[] = [
  {
    key: "primeiro-passo", name: "Primeiro Passo", icon: "sprout",
    hint: "Alcance 40 XP",
    story: "Toda árvore começa antes de parecer uma árvore. O que você fez aqui foi pequeno o suficiente para caber no dia — e é exatamente por isso que funcionou.",
    reward: "Raízes visíveis na sua árvore",
    reached: (s) => s.xp >= 40,
    progress: (s) => ({ current: Math.min(s.xp, 40), target: 40 }),
  },
  {
    key: "raizes-fortes", name: "Raízes Fortes", icon: "anchor",
    hint: "Alcance 100 XP",
    story: "Raiz é a parte que ninguém elogia. Ela não aparece, não rende foto e é a única razão pela qual a árvore continua de pé quando o vento vem.",
    reward: "Estágio Raiz concluído",
    reached: (s) => s.xp >= 100,
    progress: (s) => ({ current: Math.min(s.xp, 100), target: 100 }),
  },
  {
    key: "sete-dias", name: "Sete Dias de Constância", icon: "flame",
    hint: "Mantenha 7 dias de sequência",
    story: "Sete dias não mudam a sua vida. Mudam a sua ideia sobre o que você é capaz de sustentar — e essa é a parte que dura.",
    reward: "Anel de constelação na árvore",
    reached: (s) => s.streak >= 7,
    progress: (s) => ({ current: Math.min(s.streak, 7), target: 7 }),
    xpBonus: 100,
  },
  {
    key: "primeiro-fruto", name: "Primeiro Fruto", icon: "apple",
    hint: "Conclua uma meta",
    story: "Fruto é meta terminada. Não a mais bonita nem a maior: a que você levou até o fim enquanto ninguém estava olhando.",
    reward: "Fruto permanente na árvore",
    reached: (s) => completedGoals(s) >= 1,
    progress: (s) => ({ current: Math.min(completedGoals(s), 1), target: 1 }),
    xpBonus: 100,
  },
  {
    key: "guardiao", name: "Guardião da Disciplina", icon: "shield",
    hint: "Registre 7 reflexões",
    story: "Escrever o que passou é como você para de repetir o mesmo ciclo sem perceber. Sete registros já formam um padrão legível.",
    reward: "Histórico com leitura de padrões",
    reached: (s) => s.entries.length >= 7,
    progress: (s) => ({ current: Math.min(s.entries.length, 7), target: 7 }),
    xpBonus: 100,
  },
  {
    key: "ciclo-completo", name: "Ciclo Completo", icon: "orbit",
    hint: "Alcance o nível 3",
    story: "Um ciclo completo é quando a ação já não depende de motivação. Você chegou aqui somando dias comuns, não dias especiais.",
    reward: "Flores desbloqueadas",
    reached: (s) => s.level >= 3,
    progress: (s) => ({ current: Math.min(s.level, 3), target: 3 }),
  },
  {
    key: "arvore-dourada", name: "Árvore Dourada", icon: "crown",
    hint: "Alcance 300 XP",
    story: "A árvore dourada não é um prêmio: é o registro de que você sustentou algo por tempo suficiente para virar parte de quem você é.",
    reward: "Tema dourado completo",
    reached: (s) => s.xp >= 300,
    progress: (s) => ({ current: Math.min(s.xp, 300), target: 300 }),
  },
];

export function achievementState(snapshot: JourneySnapshot) {
  const resolved = achievements.map((achievement) => ({ ...achievement, unlocked: achievement.reached(snapshot), ...achievement.progress(snapshot) }));
  const unlocked = resolved.filter((item) => item.unlocked);
  const next = resolved.find((item) => !item.unlocked);
  return { resolved, unlockedCount: unlocked.length, total: resolved.length, next };
}

export type TreePart = {
  key: string;
  name: string;
  meaning: string;
  unlockedAt: number;
  x: number;
  y: number;
};

/** Hotspot coordinates are percentages inside the tree stage, matched to prosperity-tree.png. */
export const treeParts: readonly TreePart[] = [
  { key: "raizes", name: "Raízes", meaning: "Seus hábitos e aquilo que você cuida mesmo sem plateia. Crescem a cada ritual concluído.", unlockedAt: 0, x: 50, y: 86 },
  { key: "tronco", name: "Tronco", meaning: "Sua constância. É o que segura o peso das metas quando a motivação não aparece.", unlockedAt: 40, x: 50, y: 66 },
  { key: "galho-esquerdo", name: "Galho da Ação", meaning: "As missões que você concluiu. Cada uma abriu uma folha nova neste lado da árvore.", unlockedAt: 100, x: 34, y: 45 },
  { key: "galho-direito", name: "Galho da Reflexão", meaning: "Seu diário. Observar padrões é o que evita repetir o mesmo ciclo.", unlockedAt: 100, x: 66, y: 45 },
  { key: "flores", name: "Flores", meaning: "Suas sequências. Aparecem quando você volta em dias seguidos, mesmo fazendo pouco.", unlockedAt: 180, x: 40, y: 28 },
  { key: "frutos", name: "Frutos", meaning: "Metas concluídas. Ficam na árvore para sempre, como registro do que você terminou.", unlockedAt: 240, x: 60, y: 31 },
  { key: "copa", name: "Copa Dourada", meaning: "O estágio em que a jornada já não depende de empolgação. É o topo da sua evolução visível.", unlockedAt: 300, x: 50, y: 16 },
];

export type WeeklyReport = {
  rangeLabel: string;
  reflections: number;
  goalsAdvancing: number;
  fruits: number;
  streak: number;
  topArea: string | null;
  moodNote: string;
  newOnTree: string;
  summary: string;
  recommendation: string;
};

const stageLabel = (xp: number) => (xp < 40 ? "Semente" : xp < 100 ? "Raiz" : xp < 180 ? "Crescimento" : xp < 300 ? "Árvore" : "Árvore Dourada");

export function weeklyReport(snapshot: JourneySnapshot, nextThemeVerb: string): WeeklyReport {
  const now = new Date();
  const weekEntries = snapshot.entries.filter((entry) => {
    const date = parseBrDate(entry.date);
    return date ? daysSince(date, now) < 7 : false;
  });
  const categories = new Map<string, number>();
  for (const goal of snapshot.goals) categories.set(goal.category, (categories.get(goal.category) ?? 0) + goal.progress);
  const topArea = [...categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const stage = stageLabel(snapshot.xp);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const format = (date: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
  return {
    rangeLabel: `${format(start)} — ${format(now)}`,
    reflections: weekEntries.length,
    goalsAdvancing: snapshot.goals.filter((goal) => goal.progress > 0 && goal.progress < 100).length,
    fruits: completedGoals(snapshot),
    streak: snapshot.streak,
    topArea,
    moodNote: weekEntries.length ? `${weekEntries.length === 1 ? "registro guardado" : "registros guardados"} nesta semana` : "nenhum registro nesta semana ainda",
    newOnTree: stage,
    summary: topArea
      ? `${topArea} é a sua área mais trabalhada, e a árvore está no estágio ${stage}.`
      : `Sua árvore está no estágio ${stage}. Crie uma meta para o relatório passar a medir sua área de foco.`,
    recommendation: `Para a próxima semana: ${nextThemeVerb.toLowerCase()} uma coisa só${topArea ? `, em ${topArea.toLowerCase()}` : ""}.`,
  };
}
