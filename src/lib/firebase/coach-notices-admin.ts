import { FieldValue } from "firebase-admin/firestore";
import type { CoachBroadcastTemplateId } from "@/constants/coach-alumno-messages";
import { findCoachBroadcastTemplate } from "@/constants/coach-alumno-messages";
import { getAdminDb } from "@/lib/firebase/admin";

export async function saveCoachNoticeForAlumno(input: {
  alumnoId: string;
  title: string;
  body: string;
  templateId: CoachBroadcastTemplateId;
  coachId: string;
}): Promise<string> {
  const template = findCoachBroadcastTemplate(input.templateId);
  const ref = await getAdminDb()
    .collection("users")
    .doc(input.alumnoId)
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
