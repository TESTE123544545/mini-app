import { env } from "cloudflare:workers";
import { cleanTranslation, OpenRouterError, translatePrompt, translateTexts as translateWithOpenRouter } from "@/lib/openrouter";

/**
 * Interface translation. Workers AI (the account's own free daily allowance, no extra key) goes first;
 * OpenRouter, which needs paid credits, is the fallback when the binding is missing or fails.
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

async function translateWithWorkersAi(ai: AiBinding, language: string, texts: string[]): Promise<string[]> {
  const size = texts.reduce((total, text) => total + text.length, 0);
  const result = await ai.run(WORKERS_AI_MODEL, {
    messages: [{ role: "system", content: translatePrompt(language) }, { role: "user", content: JSON.stringify({ texts }) }],
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

export async function translateBatch(language: string, texts: string[]): Promise<string[]> {
  const ai = (env as unknown as { AI?: AiBinding }).AI;
  if (ai) {
    try { return await translateWithWorkersAi(ai, language, texts); } catch (error) { console.error("workers_ai_translate_failed", error instanceof Error ? error.message : error); }
  }
  return translateWithOpenRouter(language, texts);
}
