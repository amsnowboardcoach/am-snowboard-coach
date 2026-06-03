import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  authPhotoURL,
  hasCustomAvatar,
  usesGoogleSignIn,
} from "@/lib/auth/auth-photo";
import { getFirebaseDb } from "@/lib/firebase/client";
import { createUserProfile } from "@/lib/firebase/users";
import { requestCoachNotifyAlumnoRegistered } from "@/lib/push/request-coach-alumno-registered";
import { isAlumnoRole, LEGACY_ALUMNO_ROLE, ROLES } from "@/constants/roles";
import { isCoachEmail } from "@/lib/auth/config";
import type { UserProfile } from "@/types/firestore";

/** Parches en Firestore; si las reglas no lo permiten, se ignora el error. */
async function tryPatchUserDoc(
  ref: ReturnType<typeof doc>,
  patch: Record<string, unknown>,
): Promise<UserProfile | null> {
  try {
    await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
    const fixed = await getDoc(ref);
    return fixed.exists() ? (fixed.data() as UserProfile) : null;
  } catch {
    return null;
  }
}

/** Alumnos con Google: mantener photoURL de la cuenta de Google en Firestore. */
async function syncAlumnoGooglePhoto(
  ref: ReturnType<typeof doc>,
  existing: UserProfile,
  user: User,
): Promise<UserProfile | null> {
  if (!isAlumnoRole(existing.role) || isCoachEmail(user.email ?? "")) {
    return null;
  }
  if (!usesGoogleSignIn(user)) return null;
  if (hasCustomAvatar(existing)) return null;

  const photo = authPhotoURL(user);
  if (!photo || existing.photoURL === photo) return null;

  return tryPatchUserDoc(ref, { photoURL: photo, avatarSource: "google" });
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  if (usesGoogleSignIn(user)) {
    try {
      await user.reload();
    } catch {
      /* token / red; seguir con datos actuales */
    }
  }

  const ref = doc(getFirebaseDb(), "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const existing = snap.data() as UserProfile;
    if (user.email && isCoachEmail(user.email) && isAlumnoRole(existing.role)) {
      const fixed = await tryPatchUserDoc(ref, {
        role: ROLES.COACH,
        assignedCoachId: user.uid,
      });
      if (fixed) return fixed;
    }
    if (user.email && !isCoachEmail(user.email)) {
      if (existing.role === LEGACY_ALUMNO_ROLE) {
        const fixed = await tryPatchUserDoc(ref, { role: ROLES.ALUMNO });
        if (fixed) return fixed;
      }
    }
    const withPhoto = await syncAlumnoGooglePhoto(ref, existing, user);
    if (withPhoto) return withPhoto;

    return existing;
  }

  if (!user.email) {
    throw new Error("Tu cuenta de Google no tiene email asociado.");
  }

  const displayName =
    user.displayName?.trim() ||
    user.email.split("@")[0] ||
    "Alumno";

  const isAlumno = !isCoachEmail(user.email);

  await createUserProfile({
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: authPhotoURL(user),
    role: isAlumno ? ROLES.ALUMNO : ROLES.COACH,
  });

  if (isAlumno) {
    await new Promise((r) => setTimeout(r, 500));
    await requestCoachNotifyAlumnoRegistered();
  }

  const created = await getDoc(ref);
  if (!created.exists()) {
    throw new Error("No se pudo crear tu perfil. Inténtalo de nuevo.");
  }

  return created.data() as UserProfile;
}
