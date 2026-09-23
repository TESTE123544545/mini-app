export type ElementType = "fogo" | "terra" | "ar" | "agua";
export type ModalityType = "Cardinal" | "Fixo" | "Mutável";

export type PartnerSign = {
  sign: string;
  synergy: string;
};

export type SignData = {
  id: string;
  name: string;
  glyph: string;
  period: string;
  element: ElementType;
  elementLabel: string;
  modality: ModalityType;
  rulingPlanet: string;
  symbol: string;
  archetype: string;
  prosperityMantra: string;
  wealthMindset: string;
  strengths: readonly string[];
  blindSpots: readonly string[];
  antidote: string;
  careerAndBusiness: {
    bestFields: readonly string[];
    leadershipStyle: string;
    negotiationPower: string;
  };
  compatiblePartners: readonly PartnerSign[];
  prosperityRitual: {
    title: string;
    duration: string;
    practice: string;
  };
};

export const SIGNS: readonly SignData[] = [
  {
    id: "aries",
    name: "Áries",
    glyph: "♈",
    period: "21 mar - 19 abr",
    element: "fogo",
    elementLabel: "Fogo",
    modality: "Cardinal",
    rulingPlanet: "Marte",
    symbol: "O Carneiro",
    archetype: "O Pioneiro & Desbravador",
    prosperityMantra: "Minha coragem abre portas e minha disciplina transforma impulsos em patrimônio duradouro.",
    wealthMindset: "Áries gera riqueza pela velocidade de iniciativa. Enquanto outros planejam excessivamente, Áries dá o primeiro passo, testa o mercado e descobre rotas inexploradas.",
    strengths: [
      "Coragem para arriscar e iniciar novos empreendimentos",
      "Poder de decisão rápido sob pressão",
      "Energia contagiosa que vende ideias e projetos pioneiros",
    ],
    blindSpots: [
      "Impulsividade ao gastar com novidades efêmeras",
      "Abandono de projetos promissores antes da colheita",
    ],
    antidote: "Estabeleça a regra dos 3 dias antes de qualquer grande compra ou pivot de negócio; tenha sócios estruturadores que garantam a continuidade.",
    careerAndBusiness: {
      bestFields: ["Empreendedorismo", "Vendas agressivas", "Liderança de inovação", "Consultoria de crise", "Esportes e performance"],
      leadershipStyle: "Lidera pela linha de frente, contagiando pelo exemplo e determinação inabalável.",
      negotiationPower: "Forte em fechamento rápido e propostas diretas. Precisa exercitar paciência em negociações longas.",
    },
    compatiblePartners: [
      { sign: "Touro", synergy: "Touro ancora as ideias audaciosas de Áries em métodos financeiros sólidos e previsíveis." },
      { sign: "Leão", synergy: "Juntos criam marcas magnéticas, de alto impacto visual e forte autoridade comercial." },
      { sign: "Gêmeos", synergy: "Gêmeos traz comunicação estratégica e contatos valiosos para acelerar a visão ariana." },
    ],
    prosperityRitual: {
      title: "Ignição Matinal de Foco",
      duration: "3 minutos",
      practice: "Antes de olhar o celular, defina a ÚNICA vitória financeira inegociável do dia e declare-a em voz alta para ativar sua intenção marcial.",
    },
  },
  {
    id: "touro",
    name: "Touro",
    glyph: "♉",
    period: "20 abr - 20 mai",
    element: "terra",
    elementLabel: "Terra",
    modality: "Fixo",
    rulingPlanet: "Vênus",
    symbol: "O Touro",
    archetype: "O Construtor de Valor",
    prosperityMantra: "Eu construo segurança tijolo por tijolo. Minha paciência gera estabilidade e abundância palpável.",
    wealthMindset: "Touro tem uma conexão nativa e instintiva com o dinheiro e o conforto material. Prospera acumulando ativos tangíveis, reinvestindo com prudência e nunca sacrificando a qualidade.",
    strengths: [
      "Constância férrea e capacidade de sustentar rotinas de longo prazo",
      "Excelente faro para valor real, qualidade e ativos tangíveis",
      "Capacidade de poupar e fazer juros compostos trabalharem a seu favor",
    ],
    blindSpots: [
      "Resistência teimosa a inovações e novas ferramentas financeiras",
      "Apego a zonas de conforto por medo de instabilidade temporária",
    ],
    antidote: "Reserve uma pequena fração dos recursos (5% a 10%) especificamente para inovação, cursos e testes sem medo de perder.",
    careerAndBusiness: {
      bestFields: ["Mercado imobiliário", "Finanças e patrimônio", "Gastronomia e luxo", "Design de produtos físicos", "Agricultura sustentável"],
      leadershipStyle: "Comedido, confiável e focado em processos sustentáveis que não esgotam a equipe.",
      negotiationPower: "Paciência inabalável; ganha pelo cansaço do oponente sem ceder em seus valores fundamentais.",
    },
    compatiblePartners: [
      { sign: "Virgem", synergy: "Aliança perfeita de precisão operacional e eficiência máxima de custos." },
      { sign: "Capricórnio", synergy: "Uma máquina de longo prazo capaz de erguer impérios financeiros inabaláveis." },
      { sign: "Câncer", synergy: "Câncer traz visão acolhedora de mercado e Touro ancora os lucros com segurança." },
    ],
    prosperityRitual: {
      title: "Ancoragem do Valor Presente",
      duration: "5 minutos",
      practice: "Agradeça conscientemente por 3 bens físicos que hoje sustentam sua vida e revise suas reservas com serenidade e apreço pelo que já construiu.",
    },
  },
  {
    id: "gemeos",
    name: "Gêmeos",
    glyph: "♊",
    period: "21 mai - 20 jun",
    element: "ar",
    elementLabel: "Ar",
    modality: "Mutável",
    rulingPlanet: "Mercúrio",
    symbol: "Os Gêmeos",
    archetype: "O Conector Estratégico",
    prosperityMantra: "Minha curiosidade abre caminhos; meu foco escolhe a rota mais próspera e lucrativa.",
    wealthMindset: "Gêmeos monetiza informações, conexões humanas e ideias pioneiras. Prospera transformando dados em oportunidades de negócios e articulando parcerias de benefício mútuo.",
    strengths: [
      "Agilidade mental para identificar tendências antes dos concorrentes",
      "Comunicação persuasiva e facilidade extraordinária para networking",
      "Capacidade de diversificar fontes de renda com flexibilidade",
    ],
    blindSpots: [
      "Dispersão de energia em projetos simultâneos inacabados",
      "Desorganização de fluxo de caixa por falta de controle detalhado",
    ],
    antidote: "Crie um funil rigoroso: antes de começar uma nova fonte de renda, finalize e automatize a que já está aberta.",
    careerAndBusiness: {
      bestFields: ["Comunicação e mídia", "Comércio digital", "Negociação e intermediação", "Educação corporativa", "Tecnologia da informação"],
      leadershipStyle: "Dinâmico, participativo, estimulando a troca livre de ideias e soluções criativas.",
      negotiationPower: "Articulação verbal imbatível; encontra saídas criativas e termos onde todos sentem que ganharam.",
    },
    compatiblePartners: [
      { sign: "Libra", synergy: "Elegância e diplomacia unidas à rapidez mental para criar parcerias de prestígio." },
      { sign: "Áries", synergy: "Áries executa com força brutal as ideias brilhantes que Gêmeos formula." },
      { sign: "Aquário", synergy: "União visionária com potencial para modelos de negócios disruptivos em escala." },
    ],
    prosperityRitual: {
      title: "Filtro dos Três Canais",
      duration: "4 minutos",
      practice: "Escreva em uma folha todas as ideias na cabeça, circule apenas a de maior retorno financeiro para a semana e guarde as outras numa gaveta.",
    },
  },
  {
    id: "cancer",
    name: "Câncer",
    glyph: "♋",
    period: "21 jun - 22 jul",
    element: "agua",
    elementLabel: "Água",
    modality: "Cardinal",
    rulingPlanet: "Lua",
    symbol: "O Caranguejo",
    archetype: "O Guardião da Sustentação",
    prosperityMantra: "Eu protejo minhas conquistas e uso minha intuição para criar segurança duradoura para o meu futuro.",
    wealthMindset: "Câncer entende que a verdadeira riqueza cria raízes seguras para quem ama. Sua intuição emocional para necessidades de consumo e momentos de mercado é profunda e protetora.",
    strengths: [
      "Intuição aguçada para saber em quem confiar e onde alocar recursos",
      "Cuidado natural com a reserva de emergência e preservação do patrimônio",
      "Sensibilidade única para fidelizar clientes e construir lealdade",
    ],
    blindSpots: [
      "Tomar decisões financeiras com base em carência ou chantagem emocional",
      "Medo excessivo de escassez que impede investimentos necessários de expansão",
    ],
    antidote: "Separe rigidamente decisões de negócios das relações afetivas; crie contratos claros mesmo com pessoas próximas.",
    careerAndBusiness: {
      bestFields: ["Bens de consumo e alimentação", "Imóveis residenciais", "Recursos humanos e psicologia", "Atendimento de excelência", "Hotelaria e acolhimento"],
      leadershipStyle: "Protetor e empático, cria ambientes de alta fidelidade e pertencimento corporativo.",
      negotiationPower: "Lê intenções ocultas na mesa de negociação e protege as margens do negócio como um guardião.",
    },
    compatiblePartners: [
      { sign: "Escorpião", synergy: "Lealdade absoluta e faro investigativo conjunto para investimentos lucrativos." },
      { sign: "Touro", synergy: "Ambos prezam pela solidez e constroem patrimônio imobiliário e reservas imbatíveis." },
      { sign: "Peixes", synergy: "Criatividade empática transformada em produtos que tocam o coração do público." },
    ],
    prosperityRitual: {
      title: "Bênção das Reservas",
      duration: "3 minutos",
      practice: "Olhe para sua reserva financeira ou casa com sentimento de gratidão e segurança, reafirmando que o fluxo de provisão nunca cessa.",
    },
  },
  {
    id: "leao",
    name: "Leão",
    glyph: "♌",
    period: "23 jul - 22 ago",
    element: "fogo",
    elementLabel: "Fogo",
    modality: "Fixo",
    rulingPlanet: "Sol",
    symbol: "O Leão",
    archetype: "O Empreendedor Magnético",
    prosperityMantra: "Eu brilho pela excelência do meu trabalho e atraio abundância com integridade e generosidade.",
    wealthMindset: "Leão prospera pela autoridade, posicionamento de alto valor e orgulho da entrega. Sabe que um produto ou serviço de alto padrão atrai clientes que pagam pelo mérito e exclusividade.",
    strengths: [
      "Presença magnética que inspira confiança imediata e atrai patrocinadores",
      "Capacidade natural de agregação de valor e posicionamento de marca premium",
      "Generosidade estratégica que cultiva aliados influentes e fiéis",
    ],
    blindSpots: [
      "Gastos excessivos com status e aparências para manter padrões elevados",
      "Dificuldade em aceitar críticas operacionais ou pedir orientações financeiras",
    ],
    antidote: "Baseie seu prestígio no lucro líquido e no valor da sua reserva, e não em bens ostensivos ou validação alheia.",
    careerAndBusiness: {
      bestFields: ["Marcas de luxo e autoridade", "Liderança executiva", "Entretenimento e criação de conteúdo", "Gestão de eventos de alto padrão", "Consultoria de imagem e marca"],
      leadershipStyle: "Inspirador, nobre e audacioso; comemora as vitórias e eleva o padrão de todos ao redor.",
      negotiationPower: "Posiciona-se com altivez e nunca precifica seu tempo por baixo; sabe o valor do que entrega.",
    },
    compatiblePartners: [
      { sign: "Sagitário", synergy: "Expansão de horizontes, visão de escala internacional e otimismo inabalável." },
      { sign: "Libra", synergy: "A união de autoridade e diplomacia para criar projetos estéticos e comerciais irresistíveis." },
      { sign: "Áries", synergy: "Dupla dinâmica que conquista fatias de mercado com velocidade e impacto estrondoso." },
    ],
    prosperityRitual: {
      title: "Alinhamento Solar de Dignidade",
      duration: "3 minutos",
      practice: "Fique de pé, coluna ereta sob a luz natural, visualize o padrão ouro da sua vida material e declare seu compromisso com a excelência do dia.",
    },
  },
  {
    id: "virgem",
    name: "Virgem",
    glyph: "♍",
    period: "23 ago - 22 set",
    element: "terra",
    elementLabel: "Terra",
    modality: "Mutável",
    rulingPlanet: "Mercúrio",
    symbol: "A Virgem",
    archetype: "O Mestre da Eficiência",
    prosperityMantra: "O progresso diário supera a perfeição adiada. Minha precisão multiplica resultados e riquezas.",
    wealthMindset: "Virgem prospera pelo método, otimização de gargalos e corte cirúrgico de desperdícios. Entende que a riqueza não é apenas quanto entra, mas a eficiência matemática de como tudo é aproveitado.",
    strengths: [
      "Atenção minuciosa aos detalhes que evita perdas contratuais e financeiras",
      "Capacidade ímpar de criar processos repetíveis e automatizados",
      "Pragmatismo para transformar problemas complexos em listas de ação claras",
    ],
    blindSpots: [
      "Perfeccionismo paralisante que atrasa lançamentos e propostas comerciais",
      "Subavaliação do próprio trabalho por achar que 'ainda não está perfeito'",
    ],
    antidote: "Adote a mentalidade do MVP (Mínimo Produto Viável): lance com cuidado, valide no mundo real e aprimore na estrada.",
    careerAndBusiness: {
      bestFields: ["Auditoria e controladoria", "Otimização operacional e logística", "Engenharia de software e QA", "Saúde e biotecnologia", "Análise de métricas e dados"],
      leadershipStyle: "Meticuloso, prestativo e focado em apoiar a equipe com ferramentas e métodos práticos.",
      negotiationPower: "Armado com números, métricas e dados concretos; desmonta qualquer argumento vazio.",
    },
    compatiblePartners: [
      { sign: "Touro", synergy: "A solidez prática aliada à perfeição analítica cria modelos financeiros infalíveis." },
      { sign: "Capricórnio", synergy: "O ápice da competência empresarial e da gestão rigorosa de longo prazo." },
      { sign: "Escorpião", synergy: "Ambos investigam a fundo e criam estratégias à prova de falhas operacionais." },
    ],
    prosperityRitual: {
      title: "Desentulhar de 5 Minutos",
      duration: "5 minutos",
      practice: "Organize uma pasta digital de comprovantes ou uma gaveta física de trabalho; clareza visual destrava fluxo de caixa.",
    },
  },
  {
    id: "libra",
    name: "Libra",
    glyph: "♎",
    period: "23 set - 22 out",
    element: "ar",
    elementLabel: "Ar",
    modality: "Cardinal",
    rulingPlanet: "Vênus",
    symbol: "A Balança",
    archetype: "O Arquiteto de Parcerias",
    prosperityMantra: "Eu decido com clareza e construo alianças justas que multiplicam o valor de todas as partes.",
    wealthMindset: "Libra prospera pelo poder das associações, da diplomacia e do design elegante. Sabe que duas forças bem alinhadas geram muito mais riqueza do que uma batalha solitária.",
    strengths: [
      "Diplomacia nata para mediar conflitos e alinhar interesses comerciais",
      "Visão estética e senso de proporção que valoriza produtos e marcas",
      "Habilidade social para atrair sócios estratégicos e clientes de alto calibre",
    ],
    blindSpots: [
      "Indecisão prolongada diante de escolhas financeiras que exigem corte",
      "Ceder mais do que deveria em acordos por receio de confrontar o outro",
    ],
    antidote: "Estabeleça critérios numéricos objetivos antes de sentar para negociar; lembre-se de que se posicionar com firmeza gera respeito profissional.",
    careerAndBusiness: {
      bestFields: ["Direito e mediação de negócios", "Arquitetura e design de interiores", "Relações públicas e parcerias", "Moda e estética refinada", "Consultoria de fusões e alianças"],
      leadershipStyle: "Justo, conciliador e atento ao bem-estar e equilíbrio de forças na equipe.",
      negotiationPower: "Cria pontes onde outros veem muros; formula acordos equilibrados que perduram por anos.",
    },
    compatiblePartners: [
      { sign: "Gêmeos", synergy: "Comunicação fluida e inteligência comercial que destravam oportunidades rápidas." },
      { sign: "Aquário", synergy: "Ideais de impacto coletivo somados à diplomacia para viabilizar grandes projetos." },
      { sign: "Leão", synergy: "Leão brilha na frente e Libra cuida do prestígio estético e das alianças de bastidores." },
    ],
    prosperityRitual: {
      title: "Voto de Decisão Soberana",
      duration: "3 minutos",
      practice: "Identifique uma escolha pendente, pese os dois pratos da balança por 60 segundos e escolha com convicção sem olhar para trás.",
    },
  },
  {
    id: "escorpiao",
    name: "Escorpião",
    glyph: "♏",
    period: "23 out - 21 nov",
    element: "agua",
    elementLabel: "Água",
    modality: "Fixo",
    rulingPlanet: "Plutão / Marte",
    symbol: "O Escorpião",
    archetype: "O Alquimista Estrategista",
    prosperityMantra: "Eu transformo desafios em poder pessoal. Minha visão profunda regenera e expande meu patrimônio.",
    wealthMindset: "Escorpião prospera pela capacidade de enxergar o que os outros ignoram, reestruturar ativos em crise e operar com discrição e foco absoluto até a vitória.",
    strengths: [
      "Foco obsessivo e resiliência monumental para recuperar situações difíceis",
      "Leitura psicológica precisa de motivações, blefes e intenções de concorrentes",
      "Talento nato para alavancagem financeira e reestruturação de valor",
    ],
    blindSpots: [
      "Desconfiança excessiva que atrasa delegação e sobrecarrega a si mesmo",
      "Rancor ou postura de 'tudo ou nada' que pode queimar pontes valiosas",
    ],
    antidote: "Construa círculos de confiança testados gradualmente; mantenha discrição sobre planos sem se isolar do mercado.",
    careerAndBusiness: {
      bestFields: ["Investimentos de risco e fusões", "Investigação e segurança da informação", "Gestão de crises corporativas", "Psicoterapia e mentoria profunda", "Mineração e energia"],
      leadershipStyle: "Intenso, exigente e profundamente leal aos que demonstram dedicação real à causa.",
      negotiationPower: "Percepção afiada de fraquezas e fortalezas alheias; não recua sob intimidação.",
    },
    compatiblePartners: [
      { sign: "Câncer", synergy: "Pacto de lealdade e proteção patrimonial inquebrantável entre dois guardiões." },
      { sign: "Peixes", synergy: "Visão intuitiva profunda que antecipa viradas de mercado antes de acontecerem." },
      { sign: "Capricórnio", synergy: "A união de poder estratégico oculto com autoridade institucional e estrutura." },
    ],
    prosperityRitual: {
      title: "Queima de Bloqueios de Escassez",
      duration: "4 minutos",
      practice: "Escreva em um rascunho um medo financeiro antigo, rasgue-o em pedaços e respire fundo afirmando sua capacidade inata de regeneração.",
    },
  },
  {
    id: "sagitario",
    name: "Sagitário",
    glyph: "♐",
    period: "22 nov - 21 dez",
    element: "fogo",
    elementLabel: "Fogo",
    modality: "Mutável",
    rulingPlanet: "Júpiter",
    symbol: "O Arqueiro",
    archetype: "O Visionário da Expansão",
    prosperityMantra: "Minha flecha mira longe. Minha visão ampla encontra prosperidade em novos territórios e conhecimentos.",
    wealthMindset: "Regido por Júpiter (o planeta da grande fortuna e expansão), Sagitário prospera pensando grande, escalando projetos, explorando mercados globais e ensinando o que aprendeu.",
    strengths: [
      "Otimismo contagioso que atrai oportunidades de alto porte e investidores",
      "Facilidade para internacionalização, viagens de negócios e expansão de horizontes",
      "Filosofia de abundância que não se apega à escassez momentânea",
    ],
    blindSpots: [
      "Excesso de confiança com promessas irrealistas e falta de controle orçamentário",
      "Tédio rápido com rotinas de acompanhamento financeiro burocrático",
    ],
    antidote: "Contrate ou faça parceria com alguém minucioso (Terra) para cuidar dos contratos e da planilha de custos enquanto você abre fronteiras.",
    careerAndBusiness: {
      bestFields: ["Educação superior e palestras", "Importação, exportação e comércio exterior", "Turismo e hotelaria internacional", "Direito internacional", "Mídia de exploração e filosofia"],
      leadershipStyle: "Inspirador, entusiasta e libertário; confia na capacidade do time e incentiva o crescimento de todos.",
      negotiationPower: "Persuasivo pela visão de futuro grandiosa; entusiasma a contraparte a fazer parte de algo épico.",
    },
    compatiblePartners: [
      { sign: "Áries", synergy: "Ação direta somada a visão ampla; uma força avassaladora de conquista de mercado." },
      { sign: "Leão", synergy: "Generosidade, carisma e autoridade para construir empreendimentos com alcance nacional ou global." },
      { sign: "Aquário", synergy: "Projetos revolucionários focados no futuro da sociedade com modelo escalável." },
    ],
    prosperityRitual: {
      title: "Expansão da Flecha de Júpiter",
      duration: "4 minutos",
      practice: "Olhe para o horizonte ou para o céu, mentalize onde você quer que seus negócios estejam em 3 anos e anote um passo prático que cabe hoje.",
    },
  },
  {
    id: "capricornio",
    name: "Capricórnio",
    glyph: "♑",
    period: "22 dez - 19 jan",
    element: "terra",
    elementLabel: "Terra",
    modality: "Cardinal",
    rulingPlanet: "Saturno",
    symbol: "A Cabra da Montanha",
    archetype: "O Arquiteto do Império",
    prosperityMantra: "Eu escalo montanhas com passos firmes. Minha disciplina constrói um legado inabalável.",
    wealthMindset: "Capricórnio é o mestre da prosperidade institucional e de longo prazo. Entende o valor do tempo, do esforço silencioso e do prestígio construído sobre bases reais de competência.",
    strengths: [
      "Disciplina inigualável e capacidade de perseverar onde a maioria desiste",
      "Visão estratégica de carreira, hierarquia e consolidação institucional",
      "Gestão impecável de riscos e respeito inabalável pelas metas planejadas",
    ],
    blindSpots: [
      "Rigidez excessiva e dificuldade de celebrar conquistas intermediárias",
      "Austeridade extrema que pode passar imagem de frieza ou medo oculto de perdas",
    ],
    antidote: "Institua recompensas programadas a cada etapa concluída; lembre-se de que a leveza e o descanso alimentam a produtividade duradoura.",
    careerAndBusiness: {
      bestFields: ["Gestão corporativa e diretoria", "Mercado de capitais e investimentos", "Engenharia civil e infraestrutura", "Governo e instituições públicas", "Consultoria estratégica"],
      leadershipStyle: "Exigente, exemplar e justo; lidera pelo mérito e pela serenidade nos momentos de crise.",
      negotiationPower: "Sereno, firme e imperturbável; nunca fecha acordos apressados e protege cada cláusula com rigor.",
    },
    compatiblePartners: [
      { sign: "Virgem", synergy: "Planejamento meticuloso executado com eficiência cirúrgica; excelência garantida." },
      { sign: "Touro", synergy: "A dupla mais sólida do zodíaco para construção e blindagem de patrimônio familiar." },
      { sign: "Escorpião", synergy: "Estratégia implacável para reinar em mercados competitivos com disciplina férrea." },
    ],
    prosperityRitual: {
      title: "Reconhecimento da Montanha",
      duration: "3 minutos",
      practice: "Olhe para trás e liste mentalmente 3 obstáculos difíceis que você já superou no trabalho, reconhecendo sua própria competência consolidada.",
    },
  },
  {
    id: "aquario",
    name: "Aquário",
    glyph: "♒",
    period: "20 jan - 18 fev",
    element: "ar",
    elementLabel: "Ar",
    modality: "Fixo",
    rulingPlanet: "Urano / Saturno",
    symbol: "O Aguadeiro",
    archetype: "O Inovador Disruptivo",
    prosperityMantra: "Minha originalidade gera valor para o coletivo. Eu crio o futuro com autonomia e visão pioneira.",
    wealthMindset: "Aquário prospera quebrando paradigmas obsoletos, criando soluções que escalam para comunidades e antecipando tecnologias e tendências que o mercado tradicional ainda não percebeu.",
    strengths: [
      "Capacidade ímpar de inovar e desatar nós estruturais com soluções fora da caixa",
      "Forte apelo para negócios baseados em comunidade, tecnologia e redes",
      "Independência intelectual que não se curva a manadas ou modismos financeiros",
    ],
    blindSpots: [
      "Aversão rebelde a rotinas financeiras básicas por achá-las 'tediosas'",
      "Foco excessivo na teoria ou no ideal social esquecendo a rentabilidade imediata",
    ],
    antidote: "Automatize ao máximo pagamentos e investimentos com tecnologia; garanta que suas ideias revolucionárias tenham modelo de monetização claro.",
    careerAndBusiness: {
      bestFields: ["Tecnologia e inteligência artificial", "Startups e ecossistemas de inovação", "Ciência e pesquisa de ponta", "Energias renováveis", "Gestão de comunidades e causas coletivas"],
      leadershipStyle: "Horizontal, descentralizado e focado em dar autonomia para os talentos brilharem.",
      negotiationPower: "Apresenta propostas revolucionárias e termos inovadores que mudam as regras do jogo a seu favor.",
    },
    compatiblePartners: [
      { sign: "Gêmeos", synergy: "Velocidade de raciocínio e inteligência de rede para criar ecossistemas lucrativos." },
      { sign: "Libra", synergy: "Refinamento e harmonia para dar forma estética e aceitação comercial às ideias ousadas." },
      { sign: "Sagitário", synergy: "Visão sem limites e propósito global para transformar ideias em movimentos gigantes." },
    ],
    prosperityRitual: {
      title: "Desconexão Visionária",
      duration: "5 minutos",
      practice: "Afaste-se de todas as telas, feche os olhos e visualize como sua habilidade única pode resolver a dor de mil pessoas nos próximos anos.",
    },
  },
  {
    id: "peixes",
    name: "Peixes",
    glyph: "♓",
    period: "19 fev - 20 mar",
    element: "agua",
    elementLabel: "Água",
    modality: "Mutável",
    rulingPlanet: "Netuno / Júpiter",
    symbol: "Os Dois Peixes",
    archetype: "O Criador Intuitivo",
    prosperityMantra: "Minha sensibilidade é fonte de sabedoria e abundância. Eu materializo meus sonhos com intenção e limites saudáveis.",
    wealthMindset: "Peixes prospera pela imaginação sem fronteiras, empatia profunda e sensibilidade estética. Quando aprende a colocar limites no mundo material, atrai recursos através do poder criativo e do propósito verdadeiro.",
    strengths: [
      "Criatividade extraordinária que gera conceitos, marcas e artes únicas",
      "Empatia profunda para entender as dores mais sutis do cliente ou público",
      "Intuição aguçada que percebe marés favoráveis antes de qualquer gráfico",
    ],
    blindSpots: [
      "Evitar encarar extratos e finanças por medo de ansiedade ou confronto com a realidade",
      "Dificuldade de dizer 'não' para empréstimos a conhecidos ou cobranças justas",
    ],
    antidote: "Trate o dinheiro como energia sagrada de sustento da sua arte e vida: encare suas contas como quem rega um jardim precioso.",
    careerAndBusiness: {
      bestFields: ["Artes, música e cinema", "Design de experiências imersivas", "Terapias holísticas e saúde mental", "Moda sensorial e fotografia", "Filantropia e projetos com propósito"],
      leadershipStyle: "Inspirador, compassivo e focado em dar sentido humano e espiritual ao trabalho diário.",
      negotiationPower: "Usa charme e autenticidade desarmante; gera conexão emocional genuína que facilita acordos.",
    },
    compatiblePartners: [
      { sign: "Escorpião", synergy: "Força emocional inabalável que ancora a sensibilidade pisciana em resultados concretos." },
      { sign: "Câncer", synergy: "Compreensão mútua profunda para criar marcas acolhedoras de extrema lealdade." },
      { sign: "Touro", synergy: "Touro dá estrutura física e gestão financeira para os sonhos piscianos florescerem." },
    ],
    prosperityRitual: {
      title: "Fluidez com Limites Sagrados",
      duration: "4 minutos",
      practice: "Beba um copo de água com calma, mentalizando que a abundância flui através de você e que definir limites claros é um ato de amor próprio.",
    },
  },
];

export function getSignByName(name: string): SignData {
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const found = SIGNS.find((s) => s.id === normalized || s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalized);
  return found ?? SIGNS[0];
}

function hashString(seed: string): number {
  let value = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

const DAILY_ENERGY_POOL = [
  "Momento favorável para consolidar acordos e organizar o fluxo de receitas.",
  "Sua energia pioneira atrai oportunidades quando você simplifica o discurso.",
  "Excelente dia para cortar desperdícios sutis e blindar seu orçamento.",
  "A clareza nas conversas hoje destravará uma decisão profissional que estava parada.",
  "Confie no seu faro estratégico: uma pequena oportunidade pode virar um grande projeto.",
  "Sua consistência silenciosa está prestes a render frutos visíveis nesta fase.",
  "Dia ideal para alinhar parcerias e revisar termos contratuais com serenidade.",
  "Invista tempo no aprimoramento de uma habilidade chave; o mercado valorizará em breve.",
];

const DAILY_ACTION_POOL = [
  "Revise suas 3 maiores despesas do mês e identifique onde otimizar.",
  "Faça um contato comercial importante antes do meio-dia.",
  "Bloqueie 30 minutos na agenda para focar exclusivamente na sua meta principal.",
  "Organize um arquivo ou planilha financeira que estava esquecido.",
  "Pratique o silêncio estratégico: ouça mais do que fale em reuniões hoje.",
  "Comemore uma pequena vitória financeira desta semana para consolidar a mente de abundância.",
];

export function getDailySignReading(signName: string, dayKey: string) {
  const sign = getSignByName(signName);
  const seed = `${dayKey}|${sign.id}|prosperity`;
  const energyIndex = hashString(`energy|${seed}`) % DAILY_ENERGY_POOL.length;
  const actionIndex = hashString(`action|${seed}`) % DAILY_ACTION_POOL.length;

  return {
    energy: DAILY_ENERGY_POOL[energyIndex],
    action: DAILY_ACTION_POOL[actionIndex],
    mantra: sign.prosperityMantra,
  };
}
