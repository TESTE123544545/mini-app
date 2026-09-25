/**
 * "Sua biblioteca" in the profile. The introduction is free; the other guides are part of Premium.
 * Content is practical and symbolic — no promise of income or financial results.
 */
export type GuideSection = { heading: string; paragraphs?: string[]; bullets?: string[] };
export type Guide = { id: GuideId; title: string; subtitle: string; premium: boolean; sections: GuideSection[] };
export type GuideId = "intro" | "sign-strategies" | "career" | "money";

export const GUIDES: readonly Guide[] = [
  {
    id: "intro",
    title: "Guia Use Seu Signo para Prosperar",
    subtitle: "Introdução",
    premium: false,
    sections: [
      { heading: "O que é o Veias da Sintonia", paragraphs: ["Um app de autoconhecimento, hábitos e metas que usa a astrologia como linguagem simbólica. Seu signo não decide nada por você — ele oferece um espelho para perceber padrões e escolher o próximo passo."] },
      { heading: "O ciclo que faz sua árvore crescer", bullets: ["Signo e objetivo: o ponto de partida da sua leitura.", "Orientação do dia: um foco simbólico diferente a cada dia.", "Ação prática: a missão e o ritual de 3 minutos.", "Constância: cada dia cumprido fortalece a sequência.", "Reflexão: o diário transforma experiência em aprendizado."] },
      { heading: "Como usar em 5 minutos por dia", bullets: ["Abra o Início e leia o clima do dia.", "Faça o ritual de 3 minutos.", "Conclua a missão — ela vale XP para a árvore.", "À noite, escreva duas linhas no diário."] },
      { heading: "Um lembrete importante", paragraphs: ["As leituras são simbólicas e refletem apenas o que você registra no app. Resultados reais vêm das suas ações, no seu ritmo."] },
    ],
  },
  {
    id: "sign-strategies",
    title: "Estratégias para cada signo",
    subtitle: "Premium",
    premium: true,
    sections: [], // Built from lib/signs.ts for the reader's sign first, then the other eleven.
  },
  {
    id: "career",
    title: "Decisões e carreira",
    subtitle: "Premium",
    premium: true,
    sections: [
      { heading: "Antes de decidir: nomeie a decisão", paragraphs: ["Muitas dúvidas de carreira parecem grandes porque estão vagas. Escreva a decisão em uma frase, com um prazo: “Até 30 de novembro, decido se aceito a proposta X.”"] },
      { heading: "O método das três colunas", bullets: ["O que eu ganho — dinheiro, aprendizado, rede de contatos, tempo.", "O que eu arrisco — estabilidade, energia, relações.", "O que eu sinto — entusiasmo, medo, alívio. Emoção também é dado."] },
      { heading: "Teste pequeno antes do salto", paragraphs: ["Quase toda mudança pode ser ensaiada: uma conversa com quem já faz aquilo, um projeto de fim de semana, um curso curto. Testes pequenos transformam medo em informação."] },
      { heading: "Conversas que valem ouro", bullets: ["Pergunte a quem está 2 anos à sua frente, não 20.", "Leve perguntas específicas: rotina, ganhos reais, o que ninguém conta.", "Agradeça e retorne contando o que você fez com o conselho."] },
      { heading: "Negociação sem medo", bullets: ["Pesquise a faixa de mercado antes da conversa.", "Peça com base em entregas concretas, não em necessidade.", "Silêncio depois da proposta é normal — não preencha com descontos."] },
      { heading: "Missão desta semana", paragraphs: ["Escolha uma decisão de carreira em aberto, escreva as três colunas e agende uma conversa de 20 minutos com alguém que já passou por isso."] },
    ],
  },
  {
    id: "money",
    title: "Organização financeira consciente",
    subtitle: "Premium",
    premium: true,
    sections: [
      { heading: "Comece pela foto real", paragraphs: ["Organização começa com clareza, não com culpa. Anote quanto entra por mês e liste seus gastos fixos. Olhe para os números como quem lê um mapa — eles mostram onde você está, não quem você é."] },
      { heading: "A regra dos três potes", bullets: ["Essencial — moradia, alimentação, transporte, contas.", "Futuro — reserva de emergência e objetivos.", "Livre — lazer e prazer, sem culpa, dentro do combinado."], paragraphs: ["Um ponto de partida comum é 50% / 20% / 30%, mas ajuste à sua realidade. O importante é que o pote do futuro exista, mesmo que comece pequeno."] },
      { heading: "Reserva de emergência", bullets: ["Meta inicial: um mês de gastos essenciais.", "Depois: de três a seis meses, com calma.", "Guarde num lugar de fácil acesso e baixo risco, separado da conta do dia a dia."] },
      { heading: "Dívidas: uma de cada vez", bullets: ["Liste todas com valor, juros e parcela.", "Priorize as de juros mais altos (cartão e cheque especial).", "Negocie: bancos costumam oferecer condições melhores para quitação."] },
      { heading: "Gastos por impulso", paragraphs: ["Use a regra das 48 horas para compras não planejadas. Se depois de dois dias ainda fizer sentido e couber no pote livre, compre com tranquilidade."] },
      { heading: "Ritual mensal de 20 minutos", bullets: ["Revise o que entrou e o que saiu.", "Celebre um avanço, por menor que seja.", "Ajuste um único ponto para o próximo mês."] },
      { heading: "Aviso", paragraphs: ["Este guia traz organização básica e não substitui orientação de um profissional de finanças. Não é recomendação de investimento."] },
    ],
  },
];

export function findGuide(id: string | null) {
  return GUIDES.find((guide) => guide.id === id) ?? null;
}
