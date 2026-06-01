export const ROLES = {
  /** Rol de alumno en Firestore (valor: alumno). */
  STUDENT: "alumno",
  COACH: "coach",
  COLLABORATOR: "collaborator",
  ADMIN: "admin",
} as const;

/** Valor antiguo en Firestore; se migra a {@link ROLES.STUDENT} al iniciar sesión. */
export const LEGACY_STUDENT_ROLE = "student";

export type UserRole =
  | (typeof ROLES)[keyof typeof ROLES]
  | typeof LEGACY_STUDENT_ROLE;

export const COACH_ROLES: UserRole[] = [ROLES.COACH, ROLES.COLLABORATOR, ROLES.ADMIN];

export function isAlumnoRole(role: string | undefined): boolean {
  return role === ROLES.STUDENT || role === LEGACY_STUDENT_ROLE;
}

/** Etiqueta en español para mostrar en la UI (perfil, panel coach, etc.). */
export function roleDisplayLabel(role: string | undefined): string {
  if (!role) return "—";
  if (isAlumnoRole(role)) return "Alumno";
  if (role === ROLES.COACH) return "Coach";
  if (role === ROLES.COLLABORATOR) return "Colaborador";
  if (role === ROLES.ADMIN) return "Administrador";
  return role;
}
