import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";

export async function saveFcmToken(
  userId: string,
  token: string,
  platform: string,
): Promise<void> {
  const id = token.slice(0, 32).replace(/[/+=]/g, "_");
  await setDoc(
    doc(getFirebaseDb(), "users", userId, "fcm_tokens", id),
    {
      token,
      platform,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
