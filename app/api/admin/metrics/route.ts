import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { getSessionUser, isAdminEmail } from "@/lib/auth";
import { enforceRateLimit, RequestError, secureErrorResponse } from "@/lib/security";

/** The conversion funnel, in order. Each step counts distinct accounts (or anonymous events). */
const FUNNEL = [
  ["signup", "Cadastros"],
  ["onboarding_completed", "Concluíram o cadastro inicial"],
  ["diagnostic_completed", "Fizeram o diagnóstico"],
  ["paywall_viewed", "Viram a oferta Premium"],
  ["checkout_started", "Abriram o pagamento"],
  ["checkout_completed", "Assinaram"],
] as const;

/** GET /api/admin/metrics?days=7 — funnel and totals for the team (ADMIN_EMAILS only). */
export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) throw new RequestError("Entre na sua conta.", 401);
    if (!isAdminEmail(user.email)) throw new RequestError("Acesso restrito à equipe.", 403);
    await enforceRateLimit(request, "admin", user.id, 60, 60);

    const days = Math.min(90, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 7));
    const since = new Date(Date.now() - days * 86_400_000).toISOString().replace("T", " ").slice(0, 19);
    const db = getDb();
    const rows = await db.all<{ name: string; people: number }>(sql`
      SELECT event_name AS name, COUNT(DISTINCT COALESCE(device_id, 'anon-' || id)) AS people
      FROM analytics_events
      WHERE created_at >= ${since}
      GROUP BY event_name`);
    const counts = new Map(rows.map((row) => [row.name, Number(row.people)]));
    const [totals] = await db.all<{ users: number; premium: number }>(sql`
      SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM profiles WHERE plan = 'premium') AS premium`);

    return Response.json({
      days,
      funnel: FUNNEL.map(([key, label]) => ({ key, label, people: counts.get(key) ?? 0 })),
      totals: { users: Number(totals?.users ?? 0), premium: Number(totals?.premium ?? 0) },
    });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível carregar as métricas.");
  }
}
