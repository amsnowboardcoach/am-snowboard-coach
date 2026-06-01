import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/firestore";

export async function loadUserProfile(
  firebaseUser: User,
): Promise<UserProfile | null> {
  try {
    const ref = doc(getFirebaseDb(), "users", firebaseUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return await ensureUserProfile(firebaseUser);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[loadUserProfile]", err);
    }
    return null;
  }
}
