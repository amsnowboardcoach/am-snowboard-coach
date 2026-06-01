import { safeNextPath } from "@/lib/auth/paths";

/** Ruta canónica del acceso (entrar o registrarse) */
export const STUDENT_AREA_PATH = "/login";

export function studentAreaHref(options?: {
  signup?: boolean;
  next?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.signup) params.set("registro", "1");
  const safeNext = safeNextPath(options?.next);
  if (safeNext) params.set("next", safeNext);
  const qs = params.toString();
  return qs ? `${STUDENT_AREA_PATH}?${qs}` : STUDENT_AREA_PATH;
}
