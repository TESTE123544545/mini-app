import { gt, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { translations } from "@/db/schema";
import { hashToken } from "@/lib/auth";
import { LANG_CODES, languageEnglishName, TRANSLATION_VERSION } from "@/lib/i18n";
import { OpenRouterError } from "@/lib/openrouter";
import { translateBatch } from "@/lib/translate";
import { enforceFastLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

// Anyone can reach this (the welcome screen is translated before sign-in), so it is bounded three ways:
// small batches, a per-IP limit, and a daily cap on strings that are not in the shared cache yet.
const schema = z.object({
  lang: z.enum(LANG_CODES),
  texts: z.array(z.string().trim().min(1).max(1500)).min(1).max(50),
}).strict();

const MAX_BATCH_CHARS = 9000;
const NEW_STRINGS_PER_DAY = 8000;
const ROWS_PER_INSERT = 20; // D1 allows 100 bound values per statement; 4 columns each

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await readJsonBody<unknown>(request, 80 * 1024));
    if (!parsed.success) throw new RequestError("Os dados enviados são inválidos.", 400);
    const { lang, texts } = parsed.data;
    if (lang === "pt") return Response.json({ translations: texts });
    if (texts.reduce((total, text) => total + text.length, 0) > MAX_BATCH_CHARS) throw new RequestError("Lote grande demais.", 413);
    await enforceFastLimit(request, "LIMIT_120", "translate", "batch", 120, 60);

    const db = getDb();
    const keys = await Promise.all(texts.map((text) => hashToken(`${TRANSLATION_VERSION}\n${lang}\n${text}`)));
    const known = new Map((await db.select().from(translations).where(inArray(translations.key, [...new Set(keys)]))).map((row) => [row.key, row.text]));

    const missing = [...new Set(keys.filter((key) => !known.has(key)))];
    if (missing.length) {
      const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(translations).where(gt(translations.createdAt, new Date(Date.now() - 86_400_000).toISOString()));
      if (Number(n) + missing.length > NEW_STRINGS_PER_DAY) throw new RequestError("A tradução automática está indisponível agora. Tente mais tarde.", 503);
      const sources = missing.map((key) => texts[keys.indexOf(key)]);
      const done = await translateBatch(languageEnglishName(lang), sources);
      const now = new Date().toISOString();
      const rows = missing.map((key, index) => ({ key, lang, text: done[index], createdAt: now }));
      for (let start = 0; start < rows.length; start += ROWS_PER_INSERT) await db.insert(translations).values(rows.slice(start, start + ROWS_PER_INSERT)).onConflictDoNothing();
      rows.forEach((row) => known.set(row.key, row.text));
    }
    return Response.json({ translations: keys.map((key, index) => known.get(key) ?? texts[index]) });
  } catch (error) {
    if (error instanceof OpenRouterError) console.error("translate_failed", error.message);
    if (error instanceof OpenRouterError) return Response.json({ error: "A tradução automática falhou. Tente de novo." }, { status: 502 });
    return secureErrorResponse(error, "Não foi possível traduzir agora.");
  }
}
