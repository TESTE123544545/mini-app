import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { communityBlocks, communityProfiles } from "@/db/schema";
import { memberContext, requireActive } from "@/lib/community/server";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({ username: z.string().trim().toLowerCase().min(3).max(20), block: z.boolean() }).strict();

/** POST /api/community/block — hides one member's messages from this member (and lifts it again). */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 512));
    if (!parsed.success) throw new RequestError("Pedido inválido.", 400);
    const member = requireActive(await memberContext(request));
    await enforceRateLimit(request, "community-block", member.userId, 40, 3600);
    const db = getDb();
    const [target] = await db.select({ deviceId: communityProfiles.deviceId }).from(communityProfiles).where(eq(communityProfiles.username, parsed.data.username)).limit(1);
    if (!target) throw new RequestError("Membro não encontrado.", 404);
    if (target.deviceId === member.deviceId) throw new RequestError("Você não pode bloquear a si mesmo.", 400);
    if (parsed.data.block) await db.insert(communityBlocks).values({ blockerId: member.deviceId, blockedId: target.deviceId }).onConflictDoNothing();
    else await db.delete(communityBlocks).where(and(eq(communityBlocks.blockerId, member.deviceId), eq(communityBlocks.blockedId, target.deviceId)));
    return Response.json({ blocked: parsed.data.block });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível concluir agora.");
  }
}
