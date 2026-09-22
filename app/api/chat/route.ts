import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { chatThreads, profiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { containsAbusiveLanguage } from "@/lib/moderation";
import { generateChatReply, OpenRouterError } from "@/lib/openrouter";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse, suspendFor } from "@/lib/security";

const ABUSE_SUSPENSION_SECONDS = 4 * 60;
const MAX_STORED_MESSAGES = 40;

const bodySchema = z.object({
  threadId: z.number().int().positive().optional(),
  message: z.string().trim().min(1).max(2000),
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
    if (profile.plan !== "premium") throw new RequestError("Recurso exclusivo do plano Premium.", 402);

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
    const reply = await generateChatReply(
      { sign: profile.sign, objective: profile.objective, intention: profile.intention },
      [...history, { role: "user", content: parsed.data.message }],
    );

    const nextMessages: StoredMessage[] = [
      ...history,
      { role: "user", content: parsed.data.message },
      { role: "assistant", content: reply },
    ].slice(-MAX_STORED_MESSAGES);
    const now = new Date().toISOString();

    let threadId = thread?.id;
    if (thread) {
      await db.update(chatThreads).set({ messagesJson: JSON.stringify(nextMessages), updatedAt: now }).where(eq(chatThreads.id, thread.id));
    } else {
      const [created] = await db.insert(chatThreads).values({
        deviceId,
        title: threadTitle(parsed.data.message),
        messagesJson: JSON.stringify(nextMessages),
        updatedAt: now,
      }).returning({ id: chatThreads.id });
      threadId = created.id;
    }

    return Response.json({ reply, threadId });
  } catch (error) {
    if (error instanceof OpenRouterError) return Response.json({ error: error.message }, { status: 502 });
    return secureErrorResponse(error, "Não foi possível responder agora.");
  }
}
