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

/**
 * The same call as runWorkersAi, but yielding the reply piece by piece as the model writes it, so the
 * person starts reading in under a second. Yields nothing when the binding is missing or the call fails.
 */
export async function* streamWorkersAi(messages: Turn[], maxTokens: number, temperature: number): AsyncGenerator<string> {
  const ai = (env as unknown as { AI?: AiBinding }).AI;
  if (!ai) return;
  let result: unknown;
  try {
    result = await ai.run(WORKERS_AI_MODEL, { messages, max_tokens: maxTokens, temperature, stream: true, chat_template_kwargs: { enable_thinking: false } });
  } catch (error) {
    console.error("workers_ai_stream_failed", error instanceof Error ? error.message : error);
    return;
  }
  if (!(result instanceof ReadableStream)) {
    const value = result as { response?: unknown; choices?: { message?: { content?: unknown } }[] } | string | null;
    const text = typeof value === "string" ? value : value?.choices?.[0]?.message?.content ?? value?.response;
    if (typeof text === "string" && text) yield text;
    return;
  }
  const reader = (result as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const chunk = JSON.parse(data) as { response?: unknown; choices?: { delta?: { content?: unknown } }[] };
        const piece = chunk.response ?? chunk.choices?.[0]?.delta?.content;
        if (typeof piece === "string" && piece) yield piece;
      } catch { /* a partial or non-JSON line: skip it */ }
    }
  }
}
