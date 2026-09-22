import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rateLimits } from "@/db/schema";
import { hashToken } from "@/lib/auth";

export class RequestError extends Error {
  constructor(message: string, public status = 400, public retryAfter?: number) {
    super(message);
  }
}

function configuredFrontendOrigin() {
  return process.env.FRONTEND_ORIGIN?.replace(/\/$/, "");
}

function refererOrigin(request: Request) {
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

// Every Vercel deploy of the frontend gets a fresh, unique preview URL
// (`miniapp-<hash>-awvp9531-*.vercel.app`) — there is no fixed list to maintain.
// Only Vercel can mint a hostname under this project's own slug, so trusting the
// pattern is as safe as trusting the one alias we hardcode above.
const TRUSTED_VERCEL_PREVIEW = /^https:\/\/miniapp-[a-z0-9-]+\.vercel\.app$/i;

function isTrustedOrigin(origin: string, expectedOrigins: Set<string>) {
  return expectedOrigins.has(origin) || TRUSTED_VERCEL_PREVIEW.test(origin);
}

export function assertTrustedMutation(request: Request, contentType: "json" | "multipart" | "none") {
  const url = new URL(request.url);
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const isLocal = !request.headers.has("cf-ray") || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!isLocal && (forwardedProtocol === "http" || url.protocol !== "https:")) {
    throw new RequestError("Use uma conexão HTTPS segura.", 426);
  }

  const expectedOrigins = new Set([
    url.origin,
    "https://veiasdasintonia.com.br",
    "https://www.veiasdasintonia.com.br",
    "https://miniapp-liard-chi.vercel.app",
  ]);
  const frontendOrigin = configuredFrontendOrigin();
  if (frontendOrigin) expectedOrigins.add(frontendOrigin);
  // Some browsers omit Origin on an otherwise same-site request (privacy modes, certain
  // tracking-protection settings). Referer is governed by a separate policy, so it's a
  // legitimate fallback — reject only when neither header identifies a trusted origin.
  const origin = request.headers.get("origin") ?? refererOrigin(request);
  if (!origin || !isTrustedOrigin(origin, expectedOrigins)) throw new RequestError("Origem da requisição não autorizada.", 403);

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") throw new RequestError("Requisição entre sites bloqueada.", 403);

  if (contentType === "none") return;
  const receivedType = request.headers.get("content-type")?.toLowerCase() ?? "";
  const expectedType = contentType === "json" ? "application/json" : "multipart/form-data";
  if (!receivedType.startsWith(expectedType)) throw new RequestError("Formato da requisição não aceito.", 415);
}

export async function readJsonBody<T>(request: Request, maxBytes = 64 * 1024): Promise<T> {
  assertTrustedMutation(request, "json");
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > maxBytes) throw new RequestError("A requisição excede o tamanho permitido.", 413);
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new RequestError("A requisição excede o tamanho permitido.", 413);
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new RequestError("JSON inválido.", 400);
  }
}

export function assertMultipartRequest(request: Request, maxBytes: number) {
  assertTrustedMutation(request, "multipart");
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > maxBytes) throw new RequestError("O arquivo excede o tamanho permitido.", 413);
}

function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? "unknown";
}

export async function enforceRateLimit(request: Request, scope: string, identifier: string, limit: number, windowSeconds: number) {
  const rawKey = `${scope}:${clientIp(request)}:${identifier}`;
  const key = await hashToken(rawKey);
  const db = getDb();
  const now = Date.now();
  const [record] = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);

  if (!record || new Date(record.expiresAt).getTime() <= now) {
    const windowStartedAt = new Date(now).toISOString();
    const expiresAt = new Date(now + windowSeconds * 1000).toISOString();
    await db.insert(rateLimits).values({ key, count: 1, windowStartedAt, expiresAt }).onConflictDoUpdate({
      target: rateLimits.key,
      set: { count: 1, windowStartedAt, expiresAt },
    });
    return;
  }

  if (record.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((new Date(record.expiresAt).getTime() - now) / 1000));
    throw new RequestError("Muitas tentativas. Aguarde alguns minutos e tente novamente.", 429, retryAfter);
  }
  await db.update(rateLimits).set({ count: record.count + 1 }).where(eq(rateLimits.key, key));
}

/**
 * Locks a scope/identifier out for `durationSeconds` by pre-filling its rate-limit
 * record as already exhausted — the next `enforceRateLimit` call for the same
 * scope/identifier rejects with the remaining time until `durationSeconds` elapses.
 */
export async function suspendFor(request: Request, scope: string, identifier: string, durationSeconds: number) {
  const rawKey = `${scope}:${clientIp(request)}:${identifier}`;
  const key = await hashToken(rawKey);
  const db = getDb();
  const now = Date.now();
  const windowStartedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + durationSeconds * 1000).toISOString();
  await db.insert(rateLimits).values({ key, count: Number.MAX_SAFE_INTEGER, windowStartedAt, expiresAt }).onConflictDoUpdate({
    target: rateLimits.key,
    set: { count: Number.MAX_SAFE_INTEGER, windowStartedAt, expiresAt },
  });
}

export function secureErrorResponse(error: unknown, fallback: string) {
  if (error instanceof RequestError) {
    const headers = error.retryAfter ? { "retry-after": String(error.retryAfter) } : undefined;
    return Response.json({ error: error.message }, { status: error.status, headers });
  }
  console.error("api_error", error);
  return Response.json({ error: fallback }, { status: 500 });
}
