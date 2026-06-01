import { collection, getDocs } from "firebase/firestore";
import type { TrickCategory } from "@/constants/tricks-catalog";
import { getFirebaseDb } from "@/lib/firebase/client";

const SUBCOL = "passport_section_notes";

export interface PassportSectionNoteDoc {
  category: TrickCategory;
  notes: string;
}

export type PassportSectionNotesMap = Partial<Record<TrickCategory, string>>;

export async function fetchPassportSectionNotes(
  studentId: string,
): Promise<PassportSectionNotesMap> {
  const snap = await getDocs(
    collection(getFirebaseDb(), "users", studentId, SUBCOL),
  );
  const map: PassportSectionNotesMap = {};
  for (const d of snap.docs) {
    const data = d.data() as PassportSectionNoteDoc;
    if (data.category && typeof data.notes === "string") {
      map[data.category] = data.notes;
    }
  }
  return map;
}
