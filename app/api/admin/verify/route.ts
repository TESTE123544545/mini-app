import { z } from "zod";
import { finishAdminLogin } from "@/lib/adminAuth";
import { readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({ challenge: z.string().min(16).max(128), code: z.string().max(12) }).strict();

/** POST /api/admin/verify — step 2 of the developer login: the 6-digit code; opens the admin session. */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 2 * 1024));
    if (!parsed.success) throw new RequestError("Dados inválidos.", 400);
    const cookie = await finishAdminLogin(request, parsed.data.challenge, parsed.data.code.replace(/\D/g, ""));
    return Response.json({ ok: true }, { headers: { "set-cookie": cookie, "cache-control": "no-store" } });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível entrar agora.");
  }
}
