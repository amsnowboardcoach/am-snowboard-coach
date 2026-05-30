"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { TrickPassportGrid } from "@/components/tricks/TrickPassportGrid";
import { ensureTricksCatalog, mergeTricksWithProgress } from "@/lib/firebase/tricks";
import type { TrickWithProgress } from "@/types/tricks";

export default function PasaportePage() {
  const { user } = useAuth();
  const [tricks, setTricks] = useState<TrickWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      setLoading(true);
      try {
        await ensureTricksCatalog();
        const data = await mergeTricksWithProgress(user.uid);
        if (active) setTricks(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Error al cargar");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div>
      <Link
        href="/perfil"
        className="text-sm text-zinc-500 hover:text-sky-400"
      >
        ← Volver al perfil
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Pasaporte de Trucos</h1>
      <p className="mt-2 text-zinc-400">
        Maniobras que Alejandro te va desbloqueando según tu progreso en pista.
      </p>

      {loading && <p className="mt-8 text-zinc-500">Cargando…</p>}
      {error && (
        <p className="mt-8 text-sm text-red-400">{error}</p>
      )}
      {!loading && !error && <TrickPassportGrid tricks={tricks} />}
    </div>
  );
}
