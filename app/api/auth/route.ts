import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createPassword, createSession, deleteSession, getSessionUser, normalizeEmail, publicUser, validEmail, validPassword, verifyPassword } from "@/lib/auth";

type AuthPayload = { action?: "register" | "login" | "logout"; email?: string; password?: string };

function errorResponse(error: unknown) {
  console.error("auth_error", error);
  return Response.json({ error: "Não foi possível acessar sua conta agora." }, { status: 500 });
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
    const payload = (await request.json()) as AuthPayload;
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
      if (existing) return Response.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
      const passwordData = await createPassword(password);
      user = { id: crypto.randomUUID(), email, primaryDeviceId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...passwordData };
      await db.insert(users).values(user);
    } else if (payload.action === "login") {
      if (!existing || !(await verifyPassword(password, existing.passwordHash, existing.passwordSalt))) {
        return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
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
