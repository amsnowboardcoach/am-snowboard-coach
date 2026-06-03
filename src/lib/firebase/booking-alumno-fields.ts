/** Lee nombre de alumno en documentos booking (legacy + nuevo campo). */
export function readAlumnoDisplayName(
  data: Record<string, unknown>,
): string | undefined {
  const v = data.alumnoDisplayName ?? data.studentDisplayName;
  return typeof v === "string" ? v : undefined;
}

/** Lee email de alumno en documentos booking (legacy + nuevo campo). */
export function readAlumnoEmail(data: Record<string, unknown>): string | undefined {
  const v = data.alumnoEmail ?? data.studentEmail;
  return typeof v === "string" ? v : undefined;
}

/** Campos de alumno al escribir bookings (nuevo + legacy Firestore). */
export function bookingAlumnoWriteFields(
  displayName: string,
  email: string,
): {
  alumnoDisplayName: string;
  alumnoEmail: string;
  studentDisplayName: string;
  studentEmail: string;
} {
  const alumnoDisplayName = displayName.trim();
  const alumnoEmail = email.trim();
  return {
    alumnoDisplayName,
    alumnoEmail,
    studentDisplayName: alumnoDisplayName,
    studentEmail: alumnoEmail,
  };
}
