import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";
import type { CoachBroadcastTemplateId } from "@/constants/coach-alumno-messages";

export interface CoachBroadcastRequest {
  alumnoIds: string[];
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

export async function sendCoachAlumnoBroadcast(
  input: CoachBroadcastRequest,
): Promise<CoachBroadcastResponse> {
  const res = await fetch("/api/coach/alumnos/broadcast", {
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
