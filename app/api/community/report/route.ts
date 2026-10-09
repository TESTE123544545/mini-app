import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { communityMessages, communityReports } from "@/db/schema";
import { memberContext, requireActive, requireRoom } from "@/lib/community/server";
import { REPORT_REASONS } from "@/lib/community/rooms";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({ messageId: z.number().int().positive(), reason: z.enum(REPORT_REASONS) }).strict();

/** POST /api/community/report — flags a message for the team. Only messages from rooms the member can read can be reported. */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 1024));
    if (!parsed.success) throw new RequestError("Denúncia inválida.", 400);
    const member = requireActive(await memberContext(request));
    await enforceRateLimit(request, "community-report", member.userId, 20, 3600);
    const [message] = await getDb().select().from(communityMessages).where(eq(communityMessages.id, parsed.data.messageId)).limit(1);
    if (!message) throw new RequestError("Mensagem não encontrada.", 404);
    requireRoom(member, message.room);
    if (message.deviceId === member.deviceId) throw new RequestError("Você não pode denunciar a própria mensagem.", 400);
    // One report per person per message: sending it again is harmless.
    await getDb().insert(communityReports).values({ reporterId: member.deviceId, messageId: message.id, reason: parsed.data.reason }).onConflictDoNothing();
    return Response.json({ reported: true });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível enviar a denúncia agora.");
  }
}
