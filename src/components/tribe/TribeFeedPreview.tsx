"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { fetchApprovedTribePosts } from "@/lib/firebase/tribe-posts";
import type { TribePost } from "@/types/tribe-post";
import { TribePostCard } from "@/components/tribe/TribePostCard";
import { cn } from "@/lib/utils/cn";

interface TribeFeedPreviewProps {
  title?: string;
  subtitle?: string;
  maxPosts?: number;
  className?: string;
}

function TribeFeedPreviewSkeleton({ count }: { count: number }) {
  return (
    <div className="mt-8 flex gap-4 overflow-hidden pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[min(70vh,520px)] w-[min(85vw,320px)] shrink-0 animate-pulse rounded-2xl bg-zinc-800/80 sm:w-[min(38vw,360px)]"
          aria-hidden
        />
      ))}
    </div>
  );
}

/** Vista previa lateral del feed (home y clases). El feed completo vertical está en /tribu. */
export function TribeFeedPreview({
  title = "La Tribu",
  subtitle = "Fotos y vídeos de alumnos en Sierra Nevada. Reacciona, comenta y comparte.",
  maxPosts = 4,
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

      {loading && <TribeFeedPreviewSkeleton count={Math.min(maxPosts, 3)} />}

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
          <div
            className={cn(
              "mt-8 flex gap-4 overflow-x-auto pb-4",
              "snap-x snap-mandatory scroll-pl-4",
              "-mx-4 px-4 sm:mx-0 sm:scroll-pl-0 sm:px-0",
              "[scrollbar-width:thin] [scrollbar-color:rgb(63_63_70)_transparent]",
            )}
            role="list"
            aria-label="Publicaciones de La Tribu"
          >
            {posts.map((post) => (
              <div
                key={post.id}
                role="listitem"
                className="w-[min(85vw,320px)] shrink-0 snap-center sm:w-[min(38vw,360px)] lg:w-[360px]"
              >
                <TribePostCard
                  post={post}
                  compact
                  videoVertical={post.mediaType === "video"}
                />
              </div>
            ))}
          </div>
          <p className="mt-6 text-center">
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
