import { daysSince, parseBrDate } from "./daily";
import { treeStageFor } from "./treeStages";

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
    // Key stays "arvore-dourada" so accounts that already unlocked this keep it unlocked —
    // only the display name changed, to stop colliding with the tree's own final golden stage.
    key: "arvore-dourada", name: "Toque Dourado", icon: "crown",
    hint: "Alcance 300 XP",
    story: "O toque dourado não é um prêmio: é o registro de que você sustentou algo por tempo suficiente para virar parte de quem você é.",
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

export function weeklyReport(snapshot: JourneySnapshot, nextThemeVerb: string): WeeklyReport {
  const now = new Date();
  const weekEntries = snapshot.entries.filter((entry) => {
    const date = parseBrDate(entry.date);
    return date ? daysSince(date, now) < 7 : false;
  });
  const categories = new Map<string, number>();
  for (const goal of snapshot.goals) categories.set(goal.category, (categories.get(goal.category) ?? 0) + goal.progress);
  const topArea = [...categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const stage = treeStageFor(snapshot.xp).stage.name;
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
