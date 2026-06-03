"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { isAlumnoRole } from "@/constants/roles";
import { isCoachProfile } from "@/lib/auth/coach-role";
import { isCoachEmail, isFirebaseConfigured } from "@/lib/auth/config";
import { requestCoachNotifyAlumnoRegistered } from "@/lib/push/request-coach-alumno-registered";
import { isRecentAlumnoRegistration } from "@/lib/push/alumno-registration-window";
import { finishGoogleRedirectSignInOnce } from "@/lib/auth/google-redirect-bootstrap";
import {
  consumeGoogleAuthError,
  type GoogleSignInResult,
} from "@/lib/auth/google-sign-in";
import { loadUserProfile } from "@/lib/auth/load-profile";
import { isPrivateAppPath, loginPathWithNext } from "@/lib/auth/paths";
import { getFirebaseAuth } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/firestore";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  /** Tras email/password: espera a que el perfil esté en contexto. */
  syncSessionAfterLogin: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const firebaseReady = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(firebaseReady);
  const profileUidRef = useRef<string | null>(null);
  const initDoneRef = useRef(false);

  const applyProfile = useCallback((firebaseUser: User, next: UserProfile | null) => {
    setUser(firebaseUser);
    setProfile(next);
    profileUidRef.current = next ? firebaseUser.uid : null;
  }, []);

  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const firebaseUser = getFirebaseAuth().currentUser;
    if (!firebaseUser) {
      setProfile(null);
      profileUidRef.current = null;
      return null;
    }
    const next = await loadUserProfile(firebaseUser);
    applyProfile(firebaseUser, next);
    return next;
  }, [applyProfile]);

  const syncSessionAfterLogin = useCallback(async (): Promise<UserProfile | null> => {
    const firebaseUser = getFirebaseAuth().currentUser;
    if (!firebaseUser) return null;

    if (profileUidRef.current === firebaseUser.uid && profile) {
      return profile;
    }

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const next = await loadUserProfile(firebaseUser);
      if (next) {
        applyProfile(firebaseUser, next);
        setLoading(false);
        return next;
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    return null;
  }, [applyProfile, profile]);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const loadingTimeout = window.setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 15_000);

    void (async () => {
      let googleResult: GoogleSignInResult | null = null;
      try {
        googleResult = await finishGoogleRedirectSignInOnce();
      } catch {
        googleResult = null;
      }

      if (cancelled) return;

      if (googleResult) {
        const authUser = getFirebaseAuth().currentUser;
        if (authUser) {
          applyProfile(authUser, googleResult.profile);
        }
        setLoading(false);
        const target = googleResult.redirectPath;
        const current =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "";
        if (target !== current) {
          router.replace(target);
        }
      } else {
        const googleError = consumeGoogleAuthError();
        if (googleError) {
          const onAuthPage =
            pathname.startsWith("/login") || pathname.startsWith("/registro");
          if (!onAuthPage) {
            router.replace("/login");
          }
        }
      }

      unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
        if (cancelled) return;
        setUser(firebaseUser);

        if (!firebaseUser) {
          setProfile(null);
          profileUidRef.current = null;
          setLoading(false);
          return;
        }

        if (profileUidRef.current === firebaseUser.uid) {
          setLoading(false);
          return;
        }

        const nextProfile = await loadUserProfile(firebaseUser);
        if (!cancelled) {
          applyProfile(firebaseUser, nextProfile);
          setLoading(false);
        }
      });
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimeout);
      unsubscribe?.();
    };
    // Solo al montar la app (evita reiniciar auth en cada ruta)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured() || loading) return;
    if (user) return;
    if (!isPrivateAppPath(pathname)) return;
    router.replace(loginPathWithNext(pathname));
  }, [user, loading, pathname, router]);

  /** Monitor: nunca permanecer en /perfil (área alumno). */
  useEffect(() => {
    if (loading || !user || !profile) return;
    if (!isCoachProfile(profile)) return;
    if (!pathname.startsWith("/perfil")) return;
    router.replace("/coach");
  }, [loading, user, profile, pathname, router]);

  /** Segundo intento si el primero falló (perfil aún no visible en servidor / token). */
  useEffect(() => {
    if (loading || !user || !profile) return;
    if (!isAlumnoRole(profile.role) || isCoachEmail(profile.email)) return;
    if (profile.registrationCoachNotified === true) return;
    if (!isRecentAlumnoRegistration(user, profile)) return;

    const timer = window.setTimeout(() => {
      void requestCoachNotifyAlumnoRegistered();
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [user, profile, loading]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
      syncSessionAfterLogin,
      signOut: async () => {
        if (!isFirebaseConfigured()) return;
        profileUidRef.current = null;
        await firebaseSignOut(getFirebaseAuth());
      },
    }),
    [user, profile, loading, refreshProfile, syncSessionAfterLogin],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
