import { Platform } from "react-native";
import { api } from "./api";

export type Offer = { id: string; title: string; price: string; kind: "subs" | "inapp"; offerToken?: string };

/** Product ids created in Play Console (same ids the server accepts, see lib/googlePlay.ts). */
export const SUBSCRIPTION_ID = "premium_mensal";
export const LIFETIME_ID = "premium_vitalicio";

/** Purchases go through Google Play Billing (a Play Store rule for digital subscriptions). */
export const billingAvailable = Platform.OS === "android";

type Iap = typeof import("expo-iap");
let iap: Promise<Iap> | null = null;
let connected = false;

async function client() {
  if (!iap) iap = import("expo-iap");
  const lib = await iap;
  if (!connected) { await lib.initConnection(); connected = true; }
  return lib;
}

/** The prices shown come from Google Play itself (localized, with taxes), never from our server. */
export async function loadOffers(): Promise<Offer[]> {
  if (!billingAvailable) return [];
  const lib = await client();
  const [subs, lifetime] = await Promise.all([
    lib.fetchProducts({ skus: [SUBSCRIPTION_ID], type: "subs" }).catch(() => null),
    lib.fetchProducts({ skus: [LIFETIME_ID], type: "in-app" }).catch(() => null),
  ]);
  const offers: Offer[] = [];
  const sub = (subs ?? []).find((item) => item.id === SUBSCRIPTION_ID) as { subscriptionOffers?: { displayPrice: string; offerTokenAndroid?: string | null }[] } | undefined;
  const base = sub?.subscriptionOffers?.[0];
  if (base?.offerTokenAndroid) offers.push({ id: SUBSCRIPTION_ID, kind: "subs", title: "Premium mensal · renova todo mês", price: `${base.displayPrice}`, offerToken: base.offerTokenAndroid });
  const once = (lifetime ?? []).find((item) => item.id === LIFETIME_ID) as { displayPrice: string } | undefined;
  if (once) offers.push({ id: LIFETIME_ID, kind: "inapp", title: "Premium vitalício · pagamento único", price: once.displayPrice });
  return offers;
}

type Waiting = { resolve: (purchase: { productId: string; purchaseToken?: string | null }) => void; reject: (error: Error) => void };

/** Opens Google Play's payment sheet, then asks our server to check the purchase before Premium is unlocked. */
export async function purchase(offer: Offer, accountId: string): Promise<void> {
  const lib = await client();
  const done = new Promise<Parameters<Waiting["resolve"]>[0] & Record<string, unknown>>((resolve, reject) => {
    const timer = setTimeout(() => { updated.remove(); failed.remove(); reject(new Error("A compra demorou demais. Se você pagou, toque em Restaurar compras.")); }, 5 * 60_000);
    const updated = lib.purchaseUpdatedListener((item) => {
      if (item.productId !== offer.id) return;
      clearTimeout(timer); updated.remove(); failed.remove(); resolve(item as never);
    });
    const failed = lib.purchaseErrorListener((error) => {
      clearTimeout(timer); updated.remove(); failed.remove();
      reject(new Error(/cancel/i.test(`${error.code}${error.message}`) ? "Compra cancelada." : "Não foi possível concluir a compra no Google Play."));
    });
  });
  await lib.requestPurchase(offer.kind === "subs"
    ? { type: "subs", request: { google: { skus: [offer.id], subscriptionOffers: [{ sku: offer.id, offerToken: offer.offerToken ?? "" }], obfuscatedAccountId: accountId } } }
    : { type: "in-app", request: { google: { skus: [offer.id], obfuscatedAccountId: accountId } } });
  const bought = await done;
  if (!bought.purchaseToken) throw new Error("O Google Play não enviou o comprovante. Tente restaurar a compra.");
  await api("/api/billing/google/verify", { method: "POST", body: { productId: offer.id, purchaseToken: bought.purchaseToken } });
  // Only after our server accepted it: acknowledge to Google (otherwise Play refunds an unacknowledged purchase after 3 days).
  await lib.finishTransaction({ purchase: bought as never, isConsumable: false });
}

/** Re-sends the purchases this Google account already owns (new phone, reinstall, lost connection). */
export async function restore(): Promise<boolean> {
  if (!billingAvailable) return false;
  const lib = await client();
  const owned = await lib.getAvailablePurchases();
  let ok = false;
  for (const item of owned) {
    if ((item.productId !== SUBSCRIPTION_ID && item.productId !== LIFETIME_ID) || !item.purchaseToken) continue;
    try {
      await api("/api/billing/google/verify", { method: "POST", body: { productId: item.productId, purchaseToken: item.purchaseToken } });
      await lib.finishTransaction({ purchase: item, isConsumable: false }).catch(() => {});
      ok = true;
    } catch { /* belongs to another account or not active: skip */ }
  }
  return ok;
}
