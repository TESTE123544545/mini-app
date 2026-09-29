import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, subscriptions } from "@/db/schema";
import { WELCOME_OFFER_PERCENT, welcomeOfferEndsAt } from "@/lib/plan";
import { stripe } from "@/lib/stripe";

const COUPON_ID = "BOASVINDAS50";

/** The welcome offer this account can use right now: first subscription only, until its deadline. */
export async function welcomeOfferFor(user: { trialEndsAt?: string | null; primaryDeviceId: string | null }) {
  const endsAt = welcomeOfferEndsAt(user);
  if (!endsAt || new Date(endsAt).getTime() <= Date.now()) return null;
  if (user.primaryDeviceId) {
    const db = getDb();
    const [profile] = await db.select({ plan: profiles.plan }).from(profiles).where(eq(profiles.deviceId, user.primaryDeviceId)).limit(1);
    if (profile?.plan === "premium") return null;
    const [previous] = await db.select({ token: subscriptions.purchaseToken }).from(subscriptions).where(eq(subscriptions.deviceId, user.primaryDeviceId)).limit(1);
    if (previous) return null;
  }
  return { percentOff: WELCOME_OFFER_PERCENT, endsAt };
}

/** The Stripe coupon behind the offer (50% off, first invoice only), created on first use. */
export async function welcomeCouponId() {
  try {
    await stripe(`/coupons/${COUPON_ID}`, undefined, "GET");
  } catch (error) {
    if (!String(error).includes("stripe_404")) throw error;
    await stripe("/coupons", { id: COUPON_ID, percent_off: WELCOME_OFFER_PERCENT, duration: "once", name: `Boas-vindas: ${WELCOME_OFFER_PERCENT}% no 1º mês` });
  }
  return COUPON_ID;
}
