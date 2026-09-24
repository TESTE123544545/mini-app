import { SIGNS, getSignByName, type ElementType } from "@/lib/signs";

/**
 * "Meu Diagnóstico" — a symbolic self-knowledge reading, never a psychological or
 * financial assessment. Everything that shapes the result lives in plain data below
 * (questions, option weights, element nudges, profile rules), so tuning the reading
 * means editing numbers here, not the UI.
 */

export type Dimension = "prosperidade" | "movimento" | "clareza" | "confianca" | "constancia";
export type Scores = Record<Dimension, number>;
type Effects = Partial<Record<Dimension, number>>;

export type DiagnosticOption = { id: string; label: string; hint?: string; effects: Effects };
export type DiagnosticQuestion = {
  id: string;
  type: "single";
  title: string;
  helper?: string;
  /** Visual layout of the answer cards: a compact grid (signs) or full-width stacked cards. */
  layout?: "grid" | "list";
  options: DiagnosticOption[];
};

export const DIMENSIONS: readonly { id: Dimension; label: string; description: string }[] = [
  { id: "prosperidade", label: "Prosperidade", description: "abertura para crescer e receber" },
  { id: "movimento", label: "Movimento", description: "transformar intenção em ação" },
  { id: "clareza", label: "Clareza", description: "saber para onde direcionar a energia" },
  { id: "confianca", label: "Confiança", description: "acreditar nas próprias escolhas" },
  { id: "constancia", label: "Constância", description: "sustentar o ritmo no dia a dia" },
];

/** Every dimension starts from the middle; answers push it up or down from here. */
const BASE_SCORE = 50;

/**
 * Symbolic flavour of each element — deliberately small so the answers, not the sign,
 * lead the reading ("seu signo não determina seu futuro").
 */
export const ELEMENT_EFFECTS: Record<ElementType, Effects> = {
  fogo: { movimento: 6 },
  terra: { constancia: 6 },
  ar: { clareza: 6 },
  agua: { confianca: 6 },
};

export const DIAGNOSTIC_QUESTIONS: readonly DiagnosticQuestion[] = [
  {
    id: "sign",
    type: "single",
    title: "Qual é o seu signo?",
    helper: "Ele dá o tom simbólico da leitura — quem conduz o resultado são as suas respostas.",
    layout: "grid",
    options: SIGNS.map((sign) => ({ id: sign.name, label: sign.name, hint: sign.glyph, effects: {} })),
  },
  {
    id: "area",
    type: "single",
    title: "Qual área da sua vida você mais deseja transformar?",
    options: [
      { id: "money", label: "Dinheiro e prosperidade", effects: { prosperidade: 14 } },
      { id: "career", label: "Carreira e negócios", effects: { prosperidade: 8, movimento: 4 } },
      { id: "love", label: "Amor e relacionamentos", effects: { confianca: 4, prosperidade: 2 } },
      { id: "purpose", label: "Propósito e direção", effects: { clareza: -6, prosperidade: 4 } },
      { id: "confidence", label: "Autoconfiança", effects: { confianca: -8, movimento: 2 } },
      { id: "growth", label: "Crescimento pessoal", effects: { constancia: 4, clareza: 4 } },
    ],
  },
  {
    id: "moment",
    type: "single",
    title: "Como você sente que está sua vida neste momento?",
    options: [
      { id: "stuck", label: "Estou travado(a)", effects: { movimento: -16, confianca: -6 } },
      { id: "changing", label: "Estou passando por mudanças", effects: { movimento: 8, clareza: -6 } },
      { id: "growing", label: "Estou crescendo e evoluindo", effects: { prosperidade: 10, movimento: 8, confianca: 8 } },
      { id: "lost", label: "Estou perdido(a) e buscando direção", effects: { clareza: -18, confianca: -6 } },
      { id: "ready", label: "Estou pronto(a) para uma nova fase", effects: { movimento: 14, confianca: 12 } },
    ],
  },
  {
    id: "blocker",
    type: "single",
    title: "O que mais parece impedir seu avanço?",
    options: [
      { id: "risk", label: "Medo de arriscar", effects: { movimento: -12, confianca: -12 } },
      { id: "consistency", label: "Falta de constância", effects: { constancia: -20 } },
      { id: "path", label: "Dúvidas sobre meu caminho", effects: { clareza: -18 } },
      { id: "motivation", label: "Falta de motivação", effects: { movimento: -10, constancia: -8 } },
      { id: "money-fear", label: "Medo de perder dinheiro", effects: { prosperidade: -10, confianca: -8 } },
      { id: "action", label: "Não consigo transformar planos em ação", effects: { movimento: -16, constancia: -6, clareza: 6 } },
    ],
  },
  {
    id: "opportunity",
    type: "single",
    title: "Quando uma oportunidade aparece, você normalmente…",
    options: [
      { id: "embrace", label: "Abraço imediatamente", effects: { movimento: 14, confianca: 8, constancia: -4 } },
      { id: "overthink", label: "Penso muito antes de agir", effects: { movimento: -8, clareza: 6 } },
      { id: "fear", label: "Tenho medo de tomar a decisão errada", effects: { confianca: -14, movimento: -6 } },
      { id: "perfect", label: "Espero o momento perfeito", effects: { movimento: -12, constancia: -4 } },
      { id: "analyze", label: "Analiso e depois ajo", effects: { clareza: 10, movimento: 6, constancia: 6 } },
    ],
  },
  {
    id: "phrase",
    type: "single",
    title: "Qual destas frases mais representa você?",
    options: [
      { id: "bigger", label: "Eu sei que posso viver algo maior.", effects: { prosperidade: 8, confianca: 6 } },
      { id: "potential", label: "Tenho potencial, mas ainda não encontrei meu caminho.", effects: { clareza: -12, prosperidade: 4 } },
      { id: "close", label: "Sinto que estou perto de uma mudança.", effects: { movimento: 8, prosperidade: 4 } },
      { id: "recover", label: "Preciso recuperar minha confiança.", effects: { confianca: -14 } },
      { id: "results", label: "Quero aprender a transformar oportunidades em resultados.", effects: { prosperidade: 8, movimento: -6 } },
    ],
  },
  {
    id: "first-move",
    type: "single",
    title: "Se sua vida financeira melhorasse significativamente, o que você faria primeiro?",
    helper: "Uma pergunta de imaginação — não uma promessa de resultado.",
    options: [
      { id: "invest", label: "Investiria", effects: { prosperidade: 10, constancia: 8 } },
      { id: "business", label: "Criaria um negócio", effects: { prosperidade: 8, movimento: 8 } },
      { id: "family", label: "Ajudaria minha família", effects: { prosperidade: 6, constancia: 4 } },
      { id: "dreams", label: "Realizaria meus sonhos", effects: { prosperidade: 6, movimento: 4 } },
      { id: "freedom", label: "Buscaria mais liberdade", effects: { prosperidade: 6, clareza: 4 } },
      { id: "new-life", label: "Construiria uma vida completamente nova", effects: { movimento: 10, clareza: -4 } },
    ],
  },
];

export type Answers = Record<string, string>;

export type ProfileId = "despertar" | "movimento" | "expansao" | "reconexao" | "construcao";
export type ProsperityProfile = { id: ProfileId; name: string; tagline: string; description: string };

export const PROFILES: Record<ProfileId, ProsperityProfile> = {
  despertar: {
    id: "despertar", name: "O Despertar", tagline: "O começo de uma nova fase",
    description: "Você está no limiar de algo novo. Há energia disponível — o convite agora é escolher um primeiro passo e dar forma a ele.",
  },
  movimento: {
    id: "movimento", name: "O Movimento", tagline: "Intenção pedindo para virar ação",
    description: "O potencial está presente e você enxerga possibilidades. O ponto de virada está em transformar intenção em pequenas ações concretas.",
  },
  expansao: {
    id: "expansao", name: "A Expansão", tagline: "Crescimento e abertura para oportunidades",
    description: "Suas respostas mostram sinais de crescimento e disposição para receber o novo. O cuidado é expandir sem perder o próprio centro.",
  },
  reconexao: {
    id: "reconexao", name: "A Reconexão", tagline: "Recuperar clareza e confiança",
    description: "Este é um momento de voltar para si: reencontrar direção e confiar de novo nas próprias escolhas antes de acelerar.",
  },
  construcao: {
    id: "construcao", name: "A Construção", tagline: "Ritmo, constância e raízes",
    description: "Você sabe onde quer chegar; o que sustenta a caminhada agora é o ritmo. Pequenos hábitos repetidos se tornam raízes fortes.",
  },
};

/**
 * Scores stay on a 0–100 scale but never touch the extremes: a symbolic reading should not tell
 * anyone they have "zero" clarity or a "perfect" anything.
 */
const SCORE_FLOOR = 12;
const SCORE_CEILING = 96;
const clamp = (value: number) => Math.max(SCORE_FLOOR, Math.min(SCORE_CEILING, Math.round(value)));

export function scoreAnswers(answers: Answers): Scores {
  const totals: Scores = { prosperidade: BASE_SCORE, movimento: BASE_SCORE, clareza: BASE_SCORE, confianca: BASE_SCORE, constancia: BASE_SCORE };
  const apply = (effects: Effects) => {
    for (const [dimension, delta] of Object.entries(effects) as [Dimension, number][]) totals[dimension] += delta;
  };
  for (const question of DIAGNOSTIC_QUESTIONS) {
    const option = question.options.find((item) => item.id === answers[question.id]);
    if (option) apply(option.effects);
  }
  if (answers.sign) apply(ELEMENT_EFFECTS[getSignByName(answers.sign).element]);
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, clamp(value)])) as Scores;
}

/** Dimensions ordered from strongest to weakest; ties keep the DIMENSIONS order so results are stable. */
export function rankDimensions(scores: Scores): Dimension[] {
  return DIMENSIONS.map((item) => item.id).sort((a, b) => scores[b] - scores[a]);
}

/**
 * Reads the whole set of scores, not a single answer. Rules run in order and the first
 * match wins, which keeps the outcome deterministic and easy to reason about.
 */
export function pickProfile(scores: Scores): ProfileId {
  const values = Object.values(scores);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const weakest = rankDimensions(scores).at(-1)!;
  if (mean >= 57 && Math.min(...values) >= 40) return "expansao";
  if ((scores.clareza + scores.confianca) / 2 < 36) return "reconexao";
  if (weakest === "constancia" && scores.constancia < 52) return "construcao";
  if (weakest === "movimento" && scores.movimento < 52) return "movimento";
  if ((weakest === "clareza" || weakest === "confianca") && scores[weakest] < 34) return "reconexao";
  return "despertar";
}

const strengthCopy: Record<Dimension, string> = {
  prosperidade: "uma forte conexão com crescimento e abertura para prosperar",
  movimento: "uma energia de ação e disposição para se mover",
  clareza: "uma boa percepção do que você deseja construir",
  confianca: "uma base de confiança nas próprias escolhas",
  constancia: "uma capacidade valiosa de sustentar o ritmo",
};

const attentionCopy: Record<Dimension, string> = {
  prosperidade: "permitir-se receber e reconhecer as próprias conquistas",
  movimento: "transformar suas intenções em ações concretas",
  clareza: "escolher uma direção antes de espalhar sua energia",
  confianca: "fortalecer a confiança para decidir sem esperar certeza total",
  constancia: "criar um ritmo pequeno e possível de manter",
};

export function interpret(scores: Scores): { summary: string; attention: Dimension; strength: Dimension } {
  const ranked = rankDimensions(scores);
  const strength = ranked[0];
  const attention = ranked.at(-1)!;
  return {
    strength,
    attention,
    summary: `Seu resultado mostra ${strengthCopy[strength]}. Seu principal ponto de atenção neste momento está em ${attentionCopy[attention]}.`,
  };
}

/** How the reading shows up on the Prosperity Tree: the lowest dimension points at the part that needs care first. */
export const TREE_FOCUS: Record<Dimension, { part: string; message: string; practice: string }> = {
  constancia: { part: "Raízes", message: "Sua prosperidade precisa de raízes mais fortes.", practice: "Um ritual curto todos os dias vale mais do que um grande esforço isolado." },
  confianca: { part: "Tronco", message: "Sua árvore pede fortalecimento da confiança.", practice: "Registre no diário uma pequena decisão que você tomou sem esperar certeza." },
  movimento: { part: "Galhos", message: "Seus galhos pedem movimento.", practice: "Conclua a missão do dia — é ela que transforma intenção em crescimento." },
  clareza: { part: "Folhas", message: "Seu primeiro passo é encontrar direção.", practice: "Mantenha um único objetivo principal e deixe os outros esperarem." },
  prosperidade: { part: "Frutos", message: "Seus frutos pedem abertura para receber.", practice: "Celebre cada avanço da sua meta — frutos nascem de conquistas reconhecidas." },
};

export const TREE_OPENING: Record<Dimension, string> = {
  prosperidade: "Seu caminho começa pela expansão.",
  movimento: "Seu caminho começa pelo primeiro passo.",
  clareza: "Seu caminho começa pela direção que você já enxerga.",
  confianca: "Seu caminho começa pela coragem de se posicionar.",
  constancia: "Seu caminho começa pelo ritmo que você já sabe manter.",
};

export type DiagnosticResult = {
  version: 1;
  sign: string;
  area: string;
  answers: Answers;
  scores: Scores;
  profile: ProfileId;
  completedAt: string;
};

export function buildResult(answers: Answers, now = new Date()): DiagnosticResult {
  const scores = scoreAnswers(answers);
  return { version: 1, sign: answers.sign, area: answers.area, answers, scores, profile: pickProfile(scores), completedAt: now.toISOString() };
}

export function optionLabel(questionId: string, optionId: string | undefined) {
  return DIAGNOSTIC_QUESTIONS.find((question) => question.id === questionId)?.options.find((option) => option.id === optionId)?.label ?? "";
}

/* --- Persistence ------------------------------------------------------------
 * Stored per account on this device (latest first). The cloud sync has fixed columns,
 * so the diagnostic stays local until it earns a table of its own.
 */
const HISTORY_LIMIT = 6;
const storageKey = (accountKey: string) => `vds-diagnostic:${accountKey}`;

function isResult(value: unknown): value is DiagnosticResult {
  const item = value as DiagnosticResult;
  return !!item && item.version === 1 && typeof item.completedAt === "string" && !!item.scores && item.profile in PROFILES;
}

export function loadDiagnostics(accountKey: string | undefined): DiagnosticResult[] {
  if (!accountKey || typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(accountKey)) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isResult) : [];
  } catch {
    return [];
  }
}

export function saveDiagnostic(accountKey: string | undefined, result: DiagnosticResult, previous: DiagnosticResult[]): DiagnosticResult[] {
  const next = [result, ...previous].slice(0, HISTORY_LIMIT);
  if (accountKey) {
    try { localStorage.setItem(storageKey(accountKey), JSON.stringify(next)); } catch { /* storage full or blocked: keep it in memory */ }
  }
  return next;
}
