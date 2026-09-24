import { applyCheckoutSession, applySubscription, verifyStripeSignature, type StripeCheckoutSession, type StripeSubscription } from "@/lib/stripe";

/**
 * Stripe webhook. Configure in the Stripe dashboard:
 *   URL:    https://veiasdasintonia.com.br/api/billing/stripe/webhook
 *   Events: checkout.session.completed, customer.subscription.created,
 *           customer.subscription.updated, customer.subscription.deleted
 * and store its signing secret as STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await request.text();
  if (!secret || !(await verifyStripeSignature(rawBody, request.headers.get("stripe-signature"), secret))) {
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }
  try {
    const event = JSON.parse(rawBody) as { type: string; data: { object: unknown } };
    if (event.type === "checkout.session.completed") {
      await applyCheckoutSession(event.data.object as StripeCheckoutSession);
    } else if (event.type.startsWith("customer.subscription.")) {
      const subscription = event.data.object as StripeSubscription;
      await applySubscription(subscription, subscription.metadata?.userId);
    }
    return Response.json({ received: true });
  } catch (error) {
    // A 500 makes Stripe retry later, which is what we want for a transient database or API failure.
    console.error("stripe_webhook_error", error);
    return Response.json({ error: "processing failed" }, { status: 500 });
  }
}
