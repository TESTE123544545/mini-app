import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { requireAdmin } from "@/lib/adminAuth";
import { enforceRateLimit, secureErrorResponse } from "@/lib/security";
import { RESERVED, RESERVED_SUFFIXES } from "@/lib/emailPolicy";
import { brazilDayKey } from "@/lib/sky";

// Real accounts only: test addresses (example.com, *.test…) have no access and don't count.
const REAL_USER = sql.raw(`NOT (${[...RESERVED.map((domain) => `lower(email) LIKE '%@${domain}'`), ...RESERVED_SUFFIXES.map((suffix) => `lower(email) LIKE '%${suffix}'`)].join(" OR ")})`);

/** The conversion funnel, in order. Each step counts distinct accounts (or anonymous events). */
const FUNNEL = [
  ["signup", "Cadastros"],
  ["onboarding_completed", "Concluíram o cadastro inicial"],
  ["diagnostic_completed", "Fizeram o diagnóstico"],
  ["paywall_viewed", "Viram a oferta Premium"],
  ["checkout_started", "Abriram o pagamento"],
  ["checkout_completed", "Assinaram"],
] as const;

/** Where a visit came from, from the referring host. No referrer means typed, bookmarked, an app or a message. */
function sourceOf(host: string | null) {
  if (!host) return "Direto / app / mensagem";
  const rules: [RegExp, string][] = [
    [/google\./, "Google"], [/bing\.|msn\./, "Bing"], [/yahoo\./, "Yahoo"], [/duckduckgo/, "DuckDuckGo"],
    [/instagram/, "Instagram"], [/facebook|fb\./, "Facebook"], [/tiktok/, "TikTok"], [/youtube|youtu\.be/, "YouTube"],
    [/pinterest/, "Pinterest"], [/t\.co$|twitter|x\.com/, "X (Twitter)"], [/linkedin/, "LinkedIn"], [/whatsapp/, "WhatsApp"],
    [/stripe\.com/, "Pagamento (Stripe)"],
  ];
  return rules.find(([pattern]) => pattern.test(host))?.[1] ?? host;
}

const DEVICE_LABEL: Record<string, string> = { mobile: "Celular (navegador)", app: "App Android", desktop: "Computador", tablet: "Tablet" };

// Brasília calendar day of a stored timestamp (ISO "…T…Z" or SQLite "YYYY-MM-DD HH:MM:SS", both UTC).
const brDay = (column: string) => sql.raw(`date(replace(replace(${column}, 'T', ' '), 'Z', ''), '-3 hours')`);

function dayShift(day: string, delta: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/** GET /api/admin/dashboard?days=30 — everything the admin dashboard shows (ADMIN_EMAILS only). */
export async function GET(request: Request) {
  try {
    const user = await requireAdmin(request);
    await enforceRateLimit(request, "admin", user.id, 60, 60);

    const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get("days")) || 30));
    const today = brazilDayKey();
    const yesterday = dayShift(today, -1);
    const since = dayShift(today, -(days - 1));
    const db = getDb();

    const [
      [accounts], signupsByDay, visitsByDay, activeByDay, [activeWeek], pages, referrers, countries, devices,
      funnelRows, events, recent, [missions],
    ] = await Promise.all([
      db.all<{ total: number; premium: number; lifetime: number; trials: number }>(sql`
        SELECT (SELECT COUNT(*) FROM users WHERE ${REAL_USER}) AS total,
               (SELECT COUNT(*) FROM users WHERE trial_ends_at > ${new Date().toISOString()} AND ${REAL_USER}) AS trials,
               (SELECT COUNT(*) FROM profiles p JOIN users ON users.primary_device_id = p.device_id WHERE p.plan = 'premium' AND ${REAL_USER}) AS premium,
               (SELECT COUNT(*) FROM subscriptions WHERE status = 'lifetime') AS lifetime`),
      db.all<{ day: string; n: number }>(sql`
        SELECT ${brDay("created_at")} AS day, COUNT(*) AS n FROM users
        WHERE ${brDay("created_at")} >= ${since} AND ${REAL_USER} GROUP BY day`),
      db.all<{ day: string; views: number; visitors: number }>(sql`
        SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM page_views
        WHERE day >= ${since} GROUP BY day`),
      db.all<{ day: string; n: number }>(sql`
        SELECT day, COUNT(DISTINCT device_id) AS n FROM (
          SELECT ${brDay("created_at")} AS day, device_id FROM analytics_events WHERE device_id IS NOT NULL
          UNION ALL
          SELECT ${brDay("completed_at")} AS day, device_id FROM mission_completions
        ) WHERE day >= ${since} GROUP BY day`),
      db.all<{ n: number }>(sql`
        SELECT COUNT(DISTINCT device_id) AS n FROM (
          SELECT ${brDay("created_at")} AS day, device_id FROM analytics_events WHERE device_id IS NOT NULL
          UNION ALL
          SELECT ${brDay("completed_at")} AS day, device_id FROM mission_completions
        ) WHERE day >= ${dayShift(today, -6)}`),
      db.all<{ path: string; views: number; visitors: number }>(sql`
        SELECT path, COUNT(*) AS views, COUNT(DISTINCT day || visitor) AS visitors FROM page_views
        WHERE day >= ${since} GROUP BY path ORDER BY views DESC LIMIT 12`),
      db.all<{ host: string | null; views: number }>(sql`
        SELECT referrer AS host, COUNT(*) AS views FROM page_views WHERE day >= ${since} GROUP BY referrer`),
      db.all<{ country: string | null; views: number }>(sql`
        SELECT country, COUNT(DISTINCT day || visitor) AS views FROM page_views WHERE day >= ${since}
        GROUP BY country ORDER BY views DESC LIMIT 8`),
      db.all<{ device: string; views: number }>(sql`
        SELECT device, COUNT(DISTINCT day || visitor) AS views FROM page_views WHERE day >= ${since}
        GROUP BY device ORDER BY views DESC`),
      db.all<{ name: string; people: number }>(sql`
        SELECT event_name AS name, COUNT(DISTINCT COALESCE(device_id, 'anon-' || id)) AS people FROM analytics_events
        WHERE ${brDay("created_at")} >= ${since} GROUP BY event_name`),
      db.all<{ name: string; n: number }>(sql`
        SELECT event_name AS name, COUNT(*) AS n FROM analytics_events
        WHERE ${brDay("created_at")} >= ${since} GROUP BY event_name ORDER BY n DESC LIMIT 12`),
      db.all<{ email: string; name: string | null; sign: string | null; plan: string | null; createdAt: string }>(sql`
        SELECT u.email AS email, p.name AS name, p.sign AS sign, p.plan AS plan, u.created_at AS createdAt
        FROM (SELECT * FROM users WHERE ${REAL_USER}) u LEFT JOIN profiles p ON p.device_id = u.primary_device_id
        ORDER BY u.created_at DESC LIMIT 15`),
      db.all<{ n: number }>(sql`SELECT COUNT(*) AS n FROM mission_completions WHERE ${brDay("completed_at")} = ${today}`),
    ]);

    const signups = new Map(signupsByDay.map((row) => [row.day, Number(row.n)]));
    const visits = new Map(visitsByDay.map((row) => [row.day, row]));
    const active = new Map(activeByDay.map((row) => [row.day, Number(row.n)]));
    const series = Array.from({ length: days }, (_, index) => {
      const day = dayShift(since, index);
      return { day, views: Number(visits.get(day)?.views ?? 0), visitors: Number(visits.get(day)?.visitors ?? 0), signups: signups.get(day) ?? 0, active: active.get(day) ?? 0 };
    });
    const sum = (key: "views" | "visitors" | "signups") => series.reduce((total, item) => total + item[key], 0);

    const sources = new Map<string, number>();
    for (const row of referrers) sources.set(sourceOf(row.host), (sources.get(sourceOf(row.host)) ?? 0) + Number(row.views));
    const funnelCounts = new Map(funnelRows.map((row) => [row.name, Number(row.people)]));
    const todayRow = series[series.length - 1];
    const yesterdayRow = series.find((item) => item.day === yesterday);

    return Response.json({
      days,
      today,
      kpis: {
        accounts: Number(accounts?.total ?? 0),
        accountsNew: sum("signups"),
        accountsToday: todayRow.signups,
        premium: Number(accounts?.premium ?? 0),
        lifetime: Number(accounts?.lifetime ?? 0),
        trials: Number(accounts?.trials ?? 0),
        viewsToday: todayRow.views,
        visitorsToday: todayRow.visitors,
        viewsYesterday: yesterdayRow?.views ?? null,
        visitorsYesterday: yesterdayRow?.visitors ?? null,
        views: sum("views"),
        visitorsPerDay: Math.round(sum("visitors") / days),
        activeToday: todayRow.active,
        activeWeek: Number(activeWeek?.n ?? 0),
        missionsToday: Number(missions?.n ?? 0),
      },
      series,
      pages: pages.map((row) => ({ path: row.path, views: Number(row.views), visitors: Number(row.visitors) })),
      sources: [...sources].map(([source, views]) => ({ source, views })).sort((a, b) => b.views - a.views).slice(0, 8),
      countries: countries.map((row) => ({ country: row.country ?? "—", visitors: Number(row.views) })),
      devices: devices.map((row) => ({ device: DEVICE_LABEL[row.device] ?? row.device, visitors: Number(row.views) })),
      funnel: FUNNEL.map(([key, label]) => ({ key, label, people: funnelCounts.get(key) ?? 0 })),
      events: events.map((row) => ({ name: row.name, count: Number(row.n) })),
      recentAccounts: recent.map((row) => ({ ...row, plan: row.plan ?? "free" })),
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível carregar o painel.");
  }
}
