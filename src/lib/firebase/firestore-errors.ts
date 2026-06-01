/** Mensajes legibles para errores del SDK de Firestore en cliente. */
export function formatFirestoreClientError(
  err: unknown,
  fallback: string,
): string {
  const msg = err instanceof Error ? err.message : "";
  if (msg.toLowerCase().includes("index")) {
    return "Falta un índice en Firebase. Ejecuta: firebase deploy --only firestore:indexes";
  }
  const code = (err as { code?: string })?.code;
  if (code === "permission-denied") {
    return "No tienes permiso para esta acción.";
  }
  if (msg) return msg;
  return fallback;
}
