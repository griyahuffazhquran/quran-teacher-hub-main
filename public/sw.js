const CACHE_NAME = "ghq-upgrading-v3";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/favicon.ico"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  
  // For API calls (Google Apps Script), ALWAYS bypass browser HTTP cache (Network Only)
  if (event.request.url.includes("script.google.com")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  // Network First, fallback to cache for static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const resCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resCopy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
