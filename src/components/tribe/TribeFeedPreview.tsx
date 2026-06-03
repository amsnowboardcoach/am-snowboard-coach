"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { fetchApprovedTribePosts } from "@/lib/firebase/tribe-posts";
import type { TribePost } from "@/types/tribe-post";
import { TribePostCard } from "@/components/tribe/TribePostCard";
import { TribeFeedSkeleton } from "@/components/tribe/TribeFeedSkeleton";

interface TribeFeedPreviewProps {
  title?: string;
  subtitle?: string;
  maxPosts?: number;
  className?: string;
}

/** Vista previa del feed público (fotos y vídeos con la misma interacción que /tribu). */
export function TribeFeedPreview({
  title = "La Tribu",
  subtitle = "Fotos y vídeos de alumnos en Sierra Nevada. Dale me gusta, comenta y comparte — igual que en el feed completo.",
  maxPosts = 3,
  className,
}: TribeFeedPreviewProps) {
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedTribePosts(undefined, maxPosts)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [maxPosts]);

  return (
    <section className={className ?? "page-container section-pad"}>
      <SectionHeading centered title={title} subtitle={subtitle} />

      {loading && (
        <div className="mx-auto mt-10 max-w-2xl">
          <TribeFeedSkeleton count={Math.min(maxPosts, 2)} />
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="text-zinc-400">
            Aún no hay publicaciones en La Tribu.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            <Link href="/login" className="link-accent underline-offset-2 hover:underline">
              Área de alumno
            </Link>{" "}
            —{" "}
            <Link href="/tribu#feed" className="link-accent underline-offset-2 hover:underline">
              visita el feed
            </Link>{" "}
            para ser el primero en compartir.
          </p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <>
          <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-8 sm:gap-10">
            {posts.map((post) => (
              <TribePostCard
                key={post.id}
                post={post}
                videoVertical={post.mediaType === "video"}
              />
            ))}
          </div>
          <p className="mt-8 text-center">
            <Link
              href="/tribu#feed"
              className="text-sm font-medium link-accent underline-offset-2 hover:underline"
            >
              Ver feed completo en La Tribu →
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
