import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, subscriptions, users } from "@/db/schema";
import { secureErrorResponse } from "@/lib/security";

/**
 * Push endpoint for InfinitePay's payment webhook, authenticated with a shared-secret
 * query token — same pattern as /api/billing/rtdn for Google Play, since InfinitePay
 * calls this cross-origin with no session.
 *
 * The exact webhook payload for a dashboard-created "plans" link (as opposed to one
 * generated through InfinitePay's /links API) isn't in their public docs, so this
 * matches defensively: first by an order_nsu that looks like one of our device ids
 * (works if this is ever switched to per-user links generated via their API), then by
 * falling back to the buyer's email against our own accounts. Unmatched payments are
 * logged and still acknowledged with 200 (so InfinitePay doesn't retry forever) but
 * need a manual grant until identification is confirmed against real traffic.
 *
 * Configure the push URL in InfinitePay's dashboard as:
 *   https://veiasdasintonia.com.br/api/billing/infinitepay-webhook?token=<INFINITEPAY_WEBHOOK_TOKEN>
 */
export async function POST(request: Request) {
  try {
    const expectedToken = process.env.INFINITEPAY_WEBHOOK_TOKEN;
    const providedToken = new URL(request.url).searchParams.get("token");
    if (!expectedToken || providedToken !== expectedToken) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!payload) return Response.json({ ok: true });

    const transactionId = readString(payload, ["transaction_nsu", "transactionNsu", "id"]);
    const orderRef = readString(payload, ["order_nsu", "orderNsu"]);
    const buyerEmail = readString(payload, ["email", "buyer_email", "payer_email"])
      ?? readString(nested(payload, "customer"), ["email"])
      ?? readString(nested(payload, "payer"), ["email"]);
    const paidAmount = readNumber(payload, ["paid_amount", "paidAmount", "amount"]);
    const receiptUrl = readString(payload, ["receipt_url", "receiptUrl"]);

    const db = getDb();
    let deviceId: string | null = null;

    if (orderRef) {
      const [byDevice] = await db.select({ deviceId: profiles.deviceId }).from(profiles).where(eq(profiles.deviceId, orderRef)).limit(1);
      if (byDevice) deviceId = byDevice.deviceId;
    }
    if (!deviceId && buyerEmail) {
      const [account] = await db.select({ primaryDeviceId: users.primaryDeviceId }).from(users).where(eq(users.email, buyerEmail.toLowerCase())).limit(1);
      if (account?.primaryDeviceId) deviceId = account.primaryDeviceId;
    }

    if (!deviceId) {
      console.error("infinitepay_webhook_unmatched", { transactionId, orderRef, buyerEmail, paidAmount, receiptUrl });
      return Response.json({ ok: true, matched: false });
    }

    const now = new Date().toISOString();
    await db.batch([
      db.insert(subscriptions).values({
        purchaseToken: transactionId ?? `infinitepay-${now}`,
        deviceId,
        productId: "infinitepay_mensal",
        status: "active",
        autoRenewing: true,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: subscriptions.purchaseToken,
        set: { status: "active", updatedAt: now },
      }),
      db.update(profiles).set({ plan: "premium", updatedAt: now }).where(eq(profiles.deviceId, deviceId)),
    ] as Parameters<typeof db.batch>[0]);

    return Response.json({ ok: true, matched: true });
  } catch (error) {
    return secureErrorResponse(error, "infinitepay_webhook_error");
  }
}

function readString(payload: Record<string, unknown> | null, keys: string[]): string | undefined {
  if (!payload) return undefined;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function readNumber(payload: Record<string, unknown> | null, keys: string[]): number | undefined {
  if (!payload) return undefined;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number") return value;
  }
  return undefined;
}

function nested(payload: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = payload[key];
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}
