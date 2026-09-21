import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { assertMultipartRequest, assertTrustedMutation, enforceRateLimit, secureErrorResponse } from "@/lib/security";

const AVATAR_MAX_BYTES = 700 * 1024;

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user?.primaryDeviceId) return new Response(null, { status: 404 });
    const [profile] = await getDb().select({ avatarData: profiles.avatarData, avatarType: profiles.avatarType }).from(profiles).where(eq(profiles.deviceId, user.primaryDeviceId)).limit(1);
    if (!profile?.avatarData) return new Response(null, { status: 404 });
    return new Response(base64ToBytes(profile.avatarData), { headers: { "content-type": profile.avatarType ?? "image/webp", "cache-control": "private, max-age=300", "x-content-type-options": "nosniff" } });
  } catch (error) {
    console.error("avatar_read_error", error);
    return Response.json({ error: "Não foi possível carregar a foto." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    assertMultipartRequest(request, 1024 * 1024);
    const user = await getSessionUser(request);
    if (!user?.primaryDeviceId) return Response.json({ error: "Complete seu perfil antes de adicionar uma foto." }, { status: 400 });
    await enforceRateLimit(request, "avatar-write", user.id, 20, 60 * 60);
    const form = await request.formData();
    const file = form.get("avatar");
    if (!(file instanceof File)) return Response.json({ error: "Escolha uma imagem." }, { status: 400 });
    if (file.type !== "image/webp") return Response.json({ error: "A foto precisa ser processada pelo aplicativo antes do envio." }, { status: 400 });
    if (file.size > AVATAR_MAX_BYTES) return Response.json({ error: "A foto ficou muito grande. Escolha outra imagem." }, { status: 400 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
    if (!isWebp) return Response.json({ error: "O conteúdo enviado não é uma imagem WEBP válida." }, { status: 400 });
    const avatarData = bytesToBase64(bytes);
    await getDb().update(profiles).set({ avatarData, avatarType: file.type, updatedAt: new Date().toISOString() }).where(eq(profiles.deviceId, user.primaryDeviceId));
    return Response.json({ saved: true });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível salvar a foto agora.");
  }
}

export async function DELETE(request: Request) {
  try {
    assertTrustedMutation(request, "none");
    const user = await getSessionUser(request);
    if (!user?.primaryDeviceId) return Response.json({ removed: true });
    await enforceRateLimit(request, "avatar-delete", user.id, 20, 60 * 60);
    const db = getDb();
    await db.update(profiles).set({ avatarData: null, avatarType: null, updatedAt: new Date().toISOString() }).where(eq(profiles.deviceId, user.primaryDeviceId));
    return Response.json({ removed: true });
  } catch (error) {
    return secureErrorResponse(error, "Não foi possível remover a foto.");
  }
}
