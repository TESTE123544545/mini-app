import { and, eq, like, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
import { saveRecord } from "@/lib/stripe";

/**
 * Google Play Billing, checked on the server: the app sends the purchase token it got from Play and
 * we ask the Google Play Developer API whether it is real, whose it is and until when it lasts.
 * Needs the secret GOOGLE_PLAY_SERVICE_ACCOUNT (the service account's JSON key, with access to the app
 * in Play Console → Users and permissions) — without it nothing is granted.
 */
export const PACKAGE_NAME = "br.com.veiasdasintonia.prosperar";
/** Product ids created in Play Console: a monthly subscription and a one-time "vitalício" product. */
export const GOOGLE_SUBSCRIPTION_ID = "premium_mensal";
export const GOOGLE_LIFETIME_ID = "premium_vitalicio";

const SCOPE = "https://www.googleapis.com/auth/androidpublisher";
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}`;

type ServiceAccount = { client_email: string; private_key: string };
let cached: { token: string; expiresAt: number } | null = null;

function account(): ServiceAccount | null {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT;
  if (!raw) return null;
  try { const parsed = JSON.parse(raw) as ServiceAccount; return parsed.client_email && parsed.private_key ? parsed : null; } catch { return null; }
}
export const googleConfigured = () => account() !== null;

const b64url = (input: ArrayBuffer | string) => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function accessToken() {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const sa = account();
  if (!sa) throw new Error("google_not_configured");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }))}`;
  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(signature)}` }),
  });
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!response.ok || !data.access_token) throw new Error("google_token_failed");
  cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return cached.token;
}

async function play<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${await accessToken()}` } });
  const data = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(`google_${response.status}: ${data.error?.message ?? "request failed"}`);
  return data;
}

type SubscriptionV2 = {
  subscriptionState: string;
  lineItems?: { productId: string; expiryTime?: string; autoRenewingPlan?: { autoRenewEnabled?: boolean } }[];
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
};
type ProductPurchase = { purchaseState?: number; obfuscatedExternalAccountId?: string };

/** What Play says about one purchase token. `granted` is whether Premium should be on right now. */
export type GoogleStatus = { granted: boolean; kind: "subs" | "lifetime"; productId: string; expiresAt?: number; autoRenewing: boolean; accountId?: string };

export async function checkSubscription(token: string): Promise<GoogleStatus> {
  const data = await play<SubscriptionV2>(`/purchases/subscriptionsv2/tokens/${encodeURIComponent(token)}`);
  const line = data.lineItems?.[0];
  const expiresAt = line?.expiryTime ? Math.floor(Date.parse(line.expiryTime) / 1000) : undefined;
  // Active, in grace period, or cancelled but still inside the paid period.
  const live = ["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD", "SUBSCRIPTION_STATE_CANCELED"].includes(data.subscriptionState);
  return { granted: live && (!expiresAt || expiresAt * 1000 > Date.now()), kind: "subs", productId: line?.productId ?? GOOGLE_SUBSCRIPTION_ID, expiresAt, autoRenewing: Boolean(line?.autoRenewingPlan?.autoRenewEnabled), accountId: data.externalAccountIdentifiers?.obfuscatedExternalAccountId };
}

export async function checkLifetime(productId: string, token: string): Promise<GoogleStatus> {
  const data = await play<ProductPurchase>(`/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(token)}`);
  return { granted: data.purchaseState === 0, kind: "lifetime", productId, autoRenewing: false, accountId: data.obfuscatedExternalAccountId };
}

/** Records the purchase for the device and recomputes its plan. Returns the plan ("premium" | "free"). */
export async function applyGoogleStatus(deviceId: string, token: string, status: GoogleStatus) {
  return saveRecord(deviceId, { id: token, productId: status.productId, status: status.granted ? (status.kind === "lifetime" ? "lifetime" : "active") : "expired", expiresAt: status.expiresAt, autoRenewing: status.autoRenewing });
}

/**
 * Cron: re-reads Google subscriptions that end soon, so a renewal extends Premium and a cancellation or
 * a failed payment ends it. Stripe records (ids "sub_…") are handled by Stripe's webhook, not here.
 */
export async function refreshGoogleSubscriptions(limit = 20) {
  if (!googleConfigured()) return 0;
  const db = getDb();
  const horizon = String(Date.now() + 24 * 3_600_000);
  const rows = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.status, "active"), lt(subscriptions.expiryTimeMillis, horizon), like(subscriptions.productId, `${GOOGLE_SUBSCRIPTION_ID}%`))).limit(limit);
  for (const row of rows) {
    try { await applyGoogleStatus(row.deviceId, row.purchaseToken, await checkSubscription(row.purchaseToken)); }
    catch (error) { console.error("google_refresh_failed", error); }
  }
  return rows.length;
}
