import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { goals, journalEntries, profiles, userProgress, users } from "../../../db/schema";
import { getSessionUser } from "@/lib/auth";

type SyncPayload = {
  deviceId?: string;
  profile?: { name?: string; birthDate?: string; objective?: string; sign?: string; intention?: string; theme?: string };
  xp?: number;
  missionDone?: boolean;
  goals?: Array<{ id: number; title: string; category: string; progress: number }>;
  entries?: Array<{ date: string; answers: string[] }>;
};

function validDeviceId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{16,64}$/.test(value);
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro inesperado";
  return Response.json({ error: message }, { status: 500 });
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
    const payload = (await request.json()) as SyncPayload;
    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    const requestedDeviceId = payload.deviceId;
    const deviceId = user.primaryDeviceId ?? requestedDeviceId;
    if (!validDeviceId(deviceId)) return Response.json({ error: "deviceId inválido" }, { status: 400 });
    const profile = payload.profile;
    if (!profile?.name?.trim() || !profile.birthDate || !profile.objective || !profile.sign) return Response.json({ error: "perfil incompleto" }, { status: 400 });
    const db = getDb();
    const now = new Date().toISOString();
    if (!user.primaryDeviceId) {
      const [owner] = await db.select({ id: users.id }).from(users).where(eq(users.primaryDeviceId, deviceId)).limit(1);
      if (owner && owner.id !== user.id) return Response.json({ error: "Esta jornada já pertence a outra conta." }, { status: 409 });
      await db.update(users).set({ primaryDeviceId: deviceId, updatedAt: now }).where(eq(users.id, user.id));
    }
    const allowedThemes = ["dourado", "lua", "aurora"];
    const profileValues = { name: profile.name.trim().slice(0, 80), birthDate: profile.birthDate, objective: profile.objective.slice(0, 80), sign: profile.sign.slice(0, 30), intention: (profile.intention ?? "").trim().slice(0, 280), theme: allowedThemes.includes(profile.theme ?? "") ? profile.theme! : "dourado", updatedAt: now };
    await db.insert(profiles).values({ deviceId, ...profileValues }).onConflictDoUpdate({ target: profiles.deviceId, set: profileValues });
    const progressValues = { xp: Math.max(0, Math.floor(payload.xp ?? 0)), missionDone: Boolean(payload.missionDone), lastMissionDate: payload.missionDone ? now.slice(0, 10) : null, updatedAt: now };
    await db.insert(userProgress).values({ deviceId, ...progressValues }).onConflictDoUpdate({ target: userProgress.deviceId, set: progressValues });
    await db.delete(goals).where(eq(goals.deviceId, deviceId));
    const safeGoals = (payload.goals ?? []).slice(0, 100).filter((goal) => goal.title?.trim());
    if (safeGoals.length) await db.insert(goals).values(safeGoals.map((goal) => ({ id: goal.id, deviceId, title: goal.title.trim().slice(0, 160), category: goal.category.slice(0, 80), progress: Math.min(100, Math.max(0, Math.floor(goal.progress))), status: "active" })));
    await db.delete(journalEntries).where(eq(journalEntries.deviceId, deviceId));
    const safeEntries = (payload.entries ?? []).slice(0, 365);
    if (safeEntries.length) await db.insert(journalEntries).values(safeEntries.map((entry) => ({ deviceId, entryDate: entry.date.slice(0, 20), answersJson: JSON.stringify(entry.answers.slice(0, 4).map((answer) => String(answer).slice(0, 4000))) })));
    return Response.json({ saved: true, savedAt: now, deviceId });
  } catch (error) { return errorResponse(error); }
}
