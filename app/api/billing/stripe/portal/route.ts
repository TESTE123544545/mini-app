import { getSessionUser } from "@/lib/auth";
import { readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";
import { customerForDevice, SITE_ORIGIN, stripe } from "@/lib/stripe";

/** Stripe's customer portal: change card, see invoices, or cancel in a couple of taps. */
export async function POST(request: Request) {
  try {
    await readJsonBody<Record<string, never>>(request, 256);
    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    const customer = user.primaryDeviceId ? await customerForDevice(user.primaryDeviceId) : null;
    if (!customer) throw new RequestError("Não encontramos uma assinatura do Stripe nesta conta.", 404);
    const portal = await stripe<{ url: string }>("/billing_portal/sessions", { customer, return_url: SITE_ORIGIN, locale: "pt-BR" });
    return Response.json({ url: portal.url });
  } catch (error) {
    if (!(error instanceof RequestError)) console.error("stripe_portal_error", error);
    return secureErrorResponse(error, "Não foi possível abrir o gerenciamento da assinatura agora.");
  }
}
