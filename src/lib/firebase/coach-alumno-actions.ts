import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";
import type { TrickCategory } from "@/constants/tricks-catalog";
import type { TrickStatus } from "@/types/tricks";

export interface TrickProgressPublishUpdate {
  trickId: string;
  trickName: string;
  category: TrickCategory;
  sortOrder: number;
  status: TrickStatus;
  coachNotes?: string;
}

export interface PassportSectionNotePublish {
  category: TrickCategory;
  notes: string;
}

export async function publishAlumnoPassportChanges(
  alumnoId: string,
  input: {
    trickUpdates?: TrickProgressPublishUpdate[];
    sectionNotes?: PassportSectionNotePublish[];
  },
): Promise<void> {
  const trickUpdates = input.trickUpdates ?? [];
  const sectionNotes = input.sectionNotes ?? [];
  if (trickUpdates.length === 0 && sectionNotes.length === 0) {
    return;
  }

  const res = await fetch(
    `/api/coach/alumnos/${encodeURIComponent(alumnoId)}/trick-progress`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getFirebaseAuthHeaders()),
      },
      body: JSON.stringify({ updates: trickUpdates, sectionNotes }),
    },
  );
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "No se pudieron publicar los cambios");
  }
}

/** @deprecated Usa publishAlumnoPassportChanges */
export async function publishAlumnoTrickUpdates(
  alumnoId: string,
  updates: TrickProgressPublishUpdate[],
): Promise<void> {
  await publishAlumnoPassportChanges(alumnoId, { trickUpdates: updates });
}
