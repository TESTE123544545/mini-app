import { z } from "zod";
import { getDb } from "@/db";
import { communityProfiles } from "@/db/schema";
import { memberContext } from "@/lib/community/server";
import { MAX_BIO, hasAbuse, usernameProblem } from "@/lib/community/rooms";
import { signFromDate } from "@/lib/birth";
import { enforceRateLimit, readJsonBody, RequestError, secureErrorResponse } from "@/lib/security";

const bodySchema = z.object({
  username: z.string().trim().toLowerCase().max(20),
  displayName: z.string().trim().min(2).max(30),
  bio: z.string().trim().max(MAX_BIO).optional().default(""),
  acceptRules: z.literal(true),
}).strict();

/**
 * POST /api/community/join — creates the member's public identity. Adults only (the age comes from the birth date
 * on the account), and the sign is taken from that same date once, here: it can never be chosen or changed by the member.
 */
export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await readJsonBody<unknown>(request, 2 * 1024));
    if (!parsed.success) throw new RequestError("Confira o nome de usuário, o nome de exibição e aceite as regras.", 400);
    const member = await memberContext(request);
    if (!member.adult) throw new RequestError("A comunidade é só para maiores de 18 anos.", 403);
    if (member.cp) throw new RequestError("Você já faz parte da comunidade.", 409);
    await enforceRateLimit(request, "community-join", member.userId, 10, 3600);

    const { displayName, bio, acceptRules } = parsed.data;
    void acceptRules;
    const username = member.founder ? "fundador" : parsed.data.username;
    const problem = member.founder ? null : usernameProblem(username);
    if (problem) throw new RequestError(problem, 400);
    if (hasAbuse(`${username} ${displayName} ${bio}`)) throw new RequestError("Escolha nomes e uma bio sem ofensas.", 400);

    try {
      await getDb().insert(communityProfiles).values({ deviceId: member.deviceId, username, displayName, bio, sign: signFromDate(member.profile.birthDate) });
    } catch {
      throw new RequestError("Esse nome de usuário já está em uso. Escolha outro.", 409);
    }
    return Response.json({ joined: true });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível entrar na comunidade agora.");
  }
}
