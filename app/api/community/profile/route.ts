import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { communityProfiles } from "@/db/schema";
import { memberContext, requireActive } from "@/lib/community/server";
import { MAX_BIO, hasAbuse } from "@/lib/community/rooms";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({ displayName: z.string().trim().min(2).max(30), bio: z.string().trim().max(MAX_BIO) }).strict();

/** POST /api/community/profile — the member edits the name and bio shown to others. Username and sign stay fixed. */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 1024));
    if (!parsed.success) throw new RequestError("Confira o nome e a bio.", 400);
    const member = requireActive(await memberContext(request));
    await enforceRateLimit(request, "community-profile", member.userId, 20, 3600);
    if (hasAbuse(`${parsed.data.displayName} ${parsed.data.bio}`)) throw new RequestError("Escolha um nome e uma bio sem ofensas.", 400);
    await getDb().update(communityProfiles).set(parsed.data).where(eq(communityProfiles.deviceId, member.deviceId));
    return Response.json({ saved: true });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível salvar o perfil agora.");
  }
}
