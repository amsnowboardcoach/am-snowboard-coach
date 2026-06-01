/** Acceso estático para que Next.js inlined las variables en el bundle del cliente. */
function readPublicEnv(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

const FIREBASE_PUBLIC_CONFIG = {
  apiKey: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: readPublicEnv(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: readPublicEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
} as const;

/** Todas las claves públicas de Firebase deben estar definidas. */
export function isFirebaseConfigured(): boolean {
  return Object.values(FIREBASE_PUBLIC_CONFIG).every((value) => value.length > 0);
}

export function getFirebasePublicConfig() {
  return FIREBASE_PUBLIC_CONFIG;
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
