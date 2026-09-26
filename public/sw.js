const CACHE_NAME = "veias-da-sintonia-v4";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/app-icon-192.png",
  "/app-icon-512.png",
  "/fonts/manrope-latin.woff2",
  "/fonts/manrope-latin-ext.woff2",
  "/fonts/archivo-latin.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

/**
 * Network-first for everything same-origin: a person with a connection always gets
 * the latest deploy, and the cache only kicks in once the network request fails
 * (offline, or a flaky mobile connection) — the opposite of the old cache-first
 * behavior, which could keep serving a stale build indefinitely once a URL was
 * cached, with no way for the app to know it had gone stale.
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  const cacheKey = request.mode === "navigate" ? "/" : request;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, copy));
        }
        return response;
      })
      .catch(() => caches.match(cacheKey).then((cached) => cached || caches.match("/"))),
  );
});
