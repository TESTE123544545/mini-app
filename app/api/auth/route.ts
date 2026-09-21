import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createPassword, createSession, deleteSession, getSessionUser, normalizeEmail, PASSWORD_ITERATIONS, publicUser, validEmail, validPassword, verifyPassword } from "@/lib/auth";
import { enforceRateLimit, readJsonBody, secureErrorResponse } from "@/lib/security";

type AuthPayload = { action?: "register" | "login" | "logout"; email?: string; password?: string };

function errorResponse(error: unknown) {
  return secureErrorResponse(error, "Não foi possível acessar sua conta agora.");
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    return Response.json({ user: user ? publicUser(user) : null });
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
      const passwordData = await createPassword(password);
      user = { id: crypto.randomUUID(), email, primaryDeviceId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...passwordData };
      await db.insert(users).values(user);
    } else if (payload.action === "login") {
      if (existing) await enforceRateLimit(request, "login-account", existing.id, 7, 15 * 60);
      const valid = existing
        ? await verifyPassword(password, existing.passwordHash, existing.passwordSalt, existing.passwordIterations)
        : await verifyPassword(password, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=", "AAAAAAAAAAAAAAAAAAAAAA==", PASSWORD_ITERATIONS);
      if (!existing || !valid) {
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
