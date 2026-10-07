// Publishes the app's JavaScript as an over-the-air update (expo-updates protocol, served by our own site).
//
//   npm run ota        (from the repository root)
//
// 1. exports the Android bundle with Expo;
// 2. copies the bundle and its assets to public/ota/files (served as static files with the site);
// 3. writes lib/otaManifest.json, which /api/ota/manifest sends to the phones.
// Then build and deploy the site as usual: the installed apps pick the update up the next time they open.
// The runtime version (app.json) must match the one baked into the installed app; bump it only with native changes.
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.resolve(here, "..");
const root = path.resolve(mobile, "..");
const tmp = path.join(mobile, ".ota-tmp");
const files = path.join(root, "public", "ota", "files");
const SITE = "https://veiasdasintonia.com.br";
const MIME = { ttf: "font/ttf", otf: "font/otf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", json: "application/json", mp3: "audio/mpeg" };

const appJson = JSON.parse(fs.readFileSync(path.join(mobile, "app.json"), "utf8")).expo;
const runtimeVersion = String(appJson.runtimeVersion);

fs.rmSync(tmp, { recursive: true, force: true });
execSync(`npx expo export --platform android --output-dir "${tmp}"`, { cwd: mobile, stdio: "inherit" });
const meta = JSON.parse(fs.readFileSync(path.join(tmp, "metadata.json"), "utf8")).fileMetadata.android;

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("base64url");
const md5 = (buffer) => createHash("md5").update(buffer).digest("hex");
fs.mkdirSync(files, { recursive: true });
const used = new Set();

function publish(relative, ext) {
  const buffer = fs.readFileSync(path.join(tmp, relative.replaceAll("\\", "/")));
  const key = md5(buffer);
  const name = `${key}.${ext ?? "hbc"}`;
  fs.writeFileSync(path.join(files, name), buffer);
  used.add(name);
  return { hash: sha256(buffer), key, url: `${SITE}/ota/files/${name}` };
}

const launch = publish(meta.bundle, null);
const assets = meta.assets.map((asset) => ({
  ...publish(asset.path, asset.ext),
  fileExtension: `.${asset.ext}`,
  contentType: MIME[asset.ext] ?? "application/octet-stream",
}));

// The update id is derived from the content, so republishing identical code keeps the same id (phones skip it).
const digest = createHash("sha256").update(launch.hash + assets.map((asset) => asset.hash).join("")).digest("hex");
const id = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20, 32)}`;

const manifest = {
  id,
  createdAt: new Date().toISOString(),
  runtimeVersion,
  launchAsset: { ...launch, contentType: "application/javascript" },
  assets,
  metadata: {},
  extra: { expoClient: { name: appJson.name, slug: appJson.slug, version: appJson.version } },
};

const file = path.join(root, "lib", "otaManifest.json");
const current = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
// An identical update keeps its original date, so the file only changes when the app really changed.
if (current[runtimeVersion]?.android?.id === id) manifest.createdAt = current[runtimeVersion].android.createdAt;
current[runtimeVersion] = { android: manifest };
fs.writeFileSync(file, `${JSON.stringify(current, null, 2)}\n`);

// Files that no manifest points to any more are removed.
const keep = new Set();
for (const entry of Object.values(current)) {
  const m = entry.android;
  for (const asset of [m.launchAsset, ...m.assets]) keep.add(asset.url.split("/").pop());
}
for (const name of fs.readdirSync(files)) if (!keep.has(name)) fs.rmSync(path.join(files, name));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`OTA ${id} (runtime ${runtimeVersion}): bundle ${(fs.statSync(path.join(files, launch.url.split("/").pop())).size / 1e6).toFixed(1)} MB, ${assets.length} assets`);
