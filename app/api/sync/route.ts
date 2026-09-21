import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../db";
import { goals, journalEntries, profiles, userProgress, users } from "../../../db/schema";
import { getSessionUser } from "@/lib/auth";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const syncSchema = z.object({
  deviceId: z.string().regex(/^[a-zA-Z0-9-]{16,64}$/),
  profile: z.object({
    name: z.string().trim().min(1).max(80),
    birthDate: z.string().min(1).max(20),
    objective: z.string().min(1).max(80),
    sign: z.string().min(1).max(30),
    intention: z.string().max(280).optional().default(""),
    theme: z.enum(["dourado", "lua", "aurora"]).optional().default("dourado"),
  }).strict(),
  xp: z.number().int().min(0).max(1_000_000).optional().default(0),
  missionDone: z.boolean().optional().default(false),
  goals: z.array(z.object({ id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), title: z.string().trim().min(1).max(160), category: z.string().min(1).max(80), progress: z.number().int().min(0).max(100) }).strict()).max(100).optional().default([]),
  entries: z.array(z.object({ date: z.string().min(1).max(20), answers: z.array(z.string().max(4000)).max(4) }).strict()).max(365).optional().default([]),
}).strict();

function validDeviceId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{16,64}$/.test(value);
}

function errorResponse(error: unknown) {
  return secureErrorResponse(error, "Não foi possível sincronizar sua jornada agora.");
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    const deviceId = user.primaryDeviceId;
    if (!deviceId) return Response.json({ state: null, deviceId: null });
    const db = getDb();
    const [profile] = await db.select().from(profiles).where(eq(profiles.deviceId, deviceId)).limit(1);
    if (!profile) return Response.json({ state: null });
    const [progress] = await db.select().from(userProgress).where(eq(userProgress.deviceId, deviceId)).limit(1);
    const savedGoals = await db.select().from(goals).where(and(eq(goals.deviceId, deviceId), eq(goals.status, "active")));
    const savedEntries = await db.select().from(journalEntries).where(eq(journalEntries.deviceId, deviceId));
    return Response.json({ deviceId, state: { profile: { name: profile.name, birthDate: profile.birthDate, objective: profile.objective, sign: profile.sign, intention: profile.intention, theme: profile.theme, hasAvatar: Boolean(profile.avatarData) }, xp: progress?.xp ?? 0, missionDone: progress?.missionDone ?? false, goals: savedGoals.map(({ id, title, category, progress: value }) => ({ id, title, category, progress: value })), entries: savedEntries.map((entry) => ({ date: entry.entryDate, answers: JSON.parse(entry.answersJson) })) } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const rawPayload = await readJsonBody<unknown>(request, 256 * 1024);
    const parsed = syncSchema.safeParse(rawPayload);
    if (!parsed.success) throw new RequestError("Os dados enviados são inválidos.", 400);
    const payload = parsed.data;
    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    await enforceRateLimit(request, "sync", user.id, 120, 60);
    const requestedDeviceId = payload.deviceId;
    const deviceId = user.primaryDeviceId ?? requestedDeviceId;
    if (!validDeviceId(deviceId)) return Response.json({ error: "deviceId inválido" }, { status: 400 });
    const profile = payload.profile;
    const db = getDb();
    const now = new Date().toISOString();
    if (!user.primaryDeviceId) {
      const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.primaryDeviceId, deviceId)).limit(1);
      if (owner && owner.id !== user.id) return Response.json({ error: "Esta jornada já pertence a outra conta." }, { status: 409 });
    }
    const profileValues = { name: profile.name, birthDate: profile.birthDate, objective: profile.objective, sign: profile.sign, intention: profile.intention.trim(), theme: profile.theme, updatedAt: now };
    const progressValues = { xp: payload.xp, missionDone: payload.missionDone, lastMissionDate: payload.missionDone ? now.slice(0, 10) : null, updatedAt: now };
    const operations = [
      ...(user.primaryDeviceId ? [] : [db.update(users).set({ primaryDeviceId: deviceId, updatedAt: now }).where(eq(users.id, user.id))]),
      db.insert(profiles).values({ deviceId, ...profileValues }).onConflictDoUpdate({ target: profiles.deviceId, set: profileValues }),
      db.insert(userProgress).values({ deviceId, ...progressValues }).onConflictDoUpdate({ target: userProgress.deviceId, set: progressValues }),
      db.delete(goals).where(eq(goals.deviceId, deviceId)),
      ...(payload.goals.length ? [db.insert(goals).values(payload.goals.map((goal) => ({ ...goal, deviceId, status: "active" })))] : []),
      db.delete(journalEntries).where(eq(journalEntries.deviceId, deviceId)),
      ...(payload.entries.length ? [db.insert(journalEntries).values(payload.entries.map((entry) => ({ deviceId, entryDate: entry.date, answersJson: JSON.stringify(entry.answers) })))] : []),
    ];
    await db.batch(operations as Parameters<typeof db.batch>[0]);
    return Response.json({ saved: true, savedAt: now, deviceId });
  } catch (error) { return errorResponse(error); }
}
