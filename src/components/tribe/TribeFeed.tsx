"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { formatFirestoreClientError } from "@/lib/firebase/firestore-errors";
import {
  fetchTribeFeedPosts,
  fetchTribePostById,
} from "@/lib/firebase/tribe-posts";
import type { TribeMediaType, TribePost } from "@/types/tribe-post";
import { TribePostCard } from "@/components/tribe/TribePostCard";
import { TribeFeedSkeleton } from "@/components/tribe/TribeFeedSkeleton";
import { TribeFeedUploadBanner } from "@/components/tribe/TribeFeedUploadBanner";
import { cn } from "@/lib/utils/cn";

type FeedFilter = "all" | TribeMediaType;

const FILTER_OPTIONS: { id: FeedFilter; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "photo", label: "Fotos" },
  { id: "video", label: "Vídeos" },
];

export function TribeFeed() {
  const searchParams = useSearchParams();
  const highlightPostId = searchParams.get("post");
  const { user } = useAuth();
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [deepLinkMissing, setDeepLinkMissing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
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
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredPosts = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((p) => p.mediaType === filter);
  }, [posts, filter]);

  const photoCount = posts.filter((p) => p.mediaType === "photo").length;
  const videoCount = posts.filter((p) => p.mediaType === "video").length;

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
    <div className="content-align-start stack-page w-full">
      <TribeFeedUploadBanner />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50">Feed</h2>
          {!loading && !error && posts.length > 0 && (
            <p className="mt-1 text-sm text-zinc-500">
              {posts.length}{" "}
              {posts.length === 1 ? "publicación" : "publicaciones"}
              {photoCount > 0 && videoCount > 0
                ? ` · ${photoCount} fotos · ${videoCount} vídeos`
                : null}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-full border border-zinc-700/80 bg-zinc-900/60 p-1"
            role="tablist"
            aria-label="Filtrar publicaciones"
          >
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={filter === opt.id}
                onClick={() => setFilter(opt.id)}
                className={cn(
                  "min-h-10 touch-manipulation rounded-full px-4 py-1.5 text-sm font-medium transition",
                  filter === opt.id
                    ? "bg-sky-500/20 text-sky-200"
                    : "text-zinc-400 hover:text-zinc-200",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={loading || refreshing}
            className="min-h-10 rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40"
          >
            {refreshing ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </div>

      {loading && <TribeFeedSkeleton count={2} />}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {pendingNotice && !error && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          {pendingNotice}
        </p>
      )}
      {deepLinkMissing && !loading && (
        <p className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-400">
          El enlace que abriste ya no está disponible (quizá aún en revisión o
          retirado). Aquí tienes el resto del feed.
        </p>
      )}

      {!loading && !error && posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-16 text-center">
          <p className="text-3xl" aria-hidden>
            🏂
          </p>
          <p className="mt-4 text-lg font-medium text-zinc-200">
            Aún no hay publicaciones
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
            Sé el primero en compartir un momento en la nieve. Si eres alumno,
            sube desde tu panel de alumno.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-sky-500/15 px-5 py-2.5 text-sm font-medium text-sky-300 ring-1 ring-sky-500/35 transition hover:bg-sky-500/25"
          >
            Entrar al área de alumno
          </Link>
        </div>
      )}

      {!loading && !error && posts.length > 0 && filteredPosts.length === 0 && (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
          No hay {filter === "photo" ? "fotos" : "vídeos"} en el feed ahora.
          Prueba otro filtro.
        </p>
      )}

      <div className="space-y-8 sm:space-y-10">
        {filteredPosts.map((post) => (
          <TribePostCard
            key={post.id}
            post={post}
            videoVertical={post.mediaType === "video"}
            highlighted={highlightPostId === post.id}
            openCommentsOnMount={highlightPostId === post.id}
          />
        ))}
      </div>

      {!loading && posts.length > 0 && (
        <p className="text-center text-xs text-zinc-500">
          También hay una vista previa del feed en la{" "}
          <Link href="/" className="link-accent underline-offset-2 hover:underline">
            página de inicio
          </Link>{" "}
          y en{" "}
          <Link href="/clases" className="link-accent underline-offset-2 hover:underline">
            clases
          </Link>
          .
        </p>
      )}
    </div>
  );
}
