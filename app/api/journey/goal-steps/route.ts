import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { goalSuggestions, goals, profiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { generateGoalSteps, OpenRouterError } from "@/lib/openrouter";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({ goalId: z.number().int().positive() }).strict();

export async function POST(request: Request) {
  try {
    const rawPayload = await readJsonBody<unknown>(request, 4 * 1024);
    const parsed = bodySchema.safeParse(rawPayload);
    if (!parsed.success) throw new RequestError("Dados inválidos.", 400);

    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    await enforceRateLimit(request, "goal_steps", user.id, 20, 3600);
    const deviceId = user.primaryDeviceId;
    if (!deviceId) throw new RequestError("Jornada não encontrada.", 400);

    const db = getDb();
    const [profile] = await db.select().from(profiles).where(eq(profiles.deviceId, deviceId)).limit(1);
    if (!profile) throw new RequestError("Perfil não encontrado.", 404);
    if (profile.plan !== "premium") throw new RequestError("Recurso exclusivo do plano Premium.", 402);

    const [goal] = await db.select().from(goals).where(and(eq(goals.id, parsed.data.goalId), eq(goals.deviceId, deviceId))).limit(1);
    if (!goal) throw new RequestError("Meta não encontrada.", 404);

    const [cached] = await db.select().from(goalSuggestions).where(eq(goalSuggestions.goalId, goal.id)).limit(1);
    if (cached) return Response.json({ steps: JSON.parse(cached.stepsJson) });

    const steps = await generateGoalSteps({
      title: goal.title,
      category: goal.category,
      kind: goal.kind ?? "non_financial",
      targetAmount: goal.targetAmount ?? undefined,
      motivation: goal.motivation ?? "",
      stage: goal.stage ?? undefined,
      blocker: goal.blocker ?? undefined,
      dailyMinutes: goal.dailyMinutes ?? undefined,
    });

    await db.insert(goalSuggestions).values({ goalId: goal.id, deviceId, stepsJson: JSON.stringify(steps) })
      .onConflictDoUpdate({ target: goalSuggestions.goalId, set: { stepsJson: JSON.stringify(steps) } });

    return Response.json({ steps });
  } catch (error) {
    if (error instanceof OpenRouterError) return Response.json({ error: error.message }, { status: 502 });
    return secureErrorResponse(error, "Não foi possível gerar sugestões agora.");
  }
}
