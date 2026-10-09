import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { communityProfiles, profiles } from "@/db/schema";
import { badgesFor, displayNameFor, founderDevices, memberContext, requireActive } from "@/lib/community/server";
import { isoTime } from "@/lib/community/rooms";
import { enforceFastLimit, RequestError, secureErrorResponse } from "@/lib/security";

/** GET /api/community/members?u=username — a member's public card: name, sign, bio, badges. Nothing private (no birth date, e-mail or tree yet). */
export async function GET(request: Request) {
  try {
    const member = requireActive(await memberContext(request));
    await enforceFastLimit(request, "LIMIT_120", "community", member.userId, 120, 60);
    const username = (new URL(request.url).searchParams.get("u") ?? "").trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(username)) throw new RequestError("Membro não encontrado.", 404);
    const [row] = await getDb().select({ cp: communityProfiles, plan: profiles.plan }).from(communityProfiles)
      .innerJoin(profiles, eq(profiles.deviceId, communityProfiles.deviceId)).where(eq(communityProfiles.username, username)).limit(1);
    if (!row) throw new RequestError("Membro não encontrado.", 404);
    const founders = await founderDevices();
    return Response.json({ member: {
      username: row.cp.username, displayName: displayNameFor(row.cp.deviceId, row.cp.displayName, founders), sign: row.cp.sign,
      bio: row.cp.bio, joinedAt: isoTime(row.cp.joinedAt), badges: badgesFor(row.cp.deviceId, row.plan, founders), me: row.cp.deviceId === member.deviceId,
    } });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível abrir o perfil agora.");
  }
}
