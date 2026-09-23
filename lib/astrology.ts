export type MoonPhaseName = "Lua Nova" | "Lua Crescente" | "Lua Cheia" | "Lua Minguante";

export type MoonPhaseInfo = {
  name: MoonPhaseName;
  illumination: number; // 0 to 100%
  symbol: string;
  theme: string;
  financialFocus: string;
  favorableAction: string;
  avoidAction: string;
};

export type PlanetWealthInfo = {
  id: string;
  name: string;
  archetype: string;
  wealthDomain: string;
  howToActivate: string;
  weeklyAdvice: string;
};

export type ElementalProsperity = {
  element: "fogo" | "terra" | "ar" | "agua";
  name: string;
  signNames: readonly string[];
  wealthSuperpower: string;
  scarcityTrap: string;
  rebalancingPractice: string;
};

/**
 * Calculates real-time astronomical moon phase for any date.
 * Based on the synodic lunar cycle of 29.53058867 days.
 */
export function getMoonPhase(date = new Date()): MoonPhaseInfo {
  // Known new moon: January 6, 2000, 18:14 UTC
  const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime();
  const synodicMonthMs = 29.53058867 * 86400000;
  const diff = date.getTime() - knownNewMoon;
  const cycleFraction = ((diff % synodicMonthMs) + synodicMonthMs) % synodicMonthMs / synodicMonthMs;

  const illumination = Math.round((1 - Math.cos(cycleFraction * 2 * Math.PI)) / 2 * 100);

  if (cycleFraction < 0.22) {
    return {
      name: "Lua Nova",
      illumination,
      symbol: "🌑",
      theme: "Plantio & Intenção",
      financialFocus: "Momento perfeito para definir novas metas, planejar orçamentos e semear projetos que precisam de tempo para germinar.",
      favorableAction: "Escrever novos objetivos financeiros, traçar um plano de poupança e alinhar intenções do mês.",
      avoidAction: "Esperar retornos imediatos ou fazer cobranças agressivas antes da germinação.",
    };
  } else if (cycleFraction < 0.47) {
    return {
      name: "Lua Crescente",
      illumination,
      symbol: "🌓",
      theme: "Ação & Expansão",
      financialFocus: "A energia está em alta tração. Fase ideal para acelerar propostas comerciais, fechar contratos e investir em divulgação.",
      favorableAction: "Enviar propostas pendentes, fazer contatos de vendas e acelerar a rotina de trabalho com foco.",
      avoidAction: "Duvidar do caminho e desacelerar por medo da exposição.",
    };
  } else if (cycleFraction < 0.72) {
    return {
      name: "Lua Cheia",
      illumination,
      symbol: "🌕",
      theme: "Visibilidade & Colheita",
      financialFocus: "Ápice de magnetismo e clareza. Momento de celebrar conquistas, lançar campanhas e colher os frutos das metas em andamento.",
      favorableAction: "Lançar produtos ou ofertas ao público, negociar aumentos ou parcerias e reconhecer seu progresso.",
      avoidAction: "Gastos por empolgação ou compras por impulso motivadas por excesso de otimismo.",
    };
  } else {
    return {
      name: "Lua Minguante",
      illumination,
      symbol: "🌗",
      theme: "Corte & Estruturação",
      financialFocus: "Fase de recolhimento estratégico. Hora de auditar despesas, cortar assinaturas inúteis e organizar os bastidores do trabalho.",
      favorableAction: "Renegociar dívidas, eliminar gastos supérfluos e arrumar planilhas ou o ambiente de trabalho.",
      avoidAction: "Iniciar empreendimentos sem base sólida ou assumir novos endividamentos desnecessários.",
    };
  }
}

export const PLANETS_OF_PROSPERITY: readonly PlanetWealthInfo[] = [
  {
    id: "jupiter",
    name: "Júpiter",
    archetype: "O Grande Benéfico da Abundância",
    wealthDomain: "Expansão de horizontes, grandes investimentos, visão de longo prazo e escala de negócios.",
    howToActivate: "Estude novos mercados, invista em conhecimento de alto nível e pense em como aumentar o impacto da sua entrega.",
    weeklyAdvice: "Não limite seus objetivos ao que parece confortável; a abundância começa na amplitude da sua visão.",
  },
  {
    id: "venus",
    name: "Vênus",
    archetype: "A Deusa do Valor & Magnetismo",
    wealthDomain: "Atração de clientes, autoapreço, precificação justa e harmonia com o dinheiro.",
    howToActivate: "Melhore a estética da sua marca pessoal, aprenda a cobrar o que vale e trate seu dinheiro com carinho.",
    weeklyAdvice: "Quem tem medo de precificar o próprio valor ensina o mercado a pagar pouco.",
  },
  {
    id: "mercurio",
    name: "Mercúrio",
    archetype: "O Mensageiro dos Negócios & Vendas",
    wealthDomain: "Comunicação estratégica, contratos rápidos, negociação, marketing e agilidade mental.",
    howToActivate: "Refine seu discurso de vendas, responda clientes com prontidão e simplifique propostas comerciais.",
    weeklyAdvice: "A clareza na mensagem vence discursos longos: torne fácil para o cliente dizer 'sim'.",
  },
  {
    id: "saturno",
    name: "Saturno",
    archetype: "O Mestre da Disciplina & Patrimônio",
    wealthDomain: "Reserva de emergência, juros compostos, autoridade consolidada e patrimônio sólido.",
    howToActivate: "Mantenha a rotina mesmo sem vontade imediata; poupe com constância e construa ativos seguros.",
    weeklyAdvice: "A disciplina diária supera o talento passageiro; a estabilidade é o alicerce de qualquer império.",
  },
  {
    id: "marte",
    name: "Marte",
    archetype: "O Guerreiro da Iniciativa & Conquista",
    wealthDomain: "Coragem de empreender, velocidade de execução, fechamento de vendas e superação da procrastinação.",
    howToActivate: "Dê o primeiro passo em algo que está adiando há dias; vença o medo com movimento concreto.",
    weeklyAdvice: "A perfeição é inimiga da execução: faça bem feito hoje em vez de esperar o momento ideal que não existe.",
  },
  {
    id: "sol",
    name: "Sol",
    archetype: "O Centro da Autoridade & Liderança",
    wealthDomain: "Reconhecimento profissional, liderança exemplar, confiança interna e propósito de vida.",
    howToActivate: "Mostre o resultado do seu trabalho, assuma responsabilidades e lidere pelo mérito da sua entrega.",
    weeklyAdvice: "Sua confiança interna é percebida pelo mercado antes mesmo de você abrir a boca.",
  },
];

export const ELEMENTS_PROSPERITY: readonly ElementalProsperity[] = [
  {
    element: "fogo",
    name: "Fogo (Áries, Leão, Sagitário)",
    signNames: ["Áries", "Leão", "Sagitário"],
    wealthSuperpower: "Coragem, pioneirismo, visão ousada e magnetismo de vendas.",
    scarcityTrap: "Impulsividade financeira, compras por empolgação e tédio com a rotina de controle.",
    rebalancingPractice: "Antes de fechar compras não essenciais, espere 48 horas. Direcione sua chama para iniciar novos projetos rentáveis.",
  },
  {
    element: "terra",
    name: "Terra (Touro, Virgem, Capricórnio)",
    signNames: ["Touro", "Virgem", "Capricórnio"],
    wealthSuperpower: "Constância inabalável, controle de custos, método e visão de patrimônio perene.",
    scarcityTrap: "Apego à zona de conforto, medo de inovar e dificuldade de gastar consigo mesmo.",
    rebalancingPractice: "Separe uma cota de 10% para aprendizado e inovação. Permita-se colher e celebrar o que já construiu.",
  },
  {
    element: "ar",
    name: "Ar (Gêmeos, Libra, Aquário)",
    signNames: ["Gêmeos", "Libra", "Aquário"],
    wealthSuperpower: "Networking valioso, inovação estratégica, parcerias lucrativas e facilidade de adaptação.",
    scarcityTrap: "Dispersão em muitas frentes ao mesmo tempo, falta de controle de caixa detalhado e indecisão.",
    rebalancingPractice: "Escolha apenas UMA ideia principal por trimestre para transformar em receita recorrente antes de abrir novas frentes.",
  },
  {
    element: "agua",
    name: "Água (Câncer, Escorpião, Peixes)",
    signNames: ["Câncer", "Escorpião", "Peixes"],
    wealthSuperpower: "Intuição aguçada de mercado, sensibilidade com pessoas, fidelização profunda e criatividade única.",
    scarcityTrap: "Misturar emoções com decisões de dinheiro, receio de cobrar ou encarar números da conta bancária.",
    rebalancingPractice: "Coloque regras racionais e datas fixas para conferir extratos; encare o dinheiro como um recurso sagrado de segurança e liberdade.",
  },
];

export const ASTROLOGY_TRIAD_GUIDE = [
  {
    title: "Signo Solar (Sua Essência de Riqueza)",
    description: "Revela como sua energia vital gera valor no mundo e onde seu brilho natural atrai abundância e realização profissional.",
  },
  {
    title: "Signo Lunar (Sua Relação Emocional com o Dinheiro)",
    description: "Indica suas necessidades instintivas de segurança material, como você lida com o medo de escassez e como encontra tranquilidade financeira.",
  },
  {
    title: "Ascendente (Seu Posicionamento no Mercado)",
    description: "Mostra como o público, clientes e parceiros enxergam você à primeira vista e qual estilo de liderança gera maior autoridade comercial.",
  },
];
