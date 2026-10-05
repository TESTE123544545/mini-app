/**
 * Numerology for "Sinais do Universo": the arithmetic (Pythagorean reduction) and the plain-language
 * meaning of each number. Everything here is a symbolic lens for self-reflection, never a prediction.
 */

export type NumKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33;
export const NUMBER_KEYS: readonly NumKey[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
const MASTERS = new Set([11, 22, 33]);

/** Adds the digits until one digit is left; the master numbers 11, 22 and 33 are kept when asked. */
export function reduce(value: number, keepMasters = true): number {
  let n = Math.abs(Math.trunc(value));
  while (n > 9 && !(keepMasters && MASTERS.has(n))) n = String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);
  return n;
}

const LETTER_VALUE: Record<string, number> = {
  A: 1, J: 1, S: 1, B: 2, K: 2, T: 2, C: 3, L: 3, U: 3, D: 4, M: 4, V: 4, E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6, G: 7, P: 7, Y: 7, H: 8, Q: 8, Z: 8, I: 9, R: 9,
};

/** Destiny (every letter), Soul (vowels) and Personality (consonants) from a name; null when it has no letters. */
export function nameNumbers(name: string): { destiny: NumKey; soul: NumKey; personality: NumKey } | null {
  const letters = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
  if (!letters) return null;
  let all = 0, vowels = 0, consonants = 0;
  for (const letter of letters) {
    const value = LETTER_VALUE[letter] ?? 0;
    all += value;
    if ("AEIOU".includes(letter)) vowels += value; else consonants += value;
  }
  return { destiny: reduce(all) as NumKey, soul: reduce(vowels) as NumKey, personality: reduce(consonants) as NumKey };
}

function parts(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null;
}

/** Life Path: day, month and year each reduced, then added and reduced again. */
export function lifePath(birthDate: string): NumKey | null {
  const p = parts(birthDate);
  if (!p || p.month < 1 || p.month > 12 || p.day < 1 || p.day > 31) return null;
  return reduce(reduce(p.day) + reduce(p.month) + reduce(p.year)) as NumKey;
}

/** Personal year, month and day (always 1-9) for a "yyyy-mm-dd" day. */
export function personalCycles(birthDate: string, dayKey: string): { year: number; month: number; day: number } | null {
  const born = parts(birthDate);
  const today = parts(dayKey);
  if (!born || !today) return null;
  const year = reduce(reduce(born.day) + reduce(born.month) + reduce(today.year), false);
  const month = reduce(year + reduce(today.month), false);
  const day = reduce(month + reduce(today.day), false);
  return { year, month, day };
}

/** The number of the date itself (all digits), 1-9. */
export function universalDay(dayKey: string): number {
  return reduce(dayKey.replace(/\D/g, "").split("").reduce((sum, digit) => sum + Number(digit), 0), false);
}

export type NumberMeaning = {
  name: string;
  keyword: string;
  essence: string;
  strengths: string[];
  challenge: string;
  love: string;
  work: string;
  advice: string;
};

export const NUMBER_MEANINGS: Record<NumKey, NumberMeaning> = {
  1: {
    name: "O Iniciador", keyword: "iniciativa",
    essence: "O 1 é o número de quem abre caminho. Traz independência, coragem de começar e vontade de ser a origem das próprias escolhas.",
    strengths: ["iniciativa", "autonomia", "determinação"],
    challenge: "Aprender a pedir ajuda e a ouvir, para que a força de começar não vire solidão ou teimosia.",
    love: "No amor, o 1 valoriza liberdade e admiração; o convite é dividir decisões em vez de decidir sozinho.",
    work: "No trabalho, rende quando tem espaço para liderar, propor e inaugurar projetos.",
    advice: "Dê o primeiro passo, mas pergunte a si mesmo quem pode caminhar com você.",
  },
  2: {
    name: "O Harmonizador", keyword: "parceria",
    essence: "O 2 é o número da cooperação e da sensibilidade. Percebe o que está no ar entre as pessoas e tem o dom de aproximar.",
    strengths: ["sensibilidade", "diplomacia", "paciência"],
    challenge: "Não se anular para manter a paz: ter uma opinião também faz parte da harmonia.",
    love: "No amor, é presença, cuidado e escuta; o convite é dizer o que precisa antes de acumular mágoa.",
    work: "No trabalho, brilha em duplas e equipes, mediando, apoiando e cuidando dos detalhes humanos.",
    advice: "Escolha uma conversa honesta hoje, mesmo que seja pequena.",
  },
  3: {
    name: "O Comunicador", keyword: "expressão",
    essence: "O 3 é o número da criatividade e da palavra. Traz leveza, humor e a necessidade de colocar o que sente para fora.",
    strengths: ["criatividade", "comunicação", "otimismo"],
    challenge: "Dispersão: muitas ideias e pouca continuidade. Escolher uma e levar até o fim é o exercício.",
    love: "No amor, é carinho, conversa e alegria; o convite é sustentar também os dias menos leves.",
    work: "No trabalho, funciona quando pode criar, ensinar, apresentar ou inspirar pessoas.",
    advice: "Escreva, fale ou crie algo hoje, e termine uma coisa antes de começar outra.",
  },
  4: {
    name: "O Construtor", keyword: "estrutura",
    essence: "O 4 é o número da base. Traz disciplina, método e a paciência de construir algo que dure, tijolo por tijolo.",
    strengths: ["disciplina", "confiabilidade", "organização"],
    challenge: "Flexibilidade: nem tudo cabe em planilha, e mudar de rota também pode ser sabedoria.",
    love: "No amor, é lealdade e compromisso; o convite é demonstrar o afeto, não só provar com atos práticos.",
    work: "No trabalho, é a pessoa em quem se confia para organizar, estruturar e entregar.",
    advice: "Escolha uma rotina pequena e sustentável, e deixe um espaço para o imprevisto.",
  },
  5: {
    name: "O Explorador", keyword: "liberdade",
    essence: "O 5 é o número do movimento. Traz curiosidade, adaptabilidade e a necessidade de experimentar a vida em vez de só planejá-la.",
    strengths: ["adaptação", "curiosidade", "coragem para mudar"],
    challenge: "Constância: a liberdade fica mais forte quando tem direção e alguns compromissos escolhidos.",
    love: "No amor, precisa de espaço e novidade; o convite é construir uma relação onde liberdade e vínculo convivam.",
    work: "No trabalho, rende em ambientes variados, com contato com pessoas, viagens ou projetos que mudam.",
    advice: "Mude uma pequena rotina hoje, com intenção, e observe o que ela desperta.",
  },
  6: {
    name: "O Cuidador", keyword: "harmonia",
    essence: "O 6 é o número do cuidado e da responsabilidade afetiva. Traz senso de família, beleza e vontade de tornar o ambiente mais acolhedor.",
    strengths: ["cuidado", "responsabilidade", "senso estético"],
    challenge: "Cuidar de si com a mesma dedicação que cuida dos outros, e soltar a ideia de que tudo depende de você.",
    love: "No amor, é dedicação e lar; o convite é receber cuidado, não só oferecê-lo.",
    work: "No trabalho, brilha em áreas de ajuda, ensino, saúde, arte e qualquer lugar onde pessoas precisam ser acolhidas.",
    advice: "Reserve um momento só seu hoje, sem justificativa.",
  },
  7: {
    name: "O Buscador", keyword: "introspecção",
    essence: "O 7 é o número da busca interior. Traz análise, intuição e a necessidade de silêncio para entender o que importa.",
    strengths: ["análise", "intuição", "profundidade"],
    challenge: "Não se isolar demais: compartilhar o que descobre também é parte do caminho.",
    love: "No amor, precisa de confiança e tempo a sós; o convite é deixar a pessoa amada entrar na sua vida interior.",
    work: "No trabalho, rende em estudo, pesquisa, escrita e áreas que pedem concentração e profundidade.",
    advice: "Faça uma pausa em silêncio hoje e anote o que ficou claro.",
  },
  8: {
    name: "O Realizador", keyword: "realização",
    essence: "O 8 é o número da conquista concreta. Traz visão prática, ambição e a capacidade de transformar plano em resultado.",
    strengths: ["visão prática", "persistência", "liderança"],
    challenge: "Equilibrar o resultado com o descanso e os vínculos: sucesso também é ter com quem dividir.",
    love: "No amor, é proteção e compromisso; o convite é mostrar vulnerabilidade além da firmeza.",
    work: "No trabalho, aparece em gestão, negócios, organização de recursos e projetos de longo prazo.",
    advice: "Defina uma meta concreta para esta semana e uma pausa para celebrar quando ela acontecer.",
  },
  9: {
    name: "O Humanitário", keyword: "conclusão",
    essence: "O 9 é o número do fechamento e da compaixão. Traz visão ampla, generosidade e a sabedoria de saber encerrar ciclos.",
    strengths: ["compaixão", "visão ampla", "generosidade"],
    challenge: "Soltar o que já cumpriu seu papel, sem carregar o passado e as dores dos outros.",
    love: "No amor, é entrega e idealismo; o convite é aceitar pessoas reais, com limites e imperfeições.",
    work: "No trabalho, brilha em causas, ensino, arte e qualquer coisa que sirva a algo maior que si.",
    advice: "Feche hoje um pequeno ciclo pendente: uma conversa, uma tarefa ou um objeto que não serve mais.",
  },
  11: {
    name: "O Intuitivo", keyword: "inspiração",
    essence: "O 11 é um número mestre, ligado à intuição e à inspiração. Traz sensibilidade aguçada e a sensação de captar o que ainda não foi dito.",
    strengths: ["intuição", "inspiração", "sensibilidade"],
    challenge: "Dar chão à sensibilidade: ansiedade e dúvida aparecem quando a intuição fica sem prática e sem pausa.",
    love: "No amor, busca conexão profunda; o convite é comunicar o que sente em vez de esperar ser adivinhado.",
    work: "No trabalho, aparece em áreas de inspiração, aconselhamento, arte e qualquer lugar onde sentir bem importa.",
    advice: "Confie na primeira impressão, e confirme com um passo prático antes de decidir.",
  },
  22: {
    name: "O Construtor Mestre", keyword: "grandes projetos",
    essence: "O 22 é um número mestre que une visão e prática. Traz o impulso de transformar uma ideia grande em algo real e útil para muita gente.",
    strengths: ["visão prática", "capacidade de construir", "foco"],
    challenge: "A pressão de ser grandioso: começar pequeno é o caminho de quem pensa grande.",
    love: "No amor, leva a sério o compromisso; o convite é lembrar que o afeto também precisa de tempo, e não só de estrutura.",
    work: "No trabalho, aparece em projetos grandes, empreendimentos e iniciativas coletivas.",
    advice: "Quebre o seu maior sonho em três passos pequenos e comece pelo primeiro.",
  },
  33: {
    name: "O Mestre do Cuidado", keyword: "compaixão ativa",
    essence: "O 33 é um número mestre ligado ao cuidado profundo. Traz o desejo de ajudar, ensinar e curar, com amor como linguagem.",
    strengths: ["compaixão", "generosidade", "vocação para ensinar"],
    challenge: "Cuidar sem se esgotar: limites também são uma forma de amor.",
    love: "No amor, é dedicação intensa; o convite é aceitar ajuda e dividir o peso emocional.",
    work: "No trabalho, aparece em ensino, acolhimento, terapias, causas e liderança serena.",
    advice: "Faça hoje um gesto de cuidado e depois um para si mesmo, na mesma medida.",
  },
};

export type CycleTheme = { year: string; month: string; day: string };

/** What a personal year, month or day of each number tends to ask for. */
export const CYCLE_THEMES: Record<number, CycleTheme> = {
  1: { year: "Um ano de começos: plantar sementes, tomar iniciativa e redefinir o rumo.", month: "Mês de iniciar e decidir.", day: "Bom dia para dar o primeiro passo em algo que você vem adiando." },
  2: { year: "Um ano de parcerias e paciência: o que cresce é cultivado com calma e cooperação.", month: "Mês de ouvir, alinhar e cooperar.", day: "Dia de escutar mais, conversar com calma e cuidar de um vínculo." },
  3: { year: "Um ano de expressão e criatividade: falar, criar, mostrar o que você pensa.", month: "Mês de comunicar e criar.", day: "Dia de se expressar, criar algo ou conversar com quem você gosta." },
  4: { year: "Um ano de base e organização: construir rotinas e consolidar o que já existe.", month: "Mês de organizar e sustentar.", day: "Dia de arrumar, planejar e fazer o trabalho que ninguém vê, mas sustenta o resto." },
  5: { year: "Um ano de mudanças e movimento: abrir-se ao novo, viajar, experimentar.", month: "Mês de flexibilidade e novidade.", day: "Dia de sair da rotina com intenção e aceitar um imprevisto como convite." },
  6: { year: "Um ano de vínculos e responsabilidade afetiva: casa, família, cuidado.", month: "Mês de cuidar e harmonizar.", day: "Dia de cuidar de alguém, do ambiente ou de si, com carinho." },
  7: { year: "Um ano de recolhimento e estudo: olhar para dentro, aprender, entender.", month: "Mês de pausa e reflexão.", day: "Dia de silêncio, estudo e escuta interior." },
  8: { year: "Um ano de realização e organização de recursos: transformar plano em resultado.", month: "Mês de agir com foco e firmeza.", day: "Dia de resolver o que é prático e colocar uma meta no papel." },
  9: { year: "Um ano de fechamento de ciclos: soltar o que acabou e preparar o novo começo.", month: "Mês de concluir e soltar.", day: "Dia de encerrar pendências e agradecer o que foi vivido." },
};
