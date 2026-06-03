import { COACH_ROLES, ROLES } from "@/constants/roles";
import { isAlumnoProfile } from "@/lib/auth/coach-role";
import { getAdminDb } from "@/lib/firebase/admin";
import type { UserProfile } from "@/types/firestore";

/** Comprueba que el coach puede gestionar este alumno en el panel. */
export async function assertCoachCanManageAlumno(
  coachUid: string,
  alumnoId: string,
): Promise<void> {
  const db = getAdminDb();
  const alumnoSnap = await db.collection("users").doc(alumnoId).get();
  if (!alumnoSnap.exists) {
    throw new Error("Alumno no encontrado");
  }

  const alumno = alumnoSnap.data()!;
  const email = (alumno.email as string | undefined) ?? "";
  if (!isAlumnoProfile({ role: alumno.role as UserProfile["role"], email })) {
    throw new Error("Solo puedes gestionar alumnos");
  }

  const coachSnap = await db.collection("users").doc(coachUid).get();
  const coachRole = coachSnap.data()?.role as string | undefined;
  if (
    !coachRole ||
    !COACH_ROLES.includes(coachRole as (typeof COACH_ROLES)[number])
  ) {
    throw new Error("No autorizado");
  }

  const defaultCoachId = process.env.NEXT_PUBLIC_DEFAULT_COACH_ID?.trim();
  const assignedCoachId = alumno.assignedCoachId as string | undefined;
  const assignedToRequester = assignedCoachId === coachUid;
  const assignedToDefaultCoach =
    Boolean(defaultCoachId) &&
    assignedCoachId === defaultCoachId &&
    (coachRole === ROLES.COACH || coachRole === ROLES.ADMIN);

  if (
    !assignedToRequester &&
    coachRole !== ROLES.ADMIN &&
    !assignedToDefaultCoach
  ) {
    throw new Error("Este alumno no está asignado a tu panel");
  }
}
