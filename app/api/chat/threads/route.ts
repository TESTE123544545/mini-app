import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { chatThreads } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { assertTrustedMutation, RequestError, secureErrorResponse } from "@/lib/security";

function parseThreadId(request: Request) {
  const raw = new URL(request.url).searchParams.get("id");
  const id = Number(raw);
  if (!raw || !Number.isInteger(id) || id <= 0) throw new RequestError("Conversa inválida.", 400);
  return id;
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    const deviceId = user.primaryDeviceId;
    if (!deviceId) return Response.json({ threads: [] });

    const db = getDb();
    const url = new URL(request.url);

    if (url.searchParams.has("id")) {
      const threadId = parseThreadId(request);
      const [thread] = await db.select({ id: chatThreads.id, title: chatThreads.title, messagesJson: chatThreads.messagesJson })
        .from(chatThreads).where(and(eq(chatThreads.id, threadId), eq(chatThreads.deviceId, deviceId))).limit(1);
      if (!thread) throw new RequestError("Conversa não encontrada.", 404);
      return Response.json({ id: thread.id, title: thread.title, messages: JSON.parse(thread.messagesJson) });
    }

    const threads = await db.select({ id: chatThreads.id, title: chatThreads.title, updatedAt: chatThreads.updatedAt })
      .from(chatThreads).where(eq(chatThreads.deviceId, deviceId)).orderBy(desc(chatThreads.updatedAt)).limit(30);
    return Response.json({ threads });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível carregar suas conversas agora.");
  }
}

export async function DELETE(request: Request) {
  try {
    assertTrustedMutation(request, "none");
    const threadId = parseThreadId(request);

    const user = await getSessionUser(request);
    if (!user) return Response.json({ error: "Entre na sua conta." }, { status: 401 });
    const deviceId = user.primaryDeviceId;
    if (!deviceId) throw new RequestError("Jornada não encontrada.", 400);

    const db = getDb();
    await db.delete(chatThreads).where(and(eq(chatThreads.id, threadId), eq(chatThreads.deviceId, deviceId)));
    return Response.json({ ok: true });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível remover essa conversa agora.");
  }
}
