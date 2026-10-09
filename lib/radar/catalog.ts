import type { Level, Opportunity, RadarAnswers, SellModel } from "@/lib/radar/types";

/**
 * The built-in catalogue: used only when the AI is unavailable, so the Radar still answers. Each entry is a
 * real, common way small sellers earn in Brazil, matched to the person's words by keywords. Prices are
 * ranges that vary a lot by city and by skill; they are starting points to test, not forecasts.
 */
type Entry = {
  id: string; title: string; tags: string[]; models: SellModel[]; shows: boolean;
  what: string; customer: string; problem: string; channels: string[]; first: string;
  price: [number, number]; cost: [number, number]; setup: [number, number]; sales: [number, number];
  hoursPerSale: number; days: number; levels: [Level, Level, Level, Level, Level]; // difficulty, speed, demand, competition, scale
  risks: string[]; resources: string[];
};

const CATALOG: Entry[] = [
  { id: "artes-negocios", title: "Artes e posts para pequenos negócios locais", tags: ["desenho", "design", "arte", "canva", "photoshop", "criativ", "ilustra", "pintura"], models: ["servicos", "freelancer", "qualquer"], shows: false,
    what: "Pacote de artes para Instagram (feed e stories) prontas para postar", customer: "Lojas, salões, confeitarias e prestadores da sua cidade que postam sem identidade visual", problem: "Não têm tempo nem habilidade para deixar o perfil profissional",
    channels: ["Instagram", "WhatsApp", "Empresas locais"], first: "Pacote de 5 artes por um preço de lançamento para os 3 primeiros clientes",
    price: [60, 250], cost: [0, 10], setup: [0, 60], sales: [3, 15], hoursPerSale: 3, days: 3, levels: [2, 4, 4, 4, 3], risks: ["Muita concorrência: o diferencial precisa ser um estilo e um nicho", "Clientes que pedem muitas revisões"], resources: ["Celular ou computador", "Canva ou programa de edição", "Portfólio com 3 a 5 exemplos"] },
  { id: "video-curto", title: "Edição de vídeos curtos para criadores e lojas", tags: ["video", "vídeo", "edição", "editar", "reels", "capcut", "filmagem", "youtube", "tiktok"], models: ["servicos", "freelancer", "conteudo", "qualquer"], shows: false,
    what: "Edição de reels e vídeos curtos com legenda e cortes", customer: "Criadores pequenos, lojistas e profissionais liberais que gravam mas não editam", problem: "Gravam o material e travam na edição",
    channels: ["Instagram", "Comunidades", "Plataformas de freelancers"], first: "Editar 2 vídeos grátis de um cliente em troca de depoimento e depois ofertar um pacote mensal",
    price: [40, 180], cost: [0, 10], setup: [0, 50], sales: [4, 20], hoursPerSale: 2.5, days: 5, levels: [3, 3, 4, 4, 4], risks: ["Exige aprender o ritmo de edição que prende a atenção", "Prazos apertados"], resources: ["Celular ou computador", "Aplicativo de edição", "Dois vídeos de exemplo"] },
  { id: "redes-sociais", title: "Gestão de Instagram para negócios da sua região", tags: ["instagram", "redes", "social", "marketing", "comunica", "publicidade", "post", "conteúdo"], models: ["servicos", "freelancer", "conteudo", "qualquer"], shows: false,
    what: "Planejamento e publicação de 12 posts por mês", customer: "Comerciantes e profissionais que sabem que precisam postar mas não têm rotina", problem: "Perfil parado, sem constância e sem ideia do que postar",
    channels: ["WhatsApp", "Empresas locais", "Networking", "Indicação"], first: "Proposta de um mês de teste com calendário de 12 posts a preço reduzido",
    price: [250, 900], cost: [0, 30], setup: [0, 80], sales: [1, 5], hoursPerSale: 14, days: 7, levels: [3, 3, 4, 4, 4], risks: ["Cliente espera resultado de vendas que você não controla", "Recorrência depende de entregar toda semana"], resources: ["Celular", "Ferramenta de agendamento gratuita", "Modelo de proposta"] },
  { id: "aulas", title: "Aulas particulares ou reforço de um assunto que você domina", tags: ["ensin", "aula", "professor", "matem", "ingl", "idioma", "estud", "reforço", "português", "explicar"], models: ["conhecimento", "servicos", "freelancer", "qualquer"], shows: true,
    what: "Aulas de reforço individuais ou em pequenos grupos", customer: "Estudantes e pais da sua região, ou adultos aprendendo do zero", problem: "Dificuldade em uma matéria e falta de alguém que explique com paciência",
    channels: ["WhatsApp", "Indicação", "Comunidades", "Instagram"], first: "Aula experimental de 30 minutos e pacote de 4 aulas",
    price: [40, 120], cost: [0, 5], setup: [0, 40], sales: [4, 24], hoursPerSale: 1.2, days: 4, levels: [2, 4, 4, 3, 3], risks: ["Agenda fixa limita o crescimento", "Alunos que faltam"], resources: ["Celular ou computador", "Material de apoio próprio", "Horários definidos"] },
  { id: "doces-encomenda", title: "Doces e salgados por encomenda para a vizinhança", tags: ["cozinh", "doce", "bolo", "confeit", "salgad", "culin", "padaria", "receita", "comida"], models: ["produtos", "qualquer"], shows: true,
    what: "Kits de doces ou salgados para aniversários e reuniões", customer: "Moradores do bairro e pequenos escritórios", problem: "Falta de tempo para preparar e vontade de algo caseiro e bem feito",
    channels: ["WhatsApp", "Instagram", "Indicação", "Comunidades"], first: "Kit teste com preço de lançamento para vizinhos e grupos do bairro",
    price: [60, 180], cost: [25, 80], setup: [50, 300], sales: [4, 20], hoursPerSale: 3, days: 5, levels: [3, 4, 4, 3, 3], risks: ["Regras sanitárias locais para venda de alimentos", "Custo de ingredientes oscila"], resources: ["Cozinha equipada", "Embalagens", "Fotos boas do produto"] },
  { id: "artesanato", title: "Artesanato personalizado sob encomenda", tags: ["artesan", "crochê", "croche", "bordad", "costur", "decora", "feito à mão", "madeira", "biju"], models: ["produtos", "qualquer"], shows: true,
    what: "Peças personalizadas (presentes, lembrancinhas ou decoração) feitas a pedido", customer: "Pessoas que procuram presentes únicos e festas com tema", problem: "Presentes comprados em loja são todos iguais",
    channels: ["Instagram", "WhatsApp", "Marketplace", "Comunidades"], first: "Coleção de 3 modelos para encomenda com prazo claro",
    price: [35, 150], cost: [10, 50], setup: [40, 250], sales: [4, 25], hoursPerSale: 2.5, days: 6, levels: [3, 3, 3, 3, 2], risks: ["Tempo de produção limita o volume", "Custo de materiais"], resources: ["Materiais básicos", "Fotos do trabalho", "Perfil no Instagram"] },
  { id: "redacao", title: "Textos e legendas para marcas e profissionais", tags: ["escrev", "texto", "redação", "redacao", "revis", "legenda", "blog", "copy", "poesia", "livros"], models: ["servicos", "freelancer", "conteudo", "qualquer"], shows: false,
    what: "Legendas, textos de site e e-mails prontos para usar", customer: "Profissionais liberais e pequenas empresas que sabem o que fazem mas não sabem explicar", problem: "Textos fracos que não convencem o cliente",
    channels: ["LinkedIn", "Plataformas de freelancers", "Networking", "Instagram"], first: "Reescrever a apresentação de um perfil por um preço de entrada e propor um pacote",
    price: [40, 300], cost: [0, 5], setup: [0, 30], sales: [3, 12], hoursPerSale: 2.5, days: 3, levels: [2, 3, 3, 4, 3], risks: ["Difícil provar valor sem portfólio", "Concorrência de ferramentas automáticas"], resources: ["Computador ou celular", "3 exemplos de texto", "Modelo de proposta"] },
  { id: "assistente-virtual", title: "Assistente virtual e organização de planilhas para pequenos negócios", tags: ["planilha", "excel", "organiza", "administra", "atendimento", "agenda", "financeiro", "secret"], models: ["servicos", "freelancer", "qualquer"], shows: false,
    what: "Organização de agenda, atendimento e controle financeiro simples", customer: "Autônomos e donos de pequenos negócios sobrecarregados", problem: "Perdem tempo e dinheiro com a desorganização",
    channels: ["LinkedIn", "WhatsApp", "Plataformas de freelancers", "Indicação"], first: "Diagnóstico gratuito de 20 minutos e proposta de um mês de teste",
    price: [300, 1200], cost: [0, 20], setup: [0, 50], sales: [1, 4], hoursPerSale: 25, days: 7, levels: [2, 3, 4, 3, 3], risks: ["Exige confiança do cliente", "Escopo que cresce sem acordo"], resources: ["Computador", "Planilhas modelo", "Contrato simples"] },
  { id: "fotografia", title: "Fotos de produtos e eventos pequenos com o celular", tags: ["foto", "câmera", "camera", "imagem", "retrato", "evento", "ensaio"], models: ["servicos", "freelancer", "qualquer"], shows: false,
    what: "Sessão rápida de fotos de produtos para loja e catálogo", customer: "Lojistas, artesãos e restaurantes locais", problem: "Fotos ruins fazem o produto parecer pior do que é",
    channels: ["Instagram", "WhatsApp", "Empresas locais", "Marketplace"], first: "Sessão de 10 fotos tratadas com preço de lançamento",
    price: [80, 350], cost: [0, 20], setup: [0, 120], sales: [2, 10], hoursPerSale: 3.5, days: 5, levels: [3, 3, 4, 4, 3], risks: ["Equipamento limita a qualidade", "Depende de agenda do cliente"], resources: ["Celular com boa câmera", "Fundo e luz simples", "Portfólio com exemplos"] },
  { id: "ugc", title: "Criação de vídeos de produto (UGC) para pequenas marcas", tags: ["aparec", "tiktok", "ugc", "review", "vídeo", "video", "carisma", "comunica", "influen"], models: ["conteudo", "servicos", "comissao", "qualquer"], shows: true,
    what: "Vídeos curtos mostrando e opinando sobre produtos, no formato dos anúncios", customer: "Marcas pequenas e lojas virtuais que precisam de vídeos com gente de verdade", problem: "Anúncios com cara de anúncio não convertem",
    channels: ["TikTok", "Instagram", "Plataformas de freelancers", "Comunidades"], first: "Vídeo teste gratuito para uma marca pequena e proposta de pacote de 3 vídeos",
    price: [80, 300], cost: [0, 15], setup: [0, 60], sales: [3, 12], hoursPerSale: 3, days: 6, levels: [3, 3, 4, 4, 4], risks: ["Exige aparecer", "Marcas podem demorar a pagar"], resources: ["Celular", "Boa luz", "Portfólio com 2 vídeos"] },
  { id: "consultoria-nicho", title: "Mentoria curta sobre o assunto que você mais domina", tags: ["experiência", "especialista", "carreira", "mentoria", "consult", "dominio", "domínio", "anos de"], models: ["conhecimento", "servicos", "qualquer"], shows: true,
    what: "Sessões de 1 hora para resolver uma dúvida específica de quem está começando", customer: "Pessoas que estão um passo atrás de você no mesmo caminho", problem: "Perdem meses tentando descobrir sozinhas o que você já sabe",
    channels: ["Instagram", "LinkedIn", "Comunidades", "Indicação"], first: "Sessão de 30 minutos por preço simbólico e depois pacote de 3 sessões",
    price: [60, 250], cost: [0, 10], setup: [0, 40], sales: [3, 15], hoursPerSale: 1.3, days: 4, levels: [3, 3, 3, 3, 4], risks: ["Precisa de credibilidade percebida", "Não substitui profissão regulamentada"], resources: ["Celular ou computador", "Roteiro da sessão", "Prova do que você já fez"] },
  { id: "beleza-domicilio", title: "Atendimento de beleza em domicílio", tags: ["maquia", "unha", "cabelo", "sobrancelha", "beleza", "estética", "manicure", "trança"], models: ["servicos", "qualquer"], shows: true,
    what: "Atendimento marcado, no horário da cliente, em casa", customer: "Mulheres do bairro que preferem praticidade", problem: "Falta de tempo para ir ao salão",
    channels: ["WhatsApp", "Instagram", "Indicação", "Comunidades"], first: "Pacote de 3 atendimentos com desconto para as primeiras clientes",
    price: [40, 160], cost: [5, 30], setup: [50, 400], sales: [6, 30], hoursPerSale: 1.8, days: 5, levels: [2, 4, 4, 4, 3], risks: ["Exige habilidade comprovada", "Deslocamento consome tempo"], resources: ["Materiais profissionais", "Portfólio de fotos", "Agenda"] },
  { id: "pets", title: "Passeio e cuidado de pets na vizinhança", tags: ["pet", "cachorro", "cão", "gato", "animal", "animais"], models: ["servicos", "qualquer"], shows: true,
    what: "Passeios e visitas para alimentar e brincar enquanto os tutores trabalham", customer: "Tutores que passam o dia fora ou viajam", problem: "Medo de deixar o pet sozinho",
    channels: ["WhatsApp", "Comunidades", "Indicação", "Instagram"], first: "Passeio experimental com apresentação e termo de responsabilidade",
    price: [25, 70], cost: [0, 5], setup: [0, 80], sales: [10, 40], hoursPerSale: 1, days: 3, levels: [2, 4, 3, 3, 2], risks: ["Responsabilidade com animais", "Rotina fixa"], resources: ["Guia e sacos", "Disponibilidade de horário", "Fotos e referências"] },
  { id: "treino-online", title: "Treino ou acompanhamento de hábitos online", tags: ["treino", "fitness", "academia", "saúde", "emagrec", "yoga", "pilates", "corrida"], models: ["conhecimento", "servicos", "qualquer"], shows: true,
    what: "Planilha de treino mensal e acompanhamento por WhatsApp", customer: "Quem quer começar a se exercitar e não sabe por onde", problem: "Falta de orientação e constância",
    channels: ["Instagram", "WhatsApp", "Indicação", "Comunidades"], first: "Mês experimental com 3 vagas e depoimentos",
    price: [90, 250], cost: [0, 10], setup: [0, 60], sales: [3, 15], hoursPerSale: 4, days: 6, levels: [3, 3, 4, 4, 4], risks: ["Exige formação adequada para orientar", "Resultados variam muito de pessoa para pessoa"], resources: ["Celular", "Modelos de treino", "Registro profissional quando exigido"] },
  { id: "tecnologia-reparos", title: "Suporte técnico e ajuda com celular e computador", tags: ["tecnolog", "inform", "computador", "celular", "programa", "suporte", "site", "wordpress"], models: ["servicos", "freelancer", "qualquer"], shows: false,
    what: "Atendimento rápido para lentidão, configuração e backup", customer: "Pessoas e pequenos escritórios sem quem os ajude", problem: "Equipamento lento ou com problema e nenhum técnico de confiança",
    channels: ["WhatsApp", "Indicação", "Empresas locais", "Comunidades"], first: "Check-up gratuito de 15 minutos e orçamento do serviço",
    price: [50, 200], cost: [0, 15], setup: [0, 100], sales: [4, 20], hoursPerSale: 1.5, days: 4, levels: [3, 4, 4, 3, 3], risks: ["Responsabilidade sobre dados do cliente", "Atualização constante"], resources: ["Computador", "Ferramentas gratuitas", "Termo de serviço"] },
];

const strip = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** The five best matches, with this person's own words woven into the summary. */
export function catalogOpportunities(answers: RadarAnswers): Opportunity[] {
  const haystack = strip([answers.likes, answers.topics, answers.skills, answers.helpWith, answers.niche, answers.equipment].join(" "));
  const scored = CATALOG.map((entry) => {
    const hits = entry.tags.filter((tag) => haystack.includes(strip(tag))).length;
    const modelHit = answers.model === "qualquer" || entry.models.includes(answers.model) ? 1 : 0;
    const visibilityOk = answers.visibility === "bastidores" && entry.shows ? -6 : answers.visibility === "aparecer" && entry.shows ? 0.5 : 0;
    return { entry, hits, value: hits * 3 + modelHit * 2 + visibilityOk };
  }).sort((a, b) => b.value - a.value);

  return scored.slice(0, 5).map(({ entry, hits }): Opportunity => {
    const fit = Math.max(2, Math.min(5, 2 + hits + (answers.model !== "qualquer" && entry.models.includes(answers.model) ? 1 : 0))) as Level;
    const lcFirst = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);
    const using = answers.equipment.trim() ? `usando ${answers.equipment.trim().slice(0, 60)}` : "com o que você já tem";
    const where = answers.place.trim() ? ` em ${answers.place.trim().slice(0, 50)}` : "";
    return {
      id: entry.id,
      title: entry.title,
      summary: `Com cerca de ${answers.hoursPerDay} h livres por dia, ${using}, você pode oferecer: ${lcFirst(entry.what)}${where}. Público: ${lcFirst(entry.customer)}.`,
      whatToSell: entry.what,
      targetCustomer: entry.customer,
      problemSolved: entry.problem,
      channels: entry.channels,
      firstOffer: entry.first,
      price: { min: entry.price[0], max: entry.price[1] },
      costPerSale: { min: entry.cost[0], max: entry.cost[1] },
      setupCost: { min: entry.setup[0], max: entry.setup[1] },
      salesPerMonth: { min: entry.sales[0], max: entry.sales[1] },
      hoursPerSale: entry.hoursPerSale,
      daysToStart: entry.days,
      fit,
      difficulty: entry.levels[0], speed: entry.levels[1], demand: entry.levels[2], competition: entry.levels[3], scale: entry.levels[4],
      risks: entry.risks,
      resources: entry.resources,
    };
  });
}
