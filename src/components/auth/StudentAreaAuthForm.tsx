"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { FirebaseSetupNotice } from "@/components/auth/FirebaseSetupNotice";
import { useAuth } from "@/contexts/AuthProvider";
import { LEGAL_PATHS } from "@/constants/legal-site";
import { isCoachEmail, isFirebaseConfigured } from "@/lib/auth/config";
import { consumeGoogleAuthError } from "@/lib/auth/google-sign-in";
import { mapEmailAuthError } from "@/lib/auth/map-email-auth-error";
import { resolvePostLoginPath, safeNextPath } from "@/lib/auth/paths";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { createUserProfile } from "@/lib/firebase/users";
import { requestCoachNotifyStudentRegistered } from "@/lib/push/request-coach-student-registered";
import { usePostAuthRedirect } from "@/hooks/use-post-auth-redirect";
import { cn } from "@/lib/utils/cn";

type EmailMode = "signin" | "signup";

export function StudentAreaAuthForm() {
  usePostAuthRedirect();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { syncSessionAfterLogin } = useAuth();
  const nextPath = safeNextPath(searchParams.get("next"));
  const initialSignup = searchParams.get("registro") === "1";

  const [emailMode, setEmailMode] = useState<EmailMode>(
    initialSignup ? "signup" : "signin",
  );
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  useEffect(() => {
    setEmailMode(initialSignup ? "signup" : "signin");
  }, [initialSignup]);

  useEffect(() => {
    const msg = consumeGoogleAuthError();
    if (msg) setError(msg);
  }, []);

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isFirebaseConfigured()) {
      setError("Configura .env.local con las claves de Firebase primero.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || password.length < 1) {
      setError("Introduce email y contraseña.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(
        getFirebaseAuth(),
        trimmedEmail,
        password,
      );

      const profile = await syncSessionAfterLogin();
      if (!profile) {
        setError(
          "No hay perfil asociado. Regístrate o usa «Continuar con Google».",
        );
        return;
      }

      router.replace(resolvePostLoginPath(profile.role, nextPath));
    } catch (err) {
      setError(mapEmailAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!acceptedLegal) {
      setError(
        "Debes aceptar la Política de Privacidad y los Términos de Uso.",
      );
      return;
    }

    if (!isFirebaseConfigured()) {
      setError("Configura .env.local con las claves de Firebase primero.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (isCoachEmail(trimmedEmail)) {
      setError(
        "Esta cuenta es del monitor. No te registres aquí: entra en /coach con tu email de coach.",
      );
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        trimmedEmail,
        password,
      );

      const name = displayName.trim() || trimmedEmail.split("@")[0];
      await updateProfile(credential.user, { displayName: name });

      await createUserProfile({
        uid: credential.user.uid,
        email: trimmedEmail,
        displayName: name,
      });

      if (!isCoachEmail(trimmedEmail)) {
        await requestCoachNotifyStudentRegistered();
      }

      const profile = await syncSessionAfterLogin();
      if (!profile) {
        setError("No se pudo cargar tu perfil. Recarga la página e inténtalo.");
        return;
      }

      router.replace(resolvePostLoginPath(profile.role, nextPath));
    } catch (err) {
      setError(mapEmailAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <FirebaseSetupNotice />
      <div className="glass-panel rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Área de alumno</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Entra o crea tu cuenta gratuita: pasaporte de trucos, vídeos, reservas
          y La Tribu. Con Google es lo más rápido.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Si entras con la cuenta del coach, irás al panel de administración. Si
          eres alumno/a, a tu área privada.
        </p>

        <div className="mt-6">
          <GoogleAuthButton
            label="Continuar con Google"
            redirectPath={nextPath ?? undefined}
            onError={setError}
          />
          <p className="mt-2 text-xs text-zinc-500">
            Google sirve para entrar o registrarte. Al continuar aceptas la{" "}
            <Link
              href={LEGAL_PATHS.privacy}
              className="text-sky-500 hover:underline"
            >
              privacidad
            </Link>{" "}
            y los{" "}
            <Link
              href={LEGAL_PATHS.terms}
              className="text-sky-500 hover:underline"
            >
              términos
            </Link>
            .
          </p>
        </div>

        <AuthDivider />

        <div
          className="flex rounded-lg border border-zinc-700 bg-zinc-950/80 p-1"
          role="tablist"
          aria-label="Acceso con email"
        >
          <button
            type="button"
            role="tab"
            aria-selected={emailMode === "signin"}
            onClick={() => {
              setEmailMode("signin");
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition",
              emailMode === "signin"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={emailMode === "signup"}
            onClick={() => {
              setEmailMode("signup");
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition",
              emailMode === "signup"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            Registrarme
          </button>
        </div>

        {emailMode === "signin" ? (
          <form onSubmit={handleSignIn} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-zinc-300">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-sky-500"
              />
            </label>

            <label className="block text-sm font-medium text-zinc-300">
              Contraseña
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-sky-500"
              />
            </label>

            {error && (
              <p className="text-sm text-red-300" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-md w-full disabled:opacity-50"
            >
              {loading ? "Entrando…" : "Entrar con email"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-zinc-300">
              Nombre
              <input
                type="text"
                required
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu nombre"
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-sky-500"
              />
            </label>

            <label className="block text-sm font-medium text-zinc-300">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-sky-500"
              />
            </label>

            <label className="block text-sm font-medium text-zinc-300">
              Contraseña (mín. 8 caracteres)
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none focus:border-sky-500"
              />
            </label>

            <label className="flex gap-3 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(e) => setAcceptedLegal(e.target.checked)}
                className="mt-1 size-4 shrink-0 rounded border-zinc-600"
              />
              <span>
                He leído y acepto la{" "}
                <Link
                  href={LEGAL_PATHS.privacy}
                  className="link-accent underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Política de Privacidad
                </Link>{" "}
                y los{" "}
                <Link
                  href={LEGAL_PATHS.terms}
                  className="link-accent underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Términos de Uso
                </Link>
                .
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-300" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !acceptedLegal}
              className="btn-primary-md w-full disabled:opacity-50"
            >
              {loading ? "Creando cuenta…" : "Crear cuenta con email"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
