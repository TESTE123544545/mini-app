import { and, eq, like } from "drizzle-orm";
import { getDb } from "@/db";
import { skyDaily } from "@/db/schema";
import { allPairs, compatLevel, pairSlug } from "@/lib/compat";
import { announceUpdated } from "@/lib/indexnow";
import { generateArticle, type Article } from "@/lib/openrouter";
import { ZODIAC_SIGNS, type ZodiacSign } from "@/lib/zodiacContent";

/**
 * Long evergreen articles for the public SEO pages — each sign in love, with money and its
 * personality (36) and every sign pair's compatibility (78). They are written once by the AI in
 * the background (buildMissingArticles, run by the cron) and stored in D1; pages only read them
 * and show a shorter text of their own until the article exists.
 */

export type SignTopic = "no-amor" | "e-dinheiro" | "personalidade";
export const SIGN_TOPICS: { slug: SignTopic; label: string }[] = [
  { slug: "no-amor", label: "no amor" },
  { slug: "e-dinheiro", label: "e o dinheiro" },
  { slug: "personalidade", label: "personalidade" },
];

const EVERGREEN = "evergreen";
const signKey = (sign: ZodiacSign, topic: SignTopic) => `article:v1:${sign.slug}:${topic}`;
const compatKey = (a: ZodiacSign, b: ZodiacSign) => `compat:v1:${pairSlug(a, b)}`;

function facts(sign: ZodiacSign) {
  return [
    `${sign.name}: ${sign.dateRange}; elemento ${sign.element}; modalidade ${sign.modality}; regente ${sign.rulingPlanet}.`,
    `Visão geral de ${sign.name}: ${sign.overview.join(" ")}`,
    `${sign.name} no amor: ${sign.love}`,
    `${sign.name} na carreira e no dinheiro: ${sign.career}`,
    `Onde ${sign.name} pode crescer: ${sign.growth}`,
    `Características de ${sign.name}: ${sign.traits.join(", ")}. Combina com: ${sign.compatibleSigns.join(", ")}.`,
  ];
}

function signBrief(sign: ZodiacSign, topic: SignTopic) {
  const n = sign.name;
  if (topic === "no-amor") return { title: `${n} no amor`, brief: `como o signo de ${n} ama, o que busca num relacionamento e como se relaciona`, sections: [`Como ${n} ama`, `O que ${n} procura num relacionamento`, `Sinais de que ${n} está apaixonado`, `Pontos de atenção de ${n} no amor`, `Com quem ${n} combina`, `Como conquistar e manter ${n} por perto`] };
  if (topic === "e-dinheiro") return { title: `${n} e o dinheiro`, brief: `a relação do signo de ${n} com dinheiro, carreira e prosperidade, sempre como tendência simbólica e com hábitos práticos`, sections: [`Como ${n} lida com dinheiro`, `${n} na carreira`, `Forças financeiras de ${n}`, `Armadilhas de ${n} com dinheiro`, `Hábitos de prosperidade para ${n}`, `Como ${n} pode usar a astrologia para organizar a vida financeira`] };
  return { title: `Personalidade de ${n}`, brief: `as características, qualidades e sombras do signo de ${n}`, sections: [`Características de ${n}`, `Qualidades de ${n}`, `Defeitos e sombras de ${n}`, `${n} no trabalho`, `${n} na amizade e na família`, `Como ${n} pode crescer`] };
}

function compatBrief(a: ZodiacSign, b: ZodiacSign) {
  const level = compatLevel(a, b);
  const pair = a.slug === b.slug ? `${a.name} com ${a.name}` : `${a.name} e ${b.name}`;
  return {
    title: `${pair}: compatibilidade no amor`,
    brief: `a compatibilidade amorosa entre ${pair}, também na amizade e no trabalho, como leitura simbólica`,
    sections: [`A sintonia entre ${pair}`, "No amor e no romance", "Na convivência e na amizade", "No trabalho e no dinheiro", "Desafios do casal", "Dicas para a relação dar certo"],
    facts: [...facts(a), ...(a.slug === b.slug ? [] : facts(b)), `Leitura dos elementos (${level.label}): ${level.summary}`],
  };
}

async function readEvergreen(key: string): Promise<Article | null> {
  const [row] = await getDb().select({ payloadJson: skyDaily.payloadJson }).from(skyDaily).where(and(eq(skyDaily.day, EVERGREEN), eq(skyDaily.key, key))).limit(1);
  return row ? (JSON.parse(row.payloadJson) as Article) : null;
}

/** Never throws: a page without its article still renders its own text. */
export const getSignArticle = (sign: ZodiacSign, topic: SignTopic) => readEvergreen(signKey(sign, topic)).catch(() => null);
export const getCompatArticle = (a: ZodiacSign, b: ZodiacSign) => readEvergreen(compatKey(a, b)).catch(() => null);

type Job = { key: string; path: string; spec: { title: string; brief: string; sections: string[]; facts: string[] } };

function allJobs(): Job[] {
  const signJobs = ZODIAC_SIGNS.flatMap((sign) => SIGN_TOPICS.map(({ slug }) => ({ key: signKey(sign, slug), path: `/signos/${sign.slug}/${slug}`, spec: { ...signBrief(sign, slug), facts: facts(sign) } })));
  const compatJobs = allPairs().map(([a, b]) => ({ key: compatKey(a, b), path: `/compatibilidade/${pairSlug(a, b)}`, spec: compatBrief(a, b) }));
  return [...signJobs, ...compatJobs];
}

/**
 * Writes the articles that don't exist yet, a few at a time, and announces each new page through
 * IndexNow. Safe to run often: when everything exists it is one small query.
 */
export async function buildMissingArticles({ limit = 8, concurrency = 4 } = {}) {
  const db = getDb();
  const existing = new Set((await db.select({ key: skyDaily.key }).from(skyDaily).where(and(eq(skyDaily.day, EVERGREEN), like(skyDaily.key, "%:v1:%")))).map((row) => row.key));
  const queue = allJobs().filter((job) => !existing.has(job.key)).slice(0, limit);
  const written: string[] = [];
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      try {
        const article = await generateArticle(job.spec);
        await db.insert(skyDaily).values({ day: EVERGREEN, key: job.key, payloadJson: JSON.stringify(article) }).onConflictDoNothing();
        written.push(job.path);
      } catch (error) {
        console.error("article_failed", job.key, error);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  if (written.length) announceUpdated(written);
  return written.length;
}
