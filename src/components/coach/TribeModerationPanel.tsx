"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { formatFirestoreClientError } from "@/lib/firebase/firestore-errors";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { TribePost } from "@/types/tribe-post";
import { TribePostCard } from "@/components/tribe/TribePostCard";

interface TribeModerationPanelProps {
  /** Si false, no oculta el panel cuando no hay pendientes */
  hideWhenEmpty?: boolean;
  onModerated?: () => void;
}

export function TribeModerationPanel({
  hideWhenEmpty = true,
  onModerated,
}: TribeModerationPanelProps) {
  const [pending, setPending] = useState<TribePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(getFirebaseDb(), "tribe_posts"),
        where("moderationStatus", "==", "pending"),
        orderBy("createdAt", "desc"),
        limit(20),
      );
      const snap = await getDocs(q);
      setPending(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TribePost),
      );
    } catch (err) {
      setPending([]);
      setError(
        formatFirestoreClientError(
          err,
          "No se pudieron cargar las publicaciones pendientes",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(postId: string, status: "approved" | "rejected") {
    setActionError(null);
    try {
      await updateDoc(doc(getFirebaseDb(), "tribe_posts", postId), {
        moderationStatus: status,
      });
      await load();
      onModerated?.();
    } catch (err) {
      setActionError(
        formatFirestoreClientError(err, "No se pudo actualizar la publicación"),
      );
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-zinc-500">Cargando publicaciones de La Tribu…</p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (pending.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 py-16 text-center text-zinc-500">
        No hay publicaciones pendientes de moderación.
      </div>
    );
  }

  return (
    <section className="alert-warning p-6">
      <h2 className="text-lg font-semibold text-amber-200">
        Publicaciones pendientes ({pending.length})
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Aprueba para que aparezcan en la web y La Tribu. Rechazar oculta el
        contenido sin avisar al alumno por la app.
      </p>
      {actionError && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {actionError}
        </p>
      )}
      <ul className="mt-6 space-y-8">
        {pending.map((post) => (
          <li key={post.id}>
            <TribePostCard post={post} compact />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setStatus(post.id, "approved")}
                className="btn-success-soft"
              >
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => setStatus(post.id, "rejected")}
                className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
              >
                Rechazar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
