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

/** A choice can open a second, more specific set of options right below it (answered under `id`). */
export type DiagnosticFollowUp = { id: string; title: string; options: DiagnosticOption[] };
export type DiagnosticOption = { id: string; label: string; hint?: string; effects: Effects; followUp?: DiagnosticFollowUp };
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
      { id: "money", label: "Dinheiro e prosperidade", effects: { prosperidade: 14 }, followUp: { id: "focus", title: "Dentro de dinheiro, o que você mais quer agora?", options: [
        { id: "debts", label: "Sair das dívidas", effects: { confianca: -3, constancia: 3 } },
        { id: "savings", label: "Montar uma reserva", effects: { constancia: 4 } },
        { id: "income", label: "Aumentar minha renda", effects: { movimento: 4, prosperidade: 2 } },
        { id: "invest", label: "Começar a investir", effects: { prosperidade: 4, clareza: 2 } },
        { id: "budget", label: "Organizar meus gastos", effects: { clareza: 4 } },
      ] } },
      { id: "career", label: "Carreira e negócios", effects: { prosperidade: 8, movimento: 4 }, followUp: { id: "focus", title: "Na sua carreira, qual é o próximo passo?", options: [
        { id: "better-job", label: "Conseguir um trabalho melhor", effects: { movimento: 3 } },
        { id: "promotion", label: "Crescer onde estou", effects: { prosperidade: 3, confianca: 2 } },
        { id: "own-business", label: "Abrir meu próprio negócio", effects: { movimento: 4, confianca: 2 } },
        { id: "grow-business", label: "Fazer meu negócio crescer", effects: { prosperidade: 4 } },
        { id: "switch", label: "Mudar de área", effects: { clareza: -3, movimento: 3 } },
      ] } },
      { id: "love", label: "Amor e relacionamentos", effects: { confianca: 4, prosperidade: 2 }, followUp: { id: "focus", title: "Nos relacionamentos, o que pede sua atenção?", options: [
        { id: "find", label: "Encontrar alguém especial", effects: { movimento: 3 } },
        { id: "strengthen", label: "Fortalecer meu relacionamento", effects: { constancia: 4 } },
        { id: "heal", label: "Superar um término", effects: { confianca: -3 } },
        { id: "family", label: "Melhorar a relação com a família", effects: { constancia: 2, clareza: 2 } },
        { id: "self-love", label: "Aprender a me valorizar primeiro", effects: { confianca: 3 } },
      ] } },
      { id: "purpose", label: "Propósito e direção", effects: { clareza: -6, prosperidade: 4 }, followUp: { id: "focus", title: "Sobre propósito, o que você busca?", options: [
        { id: "calling", label: "Descobrir minha vocação", effects: { clareza: -3 } },
        { id: "align", label: "Unir trabalho e propósito", effects: { clareza: 2, movimento: 2 } },
        { id: "goals", label: "Definir metas para os próximos anos", effects: { clareza: 4 } },
        { id: "meaning", label: "Viver com mais significado", effects: { prosperidade: 2 } },
        { id: "decision", label: "Tomar uma grande decisão", effects: { movimento: 3, confianca: -2 } },
      ] } },
      { id: "confidence", label: "Autoconfiança", effects: { confianca: -8, movimento: 2 }, followUp: { id: "focus", title: "Na autoconfiança, o que mais quer mudar?", options: [
        { id: "compare", label: "Parar de me comparar", effects: { confianca: 3 } },
        { id: "speak", label: "Me posicionar e falar melhor", effects: { confianca: 2, movimento: 2 } },
        { id: "fear-error", label: "Vencer o medo de errar", effects: { movimento: 3 } },
        { id: "worth", label: "Reconhecer meu próprio valor", effects: { confianca: 4 } },
        { id: "self-critic", label: "Lidar com a autocrítica", effects: { clareza: 2 } },
      ] } },
      { id: "growth", label: "Crescimento pessoal", effects: { constancia: 4, clareza: 4 }, followUp: { id: "focus", title: "No crescimento pessoal, por onde começar?", options: [
        { id: "habits", label: "Criar hábitos saudáveis", effects: { constancia: 4 } },
        { id: "discipline", label: "Ter mais disciplina", effects: { constancia: 3 } },
        { id: "learn", label: "Aprender algo novo", effects: { movimento: 3 } },
        { id: "emotional", label: "Cuidar da saúde emocional", effects: { confianca: 2 } },
        { id: "focus", label: "Ter mais foco", effects: { clareza: 4 } },
      ] } },
    ],
  },
  {
    id: "moment",
    type: "single",
    title: "Como você sente que está sua vida neste momento?",
    options: [
      { id: "stuck", label: "Estou travado(a)", effects: { movimento: -16, confianca: -6 }, followUp: { id: "moment-detail", title: "Onde você sente mais esse travamento?", options: [
        { id: "work", label: "No trabalho ou nos negócios", effects: { movimento: -2 } },
        { id: "money", label: "Na vida financeira", effects: { prosperidade: -2 } },
        { id: "relations", label: "Nos relacionamentos", effects: { confianca: -2 } },
        { id: "inside", label: "Dentro de mim, na motivação", effects: { constancia: -2 } },
      ] } },
      { id: "changing", label: "Estou passando por mudanças", effects: { movimento: 8, clareza: -6 }, followUp: { id: "moment-detail", title: "Que tipo de mudança você está vivendo?", options: [
        { id: "career", label: "Trabalho ou carreira", effects: { movimento: 2 } },
        { id: "home", label: "Casa ou cidade", effects: { clareza: -2 } },
        { id: "relationship", label: "Início ou fim de um relacionamento", effects: { confianca: -2 } },
        { id: "inner", label: "Uma mudança interna, de valores", effects: { clareza: 2 } },
      ] } },
      { id: "growing", label: "Estou crescendo e evoluindo", effects: { prosperidade: 10, movimento: 8, confianca: 8 }, followUp: { id: "moment-detail", title: "Onde você mais sente esse crescimento?", options: [
        { id: "money", label: "Na renda e nas finanças", effects: { prosperidade: 3 } },
        { id: "career", label: "Na carreira", effects: { movimento: 2 } },
        { id: "self", label: "No autoconhecimento", effects: { clareza: 2 } },
        { id: "habits", label: "Nos hábitos e na rotina", effects: { constancia: 3 } },
      ] } },
      { id: "lost", label: "Estou perdido(a) e buscando direção", effects: { clareza: -18, confianca: -6 }, followUp: { id: "moment-detail", title: "O que mais parece faltar agora?", options: [
        { id: "goal", label: "Um objetivo claro", effects: { clareza: -2 } },
        { id: "support", label: "Apoio de pessoas próximas", effects: { confianca: -2 } },
        { id: "energy", label: "Energia para recomeçar", effects: { movimento: -2 } },
        { id: "plan", label: "Um plano prático", effects: { constancia: -2 } },
      ] } },
      { id: "ready", label: "Estou pronto(a) para uma nova fase", effects: { movimento: 14, confianca: 12 }, followUp: { id: "moment-detail", title: "O que essa nova fase representa para você?", options: [
        { id: "project", label: "Começar um projeto ou negócio", effects: { movimento: 3 } },
        { id: "money", label: "Uma virada financeira", effects: { prosperidade: 3 } },
        { id: "love", label: "Um novo momento no amor", effects: { confianca: 2 } },
        { id: "self", label: "Uma nova versão de mim", effects: { clareza: 2 } },
      ] } },
    ],
  },
  {
    id: "blocker",
    type: "single",
    title: "O que mais parece impedir seu avanço?",
    options: [
      { id: "risk", label: "Medo de arriscar", effects: { movimento: -12, confianca: -12 }, followUp: { id: "blocker-detail", title: "Que risco mais te assusta?", options: [
        { id: "money", label: "Perder dinheiro", effects: { prosperidade: -2 } },
        { id: "judgement", label: "O julgamento dos outros", effects: { confianca: -2 } },
        { id: "fail", label: "Falhar e ter que recomeçar", effects: { movimento: -2 } },
        { id: "stability", label: "Sair da estabilidade", effects: { constancia: 2 } },
      ] } },
      { id: "consistency", label: "Falta de constância", effects: { constancia: -20 }, followUp: { id: "blocker-detail", title: "Quando você costuma desistir?", options: [
        { id: "first-days", label: "Nos primeiros dias", effects: { constancia: -2 } },
        { id: "slow-results", label: "Quando o resultado demora", effects: { confianca: -2 } },
        { id: "busy", label: "Quando a rotina aperta", effects: { constancia: -2 } },
        { id: "new-idea", label: "Quando surge uma ideia nova", effects: { clareza: -2 } },
      ] } },
      { id: "path", label: "Dúvidas sobre meu caminho", effects: { clareza: -18 }, followUp: { id: "blocker-detail", title: "Qual dúvida pesa mais?", options: [
        { id: "which-area", label: "Em qual área colocar minha energia", effects: { clareza: -2 } },
        { id: "stay-go", label: "Se fico ou se mudo", effects: { movimento: -2 } },
        { id: "talent", label: "Se tenho talento para isso", effects: { confianca: -2 } },
        { id: "timing", label: "Se este é o momento certo", effects: { movimento: -1, clareza: -1 } },
      ] } },
      { id: "motivation", label: "Falta de motivação", effects: { movimento: -10, constancia: -8 }, followUp: { id: "blocker-detail", title: "O que mais tira sua motivação?", options: [
        { id: "tired", label: "O cansaço do dia a dia", effects: { constancia: -2 } },
        { id: "no-meaning", label: "Não ver sentido no que faço", effects: { clareza: -2 } },
        { id: "slow", label: "Resultados que demoram", effects: { confianca: -2 } },
        { id: "alone", label: "Sentir que caminho sozinho(a)", effects: { confianca: -2 } },
      ] } },
      { id: "money-fear", label: "Medo de perder dinheiro", effects: { prosperidade: -10, confianca: -8 }, followUp: { id: "blocker-detail", title: "Esse medo vem mais de onde?", options: [
        { id: "past-loss", label: "De uma perda que já vivi", effects: { confianca: -2 } },
        { id: "no-reserve", label: "De não ter reserva", effects: { constancia: -2 } },
        { id: "family", label: "Da responsabilidade com a família", effects: { prosperidade: -1, constancia: 2 } },
        { id: "knowledge", label: "De não entender bem de dinheiro", effects: { clareza: -2 } },
      ] } },
      { id: "action", label: "Não consigo transformar planos em ação", effects: { movimento: -16, constancia: -6, clareza: 6 }, followUp: { id: "blocker-detail", title: "Onde seus planos costumam parar?", options: [
        { id: "start", label: "Na hora de começar", effects: { movimento: -2 } },
        { id: "organize", label: "Na organização", effects: { clareza: -2 } },
        { id: "time", label: "Na falta de tempo", effects: { constancia: -2 } },
        { id: "perfection", label: "No perfeccionismo", effects: { confianca: -2 } },
      ] } },
    ],
  },
  {
    id: "opportunity",
    type: "single",
    title: "Quando uma oportunidade aparece, você normalmente…",
    options: [
      { id: "embrace", label: "Abraço imediatamente", effects: { movimento: 14, confianca: 8, constancia: -4 }, followUp: { id: "opportunity-detail", title: "E depois de abraçar, o que costuma acontecer?", options: [
        { id: "finish", label: "Vou até o fim", effects: { constancia: 3 } },
        { id: "scatter", label: "Às vezes me espalho em muitas coisas", effects: { clareza: -2 } },
        { id: "learn", label: "Aprendo no caminho", effects: { movimento: 2 } },
        { id: "rush", label: "Às vezes me arrependo da pressa", effects: { clareza: -1, confianca: -1 } },
      ] } },
      { id: "overthink", label: "Penso muito antes de agir", effects: { movimento: -8, clareza: 6 }, followUp: { id: "opportunity-detail", title: "O que você mais pondera?", options: [
        { id: "pros-cons", label: "Os prós e contras", effects: { clareza: 2 } },
        { id: "opinions", label: "A opinião de outras pessoas", effects: { confianca: -2 } },
        { id: "money", label: "O dinheiro envolvido", effects: { prosperidade: -1 } },
        { id: "timing", label: "Se é o momento certo", effects: { movimento: -2 } },
      ] } },
      { id: "fear", label: "Tenho medo de tomar a decisão errada", effects: { confianca: -14, movimento: -6 }, followUp: { id: "opportunity-detail", title: "O que acontece quando esse medo aparece?", options: [
        { id: "freeze", label: "Travo e deixo passar", effects: { movimento: -2 } },
        { id: "ask", label: "Peço muitas opiniões", effects: { confianca: -2 } },
        { id: "postpone", label: "Adio a decisão", effects: { constancia: -2 } },
        { id: "anyway", label: "Vou mesmo com medo", effects: { movimento: 2 } },
      ] } },
      { id: "perfect", label: "Espero o momento perfeito", effects: { movimento: -12, constancia: -4 }, followUp: { id: "opportunity-detail", title: "Para você, o momento perfeito seria…", options: [
        { id: "money", label: "Ter mais dinheiro guardado", effects: { prosperidade: -1 } },
        { id: "knowledge", label: "Saber mais sobre o assunto", effects: { clareza: -2 } },
        { id: "time", label: "Ter mais tempo livre", effects: { constancia: -2 } },
        { id: "security", label: "Me sentir mais seguro(a)", effects: { confianca: -2 } },
      ] } },
      { id: "analyze", label: "Analiso e depois ajo", effects: { clareza: 10, movimento: 6, constancia: 6 }, followUp: { id: "opportunity-detail", title: "Como você costuma analisar?", options: [
        { id: "research", label: "Pesquiso e comparo", effects: { clareza: 2 } },
        { id: "intuition", label: "Sigo minha intuição", effects: { confianca: 2 } },
        { id: "talk", label: "Converso com quem confio", effects: { constancia: 1, confianca: 1 } },
        { id: "test", label: "Faço um teste pequeno antes", effects: { movimento: 2 } },
      ] } },
    ],
  },
  {
    id: "phrase",
    type: "single",
    title: "Qual destas frases mais representa você?",
    options: [
      { id: "bigger", label: "Eu sei que posso viver algo maior.", effects: { prosperidade: 8, confianca: 6 }, followUp: { id: "phrase-detail", title: "Esse algo maior tem a ver com…", options: [
        { id: "money", label: "Liberdade financeira", effects: { prosperidade: 2 } },
        { id: "impact", label: "Impactar outras pessoas", effects: { confianca: 2 } },
        { id: "time", label: "Mais tempo e leveza", effects: { clareza: 1 } },
        { id: "recognition", label: "Reconhecimento pelo que faço", effects: { movimento: 2 } },
      ] } },
      { id: "potential", label: "Tenho potencial, mas ainda não encontrei meu caminho.", effects: { clareza: -12, prosperidade: 4 }, followUp: { id: "phrase-detail", title: "O que falta para encontrar esse caminho?", options: [
        { id: "clarity", label: "Clareza do que quero", effects: { clareza: -2 } },
        { id: "chance", label: "Uma oportunidade", effects: { prosperidade: -1 } },
        { id: "courage", label: "Coragem para tentar", effects: { confianca: -2 } },
        { id: "method", label: "Um método para seguir", effects: { constancia: -2 } },
      ] } },
      { id: "close", label: "Sinto que estou perto de uma mudança.", effects: { movimento: 8, prosperidade: 4 }, followUp: { id: "phrase-detail", title: "Essa mudança está mais perto em…", options: [
        { id: "work", label: "Trabalho ou negócios", effects: { movimento: 2 } },
        { id: "money", label: "Finanças", effects: { prosperidade: 2 } },
        { id: "love", label: "Amor e família", effects: { confianca: 2 } },
        { id: "self", label: "Em mim mesmo(a)", effects: { clareza: 2 } },
      ] } },
      { id: "recover", label: "Preciso recuperar minha confiança.", effects: { confianca: -14 }, followUp: { id: "phrase-detail", title: "O que mais abalou sua confiança?", options: [
        { id: "failed-project", label: "Um projeto que não deu certo", effects: { movimento: -1 } },
        { id: "criticism", label: "Críticas de outras pessoas", effects: { confianca: -1 } },
        { id: "money", label: "Uma fase financeira difícil", effects: { prosperidade: -2 } },
        { id: "relationship", label: "O fim de uma relação", effects: { constancia: -1 } },
      ] } },
      { id: "results", label: "Quero aprender a transformar oportunidades em resultados.", effects: { prosperidade: 8, movimento: -6 }, followUp: { id: "phrase-detail", title: "Que oportunidades você quer aproveitar melhor?", options: [
        { id: "job", label: "No trabalho", effects: { movimento: 2 } },
        { id: "sales", label: "Em vendas ou negócios", effects: { prosperidade: 2 } },
        { id: "investments", label: "Em investimentos", effects: { clareza: 2 } },
        { id: "network", label: "Em contatos e parcerias", effects: { confianca: 2 } },
      ] } },
    ],
  },
  {
    id: "first-move",
    type: "single",
    title: "Se sua vida financeira melhorasse significativamente, o que você faria primeiro?",
    helper: "Uma pergunta de imaginação — não uma promessa de resultado.",
    options: [
      { id: "invest", label: "Investiria", effects: { prosperidade: 10, constancia: 8 }, followUp: { id: "first-move-detail", title: "Onde você investiria primeiro?", options: [
        { id: "safe", label: "Em algo seguro, para dormir tranquilo(a)", effects: { constancia: 2 } },
        { id: "business", label: "Em um negócio", effects: { movimento: 2 } },
        { id: "education", label: "Em conhecimento e estudos", effects: { clareza: 2 } },
        { id: "property", label: "Em um imóvel", effects: { prosperidade: 2 } },
      ] } },
      { id: "business", label: "Criaria um negócio", effects: { prosperidade: 8, movimento: 8 }, followUp: { id: "first-move-detail", title: "Que tipo de negócio?", options: [
        { id: "online", label: "Algo online", effects: { movimento: 2 } },
        { id: "store", label: "Uma loja ou espaço físico", effects: { constancia: 2 } },
        { id: "service", label: "Um serviço com o meu talento", effects: { confianca: 2 } },
        { id: "old-idea", label: "Uma ideia que guardo há tempo", effects: { clareza: 2 } },
      ] } },
      { id: "family", label: "Ajudaria minha família", effects: { prosperidade: 6, constancia: 4 }, followUp: { id: "first-move-detail", title: "Como você ajudaria?", options: [
        { id: "debts", label: "Quitando dívidas da família", effects: { constancia: 2 } },
        { id: "home", label: "Com uma casa melhor", effects: { prosperidade: 2 } },
        { id: "studies", label: "Pagando estudos", effects: { clareza: 2 } },
        { id: "time", label: "Com mais tempo junto deles", effects: { confianca: 2 } },
      ] } },
      { id: "dreams", label: "Realizaria meus sonhos", effects: { prosperidade: 6, movimento: 4 }, followUp: { id: "first-move-detail", title: "Qual sonho viria primeiro?", options: [
        { id: "travel", label: "Viajar", effects: { movimento: 2 } },
        { id: "house", label: "A casa própria", effects: { constancia: 2 } },
        { id: "car", label: "Um carro novo", effects: { prosperidade: 1 } },
        { id: "project", label: "Um projeto pessoal", effects: { clareza: 2 } },
      ] } },
      { id: "freedom", label: "Buscaria mais liberdade", effects: { prosperidade: 6, clareza: 4 }, followUp: { id: "first-move-detail", title: "Liberdade para…", options: [
        { id: "time", label: "Ter controle do meu tempo", effects: { constancia: 2 } },
        { id: "boss", label: "Não depender de um chefe", effects: { movimento: 2 } },
        { id: "place", label: "Morar onde eu quiser", effects: { clareza: 1 } },
        { id: "choose", label: "Escolher sem medo", effects: { confianca: 2 } },
      ] } },
      { id: "new-life", label: "Construiria uma vida completamente nova", effects: { movimento: 10, clareza: -4 }, followUp: { id: "first-move-detail", title: "Essa vida nova começaria por…", options: [
        { id: "move", label: "Mudar de cidade ou país", effects: { movimento: 2 } },
        { id: "career", label: "Mudar de profissão", effects: { clareza: -1, movimento: 1 } },
        { id: "routine", label: "Uma rotina completamente diferente", effects: { constancia: 2 } },
        { id: "self-care", label: "Cuidar mais de mim", effects: { confianca: 2 } },
      ] } },
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
    if (!option) continue;
    apply(option.effects);
    const detail = option.followUp?.options.find((item) => item.id === answers[option.followUp!.id]);
    if (detail) apply(detail.effects);
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

/** Label of the specific focus picked under an answer's follow-up (e.g. area → "Aumentar minha renda"). */
export function followUpLabel(questionId: string, answers: Answers) {
  const option = DIAGNOSTIC_QUESTIONS.find((question) => question.id === questionId)?.options.find((item) => item.id === answers[questionId]);
  return option?.followUp?.options.find((item) => item.id === answers[option.followUp!.id])?.label ?? "";
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
