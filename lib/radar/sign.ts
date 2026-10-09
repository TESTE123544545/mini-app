import { signByName } from "@/lib/signals/compose";

const ELEMENT_STYLE = {
  Fogo: "Seu Fogo costuma gostar de começar rápido; o cuidado é terminar uma frente antes de abrir outra.",
  Terra: "Sua Terra costuma gostar do que é concreto e repetível; o cuidado é não adiar a primeira oferta esperando estar perfeito.",
  Ar: "Seu Ar costuma gostar de conversar e conectar ideias; o cuidado é transformar a conversa em uma oferta com preço.",
  Água: "Sua Água costuma perceber o que as pessoas sentem e precisam; o cuidado é não deixar de cobrar pelo cuidado que você entrega.",
} as const;

/** The astrology layer of the Radar: inspiration and self-knowledge only, never a reason an opportunity is "right". */
export function radarSignNote(sign: string) {
  const zodiac = signByName(sign);
  if (!zodiac) return null;
  return {
    title: `Leitura simbólica · ${zodiac.name}`,
    text: `${ELEMENT_STYLE[zodiac.element]} Use essa leitura como inspiração, mas tome suas decisões considerando suas habilidades, o mercado e a sua realidade financeira. O resultado do Radar vem das respostas que você deu, não do seu signo.`,
  };
}
