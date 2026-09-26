import { getSignDaily, getSignMonthly, getSignWeekly, getSkyToday, signSlugFromName } from "@/lib/sky";
import { enforceRateLimit, secureErrorResponse } from "@/lib/security";

/**
 * GET /api/sky?sign=Leão — today's live sky plus that sign's day, week and month, in Portuguese.
 * Any part can be missing (source or AI unavailable); the app then shows what it has.
 */
export async function GET(request: Request) {
  try {
    await enforceRateLimit(request, "sky", "read", 240, 3600);
    const signParam = new URL(request.url).searchParams.get("sign") ?? "";
    const slug = signParam ? signSlugFromName(signParam) : null;
    const [sky, sign, week, month] = await Promise.allSettled([
      getSkyToday(),
      slug ? getSignDaily(slug) : Promise.resolve(null),
      slug ? getSignWeekly(slug) : Promise.resolve(null),
      slug ? getSignMonthly(slug) : Promise.resolve(null),
    ]);
    for (const [name, part] of [["sky", sky], ["sign", sign], ["week", week], ["month", month]] as const) {
      if (part.status === "rejected") console.error(`sky_${name}_failed`, part.reason);
    }
    const value = <T,>(part: PromiseSettledResult<T>) => (part.status === "fulfilled" ? part.value : null);
    return Response.json(
      { sky: value(sky), sign: value(sign), week: value(week), month: value(month) },
      { headers: { "cache-control": "public, max-age=600" } },
    );
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível ler o céu agora.");
  }
}
