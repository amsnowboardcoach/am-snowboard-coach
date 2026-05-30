"use client";

import type { FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from "firebase/messaging";
import { getFirebaseApp } from "@/lib/firebase/client";
import { saveFcmToken } from "@/lib/firebase/fcm-tokens";

const SW_PATH = "/firebase-messaging-sw.js";

function getVapidKey(): string | null {
  const key = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  return key || null;
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active) return existing;
  return navigator.serviceWorker.register(SW_PATH, { scope: "/" });
}

export async function isPushSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!getVapidKey()) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

export async function requestPushPermissionAndToken(
  userId: string,
): Promise<string | null> {
  const supported = await isPushSupported();
  if (!supported) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await ensureServiceWorker();
  if (!registration) return null;

  let app: FirebaseApp;
  try {
    app = getFirebaseApp();
  } catch {
    return null;
  }

  const messaging: Messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: getVapidKey()!,
    serviceWorkerRegistration: registration,
  });

  if (!token) return null;

  const platform =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "mobile" : "web";

  await saveFcmToken(userId, token, platform);
  return token;
}

export function subscribeForegroundMessages(
  onNotify: (title: string, body: string, url?: string) => void,
): (() => void) | null {
  if (!getVapidKey()) return null;
  try {
    let app: FirebaseApp;
    try {
      app = getFirebaseApp();
    } catch {
      return null;
    }
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      const title =
        payload.notification?.title || "AM Snowboard Coach";
      const body = payload.notification?.body || "";
      const url = payload.data?.url;
      onNotify(title, body, url);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/icon.svg",
          data: { url },
        });
      }
    });
  } catch {
    return null;
  }
}
