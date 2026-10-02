const ZODIAC = [
  ["Capricórnio", 120], ["Aquário", 219], ["Peixes", 321], ["Áries", 420],
  ["Touro", 521], ["Gêmeos", 621], ["Câncer", 723], ["Leão", 823],
  ["Virgem", 923], ["Libra", 1023], ["Escorpião", 1122], ["Sagitário", 1222], ["Capricórnio", 1232],
] as const;

/** Sun sign for a "yyyy-mm-dd" birth date (Capricórnio when empty). */
export function signFromDate(date: string) {
  if (!date) return "Capricórnio";
  const [, month, day] = date.split("-").map(Number);
  const code = month * 100 + day;
  return ZODIAC.find(([, end]) => code <= end)?.[0] ?? "Capricórnio";
}

/** Whole years since a "yyyy-mm-dd" birth date, or null when it is not a real past date. */
export function ageFromDate(date: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  const born = new Date(year, month - 1, day);
  if (born.getFullYear() !== year || born.getMonth() !== month - 1 || born.getDate() !== day || year < 1900 || born > now) return null;
  let age = now.getFullYear() - year;
  if (now.getMonth() < month - 1 || (now.getMonth() === month - 1 && now.getDate() < day)) age -= 1;
  return age;
}
