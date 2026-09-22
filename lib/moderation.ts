const ABUSIVE_PATTERNS = [
  "caralho", "porra", "merda", "buceta", "piroca", "pinto", "rola",
  "viado", "veado", "corno", "otario", "otária", "otaria", "idiota", "imbecil", "retardado", "retardada",
  "vagabundo", "vagabunda", "vadia", "puta", "putaria", "safado", "safada",
  "desgraça", "disgraça", "desgraca", "bosta", "porcaria",
  "burro", "burra", "estupido", "estúpido", "estupida", "estúpida",
  "foda-se", "fodase", "vsf", "vtnc", "tnc", "fdp", "pqp",
  "toma no cu", "vai se fuder", "vai tomar no cu", "filho da puta", "filha da puta",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Rough profanity/abuse detector for PT-BR chat input — not exhaustive, just a first filter. */
export function containsAbusiveLanguage(message: string) {
  const normalized = normalize(message);
  return ABUSIVE_PATTERNS.some((pattern) => normalized.includes(normalize(pattern)));
}
