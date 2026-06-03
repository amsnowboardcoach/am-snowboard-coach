import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";
import type { UserProfile } from "@/types/firestore";

export async function updateCoachAlumnoLevel(
  alumnoId: string,
  level: UserProfile["level"] | null,
): Promise<void> {
  const res = await fetch(
    `/api/coach/alumnos/${encodeURIComponent(alumnoId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(await getFirebaseAuthHeaders()),
      },
      body: JSON.stringify({ level }),
    },
  );
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "No se pudo actualizar el nivel");
  }
}
