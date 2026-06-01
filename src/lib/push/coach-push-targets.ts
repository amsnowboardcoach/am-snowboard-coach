import { getCoachEmails } from "@/lib/auth/config";
import { COACH_ROLES, type UserRole } from "@/constants/roles";
import { getAdminDb } from "@/lib/firebase/admin";

/** UIDs de coach que deben recibir push (env + búsqueda por email). */
export async function resolveCoachPushUserIds(): Promise<string[]> {
  const ids = new Set<string>();
  const defaultId = process.env.NEXT_PUBLIC_DEFAULT_COACH_ID?.trim();
  if (defaultId) ids.add(defaultId);

  const db = getAdminDb();
  for (const email of getCoachEmails()) {
    try {
      const snap = await db
        .collection("users")
        .where("email", "==", email)
        .limit(5)
        .get();
      for (const doc of snap.docs) {
        const role = doc.data().role as UserRole | undefined;
        if (role && COACH_ROLES.includes(role)) {
          ids.add(doc.id);
        }
      }
    } catch (err) {
      console.warn("[push] No se pudo buscar coach por email", email, err);
    }
  }

  return [...ids];
}
