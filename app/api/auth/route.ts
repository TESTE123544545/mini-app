import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, users } from "@/db/schema";
import { createPassword, createSecureToken, createSession, deleteSession, getSessionUser, normalizeEmail, PASSWORD_ITERATIONS, publicUser, renewSession, validEmail, validPassword, verifyPassword } from "@/lib/auth";
import { assertLoginAllowed, recordLoginFailure } from "@/lib/bruteforce";
import { isBlockedEmail, signupEmailProblem } from "@/lib/emailPolicy";
import { trialActive, trialEndsAtFrom } from "@/lib/plan";
import { sendTrialWelcome } from "@/lib/trialEmails";
import { enforceRateLimit, readJsonBody, secureErrorResponse } from "@/lib/security";

type AuthPayload = { action?: "register" | "login" | "logout"; email?: string; password?: string };

function errorResponse(error: unknown) {
  return secureErrorResponse(error, "Não foi possível acessar sua conta agora.");
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    const renewed = user ? await renewSession(request) : null;
    // Premium (paid, or the free trial) accounts see no ads: the browser reads this flag (components/Ads.tsx).
    let adFree = user ? trialActive(user) : false;
    if (user && !adFree && user.primaryDeviceId) {
      const [profile] = await getDb().select({ plan: profiles.plan }).from(profiles).where(eq(profiles.deviceId, user.primaryDeviceId)).limit(1);
      adFree = profile?.plan === "premium";
    }
    return Response.json({ user: user ? publicUser(user) : null, adFree }, renewed ? { headers: { "set-cookie": renewed } } : undefined);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readJsonBody<AuthPayload>(request, 2 * 1024);
    await enforceRateLimit(request, "auth", "all", 20, 15 * 60);
    if (payload.action === "logout") {
      return Response.json({ loggedOut: true }, { headers: { "set-cookie": await deleteSession(request) } });
    }

    const email = normalizeEmail(payload.email ?? "");
    const password = payload.password ?? "";
    if (!validEmail(email)) return Response.json({ error: "Digite um e-mail válido." }, { status: 400 });
    if (!validPassword(password)) return Response.json({ error: "A senha precisa ter entre 8 e 128 caracteres." }, { status: 400 });

    const db = getDb();
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let user = existing;

    if (payload.action === "register") {
      await enforceRateLimit(request, "register", "new-account", 5, 60 * 60);
      if (existing) return Response.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
      const problem = await signupEmailProblem(email);
      if (problem) return Response.json({ error: problem }, { status: 400 });
      const passwordData = await createPassword(password);
      // New accounts start with a free Premium trial; the welcome e-mail tells them so.
      user = { id: crypto.randomUUID(), email, primaryDeviceId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), trialEndsAt: trialEndsAtFrom(), trialDay2SentAt: null, trialReminderSentAt: null, trialEndedSentAt: null, emailToken: createSecureToken(), emailOptOut: false, ...passwordData };
      await db.insert(users).values(user);
      sendTrialWelcome(user);
    } else if (payload.action === "login") {
      if (isBlockedEmail(email)) return Response.json({ error: "Contas com e-mail de teste ou temporário não têm acesso ao app." }, { status: 403 });
      await assertLoginAllowed(request, email);
      if (existing) await enforceRateLimit(request, "login-account", existing.id, 7, 15 * 60);
      const valid = existing
        ? await verifyPassword(password, existing.passwordHash, existing.passwordSalt, existing.passwordIterations)
        : await verifyPassword(password, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", "AAAAAAAAAAAAAAAAAAAAAA==", PASSWORD_ITERATIONS);
      if (!existing || !valid) {
        await recordLoginFailure(request, email);
        return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
      }
      if (existing.passwordIterations < PASSWORD_ITERATIONS) {
        await db.update(users).set({ ...(await createPassword(password)), updatedAt: new Date().toISOString() }).where(eq(users.id, existing.id));
      }
    } else {
      return Response.json({ error: "Ação inválida." }, { status: 400 });
    }

    const session = await createSession(user!.id);
    return Response.json({ user: publicUser(user!) }, { headers: { "set-cookie": session.cookie } });
  } catch (error) {
    return errorResponse(error);
  }
}
