import {
  collection,
  doc,
  getDoc,
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

export async function ensureTricksCatalog(): Promise<void> {
  const db = getFirebaseDb();
  const first = await getDoc(doc(db, CATALOG, TRICKS_CATALOG[0].id));
  if (first.exists()) return;

  const batch = writeBatch(db);
  for (const trick of TRICKS_CATALOG) {
    batch.set(doc(db, CATALOG, trick.id), {
      ...trick,
      active: true,
    });
  }
  await batch.commit();
}

export async function fetchTricksCatalog(): Promise<TrickCatalogDoc[]> {
  const snap = await getDocs(collection(getFirebaseDb(), CATALOG));
  if (snap.empty) {
    return TRICKS_CATALOG.map((t) => ({ ...t, active: true }));
  }
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as TrickCatalogDoc)
    .filter((t) => t.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function fetchStudentTrickProgress(
  studentId: string,
): Promise<TrickProgressDoc[]> {
  const snap = await getDocs(
    collection(getFirebaseDb(), "users", studentId, "trick_progress"),
  );
  return snap.docs.map((d) => d.data() as TrickProgressDoc);
}

export async function mergeTricksWithProgress(
  studentId: string,
): Promise<TrickWithProgress[]> {
  const [catalog, progressList] = await Promise.all([
    fetchTricksCatalog(),
    fetchStudentTrickProgress(studentId),
  ]);
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

export async function setStudentTrickStatus(
  studentId: string,
  trick: Pick<TrickCatalogDoc, "id" | "category" | "sortOrder">,
  status: TrickStatus,
  coachId: string,
  coachNotes?: string,
): Promise<void> {
  const ref = doc(
    getFirebaseDb(),
    "users",
    studentId,
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
