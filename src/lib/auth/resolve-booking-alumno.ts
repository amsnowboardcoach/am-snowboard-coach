import { NextRequest } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyUserBearer } from "@/lib/auth/verify-user-token";

export type ResolvedBookingAlumno = {
  alumnoName: string;
  alumnoEmail: string;
  authUserId: string;
};

export type BookingAlumnoAuthError = {
  error: string;
  status: 401 | 403;
};

/** Reserva web: exige alumno autenticado (Bearer Firebase). Sin invitados. */
export async function requireBookingAlumno(
  request: NextRequest,
  name: string,
): Promise<ResolvedBookingAlumno | BookingAlumnoAuthError> {
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

  const alumnoName =
    name.trim() ||
    (typeof profile?.displayName === "string"
      ? profile.displayName.trim()
      : "") ||
    auth.email.split("@")[0] ||
    "Alumno";

  return {
    alumnoName,
    alumnoEmail: auth.email,
    authUserId: auth.uid,
  };
}
