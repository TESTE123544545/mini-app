import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { createSecureToken, hashToken } from "@/lib/auth";

export const APP_ORIGIN = "https://veiasdasintonia.com.br";

/**
 * Issues a fresh single-use reset token for a user (replacing any earlier one) and returns the
 * link that opens the "Crie uma nova senha" screen. Used by the e-mail flow and by the team panel.
 */
export async function issueResetLink(userId: string, validMinutes: number) {
  const db = getDb();
  const token = createSecureToken();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + validMinutes * 60 * 1000).toISOString();
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db.insert(passwordResetTokens).values({ tokenHash, userId, expiresAt });
  return { token, tokenHash, expiresAt, url: `${APP_ORIGIN}/?reset=${encodeURIComponent(token)}` };
}
