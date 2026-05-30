import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { createUserProfile } from "@/lib/firebase/users";
import type { UserProfile } from "@/types/firestore";

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(getFirebaseDb(), "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  if (!user.email) {
    throw new Error("Tu cuenta de Google no tiene email asociado.");
  }

  const displayName =
    user.displayName?.trim() ||
    user.email.split("@")[0] ||
    "Alumno";

  await createUserProfile({
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: user.photoURL ?? undefined,
  });

  const created = await getDoc(ref);
  if (!created.exists()) {
    throw new Error("No se pudo crear tu perfil. Inténtalo de nuevo.");
  }

  return created.data() as UserProfile;
}
