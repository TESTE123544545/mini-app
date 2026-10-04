import { env } from "cloudflare:workers";
import { cleanTranslation, OpenRouterError, translatePrompt, translateTexts as translateWithOpenRouter } from "@/lib/openrouter";

/**
 * Interface translation. Workers AI (the account's own free daily allowance, no extra key) goes first;
 * OpenRouter, which needs paid credits, is the fallback when the binding is missing.
 * Gemma 4 with its "thinking" switched off: fast (1-6 s per batch) and accurate across all our languages.
 */
const WORKERS_AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";

type AiBinding = { run(model: string, input: unknown): Promise<unknown> };

function parseJson(text: string): unknown {
  try { return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); } catch { return null; }
}

/** The model's answer as a JSON value: already parsed, or inside the text of the reply. */
function readAnswer(result: unknown): unknown {
  const value = result as { response?: unknown; choices?: { message?: { content?: unknown } }[] } | string | null;
  if (typeof value === "string") return parseJson(value);
  if (value?.response && typeof value.response === "object") return value.response;
  const text = typeof value?.response === "string" ? value.response : value?.choices?.[0]?.message?.content;
  return typeof text === "string" ? parseJson(text) : null;
}

/** The list of translated strings, whichever of the shapes the model chose, or null if it does not line up. */
function toStrings(answer: unknown, count: number): string[] | null {
  let list = (answer as { translations?: unknown } | null)?.translations;
  if (Array.isArray(list) && list.length === 1 && Array.isArray((list[0] as { texts?: unknown } | null)?.texts)) list = (list[0] as { texts: unknown[] }).texts;
  if (!Array.isArray(list) || list.length !== count) return null;
  const strings = list.map((item) => (typeof item === "string" ? item : typeof (item as { translation?: unknown } | null)?.translation === "string" ? (item as { translation: string }).translation : null));
  return strings.every((item) => item !== null) ? (strings as string[]) : null;
}

async function translateWithWorkersAi(ai: AiBinding, language: string, texts: string[], force: boolean): Promise<string[]> {
  const size = texts.reduce((total, text) => total + text.length, 0);
  const result = await ai.run(WORKERS_AI_MODEL, {
    messages: [{ role: "system", content: translatePrompt(language, force) }, { role: "user", content: JSON.stringify({ texts: texts.map(soften) }) }],
    max_tokens: Math.min(8000, 500 + size * 3),
    temperature: 0.2,
    chat_template_kwargs: { enable_thinking: false },
  });
  const strings = toStrings(readAnswer(result), texts.length);
  if (!strings) {
    console.error("workers_ai_shape", JSON.stringify(result).slice(0, 400));
    throw new OpenRouterError("A tradução veio incompleta.");
  }
  return strings.map((item, index) => cleanTranslation(item, texts[index]));
}

/**
 * The app's own section names are capitalised in the Portuguese text, which makes the model treat them as
 * proper nouns and leave them untranslated ("o seu Jornada"). Lower-cased, they are ordinary words again.
 */
const SECTION_WORDS = /\b(Jornada|Ritual|Perfil|Árvore|Diário|Missão|Raízes|Momento|Signos|Início|Conquistas)\b/g;
const soften = (text: string) => text.replace(SECTION_WORDS, (word) => word.toLowerCase());

/** Names the model is right to leave alone. */
const KEEP = /^(Veias da Sintonia|Sintonia|Premium|XP)$/i;
/** Scripts without accented Latin letters: any ã, ç, é… in the answer is Portuguese the model left behind. */
const NON_LATIN = new Set(["Japanese", "Simplified Chinese", "Korean", "Arabic", "Hindi", "Thai", "Russian"]);
const BRANDS = /Veias da Sintonia|Sintonia|Premium/g;
const stillPortuguese = (language: string, source: string, out: string) =>
  (out === source && /\p{L}{3,}/u.test(source) && !KEEP.test(source.trim()))
  || (NON_LATIN.has(language) && (/[ãõçáàâéêíóôú]/i.test(out.replace(BRANDS, "")) || (source.replace(BRANDS, "").match(/[A-Za-zÀ-ú]{4,}/g) ?? []).some((word) => out.toLowerCase().includes(word.toLowerCase()))));

async function once(language: string, texts: string[], force = false): Promise<string[]> {
  const ai = (env as unknown as { AI?: AiBinding }).AI;
  return ai ? translateWithWorkersAi(ai, language, texts, force) : translateWithOpenRouter(language, texts);
}

/**
 * A batch the model answers badly (wrong count) is split in halves until each piece lines up, so one
 * bad answer never costs the other strings; items it hands back unchanged get a second, firmer try.
 */
export async function translateBatch(language: string, texts: string[]): Promise<string[]> {
  let result: string[];
  try {
    result = await once(language, texts);
  } catch (error) {
    if (texts.length === 1) throw error;
    const middle = Math.ceil(texts.length / 2);
    const [left, right] = await Promise.all([translateBatch(language, texts.slice(0, middle)), translateBatch(language, texts.slice(middle))]);
    return [...left, ...right];
  }
  const retry = result.flatMap((out, index) => (stillPortuguese(language, texts[index], out) ? [index] : []));
  if (retry.length) {
    try {
      const fixed = await once(language, retry.map((index) => texts[index]), true);
      retry.forEach((index, position) => { result[index] = fixed[position]; });
    } catch { /* keep what we have: it is still better than nothing */ }
  }
  return result;
}
