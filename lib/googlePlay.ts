const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/androidpublisher";

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

let cachedKey: CryptoKey | null = null;
async function importServiceAccountKey(pem: string) {
  if (cachedKey) return cachedKey;
  cachedKey = await crypto.subtle.importKey("pkcs8", pemToArrayBuffer(pem), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  return cachedKey;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/** Exchanges the service account key for a short-lived OAuth token, cached until near expiry. */
async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const email = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY;
  if (!email || !rawKey) throw new Error("Credenciais do Google Play não configuradas.");

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })));
  const signingInput = `${header}.${claims}`;
  const key = await importServiceAccountKey(rawKey.replace(/\\n/g, "\n"));
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${base64UrlEncode(signature)}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!response.ok) throw new Error("Falha ao autenticar com o Google Play.");
  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

export type SubscriptionPurchase = {
  expiryTimeMillis?: string;
  autoRenewing?: boolean;
  paymentState?: number;
  acknowledgementState?: number;
  cancelReason?: number;
};

/** Reads the authoritative state of a subscription purchase straight from Google Play. */
export async function fetchSubscriptionPurchase(packageName: string, subscriptionId: string, purchaseToken: string): Promise<SubscriptionPurchase> {
  const token = await getAccessToken();
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(subscriptionId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error("Não foi possível verificar a assinatura no Google Play.");
  return response.json();
}

/** Unacknowledged subscription purchases are auto-refunded by Google after ~3 days. */
export async function acknowledgeSubscriptionPurchase(packageName: string, subscriptionId: string, purchaseToken: string) {
  const token = await getAccessToken();
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(subscriptionId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;
  const response = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: "{}" });
  if (!response.ok) throw new Error("Não foi possível confirmar a assinatura no Google Play.");
}

export function isSubscriptionActive(purchase: SubscriptionPurchase) {
  const expiryMs = Number(purchase.expiryTimeMillis ?? 0);
  return Number.isFinite(expiryMs) && expiryMs > Date.now();
}
