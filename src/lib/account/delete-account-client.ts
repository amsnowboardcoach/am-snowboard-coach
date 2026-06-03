import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";

export async function deleteMyAccount(confirmPhrase: string): Promise<void> {
  const headers = await getFirebaseAuthHeaders();
  if (!("Authorization" in headers)) {
    throw new Error("Debes iniciar sesión");
  }

  const res = await fetch("/api/account/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ confirmPhrase }),
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "No se pudo eliminar la cuenta");
  }
}

export async function coachDeleteAlumno(alumnoId: string): Promise<void> {
  const headers = await getFirebaseAuthHeaders();
  if (!("Authorization" in headers)) {
    throw new Error("Debes iniciar sesión como coach");
  }

  const res = await fetch(`/api/coach/alumnos/${encodeURIComponent(alumnoId)}`, {
    method: "DELETE",
    headers,
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "No se pudo eliminar el alumno");
  }
}
