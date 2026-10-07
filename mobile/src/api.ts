import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/** Same server as the site. On the web preview the dev proxy serves both from one origin. */
export const BASE = Platform.OS === "web" ? "" : "https://veiasdasintonia.com.br";
const ORIGIN = "https://veiasdasintonia.com.br";
const KEY = "vds_session";

let session: string | null = null;
let onExpired: (() => void) | null = null;

export const setExpiredHandler = (handler: () => void) => { onExpired = handler; };

export async function loadSession() {
  if (Platform.OS === "web") return;
  session = await SecureStore.getItemAsync(KEY).catch(() => null);
}
async function saveSession(value: string | null) {
  session = value;
  if (Platform.OS === "web") return;
  if (value) await SecureStore.setItemAsync(KEY, value).catch(() => {});
  else await SecureStore.deleteItemAsync(KEY).catch(() => {});
}
export const hasSession = () => Boolean(session) || Platform.OS === "web";

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

type Options = { method?: "GET" | "POST" | "DELETE"; body?: unknown; signal?: AbortSignal };

/** JSON call to the site's API. The session cookie is kept by hand (SecureStore), not by a cookie jar. */
export async function api<T = unknown>(path: string, { method = "GET", body, signal }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (Platform.OS !== "web") {
    headers.origin = ORIGIN;
    if (session) headers.cookie = `${KEY}=${session}`;
  }
  const response = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal, credentials: Platform.OS === "web" ? "same-origin" : "omit" });
  if (Platform.OS !== "web") {
    const set = response.headers.get("set-cookie");
    const match = set?.match(/vds_session=([^;]*)/);
    if (match) await saveSession(match[1] && !/max-age=0/i.test(set ?? "") ? match[1] : null);
  }
  const data = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (response.status === 401 && path !== "/api/auth") onExpired?.();
  if (!response.ok) throw new ApiError(data?.error ?? "Não foi possível concluir agora.", response.status);
  return data as T;
}
