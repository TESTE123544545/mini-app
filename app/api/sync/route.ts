import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../db";
import { achievements, goals, journalEntries, profiles, trailProgress, userProgress, users } from "../../../db/schema";
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
  ritualDone: z.boolean().optional().default(false),
  goals: z.array(z.object({
    id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    title: z.string().trim().min(1).max(160),
    category: z.string().min(1).max(80),
    progress: z.number().int().min(0).max(100),
    isPrimary: z.boolean().optional(),
    kind: z.enum(["financial", "non_financial", "partial"]).optional(),
    targetAmount: z.number().int().min(0).max(1_000_000_000).optional(),
    currentAmount: z.number().int().min(0).max(1_000_000_000).optional(),
    deadline: z.string().max(20).optional(),
    motivation: z.string().max(500).optional(),
    stage: z.string().max(30).optional(),
    blocker: z.string().max(30).optional(),
    dailyMinutes: z.number().int().min(0).max(1440).optional(),
  }).strict()).max(100).optional().default([]),
  entries: z.array(z.object({ date: z.string().min(1).max(20), answers: z.array(z.string().max(4000)).max(4) }).strict()).max(365).optional().default([]),
  unlockedAchievements: z.array(z.string().min(1).max(60)).max(50).optional().default([]),
  dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  trail: z.object({
    trailId: z.string().trim().min(1).max(60),
    startedAt: z.string().min(1).max(20),
    completedDays: z.array(z.number().int().min(1).max(30)).max(30),
  }).strict().nullable().optional().default(null),
}).strict();

function validDeviceId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{16,64}$/.test(value);
}

/**
 * The client reports its own calendar day so the daily reset happens at the user's
 * midnight, not at UTC midnight. Anything further than one day from the server's
 * date is ignored — that range already covers every real timezone offset.
 */
function resolveDay(requested: string | null | undefined, serverDay: string) {
  if (!requested || !/^\d{4}-\d{2}-\d{2}$/.test(requested)) return serverDay;
  const distance = Math.abs(Date.parse(`${requested}T00:00:00Z`) - Date.parse(`${serverDay}T00:00:00Z`));
  return Number.isFinite(distance) && distance <= 86_400_000 ? requested : serverDay;
}

function shiftDay(day: string, offset: number) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + offset)).toISOString().slice(0, 10);
}

/** Most recent day on which the user completed the mission or the ritual. */
function lastActiveDay(mission: string | null | undefined, ritual: string | null | undefined) {
  const days = [mission, ritual].filter((value): value is string => Boolean(value)).sort();
  return days.length ? days[days.length - 1] : null;
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
    const [savedTrail] = await db.select().from(trailProgress).where(eq(trailProgress.deviceId, deviceId)).limit(1);
    const savedAchievements = await db.select({ achievementKey: achievements.achievementKey }).from(achievements).where(eq(achievements.deviceId, deviceId));
    const today = resolveDay(new URL(request.url).searchParams.get("day"), new Date().toISOString().slice(0, 10));
    const lastActive = lastActiveDay(progress?.lastMissionDate, progress?.lastRitualDate);
    const streakAlive = lastActive === today || lastActive === shiftDay(today, -1);
    return Response.json({ deviceId, state: { profile: { name: profile.name, birthDate: profile.birthDate, objective: profile.objective, sign: profile.sign, intention: profile.intention, theme: profile.theme, hasAvatar: Boolean(profile.avatarData), plan: profile.plan === "premium" ? "premium" : "free" }, xp: progress?.xp ?? 0, missionDone: progress?.lastMissionDate === today && Boolean(progress?.missionDone), ritualDone: progress?.lastRitualDate === today && Boolean(progress?.ritualDone), streak: streakAlive ? (progress?.streak ?? 0) : 0, goals: savedGoals.map((goal) => ({
        id: goal.id, title: goal.title, category: goal.category, progress: goal.progress,
        isPrimary: goal.isPrimary ?? undefined, kind: (goal.kind ?? undefined) as "financial" | "non_financial" | "partial" | undefined,
        targetAmount: goal.targetAmount ?? undefined, currentAmount: goal.currentAmount ?? undefined,
        deadline: goal.deadline ?? undefined, motivation: goal.motivation ?? undefined,
        stage: goal.stage ?? undefined, blocker: goal.blocker ?? undefined, dailyMinutes: goal.dailyMinutes ?? undefined,
      })), entries: savedEntries.map((entry) => ({ date: entry.entryDate, answers: JSON.parse(entry.answersJson) })), trail: savedTrail ? { trailId: savedTrail.trailId, startedAt: savedTrail.startedAt, completedDays: JSON.parse(savedTrail.completedDaysJson) } : null, unlockedAchievements: savedAchievements.map((item) => item.achievementKey) } });
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
    const earnedAchievements = payload.unlockedAchievements.filter((key) => !key.startsWith("exclusiva-"));
    const db = getDb();
    const now = new Date().toISOString();
    if (!user.primaryDeviceId) {
      const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.primaryDeviceId, deviceId)).limit(1);
      if (owner && owner.id !== user.id) return Response.json({ error: "Esta jornada já pertence a outra conta." }, { status: 409 });
    }
    const profileValues = { name: profile.name, birthDate: profile.birthDate, objective: profile.objective, sign: profile.sign, intention: profile.intention.trim(), theme: profile.theme, updatedAt: now };
    const [savedProgress] = await db.select().from(userProgress).where(eq(userProgress.deviceId, deviceId)).limit(1);
    const today = resolveDay(payload.dayKey, now.slice(0, 10));
    const yesterday = shiftDay(today, -1);
    const missionAlreadyCompletedToday = savedProgress?.lastMissionDate === today;
    const ritualAlreadyCompletedToday = savedProgress?.lastRitualDate === today;
    const previousActive = lastActiveDay(savedProgress?.lastMissionDate, savedProgress?.lastRitualDate);
    const activeToday = payload.missionDone || payload.ritualDone;
    let streak = savedProgress?.streak ?? 0;
    if (activeToday) {
      if (previousActive !== today) streak = previousActive === yesterday ? streak + 1 : 1;
      else if (streak === 0) streak = 1;
    } else if (previousActive !== today && previousActive !== yesterday) {
      streak = 0;
    }
    const progressValues = {
      xp: payload.xp,
      streak,
      missionDone: payload.missionDone,
      lastMissionDate: payload.missionDone ? (missionAlreadyCompletedToday ? savedProgress.lastMissionDate : today) : savedProgress?.lastMissionDate ?? null,
      ritualDone: payload.ritualDone,
      lastRitualDate: payload.ritualDone ? (ritualAlreadyCompletedToday ? savedProgress.lastRitualDate : today) : savedProgress?.lastRitualDate ?? null,
      updatedAt: now,
    };
    const operations = [
      ...(user.primaryDeviceId ? [] : [db.update(users).set({ primaryDeviceId: deviceId, updatedAt: now }).where(eq(users.id, user.id))]),
      db.insert(profiles).values({ deviceId, ...profileValues }).onConflictDoUpdate({ target: profiles.deviceId, set: profileValues }),
      db.insert(userProgress).values({ deviceId, ...progressValues }).onConflictDoUpdate({ target: userProgress.deviceId, set: progressValues }),
      db.delete(goals).where(eq(goals.deviceId, deviceId)),
      ...(payload.goals.length ? [db.insert(goals).values(payload.goals.map((goal) => ({ ...goal, deviceId, status: "active" })))] : []),
      db.delete(journalEntries).where(eq(journalEntries.deviceId, deviceId)),
      ...(payload.entries.length ? [db.insert(journalEntries).values(payload.entries.map((entry) => ({ deviceId, entryDate: entry.date, answersJson: JSON.stringify(entry.answers) })))] : []),
      ...(payload.trail
        ? [db.insert(trailProgress).values({ deviceId, trailId: payload.trail.trailId, startedAt: payload.trail.startedAt, completedDaysJson: JSON.stringify(payload.trail.completedDays), updatedAt: now }).onConflictDoUpdate({ target: trailProgress.deviceId, set: { trailId: payload.trail.trailId, startedAt: payload.trail.startedAt, completedDaysJson: JSON.stringify(payload.trail.completedDays), updatedAt: now } })]
        : [db.delete(trailProgress).where(eq(trailProgress.deviceId, deviceId))]),
      // Exclusive achievements are granted only by the team (app/api/admin/achievements); a client never adds them.
      ...(earnedAchievements.length
        ? [db.insert(achievements).values(earnedAchievements.map((key) => ({ deviceId, achievementKey: key }))).onConflictDoNothing()]
        : []),
    ];
    await db.batch(operations as unknown as Parameters<typeof db.batch>[0]);
    return Response.json({ saved: true, savedAt: now, deviceId, streak });
  } catch (error) { return errorResponse(error); }
}
