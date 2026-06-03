import { COACH_ROLES } from "@/constants/roles";
import type { UserRole } from "@/constants/roles";
import { isCoachProfile } from "@/lib/auth/coach-role";
import {
  getAuthRedirectPath,
  getAuthRedirectPathForProfile,
} from "@/lib/auth/redirect";
import type { UserProfile } from "@/types/firestore";

/** Rutas internas permitidas tras login (evita open redirect). */
const ALLOWED_NEXT_PREFIXES = [
  "/perfil",
  "/perfil/avisos",
  "/perfil/tribu",
  "/coach",
  "/reservar",
  "/tribu",
  "/mercadillo",
  "/pagar",
] as const;

export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  const path = next.split("?")[0]?.split("#")[0] ?? next;
  if (path.startsWith("/login") || path.startsWith("/registro")) return null;
  const allowed = ALLOWED_NEXT_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  return allowed ? next : null;
}

export function resolvePostLoginPath(
  role: UserRole,
  next: string | null | undefined,
  email?: string | null,
): string {
  const defaultPath = getAuthRedirectPath(role, email);
  const safe = safeNextPath(next);
  if (!safe) return defaultPath;
  const pathOnly = safe.split("?")[0]?.split("#")[0] ?? safe;
  if (pathOnly.startsWith("/coach") && !getAuthRedirectPath(role, email).startsWith("/coach")) {
    return "/perfil";
  }
  return safe;
}

export function resolvePostLoginPathForProfile(
  profile: Pick<UserProfile, "role" | "email">,
  next: string | null | undefined,
): string {
  const defaultPath = getAuthRedirectPathForProfile(profile);
  const safe = safeNextPath(next);
  if (!safe) return defaultPath;
  const pathOnly = safe.split("?")[0]?.split("#")[0] ?? safe;
  if (pathOnly.startsWith("/coach") && !isCoachProfile(profile)) {
    return "/perfil";
  }
  return safe;
}

export function isCoachRole(role: UserRole): boolean {
  return COACH_ROLES.includes(role);
}

export function isPrivateAppPath(pathname: string): boolean {
  return (
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/coach")
  );
}

export function loginPathWithNext(next: string | null | undefined): string {
  const safe = safeNextPath(next);
  if (!safe) return "/login";
  return `/login?next=${encodeURIComponent(safe)}`;
}
