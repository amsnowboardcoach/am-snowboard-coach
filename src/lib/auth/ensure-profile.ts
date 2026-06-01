import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import { createUserProfile } from "@/lib/firebase/users";
import { requestCoachNotifyStudentRegistered } from "@/lib/push/request-coach-student-registered";
import { ROLES } from "@/constants/roles";
import { isCoachEmail } from "@/lib/auth/config";
import type { UserProfile } from "@/types/firestore";

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = doc(getFirebaseDb(), "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    if (
      user.email &&
      isCoachEmail(user.email) &&
      existing.role === ROLES.STUDENT
    ) {
      await updateDoc(ref, {
        role: ROLES.COACH,
        updatedAt: serverTimestamp(),
      });
      const fixed = await getDoc(ref);
      if (fixed.exists()) {
        return fixed.data() as UserProfile;
      }
    }
    return existing;
  }

  if (!user.email) {
    throw new Error("Tu cuenta de Google no tiene email asociado.");
  }

  const displayName =
    user.displayName?.trim() ||
    user.email.split("@")[0] ||
    "Alumno";

  const isStudent = !isCoachEmail(user.email);

  await createUserProfile({
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: user.photoURL ?? undefined,
    role: isStudent ? ROLES.STUDENT : undefined,
  });

  if (isStudent) {
    await requestCoachNotifyStudentRegistered();
  }

  const created = await getDoc(ref);
  if (!created.exists()) {
    throw new Error("No se pudo crear tu perfil. Inténtalo de nuevo.");
  }

  return created.data() as UserProfile;
}
