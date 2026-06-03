import { FieldValue } from "firebase-admin/firestore";
import type { TrickCategory } from "@/constants/tricks-catalog";
import { getAdminDb } from "@/lib/firebase/admin";
import type { TrickStatus } from "@/types/tricks";

export interface TrickProgressUpdateInput {
  trickId: string;
  category: TrickCategory;
  sortOrder: number;
  status: TrickStatus;
  coachNotes?: string;
}

export async function applyAlumnoTrickProgressUpdates(
  alumnoId: string,
  coachId: string,
  updates: TrickProgressUpdateInput[],
): Promise<void> {
  const db = getAdminDb();
  const batch = db.batch();

  for (const update of updates) {
    const ref = db
      .collection("users")
      .doc(alumnoId)
      .collection("trick_progress")
      .doc(update.trickId);

    if (update.status === "locked") {
      batch.set(ref, {
        trickId: update.trickId,
        category: update.category,
        status: "locked",
        order: update.sortOrder,
      });
      continue;
    }

    const payload: Record<string, unknown> = {
      trickId: update.trickId,
      category: update.category,
      status: update.status,
      order: update.sortOrder,
      unlockedByCoachId: coachId,
      unlockedAt: FieldValue.serverTimestamp(),
    };
    if (update.coachNotes?.trim()) {
      payload.coachNotes = update.coachNotes.trim();
    }

    batch.set(ref, payload, { merge: true });
  }

  await batch.commit();
}
