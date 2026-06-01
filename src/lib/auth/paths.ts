import { COACH_ROLES } from "@/constants/roles";
import type { UserRole } from "@/constants/roles";
import { getAuthRedirectPath } from "@/lib/auth/redirect";

/** Rutas internas permitidas tras login (evita open redirect). */
const ALLOWED_NEXT_PREFIXES = [
  "/perfil",
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
): string {
  return safeNextPath(next) ?? getAuthRedirectPath(role);
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
