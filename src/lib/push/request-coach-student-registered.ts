import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";

/** Avisa al coach (push + email) tras crear perfil de alumno. */
export async function requestCoachNotifyStudentRegistered(): Promise<void> {
  try {
    const headers = await getFirebaseAuthHeaders();
    if (!("Authorization" in headers)) return;

    await fetch("/api/push/student-registered", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  } catch {
    /* aviso opcional; no bloquear registro */
  }
}
