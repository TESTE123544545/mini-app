import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { adminLoginCodes, adminSessions, users } from "@/db/schema";
import { createSecureToken, hashToken, isAdminEmail, normalizeEmail, PASSWORD_ITERATIONS, readCookie, verifyPassword } from "@/lib/auth";
import { sendAdminCodeEmail } from "@/lib/email";
import { enforceRateLimit, RequestError } from "@/lib/security";

/**
 * Developer access to /admin, separate from the app's own login:
 *  1. e-mail + password of an account listed in ADMIN_EMAILS;
 *  2. a 6-digit code e-mailed to that address (10 minutes, 5 tries);
 *  3. a short admin session (12 h, not renewed) in its own __Host- cookie.
 * Removing an address from ADMIN_EMAILS revokes its sessions at the next request.
 */

const ADMIN_COOKIE = "__Host-vds_admin";
const SESSION_HOURS = 12;
const CODE_MINUTES = 10;
const MAX_CODE_ATTEMPTS = 5;
const GENERIC_LOGIN_ERROR = "Acesso negado. Confira o e-mail e a senha.";
const DUMMY_HASH = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const DUMMY_SALT = "AAAAAAAAAAAAAAAAAAAAAA==";

type AdminUser = typeof users.$inferSelect;

async function adminFromToken(token: string | null): Promise<AdminUser | null> {
  if (!token) return null;
  const db = getDb();
  const now = new Date().toISOString();
  const [session] = await db.select().from(adminSessions).where(and(eq(adminSessions.tokenHash, await hashToken(token)), gt(adminSessions.expiresAt, now))).limit(1);
  if (!session) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user && isAdminEmail(user.email) ? user : null;
}

/** The signed-in developer for an API request, or a 401. */
export async function requireAdmin(request: Request) {
  const admin = await adminFromToken(readCookie(request, ADMIN_COOKIE));
  if (!admin) throw new RequestError("Acesso restrito à equipe.", 401);
  return admin;
}

/** For the /admin page (server component): the developer behind this cookie header, if any. */
export async function adminFromCookieHeader(cookieHeader: string | null) {
  return adminFromToken(readCookie(new Request("https://admin.local/", { headers: { cookie: cookieHeader ?? "" } }), ADMIN_COOKIE));
}

function sixDigits() {
  const [value] = crypto.getRandomValues(new Uint32Array(1));
  return String(value % 1_000_000).padStart(6, "0");
}

/** Step 1: e-mail and password. On success e-mails a code and returns the challenge id. */
export async function startAdminLogin(request: Request, rawEmail: string, password: string) {
  await enforceRateLimit(request, "admin-login", "ip", 8, 15 * 60);
  const email = normalizeEmail(rawEmail);
  const db = getDb();
  const [user] = isAdminEmail(email) ? await db.select().from(users).where(eq(users.email, email)).limit(1) : [];
  // Same work whether or not the account exists or is an admin, so timing reveals nothing.
  const valid = user
    ? await verifyPassword(password, user.passwordHash, user.passwordSalt, user.passwordIterations)
    : await verifyPassword(password, DUMMY_HASH, DUMMY_SALT, PASSWORD_ITERATIONS);
  if (!user || !valid) throw new RequestError(GENERIC_LOGIN_ERROR, 401);
  await enforceRateLimit(request, "admin-login-account", user.id, 5, 60 * 60);

  await db.delete(adminLoginCodes).where(lt(adminLoginCodes.expiresAt, new Date().toISOString()));
  const id = createSecureToken();
  const code = sixDigits();
  await db.insert(adminLoginCodes).values({ id, userId: user.id, codeHash: await hashToken(`${id}:${code}`), expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString() });
  await sendAdminCodeEmail(user.email, code);
  return { challenge: id };
}

/** Step 2: the e-mailed code. On success returns the Set-Cookie for a new admin session. */
export async function finishAdminLogin(request: Request, challenge: string, code: string) {
  await enforceRateLimit(request, "admin-code", "ip", 15, 15 * 60);
  const db = getDb();
  const now = new Date().toISOString();
  const [row] = await db.select().from(adminLoginCodes).where(and(eq(adminLoginCodes.id, challenge.slice(0, 128)), isNull(adminLoginCodes.usedAt), gt(adminLoginCodes.expiresAt, now))).limit(1);
  if (!row || row.attempts >= MAX_CODE_ATTEMPTS) throw new RequestError("Código expirado. Entre de novo para receber outro.", 401);
  if (!/^\d{6}$/.test(code) || (await hashToken(`${row.id}:${code}`)) !== row.codeHash) {
    await db.update(adminLoginCodes).set({ attempts: row.attempts + 1 }).where(eq(adminLoginCodes.id, row.id));
    throw new RequestError(row.attempts + 1 >= MAX_CODE_ATTEMPTS ? "Código incorreto. Entre de novo para receber outro." : "Código incorreto.", 401);
  }
  await db.update(adminLoginCodes).set({ usedAt: now }).where(eq(adminLoginCodes.id, row.id));
  const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  if (!user || !isAdminEmail(user.email)) throw new RequestError(GENERIC_LOGIN_ERROR, 401);

  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, now));
  const token = createSecureToken();
  await db.insert(adminSessions).values({ tokenHash: await hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + SESSION_HOURS * 3_600_000).toISOString() });
  console.log("admin_login", { email: user.email });
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

export async function endAdminSession(request: Request) {
  const token = readCookie(request, ADMIN_COOKIE);
  if (token) await getDb().delete(adminSessions).where(eq(adminSessions.tokenHash, await hashToken(token)));
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
