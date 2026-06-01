import { FieldValue } from "firebase-admin/firestore";
import type { CoachBroadcastTemplateId } from "@/constants/coach-student-messages";
import { findCoachBroadcastTemplate } from "@/constants/coach-student-messages";
import { getAdminDb } from "@/lib/firebase/admin";

export async function saveCoachNoticeForStudent(input: {
  studentId: string;
  title: string;
  body: string;
  templateId: CoachBroadcastTemplateId;
  coachId: string;
}): Promise<string> {
  const template = findCoachBroadcastTemplate(input.templateId);
  const ref = await getAdminDb()
    .collection("users")
    .doc(input.studentId)
    .collection("coach_notices")
    .add({
      title: input.title,
      body: input.body,
      templateId: input.templateId,
      templateLabel:
        input.templateId === "custom"
          ? "Aviso del coach"
          : (template?.label ?? "Aviso"),
      coachId: input.coachId,
      createdAt: FieldValue.serverTimestamp(),
      readAt: null,
    });
  return ref.id;
}
