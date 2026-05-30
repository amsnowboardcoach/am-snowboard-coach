import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { ROLES, type UserRole } from "@/constants/roles";
import { isCoachEmail } from "@/lib/auth/config";
import { getFirebaseDb } from "@/lib/firebase/client";

export async function createUserProfile(params: {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: UserRole;
}): Promise<void> {
  const { uid, email, displayName, photoURL, role } = params;
  const assignedCoachId =
    process.env.NEXT_PUBLIC_DEFAULT_COACH_ID ?? uid;

  const userRole =
    role ?? (isCoachEmail(email) ? ROLES.COACH : ROLES.STUDENT);

  const coachId =
    userRole === ROLES.COACH ? uid : assignedCoachId;

  await setDoc(doc(getFirebaseDb(), "users", uid), {
    uid,
    email,
    displayName,
    ...(photoURL ? { photoURL } : {}),
    role: userRole,
    assignedCoachId: coachId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    preferences: {
      notifications: {
        lastMinute: true,
        weather: true,
        tribe: true,
      },
    },
  });
}
