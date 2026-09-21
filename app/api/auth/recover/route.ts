import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { passwordResetTokens, sessions, users } from "@/db/schema";
import { createPassword, createSecureToken, hashToken, normalizeEmail, validEmail, validPassword } from "@/lib/auth";
import { emailIsConfigured, sendPasswordResetEmail } from "@/lib/email";
import { enforceRateLimit, readJsonBody, secureErrorResponse } from "@/lib/security";

const genericResult = { sent: true, message: "Se esse e-mail estiver cadastrado, você receberá um link para criar uma nova senha." };

export async function POST(request: Request) {
  try {
    const payload = await readJsonBody<{ email?: string }>(request, 2 * 1024);
    await enforceRateLimit(request, "password-recovery", "request", 5, 60 * 60);
    if (!emailIsConfigured()) return Response.json({ error: "A recuperação por e-mail ainda precisa ser ativada." }, { status: 503 });
    const email = normalizeEmail(payload.email ?? "");
    if (!validEmail(email)) return Response.json({ error: "Digite um e-mail válido." }, { status: 400 });
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) return Response.json(genericResult);
    await enforceRateLimit(request, "password-recovery-account", user.id, 3, 60 * 60);

    const [recent] = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt))).orderBy(desc(passwordResetTokens.createdAt)).limit(1);
    if (recent && Date.now() - new Date(recent.createdAt).getTime() < 60_000) return Response.json(genericResult);

    const token = createSecureToken();
    const tokenHash = await hashToken(token);
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
    await db.insert(passwordResetTokens).values({ tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() });
    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (error) {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
      throw error;
    }
    return Response.json(genericResult);
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos.");
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await readJsonBody<{ token?: string; password?: string }>(request, 2 * 1024);
    await enforceRateLimit(request, "password-reset", "finish", 10, 15 * 60);
    const token = payload.token ?? "";
    const password = payload.password ?? "";
    if (token.length < 32 || token.length > 128) return Response.json({ error: "Este link de recuperação é inválido." }, { status: 400 });
    if (!validPassword(password)) return Response.json({ error: "A senha precisa ter entre 8 e 128 caracteres." }, { status: 400 });
    const db = getDb();
    const tokenHash = await hashToken(token);
    const [record] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash)).limit(1);
    if (!record || record.usedAt || new Date(record.expiresAt).getTime() <= Date.now()) {
      return Response.json({ error: "Este link expirou ou já foi utilizado." }, { status: 400 });
    }
    const passwordData = await createPassword(password);
    const now = new Date().toISOString();
    await db.batch([
      db.update(users).set({ ...passwordData, updatedAt: now }).where(eq(users.id, record.userId)),
      db.update(passwordResetTokens).set({ usedAt: now }).where(eq(passwordResetTokens.tokenHash, tokenHash)),
      db.delete(sessions).where(eq(sessions.userId, record.userId)),
    ]);
    return Response.json({ reset: true });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível alterar sua senha agora.");
  }
}
