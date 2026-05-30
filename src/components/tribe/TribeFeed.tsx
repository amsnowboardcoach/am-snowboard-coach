"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { fetchTribeFeedPosts } from "@/lib/firebase/tribe-posts";
import type { TribePost } from "@/types/tribe-post";
import { TribePostCard } from "@/components/tribe/TribePostCard";
import { TribeUploadPanel } from "@/components/tribe/TribeUploadPanel";

export function TribeFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchTribeFeedPosts(user?.uid ?? null);
      setPosts(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar el feed",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <TribeUploadPanel onUploaded={load} />

      {loading && (
        <p className="text-center text-sm text-zinc-500">Cargando feed…</p>
      )}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-700 py-16 text-center">
          <p className="text-4xl" aria-hidden>
            🏂
          </p>
          <p className="mt-4 text-zinc-300">Aún no hay publicaciones</p>
          <p className="mt-2 text-sm text-zinc-500">
            Sé el primero en compartir un momento en la nieve, o vuelve pronto
            cuando subamos contenido de prueba.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {posts.map((post) => (
          <TribePostCard
            key={post.id}
            post={post}
            videoVertical={post.mediaType === "video"}
          />
        ))}
      </div>

      <p className="text-center text-xs text-zinc-600">
        También verás fotos aprobadas en la{" "}
        <Link href="/" className="text-sky-500 hover:underline">
          página de inicio
        </Link>
        .
      </p>
    </div>
  );
}
