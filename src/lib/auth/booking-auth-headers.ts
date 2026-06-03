import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";

/** Cabecera Authorization para APIs cuando hay sesión Firebase. */
export async function getBookingAuthHeaders(): Promise<HeadersInit> {
  return getFirebaseAuthHeaders();
}

/** Exige sesión Firebase; lanza si el alumno no está autenticado. */
export async function requireBookingAuthHeaders(): Promise<
  Record<string, string>
> {
  const headers = await getFirebaseAuthHeaders();
  const auth =
    typeof headers === "object" &&
    headers !== null &&
    "Authorization" in headers &&
    typeof (headers as Record<string, string>).Authorization === "string"
      ? (headers as Record<string, string>).Authorization
      : "";
  if (!auth) {
    throw new Error(
      "Debes iniciar sesión o crear una cuenta de alumno para reservar.",
    );
  }
  return {
    "Content-Type": "application/json",
    Authorization: auth,
  };
}
