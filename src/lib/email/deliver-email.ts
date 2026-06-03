import { isEmailConfigured } from "@/lib/email/send-booking";

/** Mensaje legible cuando Gmail rechaza SMTP_USER/SMTP_PASS. */
export function emailFailureMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/535|BadCredentials|Username and Password not accepted/i.test(raw)) {
    return "No se pudo enviar el email: revisa SMTP_USER y SMTP_PASS en Vercel (usa una contraseña de aplicación de Gmail, no la contraseña normal).";
  }
  if (/SMTP_USER|SMTP_PASS no configurados/i.test(raw)) {
    return "No se pudo enviar el email: SMTP no configurado en el servidor.";
  }
  return `No se pudo enviar el email: ${raw.slice(0, 160)}`;
}

/**
 * Envía un email sin tumbar la operación principal (rechazar, confirmar, etc.).
 * Devuelve un aviso para el coach si falla.
 */
export async function deliverEmail(
  context: string,
  task: () => Promise<void>,
): Promise<string | null> {
  if (!isEmailConfigured()) {
    console.warn(`[email] ${context}: SMTP no configurado`);
    return "Email al alumno omitido (SMTP no configurado en el servidor).";
  }

  try {
    await task();
    return null;
  } catch (err) {
    console.error(`[email] ${context} falló:`, err);
    return emailFailureMessage(err);
  }
}
