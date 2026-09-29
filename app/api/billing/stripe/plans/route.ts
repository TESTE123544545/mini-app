import { getSessionUser } from "@/lib/auth";
import { premiumPrices, stripeConfigured } from "@/lib/stripe";
import { welcomeOfferFor } from "@/lib/welcomeOffer";
import { secureErrorResponse } from "@/lib/security";

/** Active prices of the Premium product, read live from Stripe so the paywall never shows a stale price. */
export async function GET(request: Request) {
  try {
    if (!stripeConfigured()) return Response.json({ available: false, prices: [] });
    const prices = await premiumPrices();
    // The welcome offer applies to this signed-in account's first monthly subscription, if still valid.
    const user = await getSessionUser(request).catch(() => null);
    const offer = user ? await welcomeOfferFor(user) : null;
    return Response.json({
      available: prices.length > 0,
      offer,
      prices: prices.map((price) => ({
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        nickname: price.nickname,
        interval: price.type === "recurring" ? price.recurring?.interval ?? null : null,
        intervalCount: price.recurring?.interval_count ?? 1,
      })),
    }, { headers: { "cache-control": "private, max-age=60" } });
  } catch (error) {
    console.error("stripe_plans_error", error);
    return secureErrorResponse(error, "Não foi possível carregar os planos agora.");
  }
}
