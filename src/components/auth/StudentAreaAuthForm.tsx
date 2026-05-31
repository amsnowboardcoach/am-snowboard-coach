"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { FirebaseSetupNotice } from "@/components/auth/FirebaseSetupNotice";
import { LEGAL_PATHS } from "@/constants/legal-site";
import { isCoachEmail, isFirebaseConfigured } from "@/lib/auth/config";
import { getAuthRedirectPath } from "@/lib/auth/redirect";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { createUserProfile } from "@/lib/firebase/users";
import { cn } from "@/lib/utils/cn";
import type { UserProfile } from "@/types/firestore";

type EmailMode = "signin" | "signup";

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export function StudentAreaAuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isFirebaseConfigured()) {
      setError("Configura .env.local con las claves de Firebase primero.");
      return;
    }

    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );

      const snap = await getDoc(
        doc(getFirebaseDb(), "users", credential.user.uid),
      );
      const profile = snap.exists() ? (snap.data() as UserProfile) : null;

      if (!profile) {
        setError(
          "No hay perfil asociado. Crea tu cuenta en la pestaña «Registrarme» o usa Google.",
        );
        return;
      }

      router.push(nextPath ?? getAuthRedirectPath(profile.role));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al iniciar sesión",
      );
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

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email.trim(),
        password,
      );

      const name = displayName.trim() || email.trim().split("@")[0];
      await updateProfile(credential.user, { displayName: name });

      await createUserProfile({
        uid: credential.user.uid,
        email: email.trim(),
        displayName: name,
      });

      router.push(
        nextPath ??
          getAuthRedirectPath(isCoachEmail(email) ? "coach" : "student"),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear la cuenta",
      );
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
          <p className="mt-2 text-xs text-zinc-600">
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
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-sky-500 py-3 font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-50"
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
                  className="text-sky-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Política de Privacidad
                </Link>{" "}
                y los{" "}
                <Link
                  href={LEGAL_PATHS.terms}
                  className="text-sky-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Términos de Uso
                </Link>
                .
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !acceptedLegal}
              className="w-full rounded-full bg-sky-500 py-3 font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-50"
            >
              {loading ? "Creando cuenta…" : "Crear cuenta con email"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
