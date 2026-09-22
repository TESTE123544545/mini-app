import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { aiWeeklyReports, goals, journalEntries, profiles, userProgress } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { localDayKey } from "@/lib/daily";
import { weeklyReport } from "@/lib/journey";
import { generateWeeklyReportText, OpenRouterError } from "@/lib/openrouter";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({
  dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nextThemeVerb: z.string().trim().min(1).max(40),
}).strict();

/** Monday of the ISO week containing dayKey — the cache key, so generation happens at most once per person per week. */
function weekStartMonday(dayKey: string) {
  const [year, month, date] = dayKey.split("-").map(Number);
  const day = new Date(Date.UTC(year, month - 1, date));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const rawPayload = await readJsonBody<unknown>(request, 4 * 1024);
    const parsed = bodySchema.safeParse(rawPayload);
    if (!parsed.success) throw new RequestError("Dados inválidos.", 400);

    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    await enforceRateLimit(request, "weekly_report_ai", user.id, 20, 3600);
    const deviceId = user.primaryDeviceId;
    if (!deviceId) throw new RequestError("Jornada não encontrada.", 400);

    const db = getDb();
    const [profile] = await db.select().from(profiles).where(eq(profiles.deviceId, deviceId)).limit(1);
    if (!profile) throw new RequestError("Perfil não encontrado.", 404);
    if (profile.plan !== "premium") throw new RequestError("Recurso exclusivo do plano Premium.", 402);

    const today = parsed.data.dayKey ?? localDayKey();
    const weekStart = weekStartMonday(today);

    const [cached] = await db.select().from(aiWeeklyReports)
      .where(and(eq(aiWeeklyReports.deviceId, deviceId), eq(aiWeeklyReports.weekStart, weekStart))).limit(1);
    if (cached) return Response.json({ summary: cached.summary, recommendation: cached.recommendation });

    const [progress] = await db.select().from(userProgress).where(eq(userProgress.deviceId, deviceId)).limit(1);
    const activeGoals = await db.select().from(goals).where(and(eq(goals.deviceId, deviceId), eq(goals.status, "active")));
    const entryDates = await db.select({ entryDate: journalEntries.entryDate }).from(journalEntries).where(eq(journalEntries.deviceId, deviceId));

    const base = weeklyReport(
      {
        xp: progress?.xp ?? 0,
        streak: progress?.streak ?? 0,
        entries: entryDates.map((entry) => ({ date: entry.entryDate, answers: [] })),
        goals: activeGoals.map((goal) => ({ title: goal.title, category: goal.category, progress: goal.progress })),
      },
      parsed.data.nextThemeVerb,
    );

    const generated = await generateWeeklyReportText({
      sign: profile.sign,
      objective: profile.objective,
      intention: profile.intention,
      stage: base.newOnTree,
      streak: base.streak,
      reflections: base.reflections,
      goalsAdvancing: base.goalsAdvancing,
      fruits: base.fruits,
      topArea: base.topArea,
      goalTitles: activeGoals.map((goal) => goal.title),
      nextThemeVerb: parsed.data.nextThemeVerb,
    });

    await db.insert(aiWeeklyReports)
      .values({ deviceId, weekStart, summary: generated.summary, recommendation: generated.recommendation })
      .onConflictDoUpdate({ target: [aiWeeklyReports.deviceId, aiWeeklyReports.weekStart], set: generated });

    return Response.json(generated);
  } catch (error) {
    if (error instanceof OpenRouterError) return Response.json({ error: error.message }, { status: 502 });
    return secureErrorResponse(error, "Não foi possível gerar o relatório com IA agora.");
  }
}
