/**
 * Ajora service worker: receives Web Push from the push service (#16) and shows
 * the notification. Payloads are JSON: { title, body, tag, url }.
 */

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
