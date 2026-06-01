"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { formatFirestoreClientError } from "@/lib/firebase/firestore-errors";
import {
  fetchTribeFeedPosts,
  fetchTribePostById,
} from "@/lib/firebase/tribe-posts";
import type { TribePost } from "@/types/tribe-post";
import { TribePostCard } from "@/components/tribe/TribePostCard";
import { TribeUploadPanel } from "@/components/tribe/TribeUploadPanel";

export function TribeFeed() {
  const searchParams = useSearchParams();
  const highlightPostId = searchParams.get("post");
  const { user } = useAuth();
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [deepLinkMissing, setDeepLinkMissing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPendingNotice(null);
    setDeepLinkMissing(false);
    try {
      const { posts: list, ownPendingHidden } = await fetchTribeFeedPosts(
        user?.uid ?? null,
      );
      setPosts(list);
      if (ownPendingHidden) {
        setPendingNotice(
          "Tus publicaciones en revisión están guardadas, pero no pudimos mostrarlas aquí todavía. Cuando se aprueben, aparecerán en el feed.",
        );
      }
    } catch (err) {
      setError(
        formatFirestoreClientError(err, "No se pudo cargar el feed de La Tribu"),
      );
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!highlightPostId || loading) return;

    const scrollToPost = () => {
      document
        .getElementById(`tribe-post-${highlightPostId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    if (posts.some((p) => p.id === highlightPostId)) {
      scrollToPost();
      return;
    }

    let cancelled = false;
    void fetchTribePostById(highlightPostId).then((post) => {
      if (cancelled) return;
      if (!post) {
        setDeepLinkMissing(true);
        return;
      }
      setPosts((prev) => {
        if (prev.some((p) => p.id === post.id)) return prev;
        return [post, ...prev];
      });
      requestAnimationFrame(scrollToPost);
    });

    return () => {
      cancelled = true;
    };
  }, [highlightPostId, loading, posts]);

  return (
    <div className="stack-page">
      <TribeUploadPanel onUploaded={load} />

      {loading && (
        <p className="text-center text-sm text-zinc-500">Cargando feed…</p>
      )}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {pendingNotice && !error && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          {pendingNotice}
        </p>
      )}
      {deepLinkMissing && !loading && (
        <p className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
          El enlace que abriste ya no está disponible (quizá aún en revisión o
          retirado). Aquí tienes el resto del feed.
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
            highlighted={highlightPostId === post.id}
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
