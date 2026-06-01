"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES } from "@/constants/roles";
import {
  isPushConfigured,
  isPushSupported,
  requestPushPermissionAndToken,
  warmMessagingServiceWorker,
} from "@/lib/firebase/messaging-client";

/** Mantiene el token FCM del coach actualizado al usar el panel. */
export function CoachPushActivator() {
  const { user, profile, loading } = useAuth();
  const synced = useRef(false);

  useEffect(() => {
    if (loading || !user || !profile) return;
    if (!COACH_ROLES.includes(profile.role)) return;
    if (!isPushConfigured()) return;

    void warmMessagingServiceWorker();

    if (Notification.permission !== "granted") return;
    if (synced.current) return;
    synced.current = true;

    void (async () => {
      const ok = await isPushSupported();
      if (!ok) return;
      await requestPushPermissionAndToken(user.uid);
    })();
  }, [user, profile, loading]);

  return null;
}
