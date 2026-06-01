import { collection, getDocs, query, where } from "firebase/firestore";
import { LEGACY_STUDENT_ROLE, ROLES } from "@/constants/roles";
import { isStudentProfile } from "@/lib/auth/coach-role";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/firestore";

export async function fetchCoachStudents(
  coachId: string,
): Promise<UserProfile[]> {
  const q = query(
    collection(getFirebaseDb(), "users"),
    where("assignedCoachId", "==", coachId),
    where("role", "in", [ROLES.STUDENT, LEGACY_STUDENT_ROLE]),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as UserProfile)
    .filter((profile) => isStudentProfile(profile));
}
