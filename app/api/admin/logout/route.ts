import { endAdminSession } from "@/lib/adminAuth";
import { assertTrustedMutation, secureErrorResponse } from "@/lib/security";

/** POST /api/admin/logout — ends the developer session. */
export async function POST(request: Request) {
  try {
    assertTrustedMutation(request, "none");
    return Response.json({ ok: true }, { headers: { "set-cookie": await endAdminSession(request) } });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível sair agora.");
  }
}
