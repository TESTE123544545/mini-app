import { getSignDaily, getSkyToday, signSlugFromName } from "@/lib/sky";
import { enforceRateLimit, secureErrorResponse } from "@/lib/security";

/**
 * GET /api/sky?sign=Leão — today's live sky and that sign's day, in Portuguese.
 * Either half can be missing (source or AI unavailable); the app then keeps its own content.
 */
export async function GET(request: Request) {
  try {
    await enforceRateLimit(request, "sky", "read", 120, 3600);
    const signParam = new URL(request.url).searchParams.get("sign") ?? "";
    const slug = signParam ? signSlugFromName(signParam) : null;
    const [sky, sign] = await Promise.allSettled([getSkyToday(), slug ? getSignDaily(slug) : Promise.resolve(null)]);
    if (sky.status === "rejected") console.error("sky_today_failed", sky.reason);
    if (sign.status === "rejected") console.error("sign_daily_failed", sign.reason);
    return Response.json(
      { sky: sky.status === "fulfilled" ? sky.value : null, sign: sign.status === "fulfilled" ? sign.value : null },
      { headers: { "cache-control": "public, max-age=600" } },
    );
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível ler o céu agora.");
  }
}
