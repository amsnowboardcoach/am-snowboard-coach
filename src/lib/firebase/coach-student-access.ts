import { COACH_ROLES, ROLES } from "@/constants/roles";
import { getAdminDb } from "@/lib/firebase/admin";

/** Comprueba que el coach puede gestionar este alumno en el panel. */
export async function assertCoachCanManageStudent(
  coachUid: string,
  studentId: string,
): Promise<void> {
  const db = getAdminDb();
  const studentSnap = await db.collection("users").doc(studentId).get();
  if (!studentSnap.exists) {
    throw new Error("Alumno no encontrado");
  }

  const student = studentSnap.data()!;
  if (student.role !== ROLES.STUDENT) {
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
  const assignedCoachId = student.assignedCoachId as string | undefined;
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
