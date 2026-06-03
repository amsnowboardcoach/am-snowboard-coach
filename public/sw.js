/* eslint-disable no-undef */
/* Service worker PWA + push — v7: sin interceptar fetch (evita Failed to fetch en Next.js) */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

function resolveNotificationUrl(raw) {
  const path = raw || "/";
  try {
    return new URL(path, self.location.origin).href;
  } catch {
    return self.location.origin + "/";
  }
}

function showNotification(payload) {
  const title =
    payload.notification?.title || payload.data?.title || "AM Snowboard Coach";
  const body =
    payload.notification?.body || payload.data?.body || "";
  const url = resolveNotificationUrl(
    payload.data?.url || payload.fcmOptions?.link || "/",
  );

  return self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-32.png",
    data: { url },
    tag: payload.data?.tag || "am-snowboard",
  });
}

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(showNotification(payload));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = resolveNotificationUrl(event.notification.data?.url);
  const targetPath = new URL(targetUrl).pathname;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          try {
            const clientPath = new URL(client.url).pathname;
            if (clientPath === targetPath && "focus" in client) {
              return client.focus();
            }
          } catch {
            /* ignore */
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});
