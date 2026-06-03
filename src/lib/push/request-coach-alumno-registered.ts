import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";
import { getFirebaseAuth } from "@/lib/firebase/client";

const RETRY_DELAYS_MS = [400, 800, 1600, 3200, 5000];

/** Avisa al coach (push + email + WhatsApp) tras crear perfil de alumno. */
export async function requestCoachNotifyAlumnoRegistered(): Promise<boolean> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
    }

    try {
      const headers = await getFirebaseAuthHeaders();
      if (!("Authorization" in headers)) {
        continue;
      }

      const res = await fetch("/api/push/alumno-registered", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      });

      if (res.status === 401 && attempt < RETRY_DELAYS_MS.length) {
        await getFirebaseAuth().currentUser?.getIdToken(true);
        continue;
      }

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        skipped?: string;
        error?: string;
      };

      if (res.ok && data.ok) {
        return true;
      }

      if (res.ok && data.skipped === "already_notified") {
        return true;
      }

      if (res.status === 404 || res.status === 500) {
        continue;
      }

      if (process.env.NODE_ENV === "development") {
        console.warn("[coach-notify] alumno-registered:", res.status, data);
      }
      return false;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[coach-notify] alumno-registered fetch failed:", err);
      }
    }
  }

  return false;
}
