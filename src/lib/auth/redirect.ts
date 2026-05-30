import { COACH_ROLES } from "@/constants/roles";
import type { UserRole } from "@/constants/roles";

export function getAuthRedirectPath(role: UserRole): string {
  return COACH_ROLES.includes(role) ? "/coach" : "/perfil";
}
