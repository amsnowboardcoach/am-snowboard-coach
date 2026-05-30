export function isFirebaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
}

/** Emails que reciben rol coach al registrarse (separados por coma en .env) */
export function getCoachEmails(): string[] {
  const raw =
    process.env.NEXT_PUBLIC_COACH_EMAILS ?? "amsnowboardcoach@gmail.com";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isCoachEmail(email: string): boolean {
  return getCoachEmails().includes(email.trim().toLowerCase());
}
