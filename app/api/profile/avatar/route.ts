import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    const user = await getSessionUser(request);
    if (!user?.primaryDeviceId) return Response.json({ error: "Complete seu perfil antes de adicionar uma foto." }, { status: 400 });
    const form = await request.formData();
    const file = form.get("avatar");
    if (!(file instanceof File)) return Response.json({ error: "Escolha uma imagem." }, { status: 400 });
    if (!allowedTypes.has(file.type)) return Response.json({ error: "Use uma foto JPG, PNG ou WEBP." }, { status: 400 });
    if (file.size > 700 * 1024) return Response.json({ error: "A foto ficou muito grande. Escolha outra imagem." }, { status: 400 });

    const avatarData = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
    await getDb().update(profiles).set({ avatarData, avatarType: file.type, updatedAt: new Date().toISOString() }).where(eq(profiles.deviceId, user.primaryDeviceId));
    return Response.json({ saved: true });
  } catch (error) {
    console.error("avatar_write_error", error);
    return Response.json({ error: "Não foi possível salvar a foto agora." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser(request);
    if (!user?.primaryDeviceId) return Response.json({ removed: true });
    const db = getDb();
    await db.update(profiles).set({ avatarData: null, avatarType: null, updatedAt: new Date().toISOString() }).where(eq(profiles.deviceId, user.primaryDeviceId));
    return Response.json({ removed: true });
  } catch (error) {
    console.error("avatar_delete_error", error);
    return Response.json({ error: "Não foi possível remover a foto." }, { status: 500 });
  }
}
