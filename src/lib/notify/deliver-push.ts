/** Push al alumno sin tumbar confirmar/rechazar. */
export async function deliverAlumnoPush(
  context: string,
  task: () => Promise<void>,
): Promise<string | null> {
  try {
    await task();
    return null;
  } catch (err) {
    console.error(`[push] ${context} falló:`, err);
    const raw = err instanceof Error ? err.message : String(err);
    return `No se pudo enviar el aviso push al alumno: ${raw.slice(0, 120)}`;
  }
}
