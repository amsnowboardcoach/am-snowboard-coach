import type { User } from "firebase/auth";
import type { UserProfile } from "@/types/firestore";

/** Nombre visible en comentarios de La Tribu (perfil de alumno, no texto libre). */
export function tribeCommentAuthorName(
  profile: UserProfile | null | undefined,
  user: User | null | undefined,
  storedName?: string,
): string {
  const fromProfile = profile?.displayName?.trim();
  if (fromProfile) return fromProfile;
  const fromAuth = user?.displayName?.trim();
  if (fromAuth) return fromAuth;
  return storedName?.trim() || "Alumno AM";
}
