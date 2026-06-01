"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApprovedTribePosts } from "@/lib/firebase/tribe-posts";
import type { TribePost } from "@/types/tribe-post";
import { TribePostCard } from "@/components/tribe/TribePostCard";

interface TribeVideoStripProps {
  title?: string;
}

export function TribeVideoStrip({
  title = "Momentos en vídeo",
}: TribeVideoStripProps) {
  const [videos, setVideos] = useState<TribePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedTribePosts("video", 4)
      .then(setVideos)
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mt-20">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-6 text-sm text-zinc-500">Cargando vídeos…</p>
      </section>
    );
  }

  if (videos.length === 0) {
    return (
      <section className="mt-20">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Vídeos de alumnos y del coach. Estilo feed — likes, comentarios y
          compartir en{" "}
          <Link href="/tribu" className="link-accent underline-offset-2 hover:underline">
            La Tribu
          </Link>
          .
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-700/80 px-6 py-12 text-center text-sm text-zinc-500">
          Aún no hay vídeos publicados. Pronto subiremos contenido de prueba.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-zinc-500">
        De la comunidad AM ·{" "}
        <Link href="/tribu" className="link-accent underline-offset-2 hover:underline">
          Ver y publicar en La Tribu
        </Link>
      </p>
      <div className="mt-8 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {videos.map((post) => (
          <div
            key={post.id}
            className="w-[min(85vw,280px)] shrink-0 snap-center"
          >
            <TribePostCard post={post} compact videoVertical />
          </div>
        ))}
      </div>
    </section>
  );
}
