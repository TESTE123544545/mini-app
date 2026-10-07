export type View = "home" | "premium" | "diagnostic" | "signs" | "signals" | "tree" | "missions" | "journal" | "profile" | "goal" | "chat";

/** Tabs in the bottom bar, in the same order as the site. */
export const TABS: { view: View; label: string }[] = [
  { view: "home", label: "Início" },
  { view: "diagnostic", label: "Momento" },
  { view: "signs", label: "Signos" },
  { view: "signals", label: "Sinais" },
  { view: "tree", label: "Árvore" },
  { view: "missions", label: "Jornada" },
  { view: "journal", label: "Diário" },
  { view: "profile", label: "Perfil" },
];

/** A free account can take the diagnostic, see the offer, manage its account and open the basic "Sinais". */
export const FREE_VIEWS: View[] = ["diagnostic", "premium", "profile", "signals"];

export const LOCKED_COPY: Partial<Record<View, { title: string; text: string }>> = {
  home: { title: "Seu dia completo", text: "A leitura diária do seu signo, a missão do dia, o ritual de 3 minutos, o oráculo e o céu ao vivo." },
  signs: { title: "Signos & Astrologia", text: "O dia do seu signo com a frase do dia, o céu ao vivo, a carta de tarô do dia e a Roda da Fortuna." },
  tree: { title: "Sua Árvore da Prosperidade", text: "Uma árvore que cresce com as suas ações, com cuidados diários, etapas e conquistas." },
  missions: { title: "Sua Jornada", text: "Missões diárias, trilhas guiadas de 7 e 21 dias e o relatório semanal lido pela IA." },
  journal: { title: "Seu Diário", text: "Uma reflexão guiada por dia e o histórico completo da sua evolução." },
  goal: { title: "Seu Objetivo", text: "Metas sem limite, com passos personalizados pela IA para o seu objetivo." },
  chat: { title: "Conversar com a IA", text: "A Sintonia conversa com você sobre o seu dia, com o céu de hoje e o seu signo como contexto." },
};

export const PAYWALL_HEADLINE: Record<string, string> = {
  goal_limit: "Você atingiu o limite de metas do plano grátis",
  journal_history: "Seu histórico completo tem mais reflexões esperando",
  weekly_report: "A leitura completa do seu relatório está pronta",
  trail_start: "Essa trilha é Premium",
  premium_card: "Destrave a jornada completa",
  chat: "Converse com a IA sempre que precisar",
  goal_steps: "Passos personalizados pro seu objetivo",
  signs_weekly: "Previsão astrológica completa para o seu signo prosperar",
  signals_hour: "A interpretação completa deste sinal está pronta para você",
  signals_numerology: "Descubra o que seus números dizem sobre você",
  signals_combo: "A combinação do seu signo com o seu Caminho de Vida",
  signals_daily: "Sua mensagem do dia, completa e personalizada",
  signals_history: "Seu histórico completo de sinais",
  wheel: "A Roda da Fortuna é um ritual diário do Premium",
  tarot: "Sua carta do dia é exclusiva do Premium",
};
