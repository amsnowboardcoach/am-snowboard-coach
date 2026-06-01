"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { TrickPassportGrid } from "@/components/tricks/TrickPassportGrid";
import {
  fetchPassportSectionNotes,
  type PassportSectionNotesMap,
} from "@/lib/firebase/passport-section-notes";
import { mergeTricksWithProgress } from "@/lib/firebase/tricks";
import type { TrickWithProgress } from "@/types/tricks";

function formatPasaporteError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes("permission") || err.message.includes("Permission")) {
      return "No tienes permiso para ver el pasaporte. Cierra sesión y vuelve a entrar.";
    }
    if (err.message.includes("Failed to fetch") || err.message.includes("network")) {
      return "Sin conexión o error de red. Comprueba internet e inténtalo de nuevo.";
    }
    return err.message;
  }
  return "Error al cargar el pasaporte";
}

export default function PasaportePage() {
  const { user, loading: authLoading } = useAuth();
  const [tricks, setTricks] = useState<TrickWithProgress[]>([]);
  const [sectionNotes, setSectionNotes] = useState<PassportSectionNotesMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [data, notes] = await Promise.all([
        mergeTricksWithProgress(user.uid),
        fetchPassportSectionNotes(user.uid),
      ]);
      setTricks(data);
      setSectionNotes(notes);
    } catch (err) {
      setError(formatPasaporteError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, user, load]);

  return (
    <div className="stack-page">
      <header>
        <h1 className="page-title">Pasaporte de Trucos</h1>
        <p className="page-lead">
          Maniobras que Alejandro te va desbloqueando según tu progreso en pista.
        </p>
      </header>

      {authLoading && <p className="text-zinc-500">Cargando…</p>}

      {!authLoading && !user && (
        <p className="mt-8 text-sm text-amber-200">
          Inicia sesión para ver tu pasaporte.
        </p>
      )}

      {user && loading && <p className="mt-8 text-zinc-500">Cargando pasaporte…</p>}

      {user && error && (
        <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4">
          <p className="text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-full border border-red-500/50 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10"
          >
            Reintentar
          </button>
        </div>
      )}

      {user && !loading && !error && (
        <TrickPassportGrid tricks={tricks} sectionNotes={sectionNotes} />
      )}
    </div>
  );
}
