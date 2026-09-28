import { z } from "zod";
import { startAdminLogin } from "@/lib/adminAuth";
import { readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({ email: z.string().max(254), password: z.string().max(128) }).strict();

/** POST /api/admin/login — step 1 of the developer login: e-mail + password, then a code by e-mail. */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 2 * 1024));
    if (!parsed.success) throw new RequestError("Dados inválidos.", 400);
    return Response.json(await startAdminLogin(request, parsed.data.email, parsed.data.password), { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível entrar agora.");
  }
}
