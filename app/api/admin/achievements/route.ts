import { and, eq, like } from "drizzle-orm";
import { getDb } from "@/db";
import { achievements, profiles, users } from "@/db/schema";
import { getSessionUser, isAdminEmail, normalizeEmail } from "@/lib/auth";
import { EXCLUSIVE_ACHIEVEMENTS } from "@/lib/journey";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

/**
 * Exclusive achievements are granted by hand by the Veias da Sintonia team. Only accounts listed in
 * ADMIN_EMAILS may call this; the sync route never lets a client add an exclusive key to itself.
 */
async function requireAdmin(request: Request) {
  const user = await getSessionUser(request);
  if (!user) throw new RequestError("Entre na sua conta.", 401);
  if (!isAdminEmail(user.email)) throw new RequestError("Acesso restrito à equipe.", 403);
  return user;
}

async function findTarget(email: string) {
  const db = getDb();
  const [target] = await db.select({ id: users.id, email: users.email, deviceId: users.primaryDeviceId }).from(users).where(eq(users.email, normalizeEmail(email))).limit(1);
  if (!target) throw new RequestError("Nenhuma conta com esse e-mail.", 404);
  if (!target.deviceId) throw new RequestError("Essa conta ainda não concluiu o cadastro no app.", 409);
  const [profile] = await db.select({ name: profiles.name, sign: profiles.sign }).from(profiles).where(eq(profiles.deviceId, target.deviceId)).limit(1);
  const granted = await db.select({ key: achievements.achievementKey }).from(achievements)
    .where(and(eq(achievements.deviceId, target.deviceId), like(achievements.achievementKey, "exclusiva-%")));
  return { ...target, deviceId: target.deviceId, name: profile?.name ?? "", sign: profile?.sign ?? "", granted: granted.map((row) => row.key) };
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin", admin.id, 60, 60);
    const email = new URL(request.url).searchParams.get("email") ?? "";
    const target = await findTarget(email);
    return Response.json({ email: target.email, name: target.name, sign: target.sign, granted: target.granted });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível consultar a conta.");
  }
}

export async function POST(request: Request) {
  try {
    const { email, key, action } = await readJsonBody<{ email?: string; key?: string; action?: "grant" | "revoke" }>(request, 1024);
    const admin = await requireAdmin(request);
    await enforceRateLimit(request, "admin", admin.id, 60, 60);
    if (!key || !EXCLUSIVE_ACHIEVEMENTS.some((item) => item.key === key)) throw new RequestError("Conquista exclusiva inválida.", 400);
    if (action !== "grant" && action !== "revoke") throw new RequestError("Ação inválida.", 400);
    const target = await findTarget(email ?? "");
    const db = getDb();
    if (action === "grant") {
      await db.insert(achievements).values({ deviceId: target.deviceId, achievementKey: key }).onConflictDoNothing();
    } else {
      await db.delete(achievements).where(and(eq(achievements.deviceId, target.deviceId), eq(achievements.achievementKey, key)));
    }
    console.log("admin_exclusive_achievement", { by: admin.email, target: target.email, key, action });
    const refreshed = await findTarget(target.email);
    return Response.json({ email: refreshed.email, name: refreshed.name, sign: refreshed.sign, granted: refreshed.granted });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível atualizar a conquista.");
  }
}
