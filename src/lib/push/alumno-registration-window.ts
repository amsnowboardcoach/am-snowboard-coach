import type { User } from "firebase/auth";
import type { UserProfile } from "@/types/firestore";

export const ALUMNO_REGISTRATION_NOTIFY_WINDOW_MS = 20 * 60 * 1000;

export function isRecentAlumnoRegistration(
  firebaseUser: User,
  profile: UserProfile,
): boolean {
  const fromProfile = profile.createdAt?.toDate?.();
  if (fromProfile) {
    return (
      Date.now() - fromProfile.getTime() <= ALUMNO_REGISTRATION_NOTIFY_WINDOW_MS
    );
  }

  const meta = firebaseUser.metadata?.creationTime;
  if (meta) {
    return (
      Date.now() - new Date(meta).getTime() <=
      ALUMNO_REGISTRATION_NOTIFY_WINDOW_MS
    );
  }

  return false;
}
