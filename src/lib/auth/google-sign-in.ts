import {
  GoogleAuthProvider,
  signInWithPopup,
  type AuthError,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { getAuthRedirectPath } from "@/lib/auth/redirect";
import type { UserProfile } from "@/types/firestore";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

function mapAuthError(err: unknown): string {
  const code = (err as AuthError)?.code;
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Cerraste la ventana de Google. Inténtalo de nuevo.";
    case "auth/popup-blocked":
      return "El navegador bloqueó la ventana emergente. Permite popups para este sitio.";
    case "auth/account-exists-with-different-credential":
      return "Este email ya está registrado con contraseña. Entra con email y contraseña.";
    case "auth/cancelled-popup-request":
      return "Operación cancelada.";
    case "auth/network-request-failed":
      return "Sin conexión. Comprueba tu red e inténtalo de nuevo.";
    default:
      return err instanceof Error ? err.message : "No se pudo entrar con Google";
  }
}

export type GoogleSignInResult = {
  profile: UserProfile;
  redirectPath: string;
};

export async function signInWithGoogle(
  options?: { redirectPath?: string },
): Promise<GoogleSignInResult> {
  const credential = await signInWithPopup(getFirebaseAuth(), provider);
  const profile = await ensureUserProfile(credential.user);
  return {
    profile,
    redirectPath:
      options?.redirectPath ?? getAuthRedirectPath(profile.role),
  };
}

export { mapAuthError };
