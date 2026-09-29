import { waitUntil } from "cloudflare:workers";

/**
 * IndexNow (Bing, Yandex, Seznam, Naver…): tells search engines a page changed the moment it
 * does, instead of waiting for the next crawl. The key is public by design — it is served at
 * /<key>.txt to prove we own the host. Google doesn't take IndexNow; it reads the sitemap.
 */
const HOST = "veiasdasintonia.com.br";
// Not a credential: IndexNow's ownership token is public by design (the same value is served
// at /<key>.txt for search engines to check), so it lives in the repo. gitleaks:allow
const KEY = "a5e52b963320f8dbc2f00f0bd100446c"; // gitleaks:allow

export function announceUpdated(paths: string[]) {
  const ping = fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: paths.map((path) => `https://${HOST}${path}`) }),
    signal: AbortSignal.timeout(8000),
  }).then((response) => { if (!response.ok && response.status !== 202) console.error("indexnow_failed", response.status); })
    .catch((error) => console.error("indexnow_failed", error));
  try { waitUntil(ping); } catch { /* outside a request context */ }
}
