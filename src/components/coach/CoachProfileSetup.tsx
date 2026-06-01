"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
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
        role: ROLES.COACH,
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
    <div className="alert-warning p-6">
      <h2 className="text-lg font-semibold text-amber-100">
        Falta tu perfil en Firestore
      </h2>
      <p className="mt-2 text-sm text-amber-200/80">
        Tu cuenta de Auth existe, pero no hay documento en{" "}
        <code className="text-amber-100">users/{user.uid}</code>. Sin eso no
        puedes usar el panel coach.
      </p>
      {error && (
        <p className="mt-3 text-sm text-red-300">{error}</p>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={setupProfile}
        className="btn-primary-md mt-4 disabled:opacity-50"
      >
        {loading ? "Creando perfil…" : "Crear mi perfil de coach"}
      </button>
    </div>
  );
}
