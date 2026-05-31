/* eslint-disable no-undef */
/* Service worker PWA + Firebase Cloud Messaging */

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/** Requerido para que Chrome permita instalar la PWA */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    }),
  );
});

importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js",
);

let messaging = null;

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

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url },
    tag: payload.data?.tag || "am-snowboard",
  });
}

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

fetch("/api/firebase-public-config")
  .then((r) => r.json())
  .then((config) => {
    if (!config.apiKey) return;
    firebase.initializeApp(config);
    messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      showNotification(payload);
    });
  })
  .catch((err) => console.error("[sw] FCM init:", err));

self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    event.waitUntil(showNotification(payload));
  } catch {
    /* onBackgroundMessage */
  }
});
