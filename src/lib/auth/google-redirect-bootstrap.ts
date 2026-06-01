import { isFirebaseConfigured } from "@/lib/auth/config";
import {
  tryCompleteGoogleRedirectSignIn,
  type GoogleSignInResult,
} from "@/lib/auth/google-sign-in";

let redirectPromise: Promise<GoogleSignInResult | null> | null = null;

export function resetGoogleRedirectBootstrap(): void {
  redirectPromise = null;
}

/** Una sola llamada a getRedirectResult por carga de la app. */
export function finishGoogleRedirectSignInOnce(): Promise<GoogleSignInResult | null> {
  if (!redirectPromise) {
    redirectPromise = (async () => {
      if (!isFirebaseConfigured()) {
        return null;
      }
      return tryCompleteGoogleRedirectSignIn();
    })();
  }
  return redirectPromise;
}
