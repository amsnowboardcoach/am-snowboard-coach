import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { TRICKS_CATALOG } from "@/constants/tricks-catalog";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { TrickProgressDoc, TrickStatus, TrickWithProgress } from "@/types/tricks";
import type { TrickCatalogDoc } from "@/types/tricks";

const CATALOG = "tricks_catalog";

/** Solo coaches (reglas Firestore). Sincroniza el catálogo en `tricks_catalog`. */
export async function ensureTricksCatalog(): Promise<void> {
  const db = getFirebaseDb();
  const catalogIds = new Set(TRICKS_CATALOG.map((t) => t.id));
  const batch = writeBatch(db);

  for (const trick of TRICKS_CATALOG) {
    batch.set(
      doc(db, CATALOG, trick.id),
      { ...trick, active: true },
      { merge: true },
    );
  }

  const snap = await getDocs(collection(db, CATALOG));
  for (const d of snap.docs) {
    if (!catalogIds.has(d.id)) {
      batch.set(d.ref, { active: false }, { merge: true });
    }
  }

  await batch.commit();
}

/** Catálogo embebido en la app (siempre disponible para alumnos sin escribir en Firestore). */
function catalogFromConstants(): TrickCatalogDoc[] {
  return TRICKS_CATALOG.map((t) => ({ ...t, active: true }));
}

export async function fetchTricksCatalog(): Promise<TrickCatalogDoc[]> {
  const baseline = catalogFromConstants();

  try {
    const snap = await getDocs(collection(getFirebaseDb(), CATALOG));
    if (snap.empty) return baseline;

    const firestoreById = new Map(
      snap.docs.map((d) => [d.id, { id: d.id, ...d.data() } as TrickCatalogDoc]),
    );

    return baseline
      .filter((t) => firestoreById.get(t.id)?.active !== false)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return baseline;
  }
}

export async function fetchAlumnoTrickProgress(
  alumnoId: string,
): Promise<TrickProgressDoc[]> {
  const snap = await getDocs(
    collection(getFirebaseDb(), "users", alumnoId, "trick_progress"),
  );
  return snap.docs.map((d) => d.data() as TrickProgressDoc);
}

export async function mergeTricksWithProgress(
  alumnoId: string,
): Promise<TrickWithProgress[]> {
  const catalog = await fetchTricksCatalog();
  let progressList: TrickProgressDoc[];
  try {
    progressList = await fetchAlumnoTrickProgress(alumnoId);
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: string }).code)
        : "";
    if (code === "permission-denied") {
      throw new Error(
        "Permission denied: no se pudo leer tu progreso en el pasaporte",
      );
    }
    throw err;
  }
  const progressMap = new Map(progressList.map((p) => [p.trickId, p]));

  return catalog.map((trick) => ({
    ...trick,
    progress: progressMap.get(trick.id) ?? null,
  }));
}

export function resolveTrickStatus(
  progress: TrickProgressDoc | null,
): TrickStatus {
  return progress?.status ?? "locked";
}

export async function setAlumnoTrickStatus(
  alumnoId: string,
  trick: Pick<TrickCatalogDoc, "id" | "category" | "sortOrder">,
  status: TrickStatus,
  coachId: string,
  coachNotes?: string,
): Promise<void> {
  const ref = doc(
    getFirebaseDb(),
    "users",
    alumnoId,
    "trick_progress",
    trick.id,
  );

  const payload: TrickProgressDoc = {
    trickId: trick.id,
    category: trick.category,
    status,
    order: trick.sortOrder,
    unlockedByCoachId: coachId,
    ...(status !== "locked"
      ? { unlockedAt: serverTimestamp() as TrickProgressDoc["unlockedAt"] }
      : {}),
    ...(coachNotes?.trim() ? { coachNotes: coachNotes.trim() } : {}),
  };

  if (status === "locked") {
    await setDoc(ref, {
      trickId: trick.id,
      category: trick.category,
      status: "locked",
      order: trick.sortOrder,
    });
    return;
  }

  await setDoc(ref, payload, { merge: true });
}
