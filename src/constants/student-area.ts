/** Ruta canónica del acceso (entrar o registrarse) */
export const STUDENT_AREA_PATH = "/login";

export function studentAreaHref(options?: {
  signup?: boolean;
  next?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.signup) params.set("registro", "1");
  if (options?.next) params.set("next", options.next);
  const qs = params.toString();
  return qs ? `${STUDENT_AREA_PATH}?${qs}` : STUDENT_AREA_PATH;
}
