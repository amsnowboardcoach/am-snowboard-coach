import { isFirebaseConfigured } from "@/lib/auth/config";
import { getFirebaseAuth } from "@/lib/firebase/client";

/** Cabecera Authorization con token Firebase del usuario actual. */
export async function getFirebaseAuthHeaders(): Promise<HeadersInit> {
  if (!isFirebaseConfigured()) {
    return {};
  }
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    return {};
  }
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
