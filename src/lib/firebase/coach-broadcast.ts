import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";
import type { CoachBroadcastTemplateId } from "@/constants/coach-student-messages";

export interface CoachBroadcastRequest {
  studentIds: string[];
  templateId: CoachBroadcastTemplateId;
  customTitle?: string;
  customBody?: string;
  sendPush?: boolean;
  sendEmail?: boolean;
}

export interface CoachBroadcastResponse {
  ok: boolean;
  sent: number;
  total: number;
  title: string;
  failedCount: number;
  error?: string;
}

export async function sendCoachStudentBroadcast(
  input: CoachBroadcastRequest,
): Promise<CoachBroadcastResponse> {
  const res = await fetch("/api/coach/students/broadcast", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getFirebaseAuthHeaders()),
    },
    body: JSON.stringify(input),
  });

  const data = (await res.json().catch(() => ({}))) as CoachBroadcastResponse & {
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "No se pudo enviar el aviso");
  }

  return data;
}
