import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, subscriptions } from "@/db/schema";
import { fetchSubscriptionPurchase, isSubscriptionActive } from "@/lib/googlePlay";
import { secureErrorResponse } from "@/lib/security";

type PubSubPushBody = { message?: { data?: string; messageId?: string } };
type RtdnPayload = {
  packageName?: string;
  subscriptionNotification?: { purchaseToken: string; subscriptionId: string; notificationType: number };
};

/**
 * Push endpoint for Google Play's Real-time Developer Notifications (Pub/Sub).
 * Authenticated with a shared-secret query token instead of cookies, since Pub/Sub
 * calls this cross-origin with no session. Configure the push subscription URL as
 * `.../api/billing/rtdn?token=<GOOGLE_PLAY_RTDN_TOKEN>`.
 */
export async function POST(request: Request) {
  try {
    const expectedToken = process.env.GOOGLE_PLAY_RTDN_TOKEN;
    const providedToken = new URL(request.url).searchParams.get("token");
    if (!expectedToken || providedToken !== expectedToken) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as PubSubPushBody;
    const raw = body.message?.data;
    if (!raw) return Response.json({ ok: true });

    const decoded = JSON.parse(atob(raw)) as RtdnPayload;
    const notification = decoded.subscriptionNotification;
    const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;
    if (!notification || !packageName) return Response.json({ ok: true });

    const db = getDb();
    const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.purchaseToken, notification.purchaseToken)).limit(1);
    if (!existing) return Response.json({ ok: true });

    const purchase = await fetchSubscriptionPurchase(packageName, notification.subscriptionId, notification.purchaseToken);
    const active = isSubscriptionActive(purchase);
    const now = new Date().toISOString();
    await db.batch([
      db.update(subscriptions).set({
        status: active ? "active" : "expired",
        expiryTimeMillis: purchase.expiryTimeMillis ?? null,
        autoRenewing: purchase.autoRenewing ?? false,
        updatedAt: now,
      }).where(eq(subscriptions.purchaseToken, notification.purchaseToken)),
      db.update(profiles).set({ plan: active ? "premium" : "free", updatedAt: now }).where(eq(profiles.deviceId, existing.deviceId)),
    ] as Parameters<typeof db.batch>[0]);

    return Response.json({ ok: true });
  } catch (error) {
    return secureErrorResponse(error, "rtdn_error");
  }
}
