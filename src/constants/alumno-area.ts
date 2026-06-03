import { safeNextPath } from "@/lib/auth/paths";

/** Ruta canónica del acceso (entrar o registrarse) */
export const ALUMNO_AREA_PATH = "/login";

export function alumnoAreaHref(options?: {
  signup?: boolean;
  next?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.signup) params.set("registro", "1");
  const safeNext = safeNextPath(options?.next);
  if (safeNext) params.set("next", safeNext);
  const qs = params.toString();
  return qs ? `${ALUMNO_AREA_PATH}?${qs}` : ALUMNO_AREA_PATH;
}
