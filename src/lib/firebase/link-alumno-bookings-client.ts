import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";
import { getFirebaseAuth } from "@/lib/firebase/client";

const linkedUids = new Set<string>();
let linkInFlight: Promise<number> | null = null;

/**
 * Vincula reservas del mismo email a la cuenta actual (idempotente por sesión).
 * Devuelve cuántas reservas se actualizaron.
 */
export async function linkAlumnoBookingsForCurrentUser(): Promise<number> {
  const user = getFirebaseAuth().currentUser;
  if (!user?.uid) return 0;

  if (linkedUids.has(user.uid)) return 0;

  const rawHeaders = await getFirebaseAuthHeaders();
  const auth =
    typeof rawHeaders === "object" &&
    rawHeaders !== null &&
    "Authorization" in rawHeaders &&
    typeof (rawHeaders as Record<string, string>).Authorization === "string"
      ? (rawHeaders as Record<string, string>).Authorization
      : "";
  if (!auth) return 0;

  if (!linkInFlight) {
    linkInFlight = (async () => {
      try {
        const res = await fetch("/api/bookings/link-account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: auth,
          },
        });
        const data = (await res.json()) as { linked?: number; error?: string };
        if (!res.ok) {
          console.warn("[link-account]", data.error ?? res.status);
          return 0;
        }
        linkedUids.add(user.uid);
        return typeof data.linked === "number" ? data.linked : 0;
      } catch (err) {
        console.warn("[link-account]", err);
        return 0;
      } finally {
        linkInFlight = null;
      }
    })();
  }

  return linkInFlight;
}

/** Reinicia caché al cerrar sesión (AuthProvider). */
export function resetAlumnoBookingsLinkCache(): void {
  linkedUids.clear();
  linkInFlight = null;
}
