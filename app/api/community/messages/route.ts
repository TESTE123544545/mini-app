import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { communityMessages, communityReads } from "@/db/schema";
import { loadMessages, memberContext, requireActive, requireRoom } from "@/lib/community/server";
import { messageProblem } from "@/lib/community/rooms";
import { enforceFastLimit, enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({ room: z.string().min(1).max(40), body: z.string().max(1000), replyTo: z.number().int().positive().optional() }).strict();
const id = (value: string | null) => { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : undefined; };

/** Marks everything up to `lastId` as seen in the room (the unread counters). */
async function markRead(deviceId: string, room: string, lastId: number) {
  await getDb().insert(communityReads).values({ deviceId, room, lastId })
    .onConflictDoUpdate({ target: [communityReads.deviceId, communityReads.room], set: { lastId: sql`max(${communityReads.lastId}, ${lastId})` } });
}

/**
 * GET /api/community/messages?room=…[&after=id | &before=id] — a page of the room, or only what is newer than `after`
 * (the screens ask every few seconds). The server decides whether this member may read this room, every time.
 */
export async function GET(request: Request) {
  try {
    const member = requireActive(await memberContext(request));
    await enforceFastLimit(request, "LIMIT_120", "community", member.userId, 120, 60);
    const params = new URL(request.url).searchParams;
    const room = requireRoom(member, params.get("room") ?? "");
    const after = id(params.get("after")), before = id(params.get("before"));
    const messages = await loadMessages(member, room.id, { after, before });
    const pinned = after || before ? [] : await loadMessages(member, room.id, { pinnedOnly: true, limit: 3 });
    const top = messages.at(-1)?.id;
    if (top && !before) await markRead(member.deviceId, room.id, top);
    return Response.json({ messages, pinned }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível carregar as mensagens agora.");
  }
}

/** POST /api/community/messages — sends a message to a room the member belongs to. */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 4 * 1024));
    if (!parsed.success) throw new RequestError("Mensagem inválida.", 400);
    const member = requireActive(await memberContext(request));
    const room = requireRoom(member, parsed.data.room);
    await enforceRateLimit(request, "community-send", member.userId, 12, 60);

    const body = parsed.data.body.trim();
    const problem = messageProblem(body, { allowLinks: member.founder });
    if (problem) throw new RequestError(problem, 400);

    const db = getDb();
    // The same text twice in a minute is spam, not conversation.
    const [duplicate] = await db.select({ id: communityMessages.id }).from(communityMessages)
      .where(and(eq(communityMessages.deviceId, member.deviceId), eq(communityMessages.body, body), gt(communityMessages.createdAt, sql`datetime('now', '-60 seconds')`))).limit(1);
    if (duplicate) throw new RequestError("Você acabou de enviar essa mensagem.", 429);

    let replyTo: number | null = null;
    if (parsed.data.replyTo) {
      const [target] = await db.select({ id: communityMessages.id }).from(communityMessages).where(and(eq(communityMessages.id, parsed.data.replyTo), eq(communityMessages.room, room.id))).limit(1);
      replyTo = target?.id ?? null;
    }
    const [created] = await db.insert(communityMessages).values({ room: room.id, deviceId: member.deviceId, body, replyTo }).returning({ id: communityMessages.id });
    await markRead(member.deviceId, room.id, created.id);
    return Response.json({ id: created.id });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível enviar agora.");
  }
}

