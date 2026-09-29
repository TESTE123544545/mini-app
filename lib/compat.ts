import { ZODIAC_SIGNS, type ZodiacSign } from "@/lib/zodiacContent";

/**
 * Sign compatibility, read symbolically from the two elements (and modalities). Never a verdict:
 * every pairing is described as a way of relating, with its ease and its work.
 */

export type CompatLevel = { label: string; summary: string };

const COMPLEMENT: Record<string, string> = { Fogo: "Ar", Ar: "Fogo", Terra: "Água", Água: "Terra" };
const ELEMENT_NATURE: Record<string, string> = {
  Fogo: "entusiasmo, iniciativa e vontade de agir",
  Terra: "segurança, constância e senso prático",
  Ar: "ideias, conversa e liberdade",
  Água: "emoção, intuição e intimidade",
};

export function compatLevel(a: ZodiacSign, b: ZodiacSign): CompatLevel {
  if (a.slug === b.slug) return { label: "Espelho", summary: `Dois nativos de ${a.name} se reconhecem de cara — a mesma energia de ${ELEMENT_NATURE[a.element]}. A afinidade é natural; o cuidado é não somar também os mesmos excessos.` };
  if (a.element === b.element) return { label: "Sintonia alta", summary: `Os dois são de ${a.element}: falam a mesma língua de ${ELEMENT_NATURE[a.element]}. A convivência tende a fluir com facilidade.` };
  if (COMPLEMENT[a.element] === b.element) return { label: "Sintonia boa", summary: `${a.element} e ${b.element} se completam: ${ELEMENT_NATURE[a.element]} de um lado, ${ELEMENT_NATURE[b.element]} do outro. Um alimenta o que o outro tem de melhor.` };
  if (a.modality === b.modality) return { label: "Sintonia desafiadora", summary: `Elementos diferentes (${a.element} e ${b.element}) e o mesmo ritmo ${a.modality.toLowerCase()}: é comum disputar o mesmo espaço. Pede paciência — e ensina muito.` };
  return { label: "Sintonia de aprendizado", summary: `${a.element} e ${b.element} funcionam em ritmos diferentes: ${ELEMENT_NATURE[a.element]} encontra ${ELEMENT_NATURE[b.element]}. Dá certo quando cada um aprende a linguagem do outro.` };
}

/** The canonical order of a pair: zodiac order (áries first), so each pair has one URL. */
export function orderedPair(a: ZodiacSign, b: ZodiacSign): [ZodiacSign, ZodiacSign] {
  return ZODIAC_SIGNS.indexOf(a) <= ZODIAC_SIGNS.indexOf(b) ? [a, b] : [b, a];
}

export const pairSlug = (a: ZodiacSign, b: ZodiacSign) => orderedPair(a, b).map((sign) => sign.slug).join("-");

export function parsePair(slug: string): [ZodiacSign, ZodiacSign] | null {
  const [first, second, extra] = slug.split("-");
  if (extra !== undefined) return null;
  const a = ZODIAC_SIGNS.find((sign) => sign.slug === first);
  const b = ZODIAC_SIGNS.find((sign) => sign.slug === second);
  return a && b ? [a, b] : null;
}

/** All 78 distinct pairs (including each sign with itself). */
export function allPairs(): [ZodiacSign, ZodiacSign][] {
  return ZODIAC_SIGNS.flatMap((a, index) => ZODIAC_SIGNS.slice(index).map((b) => [a, b] as [ZodiacSign, ZodiacSign]));
}
