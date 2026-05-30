"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
import { isCoachEmail } from "@/lib/auth/config";
import { createUserProfile } from "@/lib/firebase/users";
import { ROLES } from "@/constants/roles";

interface CoachProfileSetupProps {
  user: User;
  onReady: () => void;
}

export function CoachProfileSetup({ user, onReady }: CoachProfileSetupProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setupProfile() {
    setLoading(true);
    setError(null);
    try {
      await createUserProfile({
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? "Alejandro Martín",
        role: isCoachEmail(user.email ?? "") ? ROLES.COACH : ROLES.STUDENT,
      });
      onReady();
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear el perfil",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
      <h2 className="text-lg font-semibold text-amber-100">
        Falta tu perfil en Firestore
      </h2>
      <p className="mt-2 text-sm text-amber-200/80">
        Tu cuenta de Auth existe, pero no hay documento en{" "}
        <code className="text-amber-100">users/{user.uid}</code>. Sin eso no
        puedes usar el panel coach.
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={setupProfile}
        className="mt-4 rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
      >
        {loading ? "Creando perfil…" : "Crear mi perfil de coach"}
      </button>
    </div>
  );
}
