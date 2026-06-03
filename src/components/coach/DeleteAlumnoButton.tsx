"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { coachDeleteAlumno } from "@/lib/account/delete-account-client";
import { coachHubHref } from "@/constants/coach-hub";
import { cn } from "@/lib/utils/cn";

interface DeleteAlumnoButtonProps {
  alumnoId: string;
  alumnoName: string;
  alumnoEmail: string;
  className?: string;
  /** Tras eliminar, ir al listado de alumnos */
  redirectToList?: boolean;
  onDeleted?: () => void;
}

export function DeleteAlumnoButton({
  alumnoId,
  alumnoName,
  alumnoEmail,
  className,
  redirectToList = false,
  onDeleted,
}: DeleteAlumnoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const msg = `¿Eliminar la cuenta de ${alumnoName} (${alumnoEmail})?\n\nSe borrarán perfil, vídeos, Tribu, mercadillo y reservas. No se puede deshacer.`;
    if (!confirm(msg)) return;

    setLoading(true);
    setError(null);
    try {
      await coachDeleteAlumno(alumnoId);
      onDeleted?.();
      if (redirectToList) {
        router.push(coachHubHref("alumnos"));
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleDelete()}
        className="rounded-full border border-red-500/50 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      >
        {loading ? "Eliminando…" : "Eliminar alumno"}
      </button>
      {error && (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
