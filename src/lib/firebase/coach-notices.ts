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

function noticesCol(studentId: string) {
  return collection(getFirebaseDb(), "users", studentId, SUB);
}

export async function fetchStudentCoachNotices(
  studentId: string,
  max = 50,
): Promise<CoachNoticeDoc[]> {
  const q = query(
    noticesCol(studentId),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as CoachNoticeDoc,
  );
}

export async function countUnreadCoachNotices(
  studentId: string,
): Promise<number> {
  const q = query(
    noticesCol(studentId),
    where("readAt", "==", null),
    limit(100),
  );
  const snap = await getDocs(q);
  return snap.size;
}

export async function markCoachNoticeRead(
  studentId: string,
  noticeId: string,
): Promise<void> {
  await updateDoc(
    doc(getFirebaseDb(), "users", studentId, SUB, noticeId),
    { readAt: serverTimestamp() },
  );
}

export async function markAllCoachNoticesRead(
  studentId: string,
  notices: CoachNoticeDoc[],
): Promise<void> {
  const unread = notices.filter((n) => !n.readAt);
  await Promise.all(
    unread.map((n) => markCoachNoticeRead(studentId, n.id)),
  );
}
