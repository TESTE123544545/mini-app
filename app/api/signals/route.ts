import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, signalReadings } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { hasPremium } from "@/lib/plan";
import { enforceFastLimit, RequestError, secureErrorResponse } from "@/lib/security";
import { combo, dailyMessage, hourReading, numerologyProfile } from "@/lib/signals/compose";
import { lifePath } from "@/lib/signals/numerology";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const FREE_HISTORY = 3;
const PREMIUM_HISTORY = 60;

/**
 * GET /api/signals?day=yyyy-mm-dd[&time=hh:mm] — everything the "Sinais do Universo" tab shows.
 * The paid half (full hour reading, sign + life path combination, all numbers, full history) is only
 * put in the response for Premium accounts, so it cannot be read by editing the page.
 * Opening an equal hour (`time`) also saves it to the user's history.
 */
export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user?.primaryDeviceId) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    await enforceFastLimit(request, "LIMIT_30", "signals", user.id, 30, 60);

    const params = new URL(request.url).searchParams;
    const day = params.get("day") ?? "";
    const time = params.get("time");
    // The browser sends its own calendar day (time zones differ); it must still be near today.
    if (!DAY.test(day) || Math.abs(Date.parse(`${day}T12:00:00Z`) - Date.now()) > 2 * 86_400_000) throw new RequestError("Dia inválido.", 400);
    if (time !== null && !TIME.test(time)) throw new RequestError("Hora inválida.", 400);

    const db = getDb();
    const [profile] = await db.select().from(profiles).where(eq(profiles.deviceId, user.primaryDeviceId)).limit(1);
    if (!profile) throw new RequestError("Perfil não encontrado.", 404);
    const premium = hasPremium(profile.plan, user);
    // Accounts that never gave a birth date can type one in the tab; it is only used here, the profile itself is saved by the app.
    const typed = params.get("birth") ?? "";
    const birthDate = lifePath(profile.birthDate) ? profile.birthDate : lifePath(typed) ? typed : null;
    const path = birthDate ? lifePath(birthDate) : null;

    const reading = time ? hourReading({ time, sign: profile.sign, birthDate, premium }) : null;
    if (time && !reading) throw new RequestError("Essa não é uma hora igual.", 400);
    if (reading) await db.insert(signalReadings).values({ deviceId: profile.deviceId, time: reading.time, dayKey: day, sign: profile.sign }).onConflictDoNothing();

    const history = await db.select({ time: signalReadings.time, dayKey: signalReadings.dayKey }).from(signalReadings)
      .where(eq(signalReadings.deviceId, profile.deviceId)).orderBy(desc(signalReadings.createdAt)).limit(premium ? PREMIUM_HISTORY : FREE_HISTORY + 1);
    const numerology = numerologyProfile(profile.name, birthDate, day);

    return Response.json({
      premium,
      sign: profile.sign,
      hasBirthDate: Boolean(birthDate),
      daily: dailyMessage({ dayKey: day, sign: profile.sign, birthDate, premium, hour: time }),
      hour: reading,
      numerology: premium ? numerology : { ...numerology, destiny: null, soul: null, personality: null, cycles: null },
      combo: premium && path ? combo(profile.sign, path) : null,
      history: premium ? history : history.slice(0, FREE_HISTORY),
      historyHidden: premium ? false : history.length > FREE_HISTORY,
    }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível ler seus sinais agora.");
  }
}
