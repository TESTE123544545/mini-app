import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { generateChatReply, OpenRouterError } from "@/lib/openrouter";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(2000),
  })).max(21).default([]),
  message: z.string().trim().min(1).max(2000),
}).strict();

export async function POST(request: Request) {
  try {
    const rawPayload = await readJsonBody<unknown>(request, 32 * 1024);
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

    const reply = await generateChatReply(
      { sign: profile.sign, objective: profile.objective, intention: profile.intention },
      [...parsed.data.history, { role: "user", content: parsed.data.message }],
    );

    return Response.json({ reply });
  } catch (error) {
    if (error instanceof OpenRouterError) return Response.json({ error: error.message }, { status: 502 });
    return secureErrorResponse(error, "Não foi possível responder agora.");
  }
}
