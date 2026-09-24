import { getSessionUser } from "@/lib/auth";
import { readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";
import { applyCheckoutSession, stripe, type StripeCheckoutSession } from "@/lib/stripe";

/**
 * Called when the person lands back from Checkout, so Premium turns on immediately instead of
 * waiting for the webhook. Only the account that opened the session can confirm it.
 */
export async function POST(request: Request) {
  try {
    const { sessionId } = await readJsonBody<{ sessionId?: string }>(request, 1024);
    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new RequestError("Sessão de pagamento inválida.", 400);
    const session = await stripe<StripeCheckoutSession>(`/checkout/sessions/${sessionId}`, undefined, "GET");
    if (session.client_reference_id !== user.id) throw new RequestError("Este pagamento pertence a outra conta.", 403);
    const plan = await applyCheckoutSession(session);
    return Response.json({ plan: plan ?? "pending" });
  } catch (error) {
    if (!(error instanceof RequestError)) console.error("stripe_confirm_error", error);
    return secureErrorResponse(error, "Não foi possível confirmar o pagamento agora.");
  }
}
