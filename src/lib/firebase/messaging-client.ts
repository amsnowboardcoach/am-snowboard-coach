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
import { BRAND_ICON_192 } from "@/constants/brand-icons";
import { registerPwaServiceWorker } from "@/lib/pwa/register-sw";

/** Clave pública VAPID web (65 bytes en base64url, suele empezar por B). */
function isValidWebPushVapidKey(key: string): boolean {
  if (key.length < 80 || key.length > 200) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(key)) return false;
  try {
    const padded = key + "=".repeat((4 - (key.length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return raw.length === 65;
  } catch {
    return false;
  }
}

function normalizeVapidKey(raw: string | undefined): string | null {
  let key = raw?.trim();
  if (!key) return null;
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  if (!key.startsWith("B") || !isValidWebPushVapidKey(key)) return null;
  return key;
}

function getVapidKey(): string | null {
  return normalizeVapidKey(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  return registerPwaServiceWorker();
}

/** Registra el SW (PWA + push) al cargar la app */
export async function warmMessagingServiceWorker(): Promise<void> {
  await registerPwaServiceWorker();
}

export function isPushConfigured(): boolean {
  return Boolean(getVapidKey());
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

  const vapidKey = getVapidKey();
  if (!vapidKey) return null;

  const messaging: Messaging = getMessaging(app);
  let token: string | undefined;
  try {
    token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
  } catch (err) {
    console.warn("[push] No se pudo obtener token FCM:", err);
    return null;
  }

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
          icon: BRAND_ICON_192,
          data: { url },
        });
      }
    });
  } catch {
    return null;
  }
}
