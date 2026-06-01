"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CoachVideoReviewPanel } from "@/components/videos/CoachVideoReviewPanel";
import { formatFirestoreDate } from "@/lib/utils/dates";
import { fetchTribePostsByAuthor } from "@/lib/firebase/tribe-posts";
import type { TribePost } from "@/types/tribe-post";

interface CoachStudentContentPanelProps {
  studentId: string;
  studentName: string;
}

const moderationLabels: Record<string, string> = {
  approved: "Publicado",
  pending: "Pendiente de moderación",
  rejected: "Rechazado",
};

export function CoachStudentContentPanel({
  studentId,
  studentName,
}: CoachStudentContentPanelProps) {
  const [tribePosts, setTribePosts] = useState<TribePost[]>([]);
  const [loadingTribe, setLoadingTribe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTribe = useCallback(async () => {
    setLoadingTribe(true);
    setError(null);
    try {
      setTribePosts(await fetchTribePostsByAuthor(studentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar Tribu");
    } finally {
      setLoadingTribe(false);
    }
  }, [studentId]);

  useEffect(() => {
    void loadTribe();
  }, [loadTribe]);

  return (
    <div className="space-y-10">
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <section>
        <h3 className="text-base font-semibold text-sky-200">
          Vídeos de corrección
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Material que {studentName} ha subido para revisión.
        </p>
        <div className="mt-4">
          <CoachVideoReviewPanel studentId={studentId} />
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-sky-300">La Tribu</h3>
          <Link href="/tribu" className="text-sm link-accent underline-offset-2 hover:underline">
            Abrir feed →
          </Link>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Fotos y vídeos publicados por el alumno.
        </p>

        {loadingTribe && (
          <p className="mt-4 text-sm text-zinc-500">Cargando publicaciones…</p>
        )}

        {!loadingTribe && tribePosts.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-zinc-700 py-8 text-center text-sm text-zinc-500">
            Sin publicaciones en La Tribu.
          </p>
        )}

        {!loadingTribe && tribePosts.length > 0 && (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {tribePosts.map((post) => (
              <li
                key={post.id}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40"
              >
                <div className="relative aspect-video bg-zinc-950">
                  {post.mediaType === "photo" ? (
                    <Image
                      src={post.mediaUrl}
                      alt={post.caption ?? "Publicación Tribu"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 320px"
                      unoptimized
                    />
                  ) : (
                    <video
                      src={post.mediaUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
                <div className="p-3 text-sm">
                  <p className="text-xs text-zinc-500">
                    {formatFirestoreDate(post.createdAt)} ·{" "}
                    {post.mediaType === "photo" ? "Foto" : "Vídeo"} ·{" "}
                    {moderationLabels[post.moderationStatus] ??
                      post.moderationStatus}
                  </p>
                  {post.caption && (
                    <p className="mt-2 text-zinc-300">{post.caption}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
