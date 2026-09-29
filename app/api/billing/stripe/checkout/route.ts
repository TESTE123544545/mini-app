import { getSessionUser } from "@/lib/auth";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";
import { sellableProductIds, SITE_ORIGIN, stripe, stripeConfigured, type StripePrice } from "@/lib/stripe";
import { welcomeCouponId, welcomeOfferFor } from "@/lib/welcomeOffer";

/** Opens a Stripe Checkout Session for one of the Premium product's prices and returns its URL. */
export async function POST(request: Request) {
  try {
    const { priceId } = await readJsonBody<{ priceId?: string }>(request, 1024);
    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta para assinar." }, { status: 401 });
    if (!stripeConfigured()) return Response.json({ error: "A assinatura ainda não está disponível." }, { status: 503 });
    await enforceRateLimit(request, "checkout", user.id, 10, 15 * 60);
    if (!user.primaryDeviceId) throw new RequestError("Conclua seu cadastro no app antes de assinar.", 409);
    if (!priceId || !/^price_[A-Za-z0-9]+$/.test(priceId)) throw new RequestError("Plano inválido.", 400);

    const price = await stripe<StripePrice>(`/prices/${priceId}`, undefined, "GET");
    if (!price.active || !(await sellableProductIds()).includes(price.product)) throw new RequestError("Plano indisponível.", 400);
    const recurring = price.type === "recurring";
    // Welcome offer (lib/plan.ts): 50% off the first month of the first subscription, until its deadline.
    const offer = recurring ? await welcomeOfferFor(user) : null;
    // If the coupon can't be prepared, checkout still opens at the normal price rather than failing.
    const coupon = offer ? await welcomeCouponId().catch((error) => { console.error("welcome_coupon_failed", error); return null; }) : null;
    const discount = coupon ? { "discounts[0][coupon]": coupon, "metadata[offer]": "welcome50" } : { allow_promotion_codes: true };

    const session = await stripe<{ url: string }>("/checkout/sessions", {
      mode: recurring ? "subscription" : "payment",
      "line_items[0][price]": price.id,
      "line_items[0][quantity]": 1,
      client_reference_id: user.id,
      customer_email: user.email,
      locale: "pt-BR",
      ...discount,
      "metadata[userId]": user.id,
      "metadata[priceId]": price.id,
      ...(recurring ? { "subscription_data[metadata][userId]": user.id } : { "payment_intent_data[metadata][userId]": user.id }),
      success_url: `${SITE_ORIGIN}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_ORIGIN}/?checkout=cancel`,
    });
    return Response.json({ url: session.url });
  } catch (error) {
    if (!(error instanceof RequestError)) console.error("stripe_checkout_error", error);
    return secureErrorResponse(error, "Não foi possível abrir o pagamento agora.");
  }
}
