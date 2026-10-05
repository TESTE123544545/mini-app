import type { NumKey } from "@/lib/signals/numerology";

/**
 * The 24 "horas iguais" (00:00 … 23:23): hour and minute repeat. Each carries a number, a symbolic
 * meaning and a short line per theme. Written as reflection prompts, never as predictions.
 */
export type EqualHour = {
  time: string;
  slug: string;
  /** The number the hour is read through (digits added, master numbers kept). */
  number: NumKey | 0;
  title: string;
  keywords: string[];
  essence: string;
  prosperity: string;
  love: string;
  moment: string;
};

const h = (time: string, number: NumKey | 0, title: string, keywords: string[], essence: string, prosperity: string, love: string, moment: string): EqualHour =>
  ({ time, slug: time.replace(":", "-"), number, title, keywords, essence, prosperity, love, moment });

export const EQUAL_HOURS: readonly EqualHour[] = [
  h("00:00", 0, "Recomeço", ["recomeço", "ciclo", "possibilidade"], "O zero marca um ponto de partida: o relógio zera e nada está escrito ainda. É um convite simbólico para limpar o terreno e começar com a página em branco.", "Um bom momento para olhar para o seu dinheiro e seus planos como se fosse a primeira vez: o que você manteria, e o que começaria diferente?", "No amor, lembra que todo vínculo pode ser recomeçado com mais verdade, a começar pela relação que você tem consigo.", "Algo está terminando ou pedindo um recomeço. Respire e decida qual é o primeiro passo, por menor que seja."),
  h("01:01", 1, "Iniciativa", ["começo", "coragem", "decisão"], "O 1 repetido fala de iniciativa. É como se o relógio perguntasse: o que você está esperando para dar o primeiro passo?", "Vale transformar uma ideia em ação: um passo pequeno e concreto hoje pesa mais do que um plano perfeito amanhã.", "No amor, o convite é tomar a iniciativa, seja de uma conversa sincera, seja de um gesto de carinho.", "Você tem mais energia de começar do que imagina. Escolha uma coisa e comece."),
  h("02:02", 2, "Equilíbrio e parceria", ["equilíbrio", "parceria", "paciência"], "O 2 repetido fala de dualidade, escuta e cooperação. Nem tudo se resolve sozinho: algumas coisas pedem tempo e a companhia certa.", "Um sinal para cooperar: uma parceria, uma conversa de alinhamento ou simplesmente esperar o momento certo de agir.", "No amor, fala de reciprocidade: dar e receber na mesma medida, com paciência e escuta.", "Se você está dividido entre dois caminhos, não force. Observe com calma o que cada um pede de você."),
  h("03:03", 3, "Expressão", ["criatividade", "comunicação", "alegria"], "O 3 repetido traz criatividade, palavra e leveza. É o número de quem precisa pôr para fora o que sente e pensa.", "Um sinal para mostrar o que você sabe fazer: comunique seu trabalho, suas ideias e seu valor sem se esconder.", "No amor, convida a conversar mais e a trazer humor e alegria para a relação.", "Alguma coisa quer ser dita ou criada. Escreva, fale, desenhe, cante: deixe sair."),
  h("04:04", 4, "Base e organização", ["estrutura", "disciplina", "estabilidade"], "O 4 repetido fala de alicerces. É o número da organização paciente: o que se constrói devagar costuma durar.", "Um momento para organizar finanças, rotinas e prioridades. Estrutura simples cuida do futuro sem ansiedade.", "No amor, fala de segurança e confiança, que se constroem com constância e pequenos gestos repetidos.", "Antes de buscar algo novo, firme o que já está de pé. Ponha ordem em uma área que anda bagunçada."),
  h("05:05", 5, "Mudança", ["mudança", "liberdade", "movimento"], "O 5 repetido fala de movimento. É o número da curiosidade e da necessidade de arejar a vida.", "Um convite a olhar para novas possibilidades e a flexibilizar planos, sem abandonar o que importa.", "No amor, lembra de renovar a relação: novidade, conversas diferentes, um programa fora do comum.", "Uma mudança está pedindo passagem. Em vez de resistir, pergunte o que ela quer ensinar."),
  h("06:06", 6, "Cuidado e harmonia", ["cuidado", "lar", "harmonia"], "O 6 repetido fala de afeto, responsabilidade e beleza. É o número do lar, da família e do que nos faz sentir acolhidos.", "Um sinal para cuidar do que sustenta sua vida: casa, contas em dia, vínculos de confiança e o seu bem-estar.", "No amor, destaca o cuidado: gestos de carinho, atenção ao outro e também a você.", "Cuidar também é receber. Veja se você está dando aos outros mais do que a si mesmo."),
  h("07:07", 7, "Intuição e silêncio", ["introspecção", "intuição", "estudo"], "O 7 repetido fala de profundidade. É o número da pausa, do estudo e das respostas que vêm quando fazemos silêncio.", "Um momento para estudar antes de decidir: informe-se, observe e confie em quem você pesquisou, não na pressa.", "No amor, convida à honestidade interior: o que você realmente sente e o que precisa antes de se entregar?", "Fique um tempo em silêncio. As respostas que você procura costumam chegar quando você para de correr atrás delas."),
  h("08:08", 8, "Realização", ["conquista", "equilíbrio", "merecimento"], "O 8 repetido fala de realização e de equilíbrio entre dar e receber. Também lembra que o infinito, na horizontal, é o símbolo do 8: tudo volta.", "Um sinal para olhar com clareza o que você entrega e o que recebe, e pedir o que é justo sem culpa.", "No amor, fala de equilíbrio entre dar e receber: relações boas são de mão dupla.", "O que você planta com consistência tende a voltar. Mantenha o foco no que está ao seu alcance hoje."),
  h("09:09", 9, "Encerramento", ["conclusão", "gratidão", "soltar"], "O 9 repetido fala de fim de ciclo. É o número de agradecer o que foi vivido e soltar o que já cumpriu seu papel.", "Um momento para encerrar pendências financeiras e hábitos que já não servem, abrindo espaço para o que vem.", "No amor, convida a perdoar, a soltar mágoas antigas e a fechar uma história com carinho.", "Algo chegou ao fim, e tudo bem. Agradeça e deixe ir, para que o novo tenha onde pousar."),
  h("10:10", 1, "Novo ciclo com confiança", ["começo", "fé", "potencial"], "O 10 une o 1, que inicia, ao 0, que é tudo ainda possível. É um sinal de recomeço com confiança no próprio potencial.", "Um convite a começar um projeto ou hábito com fé em si, mesmo sem ter todas as respostas.", "No amor, fala de abrir-se de novo, sem carregar o peso do que já passou.", "Você está num ponto de virada. Escolha o que quer começar e dê o primeiro passo."),
  h("11:11", 11, "Despertar da intuição", ["intuição", "despertar", "sincronicidade"], "O 11:11 é a mais conhecida das horas iguais. O 11 é um número mestre, ligado à intuição, e o espelho de dois 1 lembra de prestar atenção ao que acontece dentro e fora de você.", "Um sinal para ouvir a intuição junto com a razão: confie no que sente e confirme com um passo prático e informado.", "No amor, fala de conexão genuína e de ser verdadeiro sobre o que você deseja de uma relação.", "Presença é a palavra. Perceba o que estava pensando quando viu a hora: esse pensamento pode ser o assunto do momento."),
  h("12:12", 3, "Expressão com propósito", ["propósito", "comunicação", "visão"], "O 12 reduz ao 3: expressão e criatividade. Também lembra ciclos completos, como as 12 horas do relógio e os 12 signos.", "Um momento para alinhar o que você faz com o que você valoriza, e mostrar isso com clareza ao mundo.", "No amor, fala de comunicar com propósito: dizer o que sente de forma clara e gentil.", "Você está vendo o quadro completo. Use essa visão para escolher o que merece sua energia."),
  h("13:13", 4, "Transformação com estrutura", ["transformação", "base", "renovação"], "O 13 reduz ao 4. Muitas culturas o associam a transformações, e o 4 pede que a mudança venha com alicerce.", "Um sinal para renovar sua forma de lidar com recursos e planos, de maneira organizada e sem pressa.", "No amor, convida a transformar padrões antigos com pequenas decisões diárias.", "Mudar não é perder estrutura, é reconstruí-la. Defina o que precisa permanecer."),
  h("14:14", 5, "Mudança consciente", ["adaptação", "equilíbrio", "escolha"], "O 14 reduz ao 5: liberdade e adaptação. Lembra de mudar com consciência, com equilíbrio entre aventura e responsabilidade.", "Um convite a testar novas formas de ganhar, organizar e aprender, sem apostar tudo de uma vez.", "No amor, fala de equilibrar liberdade e vínculo, com combinados claros.", "Você pode mudar sem se perder. Pergunte-se o que está disposto a ajustar e o que é inegociável."),
  h("15:15", 6, "Amor e responsabilidade", ["afeto", "responsabilidade", "vínculos"], "O 15 reduz ao 6: cuidado e vínculos. É um sinal ligado ao afeto e às responsabilidades que escolhemos assumir.", "Um momento para cuidar das contas e das pessoas que dependem de você, sem esquecer de si.", "No amor, destaca o compromisso com carinho: presença, constância e conversa.", "Olhe para quem e o que você cuida. Veja se existe equilíbrio entre dar e se preservar."),
  h("16:16", 7, "Autoconhecimento", ["reflexão", "verdade", "análise"], "O 16 reduz ao 7: introspecção. É um sinal para olhar para dentro, rever crenças e se perguntar o que é realmente seu.", "Um convite a rever crenças sobre dinheiro e merecimento, e substituir o que vem do medo por escolhas conscientes.", "No amor, convida a perceber padrões que se repetem e o que eles revelam sobre o que você busca.", "Uma verdade interna quer ser vista. Seja gentil consigo ao olhar para ela."),
  h("17:17", 8, "Merecimento e conquista", ["merecimento", "persistência", "reconhecimento"], "O 17 reduz ao 8: realização. Fala de reconhecer o próprio valor e de persistir com os pés no chão.", "Um sinal para valorizar seu trabalho: sua dedicação tem valor, e vale aprender a pedir com segurança o que é justo.", "No amor, lembra que você merece reciprocidade e respeito, sem precisar provar nada.", "O que você construiu até aqui conta. Reconheça seus avanços antes de olhar o que falta."),
  h("18:18", 9, "Conclusão com compaixão", ["compaixão", "fechamento", "generosidade"], "O 18 reduz ao 9: conclusão. É um sinal de encerrar ciclos com generosidade e sem rancor.", "Um momento para fechar um ciclo de trabalho ou de gastos e aprender com ele, com generosidade com você mesmo.", "No amor, fala de perdoar e de cuidar sem se sacrificar.", "Termine o que merece ser terminado e deixe ir o que pesa. Há leveza do outro lado."),
  h("19:19", 1, "Independência e recomeço", ["independência", "novo capítulo", "autonomia"], "O 19 reduz ao 1, mas passa pelo 9: fecha-se um ciclo para que uma fase mais autêntica e independente comece.", "Um convite a sustentar sua autonomia: planeje o próximo passo por conta própria, com base no que aprendeu.", "No amor, fala de se sentir inteiro antes de se unir: a relação se fortalece quando cada um tem o seu chão.", "Você aprendeu muito para chegar aqui. Use isso para começar algo seu."),
  h("20:20", 2, "Cooperação", ["cooperação", "sensibilidade", "escuta"], "O 20 reduz ao 2: parceria e sensibilidade. Lembra que ouvir de verdade pode resolver mais do que insistir.", "Um sinal para buscar apoio e trocar ideias: boas parcerias multiplicam o que é feito sozinho.", "No amor, convida à escuta atenta e à paciência com o ritmo do outro.", "Há algo a ser resolvido com delicadeza. Escolha a conversa em vez da disputa."),
  h("21:21", 3, "Criatividade e alegria", ["criação", "leveza", "otimismo"], "O 21 reduz ao 3: expressão e alegria. É um sinal para criar, sorrir mais e dar espaço ao que é leve.", "Um momento para usar a criatividade com seu dinheiro e seu trabalho: uma ideia nova, uma forma diferente de mostrar o que faz.", "No amor, fala de leveza: brincar, rir junto e se permitir ser espontâneo.", "Dê espaço ao que dá alegria hoje, sem precisar justificar."),
  h("22:22", 22, "Construção com propósito", ["construção", "propósito", "estrutura"], "O 22 é um número mestre, o construtor. Une visão e ação e lembra de que grandes projetos são feitos de passos pequenos e consistentes.", "Um sinal para quebrar um grande objetivo em etapas: o sonho vira realidade quando ganha estrutura e rotina.", "No amor, fala de construir algo juntos, com combinados, cuidado e olhar para o futuro.", "Você pode estar perto de organizar algo grande. Comece pelo passo mais simples."),
  h("23:23", 5, "Liberdade com responsabilidade", ["liberdade", "ousadia", "adaptação"], "O 23 reduz ao 5: movimento. É um sinal de coragem para mudar de rota, com responsabilidade sobre as próprias escolhas.", "Um convite a arriscar com cautela: testar uma ideia nova em escala pequena antes de apostar alto.", "No amor, fala de renovar a relação ou de ter coragem de dizer o que você quer.", "A vida pede um movimento. Escolha com consciência para onde quer ir."),
];

export const hourBySlug = (slug: string) => EQUAL_HOURS.find((hour) => hour.slug === slug);
export const hourByTime = (time: string) => EQUAL_HOURS.find((hour) => hour.time === time);

/** "11:11" when the minute repeats the hour, else null. */
export function equalHourOf(date: Date): string | null {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return hh === mm ? `${hh}:${mm}` : null;
}

/** The next equal hour after "now" and how many minutes away it is (a day wraps around). */
export function nextEqualHour(date: Date): { time: string; minutes: number } {
  const now = date.getHours() * 60 + date.getMinutes();
  let best = { time: EQUAL_HOURS[0].time, minutes: 24 * 60 - now };
  for (const hour of EQUAL_HOURS) {
    const [hh, mm] = hour.time.split(":").map(Number);
    const diff = hh * 60 + mm - now;
    if (diff > 0 && diff < best.minutes) best = { time: hour.time, minutes: diff };
  }
  return best;
}
