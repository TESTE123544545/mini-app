import ota from "@/lib/otaManifest.json";

/**
 * Over-the-air updates for the Android app (the expo-updates protocol, version 1).
 * The app asks "what is the newest JavaScript for my runtime version?" and downloads it when it differs
 * from the one it runs. `npm run ota` (see mobile/scripts/publish-ota.mjs) writes lib/otaManifest.json
 * and the files under public/ota; this route only hands the manifest over. Native changes need a new
 * runtimeVersion (app.json) and a new store release; phones on an older runtime simply get "no update".
 */
type Entry = { android?: { id: string } & Record<string, unknown> };
const updates = ota as Record<string, Entry>;
const BOUNDARY = "vds-ota-boundary";

const multipart = (name: string, body: unknown) =>
  `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${name}"\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${JSON.stringify(body)}\r\n`;

export async function GET(request: Request) {
  const platform = request.headers.get("expo-platform");
  const runtime = request.headers.get("expo-runtime-version") ?? "";
  const manifest = platform === "android" ? updates[runtime]?.android : undefined;
  const headers = {
    "content-type": `multipart/mixed; boundary=${BOUNDARY}`,
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
    "cache-control": "private, max-age=0",
  };
  // Nothing newer for this phone: the same update it already runs, or a runtime version we have no update for.
  if (!manifest || request.headers.get("expo-current-update-id") === manifest.id) {
    return new Response(`${multipart("directive", { type: "noUpdateAvailable" })}--${BOUNDARY}--\r\n`, { headers });
  }
  return new Response(`${multipart("manifest", manifest)}${multipart("extensions", { assetRequestHeaders: {} })}--${BOUNDARY}--\r\n`, { headers });
}
