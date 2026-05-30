import { signInAnonymously } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

const GUEST_NAME_KEY = "tribe_guest_name";

/** Sesión mínima para reaccionar/comentar sin cuenta de alumno (Firebase Anonymous Auth). */
export async function ensureTribeVisitorAuth(): Promise<string> {
  const auth = getFirebaseAuth();
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  const credential = await signInAnonymously(auth);
  return credential.user.uid;
}

export function getStoredTribeGuestName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(GUEST_NAME_KEY)?.trim() ?? "";
}

export function storeTribeGuestName(name: string): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim().slice(0, 40);
  if (trimmed) {
    localStorage.setItem(GUEST_NAME_KEY, trimmed);
  }
}

export function tribeCommentDisplayName(
  displayName: string | null | undefined,
  guestName: string,
): string {
  const fromProfile = displayName?.trim();
  if (fromProfile) return fromProfile;
  const fromGuest = guestName.trim();
  if (fromGuest) return fromGuest;
  return "Visitante";
}
