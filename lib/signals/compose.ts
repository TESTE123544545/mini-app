import { pick } from "@/lib/daily";
import { ZODIAC_SIGNS, type ZodiacSign } from "@/lib/zodiacContent";
import { CYCLE_THEMES, NUMBER_MEANINGS, lifePath, nameNumbers, personalCycles, universalDay, type NumKey } from "@/lib/signals/numerology";
import { hourByTime } from "@/lib/signals/hours";

/**
 * Builds the readings: hour + sign + numerology, always from the tables (no AI, no network), so a
 * reading is instant, free of cost and the paid half can be withheld on the server. Language is
 * symbolic — prompts for reflection, never predictions or promises.
 */

const norm = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const signByName = (name: string): ZodiacSign | undefined => ZODIAC_SIGNS.find((sign) => norm(sign.name) === norm(name));

export const PROSPERITY = {
  Fogo: "Seu Fogo pede ação, mas prospera com plano: escolha uma ação concreta e conclua antes de partir para a próxima.",
  Terra: "Sua Terra prospera com constância: passos pequenos, práticos e repetidos pesam mais do que grandes apostas.",
  Ar: "Seu Ar abre portas com ideias e conversas: transforme uma ideia em um passo registrado por escrito.",
  Água: "Sua Água sente o que é seguro para você: confirme a intuição com números e fatos antes de decidir.",
} as const;
export const LOVE = {
  Fogo: "No amor, seu Fogo ganha com franqueza e gestos: diga o que sente sem exigir resposta imediata.",
  Terra: "No amor, sua Terra ganha com presença e confiança construída aos poucos, em gestos concretos.",
  Ar: "No amor, seu Ar ganha com conversa: pergunte, escute e diga com palavras simples o que você deseja.",
  Água: "No amor, sua Água ganha com acolhimento: nomeie o que sente e respeite o que o outro consegue oferecer.",
} as const;
const MOMENT = {
  Cardinal: "Seu jeito cardinal é iniciar: use este sinal para escolher por onde começar.",
  Fixo: "Seu jeito fixo é sustentar: use este sinal para decidir o que merece continuidade.",
  Mutável: "Seu jeito mutável é adaptar: use este sinal para escolher o que ajustar e o que manter.",
} as const;

const numberName = (n: NumKey | 0) => (n === 0 ? "0 · O Recomeço" : `${n} · ${NUMBER_MEANINGS[n].name}`);
const keyword = (n: NumKey | 0) => (n === 0 ? "recomeço" : NUMBER_MEANINGS[n].keyword);

export type HourReading = {
  time: string;
  title: string;
  keywords: string[];
  essence: string;
  number: { value: number; label: string };
  sign: string | null;
  /** Free: one short line tying hour and sign together. */
  short: string;
  /** Premium only. */
  full: null | { symbolic: string; sign: string; numerology: string; prosperity: string; love: string; moment: string };
};

export function hourReading({ time, sign, birthDate, premium }: { time: string; sign: string | null; birthDate: string | null; premium: boolean }): HourReading | null {
  const hour = hourByTime(time);
  if (!hour) return null;
  const zodiac = sign ? signByName(sign) : undefined;
  const path = birthDate ? lifePath(birthDate) : null;
  const short = zodiac
    ? `Para ${zodiac.name}, ${hour.time} lembra de ${hour.keywords[0]}. ${MOMENT[zodiac.modality]}`
    : `${hour.time} lembra de ${hour.keywords[0]}. Informe seu signo para ver o que isso significa para você.`;
  const full = !premium ? null : {
    symbolic: hour.essence,
    sign: zodiac
      ? `${zodiac.name} é regido por ${zodiac.rulingPlanet} e costuma ser ${zodiac.traits.slice(0, 3).join(", ")}. Quando ${hour.time} aparece, a pergunta é como o tema "${hour.keywords[0]}" conversa com o seu jeito de ${zodiac.element === "Fogo" ? "agir" : zodiac.element === "Terra" ? "construir" : zodiac.element === "Ar" ? "pensar" : "sentir"}.`
      : "Informe seu signo no perfil para uma leitura que leve o seu jeito em conta.",
    numerology: !path ? "Informe sua data de nascimento para ver como esta hora conversa com o seu Caminho de Vida."
      : hour.number === path ? `O número da hora (${hour.number}) é o mesmo do seu Caminho de Vida: um reforço simbólico do seu tema central, ${keyword(path)}.`
      : `O número da hora é ${numberName(hour.number)} e o seu Caminho de Vida é ${numberName(path)}. Um pede ${keyword(hour.number)}; o outro traz ${keyword(path)}. O sinal convida a combinar os dois.`,
    prosperity: `${hour.prosperity} ${zodiac ? PROSPERITY[zodiac.element] : ""}`.trim(),
    love: `${hour.love} ${zodiac ? LOVE[zodiac.element] : ""}`.trim(),
    moment: hour.moment,
  };
  return { time: hour.time, title: hour.title, keywords: hour.keywords, essence: hour.essence, number: { value: hour.number, label: numberName(hour.number) }, sign: zodiac?.name ?? null, short, full };
}

export type NumerologyProfile = {
  lifePath: { value: NumKey; name: string; essence: string } | null;
  destiny: NumKey | null; soul: NumKey | null; personality: NumKey | null;
  cycles: { year: number; month: number; day: number; yearText: string; monthText: string; dayText: string } | null;
};

export function combo(sign: string, path: NumKey) {
  const zodiac = signByName(sign);
  const n = NUMBER_MEANINGS[path];
  if (!zodiac) return null;
  return {
    title: `${zodiac.name} + Caminho de Vida ${path}`,
    lead: `${zodiac.name} (${zodiac.element}, ${zodiac.modality}) encontra o Caminho ${path}, ${n.name}: ${zodiac.tagline.toLowerCase()} E o ${path} acrescenta ${n.keyword}.`,
    sections: [
      { h: "Personalidade", t: `${zodiac.traits.slice(0, 3).join(", ")} no signo; ${n.essence}` },
      { h: "Prosperidade", t: `${PROSPERITY[zodiac.element]} ${zodiac.career.split(". ")[0].replace(/\.$/, "")}.` },
      { h: "Amor", t: `${LOVE[zodiac.element]} ${n.love}` },
      { h: "Carreira", t: n.work },
      { h: "Desafios", t: n.challenge },
      { h: "Potenciais", t: n.strengths.join(", ") + "." },
      { h: "Conselho do momento", t: n.advice },
    ],
  };
}

const DAY_LINES: Record<"prosperidade" | "amor" | "momento", readonly string[]> = {
  prosperidade: [
    "Um bom dia para dar o primeiro passo em um plano financeiro que você vem adiando.",
    "Hoje, combinar e alinhar com alguém pode render mais do que resolver tudo sozinho.",
    "Mostre o seu trabalho: divulgar o que você faz é parte de prosperar.",
    "Organize uma conta, uma planilha ou uma pasta. Ordem simples dá clareza.",
    "Considere um ajuste de rota nas suas finanças, pequeno e testado.",
    "Cuide do que sustenta sua vida: contas em dia, casa e compromissos de confiança.",
    "Estude antes de decidir. Hoje, informação vale mais do que pressa.",
    "Olhe com clareza para o que você entrega e o que recebe, e valorize o seu trabalho.",
    "Encerre uma pendência financeira. Fechar abre espaço.",
  ],
  amor: [
    "Tome a iniciativa de um gesto de carinho, sem esperar que o outro comece.",
    "Escute com atenção e sem pressa. Às vezes é tudo que a relação pede.",
    "Diga algo bom que você sente. Palavras simples aproximam.",
    "Mostre cuidado com um gesto concreto e constante, e não com uma grande declaração.",
    "Proponha algo diferente do habitual para quem você gosta.",
    "Cuide de quem está perto, e também de você.",
    "Reserve um tempo de silêncio para entender o que você realmente sente.",
    "Equilibre dar e receber: relações boas são de mão dupla.",
    "Perdoar uma mágoa antiga pode aliviar mais do que parece.",
  ],
  momento: [
    "Escolha uma coisa e comece. Pequeno já é começo.",
    "Se estiver dividido, observe com calma o que cada caminho pede de você.",
    "Algo quer ser dito ou criado. Deixe sair.",
    "Ponha ordem em uma área que anda bagunçada e sinta a diferença.",
    "Uma mudança pede passagem. Pergunte o que ela quer ensinar.",
    "Pergunte-se se você está dando mais aos outros do que a si mesmo.",
    "Faça uma pausa. As respostas chegam melhor no silêncio.",
    "O que você planta com constância tende a voltar. Mantenha o foco no que está ao seu alcance.",
    "Agradeça o que foi vivido e deixe ir o que já cumpriu o papel.",
  ],
};
const CATEGORIES = ["prosperidade", "amor", "momento"] as const;
export type DailyCategory = (typeof CATEGORIES)[number];

export type DailyMessage = {
  date: string; sign: string | null; lifePath: number | null; dayNumber: number; dayNumberKind: "pessoal" | "universal";
  category: DailyCategory; title: string; short: string;
  /** Premium only: the three categories, today's tip and the hour of the moment. */
  full: null | { messages: Record<DailyCategory, string>; tip: string; hour: string | null };
};

export function dailyMessage({ dayKey, sign, birthDate, premium, hour }: { dayKey: string; sign: string | null; birthDate: string | null; premium: boolean; hour?: string | null }): DailyMessage {
  const zodiac = sign ? signByName(sign) : undefined;
  const cycles = birthDate ? personalCycles(birthDate, dayKey) : null;
  const dayNumber = cycles?.day ?? universalDay(dayKey);
  const category = pick(CATEGORIES, `cat|${dayKey}|${sign ?? ""}`);
  const line = (cat: DailyCategory) => DAY_LINES[cat][dayNumber - 1];
  const tail = (cat: DailyCategory) => !zodiac ? "" : " " + (cat === "prosperidade" ? PROSPERITY[zodiac.element] : cat === "amor" ? LOVE[zodiac.element] : MOMENT[zodiac.modality]);
  const titles = { prosperidade: "Seu foco de prosperidade hoje", amor: "Seu foco no amor hoje", momento: "Seu momento hoje" };
  const equal = hour ? hourByTime(hour) : undefined;
  return {
    date: dayKey, sign: zodiac?.name ?? null, lifePath: birthDate ? lifePath(birthDate) : null, dayNumber, dayNumberKind: cycles ? "pessoal" : "universal",
    category, title: titles[category], short: line(category),
    full: !premium ? null : {
      messages: { prosperidade: line("prosperidade") + tail("prosperidade"), amor: line("amor") + tail("amor"), momento: line("momento") + tail("momento") },
      tip: CYCLE_THEMES[dayNumber].day,
      hour: equal ? `${equal.time} · ${equal.title}: ${equal.moment}` : null,
    },
  };
}

export function numerologyProfile(name: string, birthDate: string | null, dayKey: string): NumerologyProfile {
  const nameNums = nameNumbers(name);
  const path = birthDate ? lifePath(birthDate) : null;
  const c = birthDate ? personalCycles(birthDate, dayKey) : null;
  return {
    lifePath: path ? { value: path, name: NUMBER_MEANINGS[path].name, essence: NUMBER_MEANINGS[path].essence } : null,
    destiny: nameNums?.destiny ?? null, soul: nameNums?.soul ?? null, personality: nameNums?.personality ?? null,
    cycles: c ? { ...c, yearText: CYCLE_THEMES[c.year].year, monthText: CYCLE_THEMES[c.month].month, dayText: CYCLE_THEMES[c.day].day } : null,
  };
}
