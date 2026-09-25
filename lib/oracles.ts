/**
 * Daily symbolic rituals for Premium: the Wheel of Fortune (Astrologia & Céu) and the tarot card of
 * the day (12 Signos). Each can be used once per day; the result is a reflection plus one small
 * action. Symbolic self-knowledge only — never a prediction, prize or promise of money.
 */

export type WheelHouse = { house: number; glyph: string; theme: string; message: string; action: string };

/** The twelve astrological houses, each paired with the sign that naturally rules it. */
export const WHEEL_HOUSES: readonly WheelHouse[] = [
  { house: 1, glyph: "♈", theme: "Identidade e iniciativa", message: "A roda para na Casa I: hoje a energia favorece se mostrar como você é. Presença também é uma forma de prosperar.", action: "Apresente uma ideia sua a alguém, sem pedir desculpas antes." },
  { house: 2, glyph: "♉", theme: "Recursos e valor próprio", message: "Casa II: o que você tem — tempo, talentos, dinheiro — pede cuidado e reconhecimento.", action: "Anote três recursos que você já tem e que ainda usa pouco." },
  { house: 3, glyph: "♊", theme: "Comunicação e aprendizado", message: "Casa III: conversas e mensagens carregam oportunidades hoje.", action: "Envie aquela mensagem que você vem adiando." },
  { house: 4, glyph: "♋", theme: "Raízes e segurança", message: "Casa IV: prosperar começa por uma base firme. Olhe para o que te sustenta.", action: "Organize um canto da casa ou uma pendência doméstica de 15 minutos." },
  { house: 5, glyph: "♌", theme: "Criatividade e alegria", message: "Casa V: o prazer e a criação também geram valor. Não precisa ser tudo sério.", action: "Dedique 20 minutos a algo que você faz por gosto." },
  { house: 6, glyph: "♍", theme: "Rotina e cuidado", message: "Casa VI: pequenos hábitos repetidos constroem grandes colheitas.", action: "Escolha um hábito de 5 minutos e faça agora." },
  { house: 7, glyph: "♎", theme: "Parcerias", message: "Casa VII: alguém pode somar ao seu caminho. Prosperidade raramente é solitária.", action: "Agradeça ou reconheça publicamente uma pessoa que te ajudou." },
  { house: 8, glyph: "♏", theme: "Transformação", message: "Casa VIII: algo pede para ser encerrado para abrir espaço ao novo.", action: "Cancele, doe ou encerre uma coisa que só ocupa espaço." },
  { house: 9, glyph: "♐", theme: "Expansão e visão", message: "Casa IX: é dia de olhar mais longe e aprender algo que amplie seu horizonte.", action: "Leia ou assista 15 minutos sobre um assunto que você quer dominar." },
  { house: 10, glyph: "♑", theme: "Carreira e realização", message: "Casa X: suas conquistas pedem visibilidade e direção.", action: "Defina a próxima entrega concreta do seu objetivo principal." },
  { house: 11, glyph: "♒", theme: "Comunidade e futuro", message: "Casa XI: redes, grupos e sonhos coletivos estão em destaque.", action: "Participe de uma conversa em um grupo ligado ao seu objetivo." },
  { house: 12, glyph: "♓", theme: "Intuição e descanso", message: "Casa XII: pausa também é estratégia. Escute o que está por trás do cansaço.", action: "Faça 3 minutos de silêncio e anote a primeira ideia que vier." },
];

export type Arcanum = { number: number; roman: string; name: string; keyword: string; message: string; action: string };

/** The 22 major arcana, read through self-knowledge, habits and goals. */
export const MAJOR_ARCANA: readonly Arcanum[] = [
  { number: 0, roman: "0", name: "O Louco", keyword: "Começo", message: "Um novo começo pede leveza. Você não precisa ter o caminho inteiro — só o primeiro passo.", action: "Dê um passo pequeno em algo novo hoje, sem esperar estar pronto." },
  { number: 1, roman: "I", name: "O Mago", keyword: "Iniciativa", message: "Você já tem as ferramentas. A carta pede que você as coloque em uso.", action: "Liste o que você já tem para avançar no seu objetivo e use uma coisa." },
  { number: 2, roman: "II", name: "A Sacerdotisa", keyword: "Intuição", message: "Nem toda resposta vem de fora. Silêncio e observação trazem clareza.", action: "Antes de decidir algo hoje, espere 10 minutos e escute sua intuição." },
  { number: 3, roman: "III", name: "A Imperatriz", keyword: "Abundância", message: "Cuidar do que já floresce faz florescer mais. Nutra o que você começou.", action: "Dedique atenção a um projeto que já está andando." },
  { number: 4, roman: "IV", name: "O Imperador", keyword: "Estrutura", message: "Ordem cria liberdade. Uma estrutura simples sustenta grandes planos.", action: "Organize sua semana em três prioridades." },
  { number: 5, roman: "V", name: "O Hierofante", keyword: "Aprendizado", message: "Alguém que já trilhou o caminho pode encurtar o seu.", action: "Peça um conselho a uma pessoa mais experiente." },
  { number: 6, roman: "VI", name: "Os Enamorados", keyword: "Escolha", message: "Uma escolha alinhada aos seus valores pede coragem.", action: "Decida uma pendência que você está adiando." },
  { number: 7, roman: "VII", name: "O Carro", keyword: "Direção", message: "Foco e determinação levam longe. Escolha uma direção e siga.", action: "Faça hoje a tarefa mais importante antes de qualquer outra." },
  { number: 8, roman: "VIII", name: "A Força", keyword: "Coragem gentil", message: "Força verdadeira é firmeza com calma, não pressa.", action: "Enfrente uma situação difícil com uma conversa tranquila." },
  { number: 9, roman: "IX", name: "O Eremita", keyword: "Reflexão", message: "Um tempo consigo mesmo revela o próximo passo.", action: "Escreva no diário o que você realmente quer para este mês." },
  { number: 10, roman: "X", name: "A Roda da Fortuna", keyword: "Ciclos", message: "Ciclos mudam. Aproveite o movimento em vez de lutar contra ele.", action: "Identifique algo que mudou e ajuste um plano à nova realidade." },
  { number: 11, roman: "XI", name: "A Justiça", keyword: "Equilíbrio", message: "Clareza e honestidade consigo trazem decisões justas.", action: "Revise um gasto ou compromisso com olhar honesto." },
  { number: 12, roman: "XII", name: "O Enforcado", keyword: "Nova perspectiva", message: "Às vezes avançar é mudar o ângulo de visão.", action: "Olhe para um problema pelo ponto de vista de outra pessoa." },
  { number: 13, roman: "XIII", name: "A Morte", keyword: "Transformação", message: "Algo se encerra para abrir espaço ao novo — é renovação, não perda.", action: "Encerre um hábito ou compromisso que já não faz sentido." },
  { number: 14, roman: "XIV", name: "A Temperança", keyword: "Moderação", message: "Equilíbrio e paciência constroem resultados duradouros.", action: "Faça hoje uma escolha no meio-termo, sem excessos." },
  { number: 15, roman: "XV", name: "O Diabo", keyword: "Consciência", message: "Perceba o que te prende: um hábito, um medo, uma crença.", action: "Anote um padrão que te atrapalha e uma forma de reduzi-lo." },
  { number: 16, roman: "XVI", name: "A Torre", keyword: "Recomeço", message: "Quando algo desmorona, sobra espaço para construir melhor.", action: "Reconstrua um plano que não funcionou, versão 2.0." },
  { number: 17, roman: "XVII", name: "A Estrela", keyword: "Esperança", message: "Inspiração e fé no caminho renovam a energia.", action: "Escreva uma meta de longo prazo que te inspira." },
  { number: 18, roman: "XVIII", name: "A Lua", keyword: "Incerteza", message: "Nem tudo está claro agora — e tudo bem. Avance com cuidado.", action: "Separe fatos de suposições em uma preocupação atual." },
  { number: 19, roman: "XIX", name: "O Sol", keyword: "Vitalidade", message: "Energia, clareza e alegria estão em destaque. Celebre.", action: "Comemore uma conquista recente, por menor que seja." },
  { number: 20, roman: "XX", name: "O Julgamento", keyword: "Despertar", message: "Um chamado interior pede resposta. O que você sabe que precisa fazer?", action: "Responda a um chamado que você vem ignorando." },
  { number: 21, roman: "XXI", name: "O Mundo", keyword: "Realização", message: "Um ciclo se completa. Reconheça o caminho que você já percorreu.", action: "Liste três coisas que você conquistou este ano." },
];

/* --- Once per day, per device -------------------------------------------------------------- */
export type DailyDraw = { day: string; index: number };

export function readDraw(key: string, day: string): DailyDraw | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null") as DailyDraw | null;
    return saved && saved.day === day ? saved : null;
  } catch {
    return null;
  }
}

export function saveDraw(key: string, draw: DailyDraw) {
  try { localStorage.setItem(key, JSON.stringify(draw)); } catch { /* storage blocked */ }
}
