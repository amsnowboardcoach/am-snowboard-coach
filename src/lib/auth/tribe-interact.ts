import type { User } from "firebase/auth";
import { isAlumnoProfile } from "@/lib/auth/coach-role";
import type { UserProfile } from "@/types/firestore";

/** Me gusta, comentar y compartir en el feed público de La Tribu. */
export function canInteractOnTribeFeed(
  user: User | null | undefined,
  profile: UserProfile | null | undefined,
): boolean {
  return Boolean(
    user && !user.isAnonymous && profile && isAlumnoProfile(profile),
  );
}

export function tribeInteractBlockedMessage(
  user: User | null | undefined,
  profile: UserProfile | null | undefined,
): string {
  if (!user || user.isAnonymous) {
    return "Para dar me gusta, comentar o compartir necesitas iniciar sesión como alumno.";
  }
  if (!profile) {
    return "Completa tu registro como alumno para interactuar en La Tribu.";
  }
  if (!isAlumnoProfile(profile)) {
    return "La interacción en La Tribu es solo para alumnos registrados.";
  }
  return "No puedes interactuar en La Tribu con esta cuenta.";
}
