import { COACH_ROLES, ROLES, type UserRole } from "@/constants/roles";
import { isCoachEmail } from "@/lib/auth/config";
import type { UserProfile } from "@/types/firestore";

/** El monitor nunca debe tener rol alumno en Firestore. */
export function roleForRegistration(
  email: string,
  requested?: UserRole,
): UserRole {
  if (isCoachEmail(email)) return ROLES.COACH;
  if (requested && COACH_ROLES.includes(requested)) return requested;
  return requested ?? ROLES.STUDENT;
}

export function isStudentRole(role: UserRole): boolean {
  return role === ROLES.STUDENT;
}

/** Perfil que debe tratarse como alumno (listados, Tribu, pasaporte alumno). */
export function isStudentProfile(
  profile: Pick<UserProfile, "role" | "email">,
): boolean {
  if (isCoachEmail(profile.email)) return false;
  return isStudentRole(profile.role);
}
