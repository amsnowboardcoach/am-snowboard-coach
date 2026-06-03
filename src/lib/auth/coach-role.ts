import {
  COACH_ROLES,
  isAlumnoRole,
  ROLES,
  type UserRole,
} from "@/constants/roles";
import { isCoachEmail } from "@/lib/auth/config";
import type { UserProfile } from "@/types/firestore";

export { isAlumnoRole };

/** El monitor nunca debe tener rol alumno en Firestore. */
export function roleForRegistration(
  email: string,
  requested?: UserRole,
): UserRole {
  if (isCoachEmail(email)) return ROLES.COACH;
  if (requested && COACH_ROLES.includes(requested)) return requested;
  return requested ?? ROLES.ALUMNO;
}

/** Monitor / admin: email de coach en .env o rol en Firestore. */
export function isCoachProfile(
  profile: Pick<UserProfile, "role" | "email">,
): boolean {
  if (isCoachEmail(profile.email)) return true;
  return COACH_ROLES.includes(profile.role as UserRole);
}

/** Perfil que debe tratarse como alumno (listados, Tribu, pasaporte alumno). */
export function isAlumnoProfile(
  profile: Pick<UserProfile, "role" | "email">,
): boolean {
  return !isCoachProfile(profile);
}
