/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js",
);

let messaging = null;

function showNotification(payload) {
  const title =
    payload.notification?.title || payload.data?.title || "AM Snowboard Coach";
  const body =
    payload.notification?.body || payload.data?.body || "";
  const url = payload.data?.url || payload.fcmOptions?.link || "/";

  self.registration.showNotification(title, {
    body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { url },
    tag: payload.data?.tag || "am-snowboard",
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
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
  .catch((err) => console.error("[fcm-sw]", err));

self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    event.waitUntil(showNotification(payload));
  } catch {
    /* handled by onBackgroundMessage */
  }
});
