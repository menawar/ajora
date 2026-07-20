/**
 * Ajora service worker: receives Web Push from the push service (#16) and shows
 * the notification. Payloads are JSON: { title, body, tag, url }.
 * Also implements offline caching for PWA.
 */

const CACHE_NAME = "ajora-cache-v1";
const OFFLINE_URL = "/";

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Network-first strategy for navigation requests
      if (event.request.mode === "navigate") {
        return fetch(event.request)
          .then((response) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
          .catch(() => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
      }

      // Cache-first strategy for static assets
      return cachedResponse || fetch(event.request).then((response) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }).catch(() => caches.match(OFFLINE_URL))
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "Ajora", body: "", tag: "ajora", url: "/" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch {
    /* keep defaults on a malformed payload */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag, // same-tag notifications collapse instead of stacking
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if ("focus" in win) {
          win.navigate(url);
          return win.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
