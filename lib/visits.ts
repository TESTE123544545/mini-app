import { and, eq, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { pageViews, skyDaily } from "@/db/schema";
import { brazilDayKey } from "@/lib/sky";

/**
 * First-party visit counting for the admin dashboard. No cookie and no stored IP: each view keeps
 * a hash of IP + browser under a salt that exists for one day only, which is enough to count
 * unique visitors per day and useless for following anyone across days.
 */

const BOT = /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pagespeed|curl|wget|python|node-fetch|undici|axios|go-http|java\/|okhttp|VeiasDaSintonia-warmup/i;
const SALT_KEY = "visitor-salt";
let saltCache: { day: string; salt: string } | null = null;

/** A real page view: a document load or an in-app navigation, never a prefetch, asset or API call. */
export function isCountableView(request: Request, response: Response) {
  if (request.method !== "GET" || response.status !== 200) return false;
  const url = new URL(request.url);
  if (/^\/(api|admin|_next)(\/|$)/.test(url.pathname) || /\.[a-z0-9]+$/i.test(url.pathname)) return false;
  if (BOT.test(request.headers.get("user-agent") ?? "")) return false;
  if (request.headers.has("next-router-prefetch") || request.headers.get("purpose") === "prefetch" || request.headers.get("sec-purpose")?.includes("prefetch")) return false;
  const type = response.headers.get("content-type") ?? "";
  const dest = request.headers.get("sec-fetch-dest");
  if (type.startsWith("text/html")) return dest === null || dest === "document";
  return type.startsWith("text/x-component") && request.headers.get("rsc") === "1";
}

async function dailySalt(day: string) {
  if (saltCache?.day === day) return saltCache.salt;
  const db = getDb();
  const [row] = await db.select({ payloadJson: skyDaily.payloadJson }).from(skyDaily).where(and(eq(skyDaily.day, day), eq(skyDaily.key, SALT_KEY))).limit(1);
  let salt = row ? (JSON.parse(row.payloadJson) as string) : null;
  if (!salt) {
    const fresh = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
    await db.insert(skyDaily).values({ day, key: SALT_KEY, payloadJson: JSON.stringify(fresh) }).onConflictDoNothing();
    // Yesterday's salt is kept until today (views right after midnight); older ones are deleted.
    await db.delete(skyDaily).where(and(eq(skyDaily.key, SALT_KEY), lt(skyDaily.day, previousDay(day))));
    const [stored] = await db.select({ payloadJson: skyDaily.payloadJson }).from(skyDaily).where(and(eq(skyDaily.day, day), eq(skyDaily.key, SALT_KEY))).limit(1);
    salt = stored ? (JSON.parse(stored.payloadJson) as string) : fresh;
  }
  saltCache = { day, salt };
  return salt;
}

function previousDay(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function deviceOf(userAgent: string) {
  if (/; wv\)/.test(userAgent) && /Android/.test(userAgent)) return "app";
  if (/Mobi|Android|iPhone|iPod/.test(userAgent)) return "mobile";
  if (/iPad|Tablet/.test(userAgent)) return "tablet";
  return "desktop";
}

function externalReferrer(request: Request) {
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    const host = new URL(referer).hostname.replace(/^www\./, "");
    return host === new URL(request.url).hostname.replace(/^www\./, "") ? null : host.slice(0, 120);
  } catch {
    return null;
  }
}

export async function recordView(request: Request) {
  const day = brazilDayKey();
  const userAgent = request.headers.get("user-agent") ?? "";
  const ip = request.headers.get("cf-connecting-ip") ?? "";
  const salt = await dailySalt(day);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}|${ip}|${userAgent}`));
  const visitor = Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const country = (request as Request & { cf?: { country?: string } }).cf?.country ?? request.headers.get("cf-ipcountry");
  await getDb().insert(pageViews).values({
    day,
    path: new URL(request.url).pathname.slice(0, 200),
    visitor,
    referrer: externalReferrer(request),
    country: country && country !== "XX" ? country.slice(0, 2) : null,
    device: deviceOf(userAgent),
  });
}
