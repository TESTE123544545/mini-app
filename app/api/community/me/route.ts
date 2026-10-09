import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { communityBlocks, communityProfiles } from "@/db/schema";
import { FOUNDER_NAME, memberContext } from "@/lib/community/server";
import { MAX_BIO, MIN_AGE, REPORT_REASONS, ROOMS, RULES } from "@/lib/community/rooms";
import { enforceFastLimit, secureErrorResponse } from "@/lib/security";

/**
 * GET /api/community/me — what the Comunidade screen needs to open: whether this account may join (adults only),
 * its community profile, the rooms it can enter (with unread counters and club sizes) and the people it blocked.
 */
export async function GET(request: Request) {
  try {
    const member = await memberContext(request);
    await enforceFastLimit(request, "LIMIT_120", "community", member.userId, 120, 60);
    if (!member.adult) return Response.json({ adult: false, minAge: MIN_AGE }, { headers: { "cache-control": "private, no-store" } });

    const db = getDb();
    const base = { adult: true, minAge: MIN_AGE, founder: member.founder, rules: RULES, reasons: REPORT_REASONS, maxBio: MAX_BIO, sign: member.cp?.sign ?? member.profile.sign };
    if (!member.cp) return Response.json({ ...base, joined: false }, { headers: { "cache-control": "private, no-store" } });

    const sizes = await db.select({ sign: communityProfiles.sign, total: sql<number>`count(*)` }).from(communityProfiles).groupBy(communityProfiles.sign);
    // Unread = messages newer than the last one this member saw in the room, written by someone else.
    const unread = await db.all<{ room: string; total: number }>(sql`
      SELECT m.room AS room, COUNT(*) AS total FROM community_messages m
      LEFT JOIN community_reads r ON r.device_id = ${member.deviceId} AND r.room = m.room
      WHERE m.id > COALESCE(r.last_id, 0) AND m.device_id != ${member.deviceId} AND m.removed = 0
      GROUP BY m.room`);
    const blocked = await db.select({ username: communityProfiles.username }).from(communityBlocks)
      .innerJoin(communityProfiles, eq(communityProfiles.deviceId, communityBlocks.blockedId)).where(eq(communityBlocks.blockerId, member.deviceId));

    const rooms = ROOMS.map((room) => ({
      ...room,
      canEnter: room.kind === "global" || member.founder || room.sign === member.cp!.sign,
      members: room.sign ? Number(sizes.find((row) => row.sign === room.sign)?.total ?? 0) : null,
      unread: Number(unread.find((row) => row.room === room.id)?.total ?? 0),
    }));
    return Response.json({
      ...base, joined: true,
      profile: { username: member.cp.username, displayName: member.founder ? FOUNDER_NAME : member.cp.displayName, bio: member.cp.bio, sign: member.cp.sign, joinedAt: member.cp.joinedAt, suspendedUntil: member.cp.suspendedUntil },
      rooms, blocked: blocked.map((row) => row.username),
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível abrir a comunidade agora.");
  }
}
