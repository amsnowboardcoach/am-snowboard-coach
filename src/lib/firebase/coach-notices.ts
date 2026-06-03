import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { CoachNoticeDoc } from "@/types/coach-notice";

const SUB = "coach_notices";

function noticesCol(alumnoId: string) {
  return collection(getFirebaseDb(), "users", alumnoId, SUB);
}

export async function fetchAlumnoCoachNotices(
  alumnoId: string,
  max = 50,
): Promise<CoachNoticeDoc[]> {
  const q = query(
    noticesCol(alumnoId),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as CoachNoticeDoc,
  );
}

export async function countUnreadCoachNotices(
  alumnoId: string,
): Promise<number> {
  const q = query(
    noticesCol(alumnoId),
    where("readAt", "==", null),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function markCoachNoticeRead(
  alumnoId: string,
  noticeId: string,
): Promise<void> {
  await updateDoc(
    doc(getFirebaseDb(), "users", alumnoId, SUB, noticeId),
    { readAt: serverTimestamp() },
  );
}

export async function markAllCoachNoticesRead(
  alumnoId: string,
  notices: CoachNoticeDoc[],
): Promise<void> {
  const unread = notices.filter((n) => !n.readAt);
  await Promise.all(
    unread.map((n) => markCoachNoticeRead(alumnoId, n.id)),
  );
}
