import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type AuthError,
  type User,
} from "firebase/auth";
import { isFirebaseConfigured } from "@/lib/auth/config";
import { resetGoogleRedirectBootstrap } from "@/lib/auth/google-redirect-bootstrap";
import { resolvePostLoginPath, safeNextPath } from "@/lib/auth/paths";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import type { UserProfile } from "@/types/firestore";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export const GOOGLE_AUTH_RETURN_KEY = "am-google-auth-return";
export const GOOGLE_AUTH_ERROR_KEY = "am-google-auth-error";
const GOOGLE_FLOW_PENDING_KEY = "am-google-auth-pending";

function stash(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function consume(key: string): string | null {
  try {
    const value = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return value;
  } catch {
    return null;
  }
}

export function stashGoogleAuthReturnPath(path: string): void {
  const safe = safeNextPath(path);
  if (!safe) return;
  stash(GOOGLE_AUTH_RETURN_KEY, safe);
}

export function consumeGoogleAuthReturnPath(): string | null {
  return safeNextPath(consume(GOOGLE_AUTH_RETURN_KEY));
}

export function stashGoogleAuthError(message: string): void {
  stash(GOOGLE_AUTH_ERROR_KEY, message);
}

export function consumeGoogleAuthError(): string | null {
  return consume(GOOGLE_AUTH_ERROR_KEY);
}

export function markGoogleRedirectPending(): void {
  stash(GOOGLE_FLOW_PENDING_KEY, "1");
}

export function consumeGoogleRedirectPending(): boolean {
  return consume(GOOGLE_FLOW_PENDING_KEY) === "1";
}

export function clearGoogleAuthFlow(): void {
  try {
    sessionStorage.removeItem(GOOGLE_AUTH_RETURN_KEY);
    sessionStorage.removeItem(GOOGLE_FLOW_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

function mapAuthError(err: unknown): string {
  const code = (err as AuthError)?.code;
  switch (code) {
    case "auth/account-exists-with-different-credential":
      return "Este email ya está registrado con contraseña. Entra con email y contraseña.";
    case "auth/argument-error":
      return "No se pudo completar el acceso con Google. Prueba otra vez o entra con email y contraseña.";
    case "auth/invalid-credential":
      return "Google no está bien configurado (OAuth en Firebase). Usa email y contraseña o contacta soporte.";
    case "auth/credential-already-in-use":
      return "Esa cuenta de Google ya está en uso con otro método de acceso.";
    case "auth/network-request-failed":
      return "Sin conexión. Comprueba tu red e inténtalo de nuevo.";
    case "auth/unauthorized-domain":
      return "Este dominio no está autorizado en Firebase Authentication.";
    case "auth/operation-not-allowed":
      return "El inicio con Google no está activado en Firebase.";
    case "auth/popup-closed-by-user":
      return "Has cancelado el acceso con Google.";
    case "auth/popup-blocked":
      return "El navegador bloqueó la ventana de Google. Permite ventanas emergentes o inténtalo de nuevo.";
    default:
      return err instanceof Error ? err.message : "No se pudo entrar con Google";
  }
}

function shouldFallbackToRedirect(code: string | undefined): boolean {
  return (
    code === "auth/popup-blocked" ||
    code === "auth/operation-not-supported-in-this-environment"
  );
}

export type GoogleSignInResult = {
  profile: UserProfile;
  redirectPath: string;
};

/** Indica que la página navegará a Google (flujo redirect de respaldo). */
export type GoogleSignInRedirecting = { mode: "redirect" };

async function completeGoogleSignIn(
  firebaseUser: User,
  returnPath: string,
): Promise<GoogleSignInResult> {
  const profile = await ensureUserProfile(firebaseUser);
  const stashed = safeNextPath(returnPath) ?? consumeGoogleAuthReturnPath();
  clearGoogleAuthFlow();
  return {
    profile,
    redirectPath: resolvePostLoginPath(profile.role, stashed),
  };
}

/**
 * Debe llamarse una vez al arranque, ANTES de onAuthStateChanged.
 * Solo aplica al flujo redirect (respaldo si el popup falla).
 */
export async function tryCompleteGoogleRedirectSignIn(): Promise<GoogleSignInResult | null> {
  if (!isFirebaseConfigured()) {
    return null;
  }

  const hadPendingFlow = consumeGoogleRedirectPending();

  try {
    const credential = await getRedirectResult(getFirebaseAuth());
    if (!credential?.user) {
      clearGoogleAuthFlow();
      return null;
    }

    const stashed = consumeGoogleAuthReturnPath();
    return completeGoogleSignIn(
      credential.user,
      stashed ?? "/login",
    );
  } catch (err) {
    clearGoogleAuthFlow();
    if (hadPendingFlow) {
      stashGoogleAuthError(mapAuthError(err));
    }
    return null;
  }
}

/**
 * Popup de Google por defecto; redirect solo si el navegador bloquea el popup.
 */
export async function signInWithGoogle(options?: {
  redirectPath?: string;
  returnPath?: string;
}): Promise<GoogleSignInResult | GoogleSignInRedirecting> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase no está configurado en este entorno.");
  }

  const path =
    options?.returnPath ??
    options?.redirectPath ??
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "/login");

  stashGoogleAuthReturnPath(path);

  try {
    const credential = await signInWithPopup(getFirebaseAuth(), provider);
    return completeGoogleSignIn(credential.user, path);
  } catch (err) {
    const code = (err as AuthError)?.code;

    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      clearGoogleAuthFlow();
      throw err;
    }

    if (!shouldFallbackToRedirect(code)) {
      clearGoogleAuthFlow();
      throw err;
    }

    resetGoogleRedirectBootstrap();
    markGoogleRedirectPending();
    stashGoogleAuthReturnPath(path);
    await signInWithRedirect(getFirebaseAuth(), provider);
    return { mode: "redirect" };
  }
}

export { mapAuthError };
