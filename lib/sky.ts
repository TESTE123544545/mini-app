import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { skyDaily } from "@/db/schema";
import { adaptSignDaily, adaptSkyArticles } from "@/lib/openrouter";
import { SIGNS } from "@/lib/signs";

/**
 * Live sky data from CosmyDay (https://cosmyday.com/api-docs): free, keyless, computed from the
 * Swiss Ephemeris and regenerated once a day. We fetch each piece once per Brazilian day, adapt
 * the English text to Portuguese in the app's voice, and keep it in D1 so every visitor shares it.
 */
const COSMYDAY = "https://api.cosmyday.com";
const USER_AGENT = "VeiasDaSintonia/1.0 (+https://veiasdasintonia.com.br; contato via site)";
export const SKY_SOURCE = "Céu calculado pela CosmyDay (Swiss Ephemeris) · texto adaptado pelo Veias da Sintonia";

const SIGN_EN = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"] as const;
type SignEn = (typeof SIGN_EN)[number];
const SIGN_PT: Record<SignEn, string> = Object.fromEntries(SIGN_EN.map((en, index) => [en, SIGNS[index].name])) as Record<SignEn, string>;

const PLANET_PT: Record<string, string> = {
  sun: "Sol", moon: "Lua", mercury: "Mercúrio", venus: "Vênus", mars: "Marte", jupiter: "Júpiter",
  saturn: "Saturno", uranus: "Urano", neptune: "Netuno", pluto: "Plutão", chiron: "Quíron",
  north_node: "Nodo Norte", southnode: "Nodo Sul", south_node: "Nodo Sul",
};
const PHASE_PT: Record<string, string> = {
  new_moon: "Lua Nova", waxing_crescent: "Lua Crescente", first_quarter: "Quarto Crescente", waxing_gibbous: "Crescente Gibosa",
  full_moon: "Lua Cheia", waning_gibbous: "Minguante Gibosa", last_quarter: "Quarto Minguante", waning_crescent: "Lua Minguante",
};
/** Our own short, symbolic reading of each kind of sky event — never a prediction. */
const EVENT_MEANING: Record<string, string> = {
  full_moon: "Culminância: bom momento para concluir, reconhecer o que cresceu e soltar o que já cumpriu seu papel.",
  new_moon: "Recomeço: bom momento para plantar uma intenção pequena e concreta.",
  retrograde_start: "Tempo de revisar, reorganizar e retomar o que ficou pela metade antes de começar algo novo.",
  retrograde_end: "O movimento volta a fluir: o que foi revisto pode seguir adiante com mais clareza.",
  ingress: "Muda o clima simbólico dessa área da vida — observe onde você sente a diferença.",
  season_start: "Começa uma nova estação do zodíaco, com outro ritmo e outro foco.",
  eclipse_solar: "Eclipse solar: um ponto de virada simbólico para intenções novas; vá com calma e sem pressa de decidir.",
  eclipse_lunar: "Eclipse lunar: fase de encerramentos e percepções; um bom dia para observar antes de agir.",
};

export function brazilDayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date);
}

export function signSlugFromName(name: string): SignEn | null {
  const normalized = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const index = SIGNS.findIndex((sign) => sign.id === normalized || sign.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() === normalized);
  if (index >= 0) return SIGN_EN[index];
  return (SIGN_EN as readonly string[]).includes(normalized) ? (normalized as SignEn) : null;
}

const signPt = (value?: string) => (value ? SIGN_PT[value.toLowerCase() as SignEn] ?? value : "");
const planetPt = (value: string) => PLANET_PT[value.toLowerCase().replace(/\s+/g, "_")] ?? value;

async function cosmyday<T>(path: string): Promise<T> {
  const response = await fetch(`${COSMYDAY}${path}`, { headers: { "user-agent": USER_AGENT, accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`CosmyDay ${path} → ${response.status}`);
  return response.json() as Promise<T>;
}

async function readCache<T>(day: string, key: string): Promise<T | null> {
  const [row] = await getDb().select({ payloadJson: skyDaily.payloadJson }).from(skyDaily).where(and(eq(skyDaily.day, day), eq(skyDaily.key, key))).limit(1);
  return row ? (JSON.parse(row.payloadJson) as T) : null;
}

/**
 * Today's entry if we have it; otherwise fetch the raw source and adapt it once, stored under the
 * date the source itself reports. Around midnight, before CosmyDay rolls over, that keeps serving
 * yesterday's adapted text instead of paying for the AI again on every request.
 */
async function cachedDaily<Raw extends { date: string }, T>(day: string, key: string, fetchRaw: () => Promise<Raw>, adapt: (raw: Raw) => Promise<T>): Promise<T> {
  const today = await readCache<T>(day, key);
  if (today) return today;
  const raw = await fetchRaw();
  if (raw.date !== day) {
    const existing = await readCache<T>(raw.date, key);
    if (existing) return existing;
  }
  const value = await adapt(raw);
  // Two first visitors can race; the first write wins and the second is simply ignored.
  await getDb().insert(skyDaily).values({ day: raw.date, key, payloadJson: JSON.stringify(value) }).onConflictDoNothing();
  return value;
}

// ---- The sky of the day (same for everyone) -------------------------------------------------

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

type MoonResponse = { date: string; moon: { sign: string; phase: string; illumination: number }; content: string };
type TransitResponse = { date: string; sky_summary: Record<string, unknown>; content: string };
type EventsResponse = { events: { date: string; kind: string; headline: string; sign?: string }[] };

function eventTitle(event: EventsResponse["events"][number]) {
  const sign = signPt(event.sign);
  const planet = planetPt(event.headline.split(" ")[0] ?? "");
  switch (event.kind) {
    case "full_moon": return `Lua Cheia em ${sign}`;
    case "new_moon": return `Lua Nova em ${sign}`;
    case "retrograde_start": return `${planet} inicia a retrogradação`;
    case "retrograde_end": return `${planet} volta ao movimento direto`;
    case "ingress": return `${planet} entra em ${sign}`;
    case "season_start": return `Começa a temporada de ${sign}`;
    case "eclipse_solar": return `Eclipse solar em ${sign}`;
    case "eclipse_lunar": return `Eclipse lunar em ${sign}`;
    default: return event.headline;
  }
}

function planetsFrom(summary: Record<string, unknown>): SkyPlanet[] {
  const order = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
  return order.flatMap((key) => {
    const entry = summary[key] as { sign?: string; degree?: number; retrograde?: boolean } | undefined;
    if (!entry?.sign) return [];
    return [{ name: PLANET_PT[key], sign: signPt(entry.sign), degree: Math.floor(entry.degree ?? 0), retrograde: Boolean(entry.retrograde) }];
  });
}

export function getSkyToday(day = brazilDayKey()): Promise<SkyToday> {
  const fetchRaw = async () => {
    const [moon, transit, upcoming] = await Promise.all([
      cosmyday<MoonResponse>("/content/moon"),
      cosmyday<TransitResponse>("/content/transit"),
      cosmyday<EventsResponse>("/events/upcoming?days=45&min_importance=50&limit=8"),
    ]);
    return { date: moon.date, moon, transit, upcoming };
  };
  return cachedDaily(day, "sky", fetchRaw, async ({ moon, transit, upcoming }): Promise<SkyToday> => {
    const articles = await adaptSkyArticles({ moon: moon.content, transit: transit.content });
    return {
      date: moon.date,
      moon: { sign: signPt(moon.moon.sign), phase: PHASE_PT[moon.moon.phase] ?? moon.moon.phase, illumination: Math.round(moon.moon.illumination), text: articles.moon },
      transit: { title: articles.transitTitle, text: articles.transit },
      planets: planetsFrom(transit.sky_summary),
      events: upcoming.events.map((event) => ({ date: event.date, kind: event.kind, title: eventTitle(event), meaning: EVENT_MEANING[event.kind] ?? "" })),
      source: SKY_SOURCE,
    };
  });
}

// ---- One sign's day ----------------------------------------------------------------------------

export type SignDaily = { date: string; sign: string; overview: string; work: string; relationships: string; energy: string; tip: string; source: string };
type DailyResponse = { date: string; sign: string; content: string };

export function getSignDaily(slug: SignEn, day = brazilDayKey()): Promise<SignDaily> {
  return cachedDaily(day, `sign:${slug}`, () => cosmyday<DailyResponse>(`/content/daily/${slug}`), async (raw): Promise<SignDaily> => {
    const adapted = await adaptSignDaily(SIGN_PT[slug], raw.content);
    return { date: raw.date, sign: SIGN_PT[slug], ...adapted, source: SKY_SOURCE };
  });
}

/** A compact paragraph of today's sky for the chat's system context. Never throws. */
export async function skyContextForChat(signName: string): Promise<string | null> {
  const slug = signSlugFromName(signName);
  try {
    const [sky, daily] = await Promise.all([getSkyToday(), slug ? getSignDaily(slug) : Promise.resolve(null)]);
    const planets = sky.planets.map((planet) => `${planet.name} em ${planet.sign}${planet.retrograde ? " (retrógrado)" : ""}`).join(", ");
    const events = sky.events.slice(0, 4).map((event) => `${event.title} (${event.date.split("-").reverse().slice(0, 2).join("/")})`).join("; ");
    return [
      `Céu de hoje (${sky.date}, dados reais da CosmyDay): Lua em ${sky.moon.sign}, fase ${sky.moon.phase}. ${planets}.`,
      events ? `Próximos eventos: ${events}.` : null,
      `Clima do dia: ${sky.transit.title} — ${sky.transit.text}`,
      daily ? `Leitura de hoje para ${daily.sign}: ${daily.overview} Trabalho e metas: ${daily.work} Relações: ${daily.relationships} Energia: ${daily.energy} Dica: ${daily.tip}` : null,
    ].filter(Boolean).join("\n");
  } catch {
    return null;
  }
}
