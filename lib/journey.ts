import { daysSince, parseBrDate } from "./daily";
import { treeStageFor } from "./treeStages";

export type JourneySnapshot = {
  xp: number;
  level: number;
  streak: number;
  entries: { date: string; answers: string[] }[];
  goals: { title: string; category: string; progress: number }[];
  /** Days completed in the current guided trail. */
  trailDays?: number;
  /** Keys already unlocked (saved in the account) — keeps badges even if a number later drops,
   *  and is the only way exclusive achievements granted by the team show up. */
  unlockedKeys?: readonly string[];
};

export type AchievementTier = "bronze" | "prata" | "ouro" | "exclusiva";
export type AchievementCategory = "constancia" | "crescimento" | "nivel" | "reflexao" | "frutos" | "trilhas" | "exclusivas";

export const ACHIEVEMENT_CATEGORIES: readonly { id: AchievementCategory; label: string }[] = [
  { id: "constancia", label: "Constância" },
  { id: "crescimento", label: "Crescimento da árvore" },
  { id: "nivel", label: "Nível" },
  { id: "reflexao", label: "Reflexão" },
  { id: "frutos", label: "Frutos (metas concluídas)" },
  { id: "trilhas", label: "Trilhas" },
  { id: "exclusivas", label: "Exclusivas" },
];

export type Achievement = {
  key: string;
  name: string;
  icon: "sprout" | "anchor" | "flame" | "apple" | "shield" | "orbit" | "crown" | "gem" | "star" | "trophy" | "book" | "route";
  tier: AchievementTier;
  category: AchievementCategory;
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

type Tiered = Achievement["tier"];
const entryCount = (snapshot: JourneySnapshot) => snapshot.entries.length;
const tiered = (key: string, tier: Tiered, category: Achievement["category"], name: string, icon: Achievement["icon"], hint: string, story: string, reward: string, value: (s: JourneySnapshot) => number, target: number, xpBonus?: number): Achievement[] => [{
  key, tier, category, name, icon, hint, story, reward, xpBonus,
  reached: (snapshot) => value(snapshot) >= target,
  progress: (snapshot) => ({ current: Math.min(value(snapshot), target), target }),
}];
const streakTier = (key: string, days: number, tier: Tiered, name: string, story: string, reward: string, bonus: number) => tiered(key, tier, "constancia", name, "flame", `Mantenha ${days} dias de sequência`, story, reward, (s) => s.streak, days, bonus);
// XP and level tiers grant no XP bonus: rewarding an XP threshold with XP cascades into more thresholds.
const xpTier = (key: string, xp: number, tier: Tiered, name: string, story: string, reward: string) => tiered(key, tier, "crescimento", name, tier === "ouro" ? "crown" : "sprout", `Alcance ${xp.toLocaleString("pt-BR")} XP`, story, reward, (s) => s.xp, xp);
const levelTier = (key: string, level: number, tier: Tiered, name: string, story: string) => tiered(key, tier, "nivel", name, "orbit", `Alcance o nível ${level}`, story, `Selo de nível ${level}`, (s) => s.level, level);
const entryTier = (key: string, entries: number, tier: Tiered, name: string, story: string, bonus: number) => tiered(key, tier, "reflexao", name, "book", `Registre ${entries} reflexões no diário`, story, "Leitura de padrões mais profunda", entryCount, entries, bonus);
const fruitTier = (key: string, fruits: number, tier: Tiered, name: string, story: string, bonus: number) => tiered(key, tier, "frutos", name, "apple", `Conclua ${fruits} metas`, story, `${fruits} frutos permanentes`, completedGoals, fruits, bonus);
const trailTier = (key: string, days: number, tier: Tiered, name: string, story: string, bonus: number) => tiered(key, tier, "trilhas", name, "route", `Conclua ${days} dias de uma trilha guiada`, story, "Selo de trilha", (s) => s.trailDays ?? 0, days, bonus);
const exclusive = (key: string, name: string, icon: Achievement["icon"], story: string): Achievement[] => [{
  key, tier: "exclusiva", category: "exclusivas", name, icon, story,
  hint: "Concedida pela equipe Veias da Sintonia",
  reward: "Conquista exclusiva",
  reached: () => false,
  progress: (snapshot) => ({ current: snapshot.unlockedKeys?.includes(key) ? 1 : 0, target: 1 }),
}];

export const achievements: readonly Achievement[] = [
  {
    key: "primeiro-passo", tier: "bronze", category: "crescimento", name: "Primeiro Passo", icon: "sprout",
    hint: "Alcance 40 XP",
    story: "Toda árvore começa antes de parecer uma árvore. O que você fez aqui foi pequeno o suficiente para caber no dia — e é exatamente por isso que funcionou.",
    reward: "Raízes visíveis na sua árvore",
    reached: (s) => s.xp >= 40,
    progress: (s) => ({ current: Math.min(s.xp, 40), target: 40 }),
  },
  {
    key: "raizes-fortes", tier: "bronze", category: "crescimento", name: "Raízes Fortes", icon: "anchor",
    hint: "Alcance 100 XP",
    story: "Raiz é a parte que ninguém elogia. Ela não aparece, não rende foto e é a única razão pela qual a árvore continua de pé quando o vento vem.",
    reward: "Estágio Raiz concluído",
    reached: (s) => s.xp >= 100,
    progress: (s) => ({ current: Math.min(s.xp, 100), target: 100 }),
  },
  {
    key: "sete-dias", tier: "bronze", category: "constancia", name: "Sete Dias de Constância", icon: "flame",
    hint: "Mantenha 7 dias de sequência",
    story: "Sete dias não mudam a sua vida. Mudam a sua ideia sobre o que você é capaz de sustentar — e essa é a parte que dura.",
    reward: "Anel de constelação na árvore",
    reached: (s) => s.streak >= 7,
    progress: (s) => ({ current: Math.min(s.streak, 7), target: 7 }),
    xpBonus: 100,
  },
  {
    key: "primeiro-fruto", tier: "bronze", category: "frutos", name: "Primeiro Fruto", icon: "apple",
    hint: "Conclua uma meta",
    story: "Fruto é meta terminada. Não a mais bonita nem a maior: a que você levou até o fim enquanto ninguém estava olhando.",
    reward: "Fruto permanente na árvore",
    reached: (s) => completedGoals(s) >= 1,
    progress: (s) => ({ current: Math.min(completedGoals(s), 1), target: 1 }),
    xpBonus: 100,
  },
  {
    key: "guardiao", tier: "bronze", category: "reflexao", name: "Guardião da Disciplina", icon: "shield",
    hint: "Registre 7 reflexões",
    story: "Escrever o que passou é como você para de repetir o mesmo ciclo sem perceber. Sete registros já formam um padrão legível.",
    reward: "Histórico com leitura de padrões",
    reached: (s) => s.entries.length >= 7,
    progress: (s) => ({ current: Math.min(s.entries.length, 7), target: 7 }),
    xpBonus: 100,
  },
  {
    key: "ciclo-completo", tier: "bronze", category: "nivel", name: "Ciclo Completo", icon: "orbit",
    hint: "Alcance o nível 3",
    story: "Um ciclo completo é quando a ação já não depende de motivação. Você chegou aqui somando dias comuns, não dias especiais.",
    reward: "Flores desbloqueadas",
    reached: (s) => s.level >= 3,
    progress: (s) => ({ current: Math.min(s.level, 3), target: 3 }),
  },
  {
    // Key stays "arvore-dourada" so accounts that already unlocked this keep it unlocked —
    // only the display name changed, to stop colliding with the tree's own final golden stage.
    key: "arvore-dourada", tier: "bronze", category: "crescimento", name: "Toque Dourado", icon: "crown",
    hint: "Alcance 300 XP",
    story: "O toque dourado não é um prêmio: é o registro de que você sustentou algo por tempo suficiente para virar parte de quem você é.",
    reward: "Tema dourado completo",
    reached: (s) => s.xp >= 300,
    progress: (s) => ({ current: Math.min(s.xp, 300), target: 300 }),
  },

  /* --- Harder tiers ---------------------------------------------------------------------- */
  ...streakTier("tres-dias", 3, "bronze", "Três Dias Seguidos", "O começo de um ritmo: três dias sem quebrar a corrente.", "Brilho no tronco", 30),
  ...streakTier("vinte-e-um-dias", 21, "prata", "21 Dias de Raiz", "Vinte e um dias transformam intenção em hábito. Sua rotina já sustenta a árvore sozinha.", "Aura prateada na árvore", 150),
  ...streakTier("sessenta-dias", 60, "ouro", "60 Dias Inabaláveis", "Dois meses de presença. Você provou que a constância não depende do humor do dia.", "Coroa de constelações", 300),
  ...streakTier("cem-dias", 100, "ouro", "Cem Dias de Sintonia", "Cem dias é uma nova identidade. Poucas pessoas chegam aqui.", "Título Sintonia Plena", 500),
  ...xpTier("copa-cheia", 750, "prata", "Copa Cheia", "Sua copa ganhou volume. Os hábitos já fazem sombra — e abrigo.", "Folhagem completa"),
  ...xpTier("florescer", 1500, "prata", "Florescer", "As flores aparecem quando a raiz já não precisa ser lembrada.", "Flores na copa"),
  ...xpTier("frutificar", 3000, "ouro", "Frutificar", "Frutos são o resultado visível de um cuidado invisível e diário.", "Árvore da Prosperidade completa"),
  ...xpTier("arvore-suprema", 5000, "ouro", "Árvore Dourada", "O estado máximo da árvore. Sua jornada já não depende de empolgação.", "Árvore dourada"),
  ...levelTier("nivel-10", 10, "prata", "Nível 10", "Dez níveis somando dias comuns. É assim que se constrói algo grande."),
  ...levelTier("nivel-25", 25, "ouro", "Nível 25", "Vinte e cinco níveis. Você virou referência para si mesmo(a)."),
  ...entryTier("diario-30", 30, "prata", "Diário de 30 Páginas", "Trinta reflexões mostram padrões que você nunca veria em um dia só.", 150),
  ...entryTier("diario-100", 100, "ouro", "Cem Reflexões", "Cem registros: um mapa real de quem você está se tornando.", 400),
  ...fruitTier("tres-frutos", 3, "prata", "Colheita", "Três metas concluídas. A árvore começa a dar frutos com regularidade.", 200),
  ...fruitTier("pomar", 10, "ouro", "Pomar", "Dez metas até o fim. Você não planta mais árvores — você cultiva um pomar.", 500),
  ...trailTier("trilha-7", 7, "bronze", "Primeira Trilha", "Sete dias guiados, um capítulo por dia. O caminho ficou mais claro.", 80),
  ...trailTier("trilha-21", 21, "prata", "Trilha Completa", "Vinte e um dias de trilha concluídos. Estrutura que fica.", 250),

  /* --- Exclusive: granted by the Veias da Sintonia team, never earned automatically ----- */
  ...exclusive("exclusiva-fundador", "Fundador(a) da Sintonia", "crown", "Para quem acreditou no Veias da Sintonia desde o começo."),
  ...exclusive("exclusiva-estrela-guia", "Estrela Guia", "star", "Reconhecimento especial de quem inspira outras pessoas na jornada."),
  ...exclusive("exclusiva-guardiao-portal", "Guardião(ã) do Portal", "gem", "Concedida a quem atravessou o portal com dedicação rara."),
  ...exclusive("exclusiva-mestre", "Mestre da Constância", "trophy", "Um marco concedido pela equipe a jornadas exemplares."),
  ...exclusive("exclusiva-coracao", "Coração Generoso", "sprout", "Para quem compartilhou luz e ajudou a comunidade a crescer."),
];

export function achievementState(snapshot: JourneySnapshot) {
  const saved = new Set(snapshot.unlockedKeys ?? []);
  const resolved = achievements.map((achievement) => ({ ...achievement, unlocked: achievement.reached(snapshot) || saved.has(achievement.key), ...achievement.progress(snapshot) }));
  const unlocked = resolved.filter((item) => item.unlocked);
  // "Next" is the earnable goal closest to completion — exclusives are never suggested.
  const upcoming = resolved
    .filter((item) => !item.unlocked && item.tier !== "exclusiva")
    .sort((a, b) => b.current / b.target - a.current / a.target);
  return { resolved, unlockedCount: unlocked.length, total: resolved.length, next: upcoming[0], upcoming: upcoming.slice(0, 3) };
}

export const EXCLUSIVE_ACHIEVEMENTS = achievements.filter((item) => item.tier === "exclusiva").map(({ key, name }) => ({ key, name }));


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
