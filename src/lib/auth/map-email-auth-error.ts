import type { AuthError } from "firebase/auth";

/** Mensajes genéricos (no revelan si el email existe). */
export function mapEmailAuthError(err: unknown): string {
  const code = (err as AuthError)?.code;
  switch (code) {
    case "auth/invalid-email":
      return "El email no es válido.";
    case "auth/user-disabled":
      return "Esta cuenta está desactivada. Contacta con el coach.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email o contraseña incorrectos.";
    case "auth/email-already-in-use":
      return "Ya hay una cuenta con este email. Prueba a entrar.";
    case "auth/weak-password":
      return "La contraseña es demasiado débil (mínimo 8 caracteres).";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
    case "auth/network-request-failed":
      return "Sin conexión. Comprueba tu red e inténtalo de nuevo.";
    default:
      return "No se pudo completar el acceso. Inténtalo de nuevo.";
  }
}
