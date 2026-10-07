import handler from "vinext/server/fetch-handler";
import { buildMissingArticles } from "@/lib/articles";
import { runTrialEmails } from "@/lib/trialEmails";
import { refreshGoogleSubscriptions } from "@/lib/googlePlay";
import { isCountableView, recordView } from "@/lib/visits";

/**
 * The Worker entry: vinext serves every request, and a cron (see vite.config.ts) renders the
 * "Horóscopo do dia" hub a few times after midnight in Brasília. That creates the day's texts for
 * all twelve signs before any visitor or crawler arrives, so search engines always find today's
 * reading on the page — and each newly created text is announced through IndexNow. It also
 * counts page views (lib/visits.ts) for the admin dashboard.
 */
type Handler = { fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> };
const app = handler as unknown as Handler;

/**
 * Cloudflare knows which network (ASN) a request came from, but the framework hides `request.cf`.
 * For the sign-in endpoints we hand it over in a header the client can never set: it is dropped first.
 */
function withNetwork(request: Request) {
  const { pathname } = new URL(request.url);
  if (!pathname.startsWith("/api/auth") && !pathname.startsWith("/api/admin")) return request;
  const headers = new Headers(request.headers);
  headers.delete("x-vds-asn");
  const asn = (request as Request & { cf?: { asn?: number } }).cf?.asn;
  if (asn) headers.set("x-vds-asn", String(asn));
  return new Request(request, { headers });
}

/**
 * The public sign and horoscope pages are the same for everyone and cost seconds to build (live sky,
 * AI texts, several database reads), so they are kept at the edge: served in milliseconds, rebuilt in the
 * background when older than ten minutes. The key carries the Brasília date so a new day never shows
 * yesterday's reading. Signed-in app traffic, client navigations (RSC) and anything with a query string
 * never go through here.
 */
const EDGE_PAGES = /^\/(signos|horoscopo-do-dia|horas-iguais|numerologia|numerologia-dos-signos)(\/|$)/;
const EDGE_FRESH_MS = 10 * 60_000;

async function edgePage(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response | null> {
  const url = new URL(request.url);
  if (request.method !== "GET" || url.search || !EDGE_PAGES.test(url.pathname)) return null;
  if (request.headers.has("rsc") || request.headers.has("next-router-state-tree") || request.headers.has("next-router-prefetch")) return null;
  if (!(request.headers.get("accept") ?? "").includes("text/html")) return null;

  const cache = (caches as unknown as { default: Cache }).default;
  const day = new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);
  // Signed-in browsers get the variant without the ads script (components/Ads.tsx decides for them).
  const variant = (request.headers.get("cookie") ?? "").includes("vds_session=") ? "auth" : "anon";
  const key = new Request(`${url.origin}${url.pathname}?edge-day=${day}&v=${variant}`);

  const rebuild = async () => {
    const fresh = await app.fetch(request, env, ctx);
    if (fresh.status === 200 && (fresh.headers.get("content-type") ?? "").includes("text/html")) {
      const headers = new Headers(fresh.headers);
      headers.set("cache-control", "public, max-age=0, s-maxage=86400");
      headers.set("x-cached-at", String(Date.now()));
      await cache.put(key, new Response(fresh.clone().body, { status: 200, headers }));
    }
    return fresh;
  };

  const hit = await cache.match(key);
  if (!hit) return rebuild();
  if (Date.now() - Number(hit.headers.get("x-cached-at") ?? 0) > EDGE_FRESH_MS) ctx.waitUntil(rebuild().then((response) => response.arrayBuffer()).catch((error) => console.error("edge_rebuild_failed", error)));
  const out = new Response(hit.body, hit);
  out.headers.set("cache-control", "public, max-age=0, must-revalidate");
  out.headers.set("x-edge-cache", "HIT");
  return out;
}

const worker = {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    const response = (await edgePage(request, env, ctx)) ?? (await app.fetch(withNetwork(request), env, ctx));
    // Page views for the admin dashboard, written after the response so visitors never wait for it.
    if (isCountableView(request, response)) ctx.waitUntil(recordView(request).catch((error) => console.error("visit_record_failed", error)));
    return response;
  },
  async scheduled(controller: { cron: string }, env: unknown, ctx: ExecutionContext) {
    // Every 15 minutes, in its own invocation (the free plan allows 50 subrequests per run):
    // write any long SEO article that doesn't exist yet — a no-op once they all do.
    if (controller.cron === "*/15 * * * *") {
      ctx.waitUntil(buildMissingArticles().catch((error) => console.error("articles_failed", error)));
      return;
    }
    const warm = new Request("https://veiasdasintonia.com.br/horoscopo-do-dia", { headers: { "user-agent": "VeiasDaSintonia-warmup/1.0" } });
    ctx.waitUntil(app.fetch(warm, env, ctx).then((response) => response.arrayBuffer()).catch((error) => console.error("warmup_failed", error)));
    // Premium trial e-mails (sent only in daytime in Brasília).
    ctx.waitUntil(runTrialEmails().catch((error) => console.error("trial_emails_failed", error)));
    // Google Play subscriptions that end soon: renewals extend Premium, cancellations and failed payments end it.
    ctx.waitUntil(refreshGoogleSubscriptions().catch((error) => console.error("google_refresh_failed", error)));
  },
};

export default worker;
