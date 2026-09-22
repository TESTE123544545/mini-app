import { daysSince } from "./daily";

export type TrailDay = {
  day: number;
  title: string;
  message: string;
  practice: string;
  reflection: string;
};

export type Trail = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  length: number;
  premium: boolean;
  category: string;
  days: TrailDay[];
};

export type TrailProgress = { trailId: string; startedAt: string; completedDays: number[] };

const disciplina7: TrailDay[] = [
  { day: 1, title: "Escolha uma coisa só", message: "Disciplina não nasce de força de vontade infinita — nasce de reduzir o número de decisões que você precisa tomar todo dia.", practice: "Escolha UM hábito que você quer sustentar esta semana. Só um. Escreva o nome dele em algum lugar visível.", reflection: "Por que esse hábito específico importa pra você agora?" },
  { day: 2, title: "Prepare o ambiente", message: "É mais fácil manter um hábito quando o caminho até ele está livre de obstáculos.", practice: "Ajuste um detalhe do seu ambiente que torne o hábito escolhido mais fácil de acontecer amanhã.", reflection: "O que normalmente te impede de começar?" },
  { day: 3, title: "Cumpra uma promessa pequena", message: "Confiança em si mesmo se constrói do mesmo jeito que confiança em outra pessoa: cumprindo o combinado, mesmo nas coisas pequenas.", practice: "Faça a versão mínima do seu hábito hoje — mesmo que pareça pequeno demais pra contar.", reflection: "Como foi cumprir o combinado com você mesmo hoje?" },
  { day: 4, title: "Termine algo pela metade", message: "Coisas inacabadas continuam pesando, mesmo fora de vista. Fechar um ciclo libera espaço mental pro que vem a seguir.", practice: "Escolha uma tarefa parada há dias e leve ela até o fim — ou decida conscientemente abandoná-la.", reflection: "O que ficar inacabado estava te custando?" },
  { day: 5, title: "Diga não a uma distração", message: "Disciplina também é proteção: dizer não pro que rouba sua atenção é dizer sim pro que você escolheu construir.", practice: "Identifique a distração mais comum do seu dia e recuse ela conscientemente pelo menos uma vez hoje.", reflection: "O que essa distração te dá que o hábito escolhido não dá tão rápido?" },
  { day: 6, title: "Repita sem precisar de motivação", message: "No sexto dia a novidade já passou — e é aqui que a disciplina de verdade aparece: fazer mesmo sem vontade.", practice: "Cumpra o hábito hoje mesmo que não esteja com vontade nenhuma. Só a versão mínima já conta.", reflection: "O que mudou entre o primeiro dia e hoje?" },
  { day: 7, title: "Reconheça o que você sustentou", message: "Sete dias não mudam uma vida inteira, mas mudam sua ideia sobre o que você é capaz de manter.", practice: "Releia o que você escreveu no dia 1 e escreva uma frase sobre o que essa semana provou pra você.", reflection: "Qual desses sete dias foi o mais difícil, e por quê?" },
];

const constancia21: TrailDay[] = [
  { day: 1, title: "Defina o que é \"feito\"", message: "Constância trava quando a meta é vaga demais pra saber se você cumpriu ou não.", practice: "Escreva uma definição clara e pequena do que conta como \"cumprido\" no seu objetivo desta jornada.", reflection: "O que te impediu de definir isso antes?" },
  { day: 2, title: "O menor tamanho possível", message: "Toda meta grande tem uma versão de dois minutos escondida dentro dela.", practice: "Identifique a versão mínima do seu objetivo — aquela que você consegue cumprir mesmo em um dia ruim.", reflection: "Qual é o seu \"dia ruim\" típico, e o que ele geralmente tira de você?" },
  { day: 3, title: "Gatilho fixo", message: "Hábitos que dependem de lembrar são hábitos que falham. Hábitos presos a um gatilho já existente sobrevivem.", practice: "Escolha algo que você já faz todo dia e encaixe seu hábito logo depois dele.", reflection: "A que horário do dia sua energia costuma estar mais disponível?" },
  { day: 4, title: "Remova um obstáculo", message: "Às vezes constância não é sobre motivação — é sobre quantos passos existem entre você e a ação.", practice: "Elimine um passo desnecessário entre você e o seu hábito.", reflection: "Quantos passos existiam antes de hoje?" },
  { day: 5, title: "Registre sem julgar", message: "O que não é observado tende a ser esquecido — e esquecido, abandonado.", practice: "Anote em algum lugar se você cumpriu ou não o combinado hoje. Sem se cobrar, só registre.", reflection: "O que os últimos dias registrados mostram sobre seu padrão?" },
  { day: 6, title: "Avise alguém", message: "Compromissos ficam mais reais quando saem da sua cabeça e chegam à boca.", practice: "Conte pra alguém o que você está tentando sustentar nesses 21 dias.", reflection: "Como foi falar isso em voz alta?" },
  { day: 7, title: "Feche a primeira semana", message: "A primeira semana testa se a estrutura funciona. A partir daqui, o teste passa a ser outro: sustentar sem novidade.", practice: "Reveja os últimos 6 dias e ajuste um detalhe da estrutura antes de seguir.", reflection: "O que você mudaria na forma como organizou essa semana?" },
  { day: 8, title: "O dia sem vontade", message: "A disciplina que sobrevive é a que não depende de estar inspirado.", practice: "Cumpra hoje mesmo sem vontade — na versão mínima que você definiu no dia 2.", reflection: "O que você sentiu antes de começar, e isso mudou depois?" },
  { day: 9, title: "Falhar sem desistir", message: "Um dia perdido não encerra um ciclo. Dois dias seguidos, geralmente, encerram.", practice: "Se ontem falhou, retome hoje sem tentar compensar o que passou.", reflection: "O que normalmente vem depois de uma falha pra você: retomada ou desistência?" },
  { day: 10, title: "Reduza a meta, não a frequência", message: "Quando a semana aperta, é melhor fazer menos todo dia do que fazer tudo só quando dá.", practice: "Se hoje está difícil, corte o tamanho da tarefa pela metade — mas não pule o dia.", reflection: "O que está competindo por espaço com o seu hábito esta semana?" },
  { day: 11, title: "Observe o efeito, não só o esforço", message: "É fácil focar só no que custa fazer e esquecer o que já mudou desde o início.", practice: "Escreva uma diferença concreta entre como você começou e como está agora.", reflection: "Essa diferença já era visível pra você antes de parar pra procurar?" },
  { day: 12, title: "Proteja o horário", message: "O que não tem hora marcada compete com tudo o mais que aparece no dia.", practice: "Marque um horário específico pro seu hábito amanhã, como se fosse um compromisso com outra pessoa.", reflection: "O que normalmente invade esse horário quando ele não está protegido?" },
  { day: 13, title: "Ignore o resultado hoje", message: "Nos dias de resistência, o objetivo não é o resultado — é só não quebrar a corrente.", practice: "Cumpra o hábito hoje sem avaliar se ficou bom. Só cumpra.", reflection: "Avaliar demais está ajudando ou atrapalhando sua constância?" },
  { day: 14, title: "Feche a segunda semana", message: "Quatorze dias é o ponto em que muita gente desiste — não porque piorou, mas porque a novidade virou rotina comum.", practice: "Releia os dias 8 a 14 e identifique o dia mais difícil dessa semana.", reflection: "O que te fez continuar depois desse dia difícil?" },
  { day: 15, title: "Aumente um grau", message: "Depois que a base segura, dá pra pedir um pouco mais de si mesmo sem quebrar a estrutura.", practice: "Se a base está firme, aumente levemente a versão mínima que você definiu no início.", reflection: "Você se sente pronto pra esse próximo grau, ou ainda precisa da versão mínima?" },
  { day: 16, title: "Ensine o que aprendeu", message: "Explicar pra alguém o que você está fazendo organiza o que ainda estava confuso pra você mesmo.", practice: "Explique pra alguém, em poucas frases, o que mudou em você nesses 16 dias.", reflection: "O que ficou mais claro pra você ao tentar explicar isso?" },
  { day: 17, title: "Antecipe a recaída", message: "Toda constância de longo prazo é testada por um evento fora do controle — viagem, imprevisto, cansaço.", practice: "Planeje agora como você vai lidar com o hábito no próximo dia difícil previsível.", reflection: "Quais são os momentos em que você mais costuma abandonar hábitos?" },
  { day: 18, title: "Solte o que não serve mais", message: "Constância também é sobre deixar de fazer o que não ajuda, não só sobre acumular novas tarefas.", practice: "Identifique algo que você pode parar de fazer pra abrir espaço pro que importa.", reflection: "O que você estava fazendo só por hábito, sem perguntar se ainda fazia sentido?" },
  { day: 19, title: "Comemore sem exagero", message: "Reconhecer o progresso não precisa ser grandioso — só precisa ser real.", practice: "Faça algo pequeno hoje só para reconhecer que você chegou até aqui.", reflection: "Quando foi a última vez que você comemorou algo por si mesmo, sem esperar que alguém notasse?" },
  { day: 20, title: "Projete depois do dia 21", message: "O objetivo de 21 dias nunca foi o número 21 — foi construir algo que continua sem precisar de uma contagem.", practice: "Escreva como esse hábito vai continuar depois que a trilha terminar, sem o lembrete diário do app.", reflection: "O que muda se ninguém mais estiver contando os dias por você?" },
  { day: 21, title: "Feche o ciclo", message: "Você não está mais tentando construir um hábito — está observando um que já existe.", practice: "Releia o que escreveu no dia 1 e escreva o que você diria pra essa versão sua de 21 dias atrás.", reflection: "O que você quer que continue exatamente do jeito que está agora?" },
];

const carreira7: TrailDay[] = [
  { day: 1, title: "Mapeie onde você está", message: "Antes de decidir pra onde ir, vale entender com clareza onde você está agora — sem otimismo nem autocrítica exagerada.", practice: "Liste três conquistas reais do último ano de trabalho, por menores que pareçam.", reflection: "O que essas três conquistas têm em comum?" },
  { day: 2, title: "Nomeie a habilidade que falta", message: "Quase todo próximo passo de carreira depende de uma habilidade específica que ainda não está madura.", practice: "Identifique a habilidade que mais destravaria sua próxima oportunidade.", reflection: "O que te impediu de desenvolver essa habilidade até agora?" },
  { day: 3, title: "Reative uma conexão", message: "Oportunidades de carreira raramente vêm de estranhos — vêm de gente que já sabe o que você faz.", practice: "Envie uma mensagem pra alguém que já trabalhou com você, só pra reconectar, sem pedir nada.", reflection: "Por que essa pessoa específica veio à mente?" },
  { day: 4, title: "Atualize sua vitrine", message: "Seu perfil profissional é, muitas vezes, a primeira e única impressão que alguém vai ter de você.", practice: "Atualize uma linha do seu currículo ou perfil profissional com algo recente e concreto.", reflection: "O que você faria diferente se soubesse que alguém decisivo veria seu perfil amanhã?" },
  { day: 5, title: "Peça um retorno honesto", message: "É difícil enxergar seus próprios pontos cegos de dentro — alguém de fora enxerga em segundos.", practice: "Peça a alguém em quem confia um retorno sincero sobre seu trabalho recente.", reflection: "Qual retorno você tem medo de ouvir, e por quê?" },
  { day: 6, title: "Proteja um bloco de trabalho importante", message: "O trabalho que mais importa raramente é o mais urgente — e por isso é o que mais perde espaço na agenda.", practice: "Bloqueie 30 minutos na agenda só pra um trabalho que importa de verdade, não pro que é só urgente.", reflection: "O que normalmente rouba esse tempo antes que você perceba?" },
  { day: 7, title: "Decida o próximo passo", message: "Uma semana de atenção à carreira só vale a pena se terminar em uma decisão, não só em reflexão.", practice: "Escolha uma ação concreta pra dar nos próximos 30 dias e escreva uma data pra ela.", reflection: "O que te impediu de tomar essa decisão antes desta semana?" },
];

export const trails: readonly Trail[] = [
  { id: "disciplina-7", title: "7 dias para fortalecer sua disciplina", subtitle: "Jornada introdutória · grátis", description: "Uma sequência curta pra sair da intenção e entrar na ação, um passo pequeno por dia.", length: 7, premium: false, category: "Disciplina", days: disciplina7 },
  { id: "constancia-21", title: "21 dias de constância", subtitle: "Jornada completa · Premium", description: "Três semanas com estrutura: fundação, resistência e integração — pensada pra hábitos que realmente ficam.", length: 21, premium: true, category: "Disciplina", days: constancia21 },
  { id: "carreira-7", title: "Jornada da carreira", subtitle: "7 dias · Premium", description: "Uma semana de atenção real à sua trajetória profissional, com ações concretas, não só reflexão.", length: 7, premium: true, category: "Carreira", days: carreira7 },
];

export function findTrail(trailId: string | undefined) {
  return trails.find((trail) => trail.id === trailId);
}

/** Days unlock one per calendar day since the trail started; day 1 is unlocked on the start day itself. */
export function unlockedDayCount(trail: Trail, startedAt: string) {
  // Parsed as a local date (not UTC) — "YYYY-MM-DD" alone would shift a day west of UTC.
  const started = new Date(`${startedAt}T00:00:00`);
  if (Number.isNaN(started.getTime())) return 1;
  const elapsed = daysSince(started);
  return Math.min(trail.length, Math.max(1, elapsed + 1));
}

export function trailStatus(trail: Trail, progress: TrailProgress | null) {
  if (!progress || progress.trailId !== trail.id) return { active: false, unlocked: 0, completed: 0, currentDay: 1, finished: false };
  const unlocked = unlockedDayCount(trail, progress.startedAt);
  const completed = progress.completedDays.filter((day) => day <= trail.length).length;
  const currentDay = Math.min(trail.length, progress.completedDays.length ? Math.max(unlocked, Math.min(trail.length, Math.max(...progress.completedDays) + 1)) : unlocked);
  return { active: true, unlocked, completed, currentDay, finished: completed >= trail.length };
}
