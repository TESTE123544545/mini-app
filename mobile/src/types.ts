/** Shapes of /api/sky (the server's lib/sky.ts is not shared: it reads the database). */
export type SkyPlanet = { name: string; sign: string; degree: number; retrograde: boolean };
export type SkyEvent = { date: string; kind: string; title: string; meaning: string };
export type SkyToday = {
  date: string;
  moon: { sign: string; phase: string; illumination: number; text: string };
  transit: { title: string; text: string };
  planets: SkyPlanet[];
  events: SkyEvent[];
  source: string;
};
export type SignDaily = { date: string; sign: string; overview: string; work: string; relationships: string; energy: string; tip: string; source: string };
export type KeyDate = { date: string; title: string; text: string };
export type SignPeriod = { period: string; sign: string; summary: string; focus: string; tip: string; keyDates: KeyDate[]; source: string };
