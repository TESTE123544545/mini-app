import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { communityMessages, communityModLog, communityProfiles, communityReports } from "@/db/schema";
import { isoTime } from "@/lib/community/rooms";
import { memberContext, requireFounder } from "@/lib/community/server";
import { readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["pin", "unpin", "remove", "restore"]), messageId: z.number().int().positive(), note: z.string().trim().max(200).optional() }).strict(),
  z.object({ action: z.literal("suspend"), username: z.string().trim().toLowerCase().max(20), days: z.number().int().min(1).max(365), note: z.string().trim().min(3).max(200) }).strict(),
  z.object({ action: z.literal("unsuspend"), username: z.string().trim().toLowerCase().max(20), note: z.string().trim().max(200).optional() }).strict(),
  z.object({ action: z.literal("dismiss"), reportId: z.number().int().positive() }).strict(),
]);

/**
 * GET /api/community/mod — the team's panel: reports waiting, community numbers and the log of team actions.
 * Private conversations do not exist in this stage, and reported messages are the only content shown here.
 */
export async function GET(request: Request) {
  try {
    requireFounder(await memberContext(request));
    const db = getDb();
    const reports = await db.all<{ id: number; messageId: number; reason: string; createdAt: string; room: string; body: string; removed: number; username: string; reports: number }>(sql`
      SELECT r.id AS id, r.message_id AS messageId, r.reason AS reason, r.created_at AS createdAt, m.room AS room, m.body AS body, m.removed AS removed,
             cp.username AS username, (SELECT COUNT(*) FROM community_reports x WHERE x.message_id = r.message_id) AS reports
      FROM community_reports r
      JOIN community_messages m ON m.id = r.message_id
      JOIN community_profiles cp ON cp.device_id = m.device_id
      WHERE r.status = 'open' ORDER BY r.id DESC LIMIT 50`);
    const [numbers] = await db.all<{ members: number; messages24h: number; active24h: number; open: number }>(sql`
      SELECT (SELECT COUNT(*) FROM community_profiles) AS members,
             (SELECT COUNT(*) FROM community_messages WHERE created_at > datetime('now','-1 day')) AS messages24h,
             (SELECT COUNT(DISTINCT device_id) FROM community_messages WHERE created_at > datetime('now','-1 day')) AS active24h,
             (SELECT COUNT(*) FROM community_reports WHERE status = 'open') AS open`);
    const log = await db.select().from(communityModLog).orderBy(desc(communityModLog.id)).limit(20);
    return Response.json({
      reports: reports.map((row) => ({ ...row, removed: Boolean(row.removed), createdAt: isoTime(row.createdAt) })),
      numbers, log: log.map((row) => ({ ...row, createdAt: isoTime(row.createdAt) })),
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível abrir o painel agora.");
  }
}

/** POST /api/community/mod — pin, remove or restore a message, suspend a member, dismiss a report. Founder only, always logged. */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 2048));
    if (!parsed.success) throw new RequestError("Ação inválida.", 400);
    const founder = requireFounder(await memberContext(request));
    const db = getDb();
    const body = parsed.data;
    const log = (action: string, extra: { targetUsername?: string; messageId?: number; note?: string }) =>
      db.insert(communityModLog).values({ actor: founder.email, action, targetUsername: extra.targetUsername ?? null, messageId: extra.messageId ?? null, note: extra.note ?? "" });

    if (body.action === "pin" || body.action === "unpin" || body.action === "remove" || body.action === "restore") {
      const [message] = await db.select({ id: communityMessages.id, username: communityProfiles.username }).from(communityMessages)
        .innerJoin(communityProfiles, eq(communityProfiles.deviceId, communityMessages.deviceId)).where(eq(communityMessages.id, body.messageId)).limit(1);
      if (!message) throw new RequestError("Mensagem não encontrada.", 404);
      if (body.action === "pin" || body.action === "unpin") await db.update(communityMessages).set({ pinned: body.action === "pin" }).where(eq(communityMessages.id, message.id));
      else await db.update(communityMessages).set({ removed: body.action === "remove", ...(body.action === "remove" ? { pinned: false } : {}) }).where(eq(communityMessages.id, message.id));
      // Removing a message settles the reports about it.
      if (body.action === "remove") await db.update(communityReports).set({ status: "resolved", handledAt: new Date().toISOString() }).where(eq(communityReports.messageId, message.id));
      await log(body.action, { targetUsername: message.username, messageId: message.id, note: body.note });
    } else if (body.action === "suspend" || body.action === "unsuspend") {
      const [target] = await db.select().from(communityProfiles).where(eq(communityProfiles.username, body.username)).limit(1);
      if (!target) throw new RequestError("Membro não encontrado.", 404);
      if (body.action === "suspend") {
        const until = new Date(Date.now() + body.days * 86_400_000).toISOString();
        await db.update(communityProfiles).set({ suspendedUntil: until, strikes: target.strikes + 1 }).where(eq(communityProfiles.deviceId, target.deviceId));
        await log("suspend", { targetUsername: target.username, note: `${body.days} dia(s): ${body.note}` });
      } else {
        await db.update(communityProfiles).set({ suspendedUntil: null }).where(eq(communityProfiles.deviceId, target.deviceId));
        await log("unsuspend", { targetUsername: target.username, note: body.note });
      }
    } else if (body.action === "dismiss") {
      await db.update(communityReports).set({ status: "dismissed", handledAt: new Date().toISOString() }).where(eq(communityReports.id, body.reportId));
      await log("dismiss", { note: `denúncia ${body.reportId}` });
    }
    return Response.json({ done: true });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível concluir a ação agora.");
  }
}
