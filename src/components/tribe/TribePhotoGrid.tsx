"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { fetchApprovedTribePosts } from "@/lib/firebase/tribe-posts";
import type { TribePost } from "@/types/tribe-post";

export function TribePhotoGrid() {
  const [photos, setPhotos] = useState<TribePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedTribePosts("photo", 6)
      .then(setPhotos)
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page-container section-pad">
      <SectionHeading
        centered
        title="Ambiente en la nieve"
        subtitle="Fotos de alumnos y del coach en Sierra Nevada. ¿Tienes cuenta? Comparte la tuya en La Tribu."
      />

      {loading && (
        <p className="mt-10 text-center text-sm text-zinc-500">Cargando…</p>
      )}

      {!loading && photos.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 px-6 py-14 text-center">
          <p className="text-zinc-400">
            Pronto habrá fotos de la comunidad aquí.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            <Link href="/login" className="link-accent underline-offset-2 hover:underline">
              Área de alumno
            </Link>{" "}
            —{" "}
            <Link href="/tribu" className="link-accent underline-offset-2 hover:underline">
              visita La Tribu
            </Link>{" "}
            para ser el primero en publicar.
          </p>
        </div>
      )}

      {photos.length > 0 && (
        <>
          <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {photos.map((photo) => (
              <Link
                key={photo.id}
                href={`/tribu?post=${photo.id}`}
                className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-900"
              >
                <Image
                  src={photo.mediaUrl}
                  alt={photo.caption || `Foto de ${photo.authorDisplayName}`}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="33vw"
                  unoptimized
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                  <p className="truncate text-xs font-medium text-white">
                    {photo.authorDisplayName}
                  </p>
                  {photo.fireCount > 0 && (
                    <p className="text-[10px] text-zinc-300">
                      ♥ {photo.fireCount}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-center">
            <Link
              href="/tribu"
              className="text-sm link-accent underline-offset-2 hover:underline"
            >
              Ver feed completo en La Tribu →
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
