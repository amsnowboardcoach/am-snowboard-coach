import type { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  COACH_ROLES,
  isAlumnoRole,
  LEGACY_ALUMNO_ROLE,
  ROLES,
  type UserRole,
} from "@/constants/roles";
import { isCoachEmail } from "@/lib/auth/config";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifyUserBearer } from "@/lib/auth/verify-user-token";

export type VerifiedAlumno = {
  uid: string;
  email: string;
  displayName: string;
  authorPhotoURL?: string;
};

/** Alumno autenticado con rol válido en Firestore (corrige rol ausente si aplica). */
export async function verifyAlumnoBearer(
  request: NextRequest,
): Promise<VerifiedAlumno | null> {
  const auth = await verifyUserBearer(request);
  if (!auth) return null;
  if (isCoachEmail(auth.email)) return null;

  const ref = getAdminDb().collection("users").doc(auth.uid);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data()!;
  let role = data.role as UserRole | undefined;

  if (role && COACH_ROLES.includes(role)) {
    return null;
  }

  if (!isAlumnoRole(role)) {
    await ref.update({
      role: ROLES.ALUMNO,
      updatedAt: FieldValue.serverTimestamp(),
    });
    role = ROLES.ALUMNO;
  } else if (role === LEGACY_ALUMNO_ROLE) {
    await ref.update({
      role: ROLES.ALUMNO,
      updatedAt: FieldValue.serverTimestamp(),
    });
    role = ROLES.ALUMNO;
  }

  return {
    uid: auth.uid,
    email: auth.email,
    displayName: (data.displayName as string) || auth.email.split("@")[0] || "Alumno",
    authorPhotoURL: (data.photoURL as string | undefined) || undefined,
  };
}
