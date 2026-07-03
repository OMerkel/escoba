const CACHE_VERSION = "escoba-pwa-v2";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./img/icons/favicon.ico",
  "./img/icons/escoba128.png",
  "./img/icons/escoba256.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await Promise.all(
        APP_SHELL_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset, { cache: "no-cache" });
            if (response.ok) {
              await cache.put(asset, response.clone());
            }
          } catch {
            // Continue installing even if one optional asset fails.
          }
        }),
      );
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![SHELL_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function cacheRuntimeResponse(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") {
    return;
  }

  caches.open(RUNTIME_CACHE).then((cache) => {
    cache.put(request, response.clone());
  });
}

function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const networkFetch = fetch(request)
      .then((response) => {
        cacheRuntimeResponse(request, response);
        return response;
      })
      .catch(() => cached);

    return cached || networkFetch;
  });
}

function networkFirstNavigation(request) {
  return fetch(request)
    .then((response) => {
      cacheRuntimeResponse(request, response);
      return response;
    })
    .catch(async () => {
      const cachedPage = await caches.match("./index.html");
      if (cachedPage) return cachedPage;
      return caches.match("./");
    });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  const destination = request.destination;
  if (
    destination === "style" ||
    destination === "script" ||
    destination === "worker" ||
    destination === "image" ||
    destination === "font"
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        cacheRuntimeResponse(request, response);
        return response;
      })
      .catch(() => caches.match(request)),
  );
});
