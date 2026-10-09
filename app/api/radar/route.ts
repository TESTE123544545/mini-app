import { and, desc, eq, notInArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { profiles, radarReports } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { containsAbusiveLanguage } from "@/lib/moderation";
import { OpenRouterError } from "@/lib/openrouter";
import { hasPremium } from "@/lib/plan";
import { analyze, boostPlan, offerKit, sellPlan } from "@/lib/radar/engine";
import { SELL_MODELS, SOCIALS, VISIBILITY, type RadarAnswers, type RadarResult } from "@/lib/radar/types";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const KEEP_REPORTS = 5;
const text = (max: number) => z.string().trim().max(max);

const answersSchema = z.object({
  likes: text(600), topics: text(600), skills: text(600), helpWith: text(600),
  hoursPerDay: z.number().min(0.25).max(16),
  investment: z.number().min(0).max(1_000_000),
  monthlyGoal: z.number().min(0).max(10_000_000),
  model: z.enum(SELL_MODELS.map((item) => item[0]) as [string, ...string[]]),
  visibility: z.enum(VISIBILITY.map((item) => item[0]) as [string, ...string[]]),
  equipment: text(400),
  socials: z.array(z.enum(SOCIALS)).max(SOCIALS.length),
  place: text(120), niche: text(300),
  hourValue: z.number().min(0).max(100_000).nullable(),
  monthlyIncome: z.number().min(0).max(10_000_000).nullable(),
  monthlyHours: z.number().min(1).max(744).nullable(),
}).strict();

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("analyze"), answers: answersSchema }).strict(),
  z.object({ action: z.enum(["detail", "offer", "boost"]), reportId: z.number().int().positive(), opportunityId: z.string().min(1).max(60) }).strict(),
]);

async function premiumDevice(request: Request) {
  const user = await getSessionUser(request);
  if (!user) throw new RequestError("Entre na sua conta.", 401);
  if (!user.primaryDeviceId) throw new RequestError("Conclua seu cadastro no app antes de usar o Radar.", 409);
  const [profile] = await getDb().select().from(profiles).where(eq(profiles.deviceId, user.primaryDeviceId)).limit(1);
  if (!profile) throw new RequestError("Perfil não encontrado.", 404);
  if (!hasPremium(profile.plan, user)) throw new RequestError("O Radar da Prosperidade é exclusivo do plano Premium.", 402);
  return { user, deviceId: user.primaryDeviceId };
}

/** GET /api/radar: the latest analysis (answers and results), so the screen opens where the person left off. */
export async function GET(request: Request) {
  try {
    const { deviceId } = await premiumDevice(request);
    const [row] = await getDb().select().from(radarReports).where(eq(radarReports.deviceId, deviceId)).orderBy(desc(radarReports.createdAt), desc(radarReports.id)).limit(1);
    const report = row ? { id: row.id, createdAt: row.createdAt, answers: JSON.parse(row.answersJson) as RadarAnswers, result: JSON.parse(row.resultJson) as RadarResult } : null;
    return Response.json({ report }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível abrir o Radar agora.");
  }
}

/** POST /api/radar: analyze the answers, or build the plan / offer / growth ideas of one opportunity. Premium only. */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 16 * 1024));
    if (!parsed.success) throw new RequestError("Confira as respostas e tente de novo.", 400);
    const { user, deviceId } = await premiumDevice(request);
    const body = parsed.data;
    const db = getDb();

    if (body.action === "analyze") {
      await enforceRateLimit(request, "radar-analyze", user.id, 8, 3600);
      const answers = body.answers as RadarAnswers;
      if (containsAbusiveLanguage([answers.likes, answers.topics, answers.skills, answers.helpWith, answers.niche, answers.equipment, answers.place].join(" "))) {
        throw new RequestError("Vamos manter o respeito nas respostas para o Radar funcionar bem.", 400);
      }
      const result = await analyze(answers);
      const [created] = await db.insert(radarReports).values({ deviceId, answersJson: JSON.stringify(answers), resultJson: JSON.stringify(result) }).returning({ id: radarReports.id, createdAt: radarReports.createdAt });
      // Only the latest few analyses are kept.
      const recent = await db.select({ id: radarReports.id }).from(radarReports).where(eq(radarReports.deviceId, deviceId)).orderBy(desc(radarReports.createdAt), desc(radarReports.id)).limit(KEEP_REPORTS);
      await db.delete(radarReports).where(and(eq(radarReports.deviceId, deviceId), notInArray(radarReports.id, recent.map((row) => row.id))));
      return Response.json({ report: { id: created.id, createdAt: created.createdAt, answers, result } });
    }

    await enforceRateLimit(request, "radar-detail", user.id, 40, 3600);
    const [row] = await db.select().from(radarReports).where(and(eq(radarReports.id, body.reportId), eq(radarReports.deviceId, deviceId))).limit(1);
    if (!row) throw new RequestError("Análise não encontrada.", 404);
    const answers = JSON.parse(row.answersJson) as RadarAnswers;
    const result = JSON.parse(row.resultJson) as RadarResult;
    const opportunity = result.opportunities.find((item) => item.id === body.opportunityId);
    if (!opportunity) throw new RequestError("Oportunidade não encontrada.", 404);

    // Each piece is generated once per analysis and kept, so reopening it is instant and free.
    if (body.action === "detail" && !result.plans[opportunity.id]) result.plans[opportunity.id] = await sellPlan(opportunity, answers);
    if (body.action === "offer" && !result.offers[opportunity.id]) result.offers[opportunity.id] = await offerKit(opportunity, answers);
    if (body.action === "boost" && !result.boosts[opportunity.id]) result.boosts[opportunity.id] = await boostPlan(opportunity, answers);
    await db.update(radarReports).set({ resultJson: JSON.stringify(result), updatedAt: new Date().toISOString() }).where(eq(radarReports.id, row.id));

    const key = body.action === "detail" ? "plans" : body.action === "offer" ? "offers" : "boosts";
    return Response.json({ [body.action === "detail" ? "plan" : body.action]: result[key][opportunity.id] });
  } catch (error) {
    if (error instanceof OpenRouterError) return Response.json({ error: "O Radar não conseguiu analisar agora. Tente de novo em instantes." }, { status: 502 });
    return secureErrorResponse(error, "Não foi possível usar o Radar agora.");
  }
}
