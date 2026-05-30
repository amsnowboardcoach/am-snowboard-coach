import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";

/** Cabecera Authorization para APIs cuando hay sesión Firebase. */
export async function getBookingAuthHeaders(): Promise<HeadersInit> {
  return getFirebaseAuthHeaders();
}
