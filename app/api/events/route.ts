import { z } from "zod";
import { getDb } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({
  events: z.array(z.object({
    event: z.string().regex(/^[a-z0-9_]{2,48}$/),
    data: z.record(z.string(), z.unknown()).optional(),
    at: z.string().max(40).optional(),
  })).min(1).max(20),
}).strict();

/** POST /api/events — a small batch of first-party analytics events from the app. */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 16 * 1024));
    if (!parsed.success) throw new RequestError("Dados inválidos.", 400);
    await enforceRateLimit(request, "events", "batch", 240, 3600);
    const user = await getSessionUser(request).catch(() => null);
    const deviceId = user?.primaryDeviceId ?? null;
    await getDb().insert(analyticsEvents).values(parsed.data.events.map((item) => ({
      deviceId,
      eventName: item.event,
      payloadJson: JSON.stringify(item.data ?? {}).slice(0, 1000),
    })));
    return new Response(null, { status: 204 });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível registrar.");
  }
}
