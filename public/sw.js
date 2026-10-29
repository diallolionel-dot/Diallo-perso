/*
 * Service worker — Diallo Coaching (phase 1).
 *
 * Volontairement minimal :
 * - met en cache uniquement les ressources statiques versionnées (/_next/static, /icons) ;
 * - ne met JAMAIS en cache les pages, les API ni les requêtes vers Supabase,
 *   pour ne pas conserver de données personnelles sur l'appareil à l'insu de l'utilisateur ;
 * - affiche une page hors ligne simple si la navigation échoue.
 */
const CACHE = "diallo-static-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  const isStatic = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
  if (!isStatic) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
