import { env } from "cloudflare:workers";

/**
 * Text generation on Cloudflare Workers AI: the account's own free daily allowance, no extra key and
 * nothing leaves the account. Gemma 4 with its "thinking" switched off answers in 1-4 seconds.
 * Returns null when the binding is missing or the call fails, so the caller can fall back.
 */
export const WORKERS_AI_MODEL = "@cf/google/gemma-4-26b-a4b-it";

type Turn = { role: "system" | "user" | "assistant"; content: string };
type AiBinding = { run(model: string, input: unknown): Promise<unknown> };

export async function runWorkersAi(messages: Turn[], maxTokens: number, temperature: number): Promise<string | null> {
  const ai = (env as unknown as { AI?: AiBinding }).AI;
  if (!ai) return null;
  try {
    const result = await ai.run(WORKERS_AI_MODEL, { messages, max_tokens: maxTokens, temperature, chat_template_kwargs: { enable_thinking: false } });
    const value = result as { response?: unknown; choices?: { message?: { content?: unknown } }[] } | string | null;
    const text = typeof value === "string" ? value : value?.choices?.[0]?.message?.content ?? value?.response;
    const out = typeof text === "string" ? text : text && typeof text === "object" ? JSON.stringify(text) : "";
    return out.trim() ? out : null;
  } catch (error) {
    console.error("workers_ai_failed", error instanceof Error ? error.message : error);
    return null;
  }
}
