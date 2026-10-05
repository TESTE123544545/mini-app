import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { chatThreads, profiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { hasPremium } from "@/lib/plan";
import { containsAbusiveLanguage } from "@/lib/moderation";
import { chatReplyPieces, finalizeChatReply, OpenRouterError } from "@/lib/openrouter";
import { settleWithin, skyContextForChat } from "@/lib/sky";
import { LANG_CODES, languageEnglishName } from "@/lib/i18n";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse, suspendFor } from "@/lib/security";

const ABUSE_SUSPENSION_SECONDS = 4 * 60;
const MAX_STORED_MESSAGES = 40;

const bodySchema = z.object({
  threadId: z.number().int().positive().optional(),
  message: z.string().trim().min(1).max(2000),
  lang: z.enum(LANG_CODES).optional(),
  // The answer is sent as it is written (text, then a NUL and a JSON tail) instead of all at once.
  stream: z.boolean().optional(),
}).strict();

type StoredMessage = { role: "user" | "assistant"; content: string };

function threadTitle(message: string) {
  const flat = message.trim().replace(/\s+/g, " ");
  return flat.length > 40 ? `${flat.slice(0, 40)}…` : flat;
}

export async function POST(request: Request) {
  try {
    const rawPayload = await readJsonBody<unknown>(request, 8 * 1024);
    const parsed = bodySchema.safeParse(rawPayload);
    if (!parsed.success) throw new RequestError("Dados inválidos.", 400);

    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    await enforceRateLimit(request, "chat", user.id, 40, 3600);
    const deviceId = user.primaryDeviceId;
    if (!deviceId) throw new RequestError("Jornada não encontrada.", 400);

    const db = getDb();
    const [profile] = await db.select().from(profiles).where(eq(profiles.deviceId, deviceId)).limit(1);
    if (!profile) throw new RequestError("Perfil não encontrado.", 404);
    if (!hasPremium(profile.plan, user)) throw new RequestError("Recurso exclusivo do plano Premium.", 402);

    if (containsAbusiveLanguage(parsed.data.message)) {
      await suspendFor(request, "chat", user.id, ABUSE_SUSPENSION_SECONDS);
      throw new RequestError("Vamos manter a conversa respeitosa. Você poderá voltar a conversar em alguns minutos.", 429, ABUSE_SUSPENSION_SECONDS);
    }

    let thread: { id: number; messagesJson: string } | undefined;
    if (parsed.data.threadId) {
      [thread] = await db.select({ id: chatThreads.id, messagesJson: chatThreads.messagesJson })
        .from(chatThreads).where(and(eq(chatThreads.id, parsed.data.threadId), eq(chatThreads.deviceId, deviceId))).limit(1);
      if (!thread) throw new RequestError("Conversa não encontrada.", 404);
    }

    const history: StoredMessage[] = thread ? JSON.parse(thread.messagesJson) : [];
    // Today's sky helps, but the answer never waits more than a second and a half for it.
    const sky = (await settleWithin(skyContextForChat(profile.sign), 1500)) ?? null;
    const context = { sign: profile.sign, objective: profile.objective, intention: profile.intention, sky };
    const turns = [...history, { role: "user" as const, content: parsed.data.message }];
    const language = parsed.data.lang && parsed.data.lang !== "pt" ? languageEnglishName(parsed.data.lang) : undefined;

    const save = async (reply: string) => {
      const nextMessages: StoredMessage[] = [...turns, { role: "assistant" as const, content: reply }].slice(-MAX_STORED_MESSAGES);
      const now = new Date().toISOString();
      if (thread) {
        await db.update(chatThreads).set({ messagesJson: JSON.stringify(nextMessages), updatedAt: now }).where(eq(chatThreads.id, thread.id));
        return thread.id;
      }
      const [created] = await db.insert(chatThreads).values({ deviceId, title: threadTitle(parsed.data.message), messagesJson: JSON.stringify(nextMessages), updatedAt: now }).returning({ id: chatThreads.id });
      return created.id;
    };

    if (parsed.data.stream) {
      const encoder = new TextEncoder();
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          let written = "";
          try {
            for await (const piece of chatReplyPieces(context, turns, language)) {
              written += piece;
              controller.enqueue(encoder.encode(piece));
            }
            if (!written.trim()) throw new OpenRouterError("A IA não retornou conteúdo.");
            const reply = finalizeChatReply(written);
            const threadId = await save(reply);
            controller.enqueue(encoder.encode("\u0000" + JSON.stringify({ threadId, ...(reply !== written.trim() ? { replace: reply } : {}) })));
          } catch (error) {
            const message = error instanceof OpenRouterError ? error.message : "Não foi possível responder agora.";
            if (!(error instanceof OpenRouterError)) console.error("chat_stream_failed", error);
            controller.enqueue(encoder.encode("\u0000" + JSON.stringify({ error: message })));
          }
          controller.close();
        },
      });
      return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
    }

    let reply = "";
    for await (const piece of chatReplyPieces(context, turns, language)) reply += piece;
    if (!reply.trim()) throw new OpenRouterError("A IA não retornou conteúdo.");
    reply = finalizeChatReply(reply);
    return Response.json({ reply, threadId: await save(reply) });
  } catch (error) {
    if (error instanceof OpenRouterError) return Response.json({ error: error.message }, { status: 502 });
    return secureErrorResponse(error, "Não foi possível responder agora.");
  }
}
