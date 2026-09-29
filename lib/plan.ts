/**
 * Premium access. A paid plan lives on the profile; new accounts also get a free trial of
 * TRIAL_DAYS days (users.trial_ends_at) with everything unlocked, no card and no automatic charge:
 * when it ends the account simply goes back to the free plan.
 *
 * Welcome offer: an account that had the trial gets WELCOME_OFFER_PERCENT off the first month of
 * its first subscription, from the trial until WELCOME_OFFER_DAYS after it ends — a real deadline,
 * shown as a date, never a countdown.
 */
export const TRIAL_DAYS = 3;
export const WELCOME_OFFER_PERCENT = 50;
export const WELCOME_OFFER_DAYS = 7;

export function trialEndsAtFrom(now = new Date()) {
  return new Date(now.getTime() + TRIAL_DAYS * 86_400_000).toISOString();
}

export function trialActive(user: { trialEndsAt?: string | null } | null | undefined, now = Date.now()) {
  return Boolean(user?.trialEndsAt && new Date(user.trialEndsAt).getTime() > now);
}

/** Paid Premium, or a trial that hasn't ended yet. */
export function hasPremium(profilePlan: string | null | undefined, user: { trialEndsAt?: string | null } | null | undefined) {
  return profilePlan === "premium" || trialActive(user);
}

/** When the welcome offer stops being valid, or null for accounts that never had the trial. */
export function welcomeOfferEndsAt(user: { trialEndsAt?: string | null } | null | undefined) {
  if (!user?.trialEndsAt) return null;
  return new Date(new Date(user.trialEndsAt).getTime() + WELCOME_OFFER_DAYS * 86_400_000).toISOString();
}
