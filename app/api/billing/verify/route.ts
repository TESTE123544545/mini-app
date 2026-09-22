import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { profiles, subscriptions } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { acknowledgeSubscriptionPurchase, fetchSubscriptionPurchase, isSubscriptionActive } from "@/lib/googlePlay";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const verifySchema = z.object({
  purchaseToken: z.string().trim().min(10).max(4000),
  productId: z.string().trim().min(1).max(120),
}).strict();

export async function POST(request: Request) {
  try {
    const rawPayload = await readJsonBody<unknown>(request, 8 * 1024);
    const parsed = verifySchema.safeParse(rawPayload);
    if (!parsed.success) throw new RequestError("Os dados da compra são inválidos.", 400);
    const payload = parsed.data;

    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    await enforceRateLimit(request, "billing_verify", user.id, 20, 60);
    const deviceId = user.primaryDeviceId;
    if (!deviceId) throw new RequestError("Crie sua jornada antes de assinar.", 400);

    const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;
    if (!packageName) throw new RequestError("A assinatura ainda não foi configurada.", 500);

    const purchase = await fetchSubscriptionPurchase(packageName, payload.productId, payload.purchaseToken);
    if (!isSubscriptionActive(purchase)) throw new RequestError("Não foi possível confirmar a assinatura.", 402);
    if (purchase.acknowledgementState !== 1) {
      await acknowledgeSubscriptionPurchase(packageName, payload.productId, payload.purchaseToken);
    }

    const now = new Date().toISOString();
    const subscriptionValues = {
      deviceId,
      productId: payload.productId,
      status: "active",
      expiryTimeMillis: purchase.expiryTimeMillis ?? null,
      autoRenewing: purchase.autoRenewing ?? true,
      updatedAt: now,
    };
    const db = getDb();
    await db.batch([
      db.insert(subscriptions).values({ purchaseToken: payload.purchaseToken, ...subscriptionValues })
        .onConflictDoUpdate({ target: subscriptions.purchaseToken, set: subscriptionValues }),
      db.update(profiles).set({ plan: "premium", updatedAt: now }).where(eq(profiles.deviceId, deviceId)),
    ] as Parameters<typeof db.batch>[0]);

    return Response.json({ plan: "premium" });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível confirmar sua assinatura agora.");
  }
}
