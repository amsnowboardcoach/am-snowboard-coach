import type { User } from "firebase/auth";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import type { UserProfile } from "@/types/firestore";

export async function loadUserProfile(
  firebaseUser: User,
): Promise<UserProfile | null> {
  try {
    return await ensureUserProfile(firebaseUser);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[loadUserProfile]", err);
    }
    return null;
  }
}
