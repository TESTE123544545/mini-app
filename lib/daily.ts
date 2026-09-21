export type DayPart = "dawn" | "day" | "dusk" | "night";
export type DayTheme = { key: string; name: string; guidance: string; verb: string };
export type Oracle = { message: string; action: string };
export type DailyPlan = { theme: DayTheme; voice: string; mission: string; micro: string; oracle: Oracle; journalQuestion: string };

export const dayThemes: readonly DayTheme[] = [
  { key: "raiz", name: "Raiz", guidance: "O dia pede base: cuide do que sustenta você antes de expandir.", verb: "Fortalecer" },
  { key: "clareza", name: "Clareza", guidance: "Nomear o problema já resolve metade dele.", verb: "Enxergar" },
  { key: "constancia", name: "Constância", guidance: "Repetir o pequeno vale mais do que tentar o enorme uma vez.", verb: "Repetir" },
  { key: "coragem", name: "Coragem", guidance: "Existe uma decisão que só depende de você começar.", verb: "Iniciar" },
  { key: "foco", name: "Foco", guidance: "Escolher uma coisa é abrir mão de dez — e é isso que faz avançar.", verb: "Escolher" },
  { key: "revisao", name: "Revisão", guidance: "Olhar para trás com honestidade é o que evita repetir o ciclo.", verb: "Revisar" },
  { key: "semear", name: "Semear", guidance: "Hoje o trabalho não dá retorno imediato — e mesmo assim importa.", verb: "Plantar" },
  { key: "silencio", name: "Silêncio", guidance: "Reduzir o ruído externo costuma revelar a próxima decisão.", verb: "Ouvir" },
  { key: "movimento", name: "Movimento", guidance: "O corpo em movimento organiza a cabeça travada.", verb: "Mover" },
  { key: "colheita", name: "Colheita", guidance: "Reconhecer o que já cresceu é parte de continuar crescendo.", verb: "Reconhecer" },
];

const signVoices: Record<string, readonly string[]> = {
  "Áries": ["Sua força é começar; o desafio é escolher onde.", "Você acelera bem — hoje vale medir a direção antes do impulso.", "Coragem não é pressa: é dar o passo certo com convicção."],
  "Touro": ["Você constrói melhor quando o ritmo é seu.", "Sua paciência é vantagem — desde que não vire adiamento.", "O concreto te acalma: escolha algo que dê para tocar hoje."],
  "Gêmeos": ["Você tem ideias de sobra; hoje basta uma.", "Sua mente rápida rende mais quando encontra um limite.", "Conversa vira progresso quando termina em combinado."],
  "Câncer": ["Sua intuição já sabe — falta dar forma a ela.", "Você cuida bem dos outros; inclua-se nessa conta.", "Segurança se constrói com rotina, não com controle."],
  "Leão": ["Sua presença abre portas; hoje escolha qual.", "Você brilha mais quando cria, não quando compara.", "Reconhecimento vem depois do trabalho feito — comece por ele."],
  "Virgem": ["Seu método é raro; o perfeccionismo é o custo dele.", "Feito com cuidado já é suficiente hoje.", "Melhorar um detalhe pode destravar o todo."],
  "Libra": ["Decidir também é uma forma de se respeitar.", "Equilíbrio não é agradar todos; é incluir você.", "Sua leitura das pessoas é ferramenta — use a seu favor."],
  "Escorpião": ["Sua intensidade rende quando tem um alvo só.", "Encerrar algo hoje libera mais energia do que começar.", "Você enxerga o fundo das coisas — não pare na suspeita."],
  "Sagitário": ["Sua visão é grande; hoje ela precisa de data e hora.", "Expandir também é terminar o que já foi aberto.", "Otimismo vira resultado quando encontra um plano."],
  "Capricórnio": ["Você sustenta muito — hoje sustente com leveza.", "Estrutura é seu talento; descanso faz parte dela.", "Constância gentil vence cobrança impossível."],
  "Aquário": ["Sua ideia diferente só prova valor quando é testada.", "Você vê o que ninguém vê — traduza para quem precisa ouvir.", "Inovar é simplificar, não complicar."],
  "Peixes": ["Sua sensibilidade é dado, não fraqueza.", "Dê contorno à intuição: escreva antes de decidir.", "Limite é cuidado com a sua própria energia."],
};

const missionsByObjective: Record<string, readonly string[]> = {
  "Dinheiro": [
    "Liste suas saídas fixas e marque a primeira que você cortaria.",
    "Separe hoje um valor — qualquer valor — para a sua reserva.",
    "Revise uma assinatura recorrente e decida se ela continua.",
    "Escreva quanto você quer ter guardado em 90 dias e por quê.",
    "Confira o saldo real das suas contas sem julgar o número.",
    "Escolha uma pendência financeira e descubra o próximo passo dela.",
  ],
  "Carreira": [
    "Atualize uma linha do seu perfil profissional com algo recente.",
    "Envie uma mensagem para alguém que já trabalhou com você.",
    "Escreva as três entregas que mais orgulham você neste ano.",
    "Identifique a habilidade que mais destravaria seu próximo passo.",
    "Peça um retorno honesto a alguém em quem você confia.",
    "Bloqueie 30 minutos na agenda para um trabalho que importa.",
  ],
  "Negócios": [
    "Converse com um cliente ou possível cliente — só uma conversa.",
    "Escreva em uma frase o problema que você resolve.",
    "Calcule quanto custa entregar o seu serviço uma vez.",
    "Liste três motivos pelos quais alguém diria não para você.",
    "Escolha uma tarefa do seu negócio para delegar ou eliminar.",
    "Teste um preço, uma oferta ou uma mensagem nova.",
  ],
  "Organização financeira": [
    "Registre todos os gastos de hoje, sem exceção.",
    "Junte em um só lugar as datas de vencimento do mês.",
    "Crie uma categoria de gasto que você ainda não acompanha.",
    "Compare o que você planejou e o que gastou na última semana.",
    "Defina um teto para uma categoria específica deste mês.",
    "Automatize uma transferência, mesmo pequena, para a reserva.",
  ],
  "Disciplina": [
    "Escolha o hábito que mais importa e faça a versão de dois minutos dele.",
    "Prepare hoje o ambiente para o hábito de amanhã.",
    "Defina uma hora fixa para uma única tarefa importante.",
    "Cumpra uma promessa pequena que você fez a si mesmo.",
    "Retire uma distração do seu campo de visão por uma hora.",
    "Termine algo que já está quase pronto.",
  ],
  "Desenvolvimento pessoal": [
    "Escreva o que você sente hoje sem tentar consertar.",
    "Leia dez páginas de algo que te faz pensar.",
    "Pergunte a si mesmo o que você está evitando — e responda.",
    "Passe dez minutos sem tela nem estímulo.",
    "Agradeça a alguém de forma específica.",
    "Escolha um limite que você precisa comunicar e escreva como.",
  ],
};

const fallbackMissions: readonly string[] = [
  "Escolha uma meta adiada e defina seu primeiro passo concreto.",
  "Separe 15 minutos para a tarefa que você vem empurrando.",
  "Reduza um objetivo grande até ele caber no dia de hoje.",
];

const microActions: readonly string[] = [
  "Escreva em uma frase o que você quer que hoje tenha de diferente.",
  "Beba um copo de água e respire fundo antes da próxima tarefa.",
  "Escolha a primeira tarefa do dia e diga o nome dela em voz alta.",
  "Guarde o celular por dois minutos e olhe para longe.",
  "Anote uma coisa que você não quer esquecer nesta semana.",
  "Arrume um objeto que está fora do lugar perto de você.",
  "Mande uma mensagem curta para alguém que te faz bem.",
  "Escreva o número que você quer mudar neste mês.",
  "Alongue os ombros por trinta segundos.",
  "Defina o horário em que você vai parar de trabalhar hoje.",
];

const oracles: readonly Oracle[] = [
  { message: "A clareza cresce quando a decisão encontra um gesto.", action: "Escolha uma pendência simples e reserve 15 minutos para ela." },
  { message: "O que você repete é o que você constrói.", action: "Faça hoje, em versão mínima, aquilo que quer virar hábito." },
  { message: "Nem toda espera é paciência; parte dela é medo.", action: "Nomeie algo que você está adiando e defina o primeiro passo." },
  { message: "Raiz não aparece na foto, mas sustenta a árvore inteira.", action: "Cuide hoje de algo invisível: sono, contas, organização." },
  { message: "Abundância começa como organização.", action: "Arrume um espaço ou um arquivo que te atrapalha há semanas." },
  { message: "Você não precisa de mais tempo; precisa de menos frentes.", action: "Escolha uma prioridade e desligue as outras por uma hora." },
  { message: "Pedir também é uma habilidade.", action: "Faça hoje um pedido claro a uma pessoa." },
  { message: "O corpo sabe antes da cabeça admitir.", action: "Repare em uma tensão física e ajuste algo por causa dela." },
  { message: "Recomeçar não apaga o caminho anterior.", action: "Retome algo que você deixou pela metade." },
  { message: "O pequeno feito hoje vale mais que o grande imaginado.", action: "Reduza sua meta do dia até ela caber em 15 minutos." },
  { message: "Dizer não é cuidar do que você já disse sim.", action: "Recuse hoje um compromisso que não cabe." },
  { message: "Você já sabe a resposta; só não gostou dela ainda.", action: "Escreva a decisão que você evita e o custo de não tomá-la." },
];

export const journalAnchors: readonly string[] = ["O que eu quero construir?", "O que estou evitando?", "Qual pequena ação posso realizar amanhã?"];

const journalRotating: readonly string[] = [
  "O que hoje me mostrou sobre mim?",
  "Onde eu gastei energia sem retorno?",
  "O que eu faria diferente se recomeçasse este dia?",
  "Que conversa está esperando por mim?",
  "O que eu já tenho e ainda não reconheci?",
  "Qual limite eu preciso colocar esta semana?",
  "O que está mais leve do que há um mês?",
  "Qual decisão pequena mudaria minha próxima semana?",
];

function hash(seed: string) {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function pick<T>(list: readonly T[], seed: string) {
  return list[hash(seed) % list.length];
}

/** Local calendar day (YYYY-MM-DD) — never UTC, so the day turns when the user's day turns. */
export function localDayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dayPart(hour: number): DayPart {
  return hour < 6 ? "night" : hour < 11 ? "dawn" : hour < 17 ? "day" : hour < 21 ? "dusk" : "night";
}

export const dayPartLabel: Record<DayPart, string> = { dawn: "Manhã", day: "Tarde", dusk: "Fim de tarde", night: "Noite" };
export const greetingLabel: Record<DayPart, string> = { dawn: "Bom dia", day: "Boa tarde", dusk: "Boa tarde", night: "Boa noite" };

export function themeForDay(dayKey: string, sign: string) {
  return pick(dayThemes, `theme|${dayKey}|${sign}`);
}

export function dailyPlan({ dayKey, sign, objective }: { dayKey: string; sign: string; objective: string }): DailyPlan {
  const missionPool = missionsByObjective[objective] ?? fallbackMissions;
  return {
    theme: themeForDay(dayKey, sign),
    voice: pick(signVoices[sign] ?? signVoices["Capricórnio"], `voice|${dayKey}|${sign}`),
    mission: pick(missionPool, `mission|${dayKey}|${sign}|${objective}`),
    micro: pick(microActions, `micro|${dayKey}|${sign}`),
    oracle: pick(oracles, `oracle|${dayKey}|${sign}`),
    journalQuestion: pick(journalRotating, `journal|${dayKey}`),
  };
}

export function weekPlan(sign: string, length = 7, from = new Date()) {
  return Array.from({ length }, (_, offset) => {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
    return {
      dayKey: localDayKey(date),
      date,
      offset,
      weekday: new Intl.DateTimeFormat("pt-BR", { weekday: "narrow" }).format(date),
      day: date.getDate(),
      theme: themeForDay(localDayKey(date), sign),
    };
  });
}

/** Parses the pt-BR dates stored by the journal ("21/09/2026") back into a local Date. */
export function parseBrDate(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  if (!day || !month || !year) return null;
  return new Date(year, month - 1, day);
}

export function daysSince(date: Date, from = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const end = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  return Math.round((end - start) / 86_400_000);
}
