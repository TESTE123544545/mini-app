import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { analyticsEvents, profiles, subscriptions, users } from "@/db/schema";
import { deleteSession, getSessionUser, verifyPassword } from "@/lib/auth";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";
import { stripe, stripeConfigured } from "@/lib/stripe";

const bodySchema = z.object({ action: z.literal("delete"), password: z.string().min(1).max(128) }).strict();

/**
 * POST /api/account { action: "delete", password } — erases the account and everything tied to it (LGPD art. 18,
 * and the account-deletion rule of the app stores). The password is asked again so a stolen session cannot do it.
 * Stripe subscriptions are cancelled first; a Google Play subscription can only be cancelled by the person, in Play.
 */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 1024));
    if (!parsed.success) throw new RequestError("Dados inválidos.", 400);
    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    await enforceRateLimit(request, "account-delete", user.id, 5, 60 * 60);
    if (!(await verifyPassword(parsed.data.password, user.passwordHash, user.passwordSalt, user.passwordIterations))) {
      throw new RequestError("Senha incorreta.", 403);
    }

    const db = getDb();
    const deviceId = user.primaryDeviceId;
    if (deviceId) {
      const stripeSubs = (await db.select({ id: subscriptions.purchaseToken }).from(subscriptions).where(eq(subscriptions.deviceId, deviceId))).filter((row) => row.id.startsWith("sub_"));
      if (stripeSubs.length && stripeConfigured()) {
        for (const row of stripeSubs) {
          try { await stripe(`/subscriptions/${row.id}`, undefined, "DELETE"); }
          catch (error) {
            // Already cancelled in Stripe is fine; anything else stops the deletion so no charge keeps running unseen.
            if (!String(error).includes("stripe_404") && !String(error).includes("No such subscription")) throw new RequestError("Não conseguimos cancelar sua assinatura agora. Tente de novo em instantes.", 502);
          }
        }
      }
      // Profile rows cascade (goals, diary, chat, achievements, progress, subscriptions, signals…); analytics have no FK.
      await db.delete(analyticsEvents).where(eq(analyticsEvents.deviceId, deviceId));
      await db.delete(profiles).where(eq(profiles.deviceId, deviceId));
    }
    // Sessions, reset tokens and admin sessions cascade from the user row.
    await db.delete(users).where(eq(users.id, user.id));
    return Response.json({ deleted: true }, { headers: { "set-cookie": await deleteSession(request) } });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível excluir a conta agora.");
  }
}
