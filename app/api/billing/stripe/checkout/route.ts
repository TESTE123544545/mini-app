import { getSessionUser } from "@/lib/auth";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";
import { premiumProductId, SITE_ORIGIN, stripe, stripeConfigured, type StripePrice } from "@/lib/stripe";

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
    if (!price.active || price.product !== premiumProductId()) throw new RequestError("Plano indisponível.", 400);
    const recurring = price.type === "recurring";

    const session = await stripe<{ url: string }>("/checkout/sessions", {
      mode: recurring ? "subscription" : "payment",
      "line_items[0][price]": price.id,
      "line_items[0][quantity]": 1,
      client_reference_id: user.id,
      customer_email: user.email,
      locale: "pt-BR",
      allow_promotion_codes: true,
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
