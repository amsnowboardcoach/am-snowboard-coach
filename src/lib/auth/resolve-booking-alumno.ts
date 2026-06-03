import { NextRequest } from "next/server";
import { isCoachEmail } from "@/lib/auth/config";
import { isAlumnoRole, LEGACY_ALUMNO_ROLE } from "@/constants/roles";
import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeAlumnoEmail } from "@/lib/firebase/booking-alumno-fields";
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
  bodyEmail?: string,
): Promise<ResolvedBookingAlumno | BookingAlumnoAuthError> {
  const auth = await verifyUserBearer(request);
  if (!auth) {
    return {
      error:
        "Debes iniciar sesión o crear una cuenta de alumno para reservar.",
      status: 401,
    };
  }

  if (isCoachEmail(auth.email)) {
    return {
      error:
        "Las reservas de clase son con cuenta de alumno. Cierra sesión de coach e inicia sesión como alumno.",
      status: 403,
    };
  }

  const normalizedBodyEmail = bodyEmail
    ? normalizeAlumnoEmail(bodyEmail)
    : null;
  if (normalizedBodyEmail && normalizedBodyEmail !== auth.email) {
    return {
      error:
        "El email del formulario no coincide con tu cuenta. Usa el mismo email con el que iniciaste sesión.",
      status: 403,
    };
  }

  const userSnap = await getAdminDb().collection("users").doc(auth.uid).get();
  const profile = userSnap.data();
  const role = profile?.role as string | undefined;

  if (role && !isAlumnoRole(role) && role !== LEGACY_ALUMNO_ROLE) {
    return {
      error: "Solo las cuentas de alumno pueden reservar desde la web.",
      status: 403,
    };
  }

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
