"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { isFirebaseConfigured } from "@/lib/auth/config";
import { getAuthRedirectPath } from "@/lib/auth/redirect";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/firestore";
import { FirebaseSetupNotice } from "./FirebaseSetupNotice";

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
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
      const profile = snap.exists()
        ? (snap.data() as UserProfile)
        : null;

      if (!profile) {
        setError(
          "No hay perfil asociado. Crea una cuenta en Registro o entra con Google.",
        );
        return;
      }

      router.push(nextPath ?? getAuthRedirectPath(profile.role));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <FirebaseSetupNotice />
      <div className="glass-panel rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Accede a tu pasaporte de trucos, vídeos y reservas. Google es la forma
          más rápida.
        </p>

        <div className="mt-6">
          <GoogleAuthButton
            label="Entrar con Google"
            redirectPath={nextPath ?? undefined}
            onError={setError}
          />
        </div>

        <AuthDivider />

        <form onSubmit={handleSubmit} className="space-y-4">
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

        <p className="mt-6 text-center text-sm text-zinc-500">
          ¿Primera vez?{" "}
          <Link href="/registro" className="text-sky-400 hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
