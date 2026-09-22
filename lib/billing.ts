"use client";

const PAYMENT_METHOD = "https://play.google.com/billing";

type DigitalGoodsService = {
  getDetails: (itemIds: string[]) => Promise<{ itemId: string; title: string; price: { currency: string; value: string } }[]>;
};

declare global {
  interface Window {
    getDigitalGoodsService?: (paymentMethod: string) => Promise<DigitalGoodsService>;
  }
}

/** Play Console item id, formatted `<subscriptionId>:<basePlanId>` (e.g. "premium_mensal:mensal-padrao"). */
function playBillingItemId() {
  return process.env.NEXT_PUBLIC_PREMIUM_PRODUCT_ID ?? "";
}

export function isPlayBillingAvailable() {
  return typeof window !== "undefined" && typeof window.getDigitalGoodsService === "function" && Boolean(playBillingItemId());
}

export async function fetchPremiumPrice(): Promise<{ currency: string; value: string } | null> {
  if (!isPlayBillingAvailable()) return null;
  try {
    const service = await window.getDigitalGoodsService!(PAYMENT_METHOD);
    const [details] = await service.getDetails([playBillingItemId()]);
    return details?.price ?? null;
  } catch {
    return null;
  }
}

export type PurchaseResult = { purchaseToken: string; itemId: string };

/** Opens the native Google Play purchase sheet for the premium subscription. */
export async function purchasePremium(): Promise<PurchaseResult> {
  const itemId = playBillingItemId();
  if (!isPlayBillingAvailable()) throw new Error("A assinatura pelo Google Play não está disponível neste dispositivo.");

  const request = new PaymentRequest(
    [{ supportedMethods: PAYMENT_METHOD, data: { sku: itemId } }],
    { total: { label: "Assinatura Premium", amount: { currency: "BRL", value: "0" } } },
  );
  const response = await request.show();
  const purchaseToken = (response.details as { token?: string } | null)?.token;
  if (!purchaseToken) {
    await response.complete("fail");
    throw new Error("A compra não retornou um token válido.");
  }
  await response.complete("success");
  return { purchaseToken, itemId };
}

/** Sends the purchase token to our server, which verifies it against the Play Developer API before granting premium. */
export async function verifyPurchaseWithServer(purchaseToken: string, itemId: string) {
  const subscriptionId = itemId.split(":")[0];
  const response = await fetch("/api/billing/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ purchaseToken, productId: subscriptionId }),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; plan?: "premium" };
  if (!response.ok) throw new Error(data.error ?? "Não foi possível confirmar sua assinatura.");
  return data as { plan: "premium" };
}
