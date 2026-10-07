import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { applyGoogleStatus, checkLifetime, checkSubscription, GOOGLE_LIFETIME_ID, GOOGLE_SUBSCRIPTION_ID, googleConfigured } from "@/lib/googlePlay";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({
  productId: z.enum([GOOGLE_SUBSCRIPTION_ID, GOOGLE_LIFETIME_ID]),
  purchaseToken: z.string().min(20).max(2048).regex(/^[A-Za-z0-9._-]+$/),
}).strict();

/**
 * The Android app calls this right after Google Play confirms a purchase. The token is checked with Google
 * (never trusted from the phone), must belong to this account, and can only be used by one account.
 */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 4 * 1024));
    if (!parsed.success) throw new RequestError("Compra inválida.", 400);
    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    if (!googleConfigured()) return Response.json({ error: "A assinatura pela Google Play ainda não está disponível." }, { status: 503 });
    await enforceRateLimit(request, "google-verify", user.id, 20, 3600);
    if (!user.primaryDeviceId) throw new RequestError("Conclua seu cadastro no app antes de assinar.", 409);

    const { productId, purchaseToken } = parsed.data;
    const [taken] = await getDb().select({ deviceId: subscriptions.deviceId }).from(subscriptions).where(eq(subscriptions.purchaseToken, purchaseToken)).limit(1);
    if (taken && taken.deviceId !== user.primaryDeviceId) throw new RequestError("Essa compra já está ligada a outra conta.", 409);

    const status = productId === GOOGLE_SUBSCRIPTION_ID ? await checkSubscription(purchaseToken) : await checkLifetime(productId, purchaseToken);
    // The app tags each purchase with the account's device id; a token bought by someone else is refused.
    if (status.accountId && status.accountId !== user.primaryDeviceId) throw new RequestError("Essa compra pertence a outra conta.", 403);
    if (!status.granted) throw new RequestError("Essa compra não está ativa no Google Play.", 402);

    const plan = await applyGoogleStatus(user.primaryDeviceId, purchaseToken, status);
    return Response.json({ plan });
  } catch (error) {
    if (!(error instanceof RequestError)) console.error("google_verify_error", error);
    return secureErrorResponse(error, "Não foi possível confirmar a compra agora.");
  }
}
