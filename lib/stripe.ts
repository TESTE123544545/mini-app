import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, subscriptions, users } from "@/db/schema";

/**
 * Stripe over plain fetch (no SDK), so it runs on Cloudflare Workers as-is.
 *
 * Configuration (Cloudflare secrets / env):
 * - STRIPE_SECRET_KEY      — required; without it the Premium button stays "em breve".
 * - STRIPE_WEBHOOK_SECRET  — signing secret of the webhook pointed at /api/billing/stripe/webhook.
 * - STRIPE_PRODUCT_ID      — optional; defaults to the Premium product below. Every active price
 *                            of this product is offered in the paywall.
 */
const API = "https://api.stripe.com/v1";
const DEFAULT_PRODUCT_ID = "prod_UWpOZdImpB8hHp";
/**
 * Pinned so our calls do not follow the account's default (2019-02-19 at setup time). Webhook
 * payloads still arrive in the endpoint's version; the handlers read fields present in both.
 */
const STRIPE_API_VERSION = "2024-06-20";
export const SITE_ORIGIN = "https://veiasdasintonia.com.br";

/** Subscription states that keep Premium on. past_due stays on while Stripe retries the card. */
const PREMIUM_STATUSES = ["active", "trialing", "past_due", "lifetime"];

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function premiumProductId() {
  return process.env.STRIPE_PRODUCT_ID || DEFAULT_PRODUCT_ID;
}

type Params = Record<string, string | number | boolean | undefined>;

export async function stripe<T>(path: string, params?: Params, method: "GET" | "POST" = params ? "POST" : "GET"): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("stripe_not_configured");
  const body = params
    ? new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([name, value]) => [name, String(value)]))
    : undefined;
  const url = method === "GET" && body ? `${API}${path}?${body}` : `${API}${path}`;
  const response = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${key}`, "stripe-version": STRIPE_API_VERSION, ...(method === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
    body: method === "POST" ? body : undefined,
  });
  const data = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(`stripe_${response.status}: ${data.error?.message ?? "request failed"}`);
  return data;
}

export type StripePrice = {
  id: string; active: boolean; product: string; currency: string; unit_amount: number | null; nickname: string | null;
  type: "recurring" | "one_time"; recurring: { interval: "day" | "week" | "month" | "year"; interval_count: number } | null;
};

export async function premiumPrices() {
  const { data } = await stripe<{ data: StripePrice[] }>("/prices", { product: premiumProductId(), active: true, limit: 20 }, "GET");
  const priced = data.filter((price) => price.unit_amount !== null).sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0));
  // The product also carries GBP/EUR/USD prices; the app is Brazilian, so offer the BRL ones when they exist.
  const inReais = priced.filter((price) => price.currency === "brl");
  return inReais.length ? inReais : priced;
}

/* --- Webhook signature (Stripe-Signature: t=…,v1=…) ------------------------------------------ */
const TOLERANCE_S = 300;

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export async function verifyStripeSignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = header.split(",").map((item) => item.split("=") as [string, string]);
  const timestamp = parts.find(([name]) => name === "t")?.[1];
  const signatures = parts.filter(([name]) => name === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE_S) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${rawBody}`)));
  return signatures.some((signature) => safeEqual(signature, expected));
}

/* --- Granting and revoking Premium ------------------------------------------------------------ */
export type StripeSubscription = {
  id: string; status: string; customer: string; cancel_at_period_end: boolean;
  current_period_end?: number; metadata?: Record<string, string>;
  items?: { data: { price: { id: string }; current_period_end?: number }[] };
};

export type StripeCheckoutSession = {
  id: string; mode: "subscription" | "payment" | "setup"; status: string | null; payment_status: string;
  client_reference_id: string | null; subscription: string | null; payment_intent: string | null; customer: string | null;
  metadata?: Record<string, string>;
};

async function deviceForUser(userId: string) {
  const [user] = await getDb().select({ deviceId: users.primaryDeviceId }).from(users).where(eq(users.id, userId)).limit(1);
  return user?.deviceId ?? null;
}

/** Recomputes profiles.plan from every Stripe record of the device (a second purchase never gets revoked by the first). */
async function refreshPlan(deviceId: string) {
  const db = getDb();
  const [active] = await db.select({ id: subscriptions.purchaseToken }).from(subscriptions)
    .where(and(eq(subscriptions.deviceId, deviceId), inArray(subscriptions.status, PREMIUM_STATUSES))).limit(1);
  const plan = active ? "premium" : "free";
  await db.update(profiles).set({ plan, updatedAt: new Date().toISOString() }).where(eq(profiles.deviceId, deviceId));
  return plan;
}

async function saveRecord(deviceId: string, record: { id: string; productId: string; status: string; expiresAt?: number; autoRenewing: boolean }) {
  const now = new Date().toISOString();
  const values = {
    productId: record.productId, status: record.status, autoRenewing: record.autoRenewing, updatedAt: now,
    expiryTimeMillis: record.expiresAt ? String(record.expiresAt * 1000) : null,
  };
  await getDb().insert(subscriptions).values({ purchaseToken: record.id, deviceId, ...values })
    .onConflictDoUpdate({ target: subscriptions.purchaseToken, set: values });
  return refreshPlan(deviceId);
}

export async function applySubscription(subscription: StripeSubscription, userId: string | undefined) {
  if (!userId) return null;
  const deviceId = await deviceForUser(userId);
  if (!deviceId) { console.error("stripe_no_profile_for_user", { userId, subscription: subscription.id }); return null; }
  const item = subscription.items?.data[0];
  return saveRecord(deviceId, {
    id: subscription.id,
    productId: item?.price.id ?? "stripe",
    status: subscription.status,
    expiresAt: subscription.current_period_end ?? item?.current_period_end,
    autoRenewing: !subscription.cancel_at_period_end,
  });
}

/** Applies a finished Checkout Session: fetches the subscription, or records a one-time purchase as lifetime. */
export async function applyCheckoutSession(session: StripeCheckoutSession) {
  const userId = session.client_reference_id ?? session.metadata?.userId;
  // `status` is missing from payloads rendered in very old API versions; checkout.session.completed already implies it.
  if (!userId || (session.status && session.status !== "complete")) return null;
  if (session.mode === "subscription" && session.subscription) {
    const subscription = await stripe<StripeSubscription>(`/subscriptions/${session.subscription}`, undefined, "GET");
    return applySubscription(subscription, userId);
  }
  if (session.mode === "payment" && session.payment_status === "paid") {
    const deviceId = await deviceForUser(userId);
    if (!deviceId) return null;
    return saveRecord(deviceId, { id: session.payment_intent ?? session.id, productId: session.metadata?.priceId ?? "stripe", status: "lifetime", autoRenewing: false });
  }
  return null;
}

/** The Stripe customer behind a device's most recent Stripe subscription, for the billing portal. */
export async function customerForDevice(deviceId: string) {
  const rows = await getDb().select({ id: subscriptions.purchaseToken }).from(subscriptions).where(eq(subscriptions.deviceId, deviceId));
  const stripeSubscription = rows.map((row) => row.id).reverse().find((id) => id.startsWith("sub_"));
  if (!stripeSubscription) return null;
  const subscription = await stripe<StripeSubscription>(`/subscriptions/${stripeSubscription}`, undefined, "GET");
  return subscription.customer;
}
