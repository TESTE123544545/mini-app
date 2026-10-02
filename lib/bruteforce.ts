import { and, count, countDistinct, desc, eq, gt, lt, min } from "drizzle-orm";
import { getDb } from "@/db";
import { ipBlocks, loginFailures, securityEvents } from "@/db/schema";
import { hashToken } from "@/lib/auth";
import { clientIp, RequestError } from "@/lib/security";

/**
 * Brute-force defense for passwords, in three layers that each look at a different thing an attacker
 * can't change at will:
 *  1. the IP: 10 wrong passwords in 15 min blocks it for 15 min, then 1 h, 6 h, 24 h (repeat offenders);
 *  2. the e-mail being attacked, from ANY IP: 10 wrong passwords in 30 min locks that e-mail's logins,
 *     so changing IP or VPN server between guesses gains nothing;
 *  3. the network (ASN): VPN and hosting providers keep many exit IPs in one ASN, so a burst of wrong
 *     passwords spread over several IPs of one ASN — like Tor traffic — puts those IPs on a 3-try leash.
 * Only wrong passwords are counted. Attempts refused by a block or lock are not, so an attacker can't
 * keep the lock going forever against the real owner, who can always recover the password by e-mail.
 */

const MINUTE = 60_000;
const IP_LIMIT = 10;
const WATCHED_IP_LIMIT = 3;
const ACCOUNT_LIMIT = 10;
const NETWORK_LIMIT = 40;
const NETWORK_MIN_IPS = 4;
const BLOCK_MINUTES = [15, 60, 360, 1440];
const MESSAGE = "Muitas tentativas. Tente novamente mais tarde.";

type Origin = { ip: string; asn: string | null; country: string | null };

function originOf(request: Request): Origin {
  const cf = (request as Request & { cf?: { asn?: number; country?: string } }).cf;
  return { ip: clientIp(request), asn: cf?.asn ? String(cf.asn) : null, country: cf?.country ?? request.headers.get("cf-ipcountry") };
}

const iso = (ms: number) => new Date(ms).toISOString();
const accountKey = (email: string) => hashToken(`login-account:${email}`);
const maskEmail = (email: string) => `${email.slice(0, 2)}***${email.slice(email.lastIndexOf("@"))}`;

async function logEvent(kind: string, origin: Origin, detail: string) {
  await getDb().insert(securityEvents).values({ kind, ip: origin.ip, asn: origin.asn, country: origin.country, detail, createdAt: iso(Date.now()) });
}

/** Call before checking a password. Throws 429 when this IP is blocked or this e-mail is locked. */
export async function assertLoginAllowed(request: Request, email: string) {
  const { ip } = originOf(request);
  const db = getDb();
  const now = Date.now();
  const [block] = await db.select().from(ipBlocks).where(eq(ipBlocks.ip, ip)).limit(1);
  if (block && Date.parse(block.until) > now) throw new RequestError(MESSAGE, 429, Math.ceil((Date.parse(block.until) - now) / 1000));
  const [recent] = await db.select({ n: count(), oldest: min(loginFailures.createdAt) }).from(loginFailures)
    .where(and(eq(loginFailures.account, await accountKey(email)), gt(loginFailures.createdAt, iso(now - 30 * MINUTE))));
  if (recent.n >= ACCOUNT_LIMIT && recent.oldest) throw new RequestError(MESSAGE, 429, Math.max(60, Math.ceil((Date.parse(recent.oldest) + 30 * MINUTE - now) / 1000)));
}

/** Call after a wrong password: records it and applies the IP block, the account lock and the network watch. */
export async function recordLoginFailure(request: Request, email: string) {
  const origin = originOf(request);
  const { ip, asn, country } = origin;
  const db = getDb();
  const now = Date.now();
  const account = await accountKey(email);
  await db.insert(loginFailures).values({ ip, asn, account, createdAt: iso(now) });
  // Old rows are never read again; about 1 call in 85 clears them so the tables stay small.
  if (crypto.getRandomValues(new Uint8Array(1))[0] < 3) {
    await db.delete(loginFailures).where(lt(loginFailures.createdAt, iso(now - 24 * 60 * MINUTE)));
    await db.delete(securityEvents).where(lt(securityEvents.createdAt, iso(now - 30 * 24 * 60 * MINUTE)));
  }

  const since15 = iso(now - 15 * MINUTE);
  const [[byIp], [byAccount], [byNetwork]] = await Promise.all([
    db.select({ n: count() }).from(loginFailures).where(and(eq(loginFailures.ip, ip), gt(loginFailures.createdAt, since15))),
    db.select({ n: count(), ips: countDistinct(loginFailures.ip) }).from(loginFailures).where(and(eq(loginFailures.account, account), gt(loginFailures.createdAt, iso(now - 30 * MINUTE)))),
    asn
      ? db.select({ n: count(), ips: countDistinct(loginFailures.ip) }).from(loginFailures).where(and(eq(loginFailures.asn, asn), gt(loginFailures.createdAt, since15)))
      : Promise.resolve([{ n: 0, ips: 0 }]),
  ]);

  const networkUnderAttack = byNetwork.n >= NETWORK_LIMIT && byNetwork.ips >= NETWORK_MIN_IPS;
  if (networkUnderAttack) {
    const [seen] = await db.select({ n: count() }).from(securityEvents).where(and(eq(securityEvents.kind, "network_watched"), eq(securityEvents.asn, asn!), gt(securityEvents.createdAt, since15)));
    if (!seen.n) await logEvent("network_watched", origin, `${byNetwork.n} senhas erradas de ${byNetwork.ips} IPs desta rede em 15 min`);
  }

  const watched = country === "T1" || networkUnderAttack;
  if (ip !== "unknown" && byIp.n >= (watched ? WATCHED_IP_LIMIT : IP_LIMIT)) {
    const [previous] = await db.select().from(ipBlocks).where(eq(ipBlocks.ip, ip)).limit(1);
    const strikes = previous && Date.parse(previous.until) + 24 * 60 * MINUTE > now ? previous.strikes + 1 : 1;
    const minutes = BLOCK_MINUTES[Math.min(strikes, BLOCK_MINUTES.length) - 1];
    const values = { until: iso(now + minutes * MINUTE), strikes, updatedAt: iso(now) };
    await db.insert(ipBlocks).values({ ip, ...values }).onConflictDoUpdate({ target: ipBlocks.ip, set: values });
    const reason = country === "T1" ? "rede Tor" : networkUnderAttack ? "rede sob ataque" : "senhas erradas";
    await logEvent("ip_blocked", origin, `${strikes}ª vez · ${minutes >= 60 ? `${minutes / 60} h` : `${minutes} min`} · ${reason} · ${maskEmail(email)}`);
  }

  if (byAccount.n === ACCOUNT_LIMIT) {
    const rotating = byAccount.ips >= 3;
    await logEvent(rotating ? "rotation_suspected" : "account_locked", origin, `${maskEmail(email)} · ${byAccount.n} senhas erradas de ${byAccount.ips} IP${byAccount.ips === 1 ? "" : "s"} em 30 min`);
  }
}

/** Numbers and the latest events for the admin panel. */
export async function securitySummary() {
  const db = getDb();
  const now = Date.now();
  const day = iso(now - 24 * 60 * MINUTE);
  const [[failed], [blocked], recent, kinds] = await Promise.all([
    db.select({ n: count() }).from(loginFailures).where(gt(loginFailures.createdAt, day)),
    db.select({ n: count() }).from(ipBlocks).where(gt(ipBlocks.until, iso(now))),
    db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt)).limit(25),
    db.select({ kind: securityEvents.kind, n: count() }).from(securityEvents).where(gt(securityEvents.createdAt, day)).groupBy(securityEvents.kind),
  ]);
  return {
    failed24h: Number(failed.n),
    blockedNow: Number(blocked.n),
    last24h: Object.fromEntries(kinds.map((row) => [row.kind, Number(row.n)])) as Record<string, number>,
    recent: recent.map((row) => ({ kind: row.kind, ip: row.ip, asn: row.asn, country: row.country, detail: row.detail, createdAt: row.createdAt })),
  };
}
