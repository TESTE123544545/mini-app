import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";

const SESSION_COOKIE = "vds_session";
// Long-lived and sliding: people who keep using the app are never logged out by the clock.
const SESSION_DAYS = 180;
const DAY_MS = 24 * 60 * 60 * 1000;
// Cloudflare Workers currently rejects a single PBKDF2 operation above 100,000
// iterations. Keep this versioned so accounts can be rehashed when authentication
// moves to the dedicated backend with Argon2id support.
export const PASSWORD_ITERATIONS = 100_000;

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function hashToken(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToBase64(new Uint8Array(digest));
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as Uint8Array<ArrayBuffer>, iterations }, key, 256);
  return bytesToBase64(new Uint8Array(bits));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  for (const item of cookies.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return null;
}

export function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function validPassword(value: string) {
  return value.length >= 8 && value.length <= 128;
}

export async function createPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { passwordHash: await derivePassword(password, salt, PASSWORD_ITERATIONS), passwordSalt: bytesToBase64(salt), passwordIterations: PASSWORD_ITERATIONS };
}

export async function verifyPassword(password: string, passwordHash: string, passwordSalt: string, passwordIterations = 100_000) {
  const candidate = await derivePassword(password, base64ToBytes(passwordSalt), passwordIterations);
  return constantTimeEqual(candidate, passwordHash);
}

export async function createSession(userId: string) {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = bytesToBase64(tokenBytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const tokenHash = await hashToken(token);
  const expires = new Date(Date.now() + SESSION_DAYS * DAY_MS);
  await getDb().insert(sessions).values({ tokenHash, userId, expiresAt: expires.toISOString() });
  return { token, cookie: sessionCookie(token) };
}

function sessionCookie(token: string) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`;
}

/**
 * Pushes a valid session's expiry back to a full SESSION_DAYS (at most once a day) and returns
 * the refreshed cookie, so an app that is opened regularly stays signed in indefinitely.
 */
export async function renewSession(request: Request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const db = getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).limit(1);
  if (!session) return null;
  const remaining = new Date(session.expiresAt).getTime() - Date.now();
  if (remaining <= 0 || remaining > (SESSION_DAYS - 1) * DAY_MS) return null;
  await db.update(sessions).set({ expiresAt: new Date(Date.now() + SESSION_DAYS * DAY_MS).toISOString() }).where(eq(sessions.tokenHash, tokenHash));
  return sessionCookie(token);
}

export async function getSessionUser(request: Request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await hashToken(token);
  const db = getDb();
  const [session] = await db.select().from(sessions).where(eq(sessions.tokenHash, tokenHash)).limit(1);
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    if (session) await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    return null;
  }
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  return user ?? null;
}

export async function deleteSession(request: Request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await getDb().delete(sessions).where(eq(sessions.tokenHash, await hashToken(token)));
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

/** Team accounts (comma-separated ADMIN_EMAILS) that may grant exclusive achievements. */
export function isAdminEmail(email: string) {
  // Worker secrets are read from the Cloudflare env binding, with process.env as a fallback for other runtimes.
  const configured = (env as unknown as { ADMIN_EMAILS?: string }).ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? "";
  const admins = configured.split(",").map((item) => normalizeEmail(item)).filter(Boolean);
  return admins.includes(normalizeEmail(email));
}

export function publicUser(user: { email: string; primaryDeviceId: string | null }) {
  return { email: user.email, deviceId: user.primaryDeviceId, isAdmin: isAdminEmail(user.email) };
}

export function createSecureToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64(bytes).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
