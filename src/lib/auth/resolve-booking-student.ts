import { NextRequest } from "next/server";
import { COACH_ROLES, type UserRole } from "@/constants/roles";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyUserBearer } from "@/lib/auth/verify-user-token";

export type ResolvedBookingStudent = {
  studentName: string;
  studentEmail: string;
  authUserId: string;
};

export type BookingStudentAuthError = {
  error: string;
  status: 401 | 403;
};

/** Reserva web: exige alumno autenticado (Bearer Firebase). Sin invitados. */
export async function requireBookingStudent(
  request: NextRequest,
  name: string,
): Promise<ResolvedBookingStudent | BookingStudentAuthError> {
  const auth = await verifyUserBearer(request);
  if (!auth) {
    return {
      error:
        "Debes iniciar sesión o crear una cuenta de alumno para reservar.",
      status: 401,
    };
  }

  const userSnap = await getAdminDb().collection("users").doc(auth.uid).get();
  const profile = userSnap.data();
  const role = profile?.role as string | undefined;
  if (role && COACH_ROLES.includes(role as UserRole)) {
    return {
      error: "Las reservas en la web son solo para alumnos.",
      status: 403,
    };
  }

  const studentName =
    name.trim() ||
    (typeof profile?.displayName === "string"
      ? profile.displayName.trim()
      : "") ||
    auth.email.split("@")[0] ||
    "Alumno";

  return {
    studentName,
    studentEmail: auth.email,
    authUserId: auth.uid,
  };
}
