import { FieldValue } from "firebase-admin/firestore";
import type { TrickCategory } from "@/constants/tricks-catalog";
import { getAdminDb } from "@/lib/firebase/admin";

export interface PassportSectionNoteInput {
  category: TrickCategory;
  notes: string;
}

export async function applyPassportSectionNotes(
  studentId: string,
  coachId: string,
  notes: PassportSectionNoteInput[],
): Promise<void> {
  if (notes.length === 0) return;

  const db = getAdminDb();
  const batch = db.batch();

  for (const item of notes) {
    const ref = db
      .collection("users")
      .doc(studentId)
      .collection("passport_section_notes")
      .doc(item.category);

    const trimmed = item.notes.trim();
    if (!trimmed) {
      batch.delete(ref);
      continue;
    }

    batch.set(ref, {
      category: item.category,
      notes: trimmed,
      updatedByCoachId: coachId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
}
