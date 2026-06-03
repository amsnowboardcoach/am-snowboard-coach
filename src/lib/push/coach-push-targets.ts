import { getCoachEmails } from "@/lib/auth/config";
import { getAdminDb } from "@/lib/firebase/admin";

/** UIDs de coach que deben recibir push (env + búsqueda por email). */
export async function resolveCoachPushUserIds(): Promise<string[]> {
  const ids = new Set<string>();
  const coachEmails = new Set(getCoachEmails());
  const defaultId = process.env.NEXT_PUBLIC_DEFAULT_COACH_ID?.trim();
  if (defaultId) ids.add(defaultId);

  const db = getAdminDb();
  for (const email of coachEmails) {
    try {
      const snap = await db
        .collection("users")
        .where("email", "==", email)
        .limit(5)
        .get();
      for (const doc of snap.docs) {
        ids.add(doc.id);
      }
    } catch (err) {
      console.warn("[push] No se pudo buscar coach por email", email, err);
    }
  }

  return [...ids];
}
