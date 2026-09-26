import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser, isAdminEmail, normalizeEmail } from "@/lib/auth";
import { issueResetLink } from "@/lib/passwordReset";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({ email: z.string().trim().min(3).max(254) }).strict();

/**
 * POST /api/admin/reset-link — the team (ADMIN_EMAILS) generates a one-time "Crie uma nova senha"
 * link for an account, valid for 24 hours, to send to the person by hand (e.g. WhatsApp).
 * Works whether or not automatic e-mail is configured.
 */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 2 * 1024));
    if (!parsed.success) throw new RequestError("Digite um e-mail válido.", 400);
    const admin = await getSessionUser(request);
    if (!admin) throw new RequestError("Entre na sua conta.", 401);
    if (!isAdminEmail(admin.email)) throw new RequestError("Acesso restrito à equipe.", 403);
    await enforceRateLimit(request, "admin-reset-link", admin.id, 20, 3600);

    const [target] = await getDb().select({ id: users.id, email: users.email }).from(users).where(eq(users.email, normalizeEmail(parsed.data.email))).limit(1);
    if (!target) throw new RequestError("Nenhuma conta com esse e-mail.", 404);
    const { url, expiresAt } = await issueResetLink(target.id, 24 * 60);
    return Response.json({ email: target.email, url, expiresAt });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível gerar o link.");
  }
}
