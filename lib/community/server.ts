import { and, asc, desc, eq, gt, inArray, lt, notInArray } from "drizzle-orm";
import { getDb } from "@/db";
import { communityBlocks, communityMessages, communityProfiles, profiles, users } from "@/db/schema";
import { getSessionUser, isAdminEmail, normalizeEmail } from "@/lib/auth";
import { env } from "cloudflare:workers";
import { ageFromDate } from "@/lib/birth";
import { MIN_AGE, isoTime, roomById, type Badge, type MessageView } from "@/lib/community/rooms";
import { RequestError } from "@/lib/security";

export const FOUNDER_NAME = "Fundador | Veias da Sintonia";

export type Member = {
  userId: string; email: string; deviceId: string;
  /** The account's real profile: its birth date decides the sign and the age, its plan decides the Premium badge. */
  profile: typeof profiles.$inferSelect;
  cp: typeof communityProfiles.$inferSelect | null;
  founder: boolean;
  adult: boolean;
};

/** Who is asking: session, profile, community profile, and the roles the SERVER decides (never a field the person can edit). */
export async function memberContext(request: Request): Promise<Member> {
  const user = await getSessionUser(request);
  if (!user) throw new RequestError("Entre na sua conta.", 401);
  if (!user.primaryDeviceId) throw new RequestError("Conclua seu cadastro no app antes de usar a comunidade.", 409);
  const db = getDb();
  const [profile] = await db.select().from(profiles).where(eq(profiles.deviceId, user.primaryDeviceId)).limit(1);
  if (!profile) throw new RequestError("Perfil não encontrado.", 404);
  const [cp] = await db.select().from(communityProfiles).where(eq(communityProfiles.deviceId, profile.deviceId)).limit(1);
  const founder = isAdminEmail(user.email);
  const age = ageFromDate(profile.birthDate);
  return { userId: user.id, email: user.email, deviceId: profile.deviceId, profile, cp: cp ?? null, founder, adult: founder || (age !== null && age >= MIN_AGE) };
}

/** A member who is allowed in: adult, has joined and is not suspended. */
export function requireActive(member: Member) {
  if (!member.adult) throw new RequestError("A comunidade é só para maiores de 18 anos.", 403);
  if (!member.cp) throw new RequestError("Entre na comunidade primeiro.", 403);
  if (!member.founder && member.cp.suspendedUntil && Date.parse(isoTime(member.cp.suspendedUntil)) > Date.now()) {
    throw new RequestError(`Sua participação está suspensa até ${new Date(isoTime(member.cp.suspendedUntil)).toLocaleDateString("pt-BR")}.`, 403);
  }
  return member as Member & { cp: NonNullable<Member["cp"]> };
}

export const requireFounder = (member: Member) => {
  if (!member.founder) throw new RequestError("Área exclusiva da equipe.", 403);
  return member;
};

/** Can this member read and write in this room? Clubs belong to their sign; the founder may enter all of them. */
export function requireRoom(member: Member & { cp: NonNullable<Member["cp"]> }, roomId: string) {
  const room = roomById(roomId);
  if (!room) throw new RequestError("Sala não encontrada.", 404);
  if (room.kind === "club" && !member.founder && member.cp.sign !== room.sign) throw new RequestError(`Este clube é só para o signo de ${room.sign}.`, 403);
  return room;
}

/** Device ids of the founder accounts (ADMIN_EMAILS), so their messages carry the founder badge. */
export async function founderDevices() {
  const configured = (env as unknown as { ADMIN_EMAILS?: string }).ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? "";
  const emails = configured.split(",").map((item) => normalizeEmail(item)).filter(Boolean);
  if (!emails.length) return new Set<string>();
  const rows = await getDb().select({ id: users.primaryDeviceId }).from(users).where(inArray(users.email, emails));
  return new Set(rows.map((row) => row.id).filter((id): id is string => Boolean(id)));
}

export function badgesFor(deviceId: string, plan: string, founders: Set<string>): Badge[] {
  const badges: Badge[] = [];
  if (founders.has(deviceId)) badges.push("fundador");
  // The Premium badge only follows a paid plan, never a free trial and never something the person set.
  if (plan === "premium") badges.push("premium");
  return badges;
}

export const displayNameFor = (deviceId: string, displayName: string, founders: Set<string>) => (founders.has(deviceId) ? FOUNDER_NAME : displayName);

const PAGE = 40;

/** A page of a room's messages as the viewer should see them (blocked authors hidden, removed ones as tombstones). */
export async function loadMessages(viewer: Member, room: string, { after, before, limit = PAGE, pinnedOnly = false }: { after?: number; before?: number; limit?: number; pinnedOnly?: boolean }) {
  const db = getDb();
  const blocked = (await db.select({ id: communityBlocks.blockedId }).from(communityBlocks).where(eq(communityBlocks.blockerId, viewer.deviceId))).map((row) => row.id);
  const conditions = [eq(communityMessages.room, room)];
  if (after) conditions.push(gt(communityMessages.id, after));
  if (before) conditions.push(lt(communityMessages.id, before));
  if (pinnedOnly) conditions.push(eq(communityMessages.pinned, true), eq(communityMessages.removed, false));
  if (blocked.length) conditions.push(notInArray(communityMessages.deviceId, blocked));
  const rows = await db.select({ m: communityMessages, cp: communityProfiles, plan: profiles.plan })
    .from(communityMessages)
    .innerJoin(communityProfiles, eq(communityProfiles.deviceId, communityMessages.deviceId))
    .innerJoin(profiles, eq(profiles.deviceId, communityMessages.deviceId))
    .where(and(...conditions))
    .orderBy(after ? asc(communityMessages.id) : desc(communityMessages.id))
    .limit(Math.min(limit, PAGE));
  const founders = await founderDevices();

  const replyIds = [...new Set(rows.map((row) => row.m.replyTo).filter((id): id is number => id !== null))];
  const replies = replyIds.length
    ? await db.select({ id: communityMessages.id, body: communityMessages.body, removed: communityMessages.removed, username: communityProfiles.username })
      .from(communityMessages).innerJoin(communityProfiles, eq(communityProfiles.deviceId, communityMessages.deviceId)).where(inArray(communityMessages.id, replyIds))
    : [];

  const view = rows.map(({ m, cp, plan }): MessageView => {
    const reply = replies.find((item) => item.id === m.replyTo);
    return {
      id: m.id, room: m.room, createdAt: isoTime(m.createdAt), pinned: m.pinned,
      body: m.removed ? "" : m.body,
      removed: m.removed,
      replyTo: reply ? { id: reply.id, username: reply.username, body: reply.removed ? "" : reply.body.slice(0, 90) } : null,
      author: { username: cp.username, displayName: displayNameFor(cp.deviceId, cp.displayName, founders), sign: cp.sign, badges: badgesFor(cp.deviceId, plan, founders) },
      mine: m.deviceId === viewer.deviceId,
    };
  });
  // Newest page comes back newest-first from the query; the screens want oldest-first.
  return after ? view : view.reverse();
}
