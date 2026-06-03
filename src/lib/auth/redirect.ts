import { COACH_ROLES, type UserRole } from "@/constants/roles";
import { isCoachEmail } from "@/lib/auth/config";
import { isCoachProfile } from "@/lib/auth/coach-role";
import type { UserProfile } from "@/types/firestore";

export function getAuthRedirectPath(
  role: UserRole,
  email?: string | null,
): string {
  if (email && isCoachEmail(email)) return "/coach";
  return COACH_ROLES.includes(role) ? "/coach" : "/perfil";
}

export function getAuthRedirectPathForProfile(
  profile: Pick<UserProfile, "role" | "email">,
): string {
  return isCoachProfile(profile) ? "/coach" : "/perfil";
}
